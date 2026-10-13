import Phaser from 'phaser';
import { VIEW, PLAYER } from '../config/game';
import { POWERUPS, type PowerUpKind } from '../config/powerups';
import { SKINS, SKINS_CONFIG, type SkinId } from '../config/skins';
import { availableSkins, loadSave } from '../systems/SaveSystem';
import { resetTouchInput, touchEnabled, touchInput } from '../systems/TouchInput';

interface HudData {
  hp: number;
  maxHp: number;
  score: number;
  coins: number;
  held: PowerUpKind | null;
  charges: number;
  deaths: number;
  lives: number;
  form: 'none' | 'star' | 'mushroom';
  formLabel: string;
  formMs: number;
  formTotalMs: number;
  skinLabel: string;
  attackHint: string | null;
  canNurseHeal: boolean;
  nearlyImpossible: boolean;
  godTomStacks: number;
}

interface HoleEndData {
  originLevelId: number;
}

interface BossData {
  hp: number;
  maxHp: number;
  name: string;
}

interface GameOverData {
  levelName: string;
  score: number;
  /** The level that re-locked, or null if nothing was lost. */
  lockedLevel: number | null;
}

interface CompleteData {
  score: number;
  coins: number;
  deaths: number;
  bonus: number;
  levelName: string;
  nextLevelId: number | null;
  isBoss: boolean;
  /** The coin bank after this level's coins went in. */
  totalCoins: number;
  /** Which merchant turns up on the card. */
  merchant: 'boo' | 'bob';
  /** True the first time clearedLevel crosses 5, unlocking Tiny Guy for good. */
  tinyGuyUnlocked: boolean;
}

/** The handful of GameScene methods this UI drives touch/tap input through —
 * always the same path a keyboard press would take. */
type GameSceneLike = Phaser.Scene & {
  requestPause?: () => void;
  requestResume?: () => void;
  restartLevel?: () => void;
  quitToMenu?: () => void;
  trySwitchSkin?: (id: SkinId) => { ok: boolean; reason?: string };
};

const FONT = 'monospace';

/** One of the circular on-screen movement/action buttons. */
interface TouchButton {
  circle: Phaser.GameObjects.Arc;
  glyph: Phaser.GameObjects.Text;
  zone: Phaser.GameObjects.Zone;
  /** 'always' shows whenever the controls are up; 'attack'/'heal' also need
   * the current skin to support that action. */
  kind: 'always' | 'attack' | 'heal';
}

/**
 * Everything drawn on top of the world. Runs as its own scene so nothing here
 * scrolls with the camera or gets tangled up in the physics world.
 */
export class UIScene extends Phaser.Scene {
  private hpBar!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private powerIcon!: Phaser.GameObjects.Image;
  private powerText!: Phaser.GameObjects.Text;
  private bossBar!: Phaser.GameObjects.Graphics;
  private bossText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private formBar!: Phaser.GameObjects.Graphics;
  private formText!: Phaser.GameObjects.Text;
  private skinInfoText!: Phaser.GameObjects.Text;
  private modeTagText!: Phaser.GameObjects.Text;
  private powerStackText!: Phaser.GameObjects.Text;
  private pauseCard?: Phaser.GameObjects.Container;
  private pauseExtras: Phaser.GameObjects.GameObject[] = [];
  private pauseDigitHandler?: (ev: KeyboardEvent) => void;
  private levelId = 1;
  private hud: HudData = {
    hp: PLAYER.maxHp,
    maxHp: PLAYER.maxHp,
    score: 0,
    coins: 0,
    held: null,
    charges: 0,
    deaths: 0,
    lives: 5,
    form: 'none',
    formLabel: '',
    formMs: 0,
    formTotalMs: 0,
    skinLabel: '',
    attackHint: null,
    canNurseHeal: false,
    nearlyImpossible: false,
    godTomStacks: 0,
  };
  private boss: BossData | null = null;

  /** The on-screen movement/action buttons, only built on a touch device (or
   * with ?touch=1). Empty otherwise. */
  private touchButtons: TouchButton[] = [];
  private touchControlsVisible = false;

  constructor() {
    super('UI');
  }

  create(data: { levelName: string; levelId?: number }): void {
    this.levelId = data.levelId ?? 1;
    // The scene object is reused between levels, so a beaten boss's bar would
    // otherwise follow you into the next level.
    this.boss = null;
    this.touchButtons = [];
    this.touchControlsVisible = false;
    // A restart (Shift+R, or the pause card's own RESTART button) can happen
    // while this card is showing — it stops and relaunches this whole scene,
    // so a stale reference here would make the next showPause() think a card
    // is already up and silently refuse to draw one.
    this.pauseCard = undefined;
    this.pauseExtras = [];
    this.pauseDigitHandler = undefined;
    const panel = this.add.graphics().setDepth(0);
    panel.fillStyle(0x000000, 0.35);
    panel.fillRoundedRect(16, 14, 430, 74, 10);

    this.add
      .text(30, 24, 'HP', { fontFamily: FONT, fontSize: '18px', color: '#ffffff' })
      .setDepth(2);

    this.hpBar = this.add.graphics().setDepth(1);
    this.hpText = this.add
      .text(70, 24, '', { fontFamily: FONT, fontSize: '18px', color: '#ffffff' })
      .setDepth(2);

    this.scoreText = this.add
      .text(30, 56, '', { fontFamily: FONT, fontSize: '18px', color: '#ffe27a' })
      .setDepth(2);
    this.coinText = this.add
      .text(196, 56, '', { fontFamily: FONT, fontSize: '18px', color: '#ffd76b' })
      .setDepth(2);
    this.livesText = this.add
      .text(340, 56, '', { fontFamily: FONT, fontSize: '18px', color: '#7ee6a0' })
      .setDepth(2);

    this.add
      .text(VIEW.width - 24, 24, data.levelName, {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(1, 0)
      .setDepth(2);

    // On a touch device there is no keyboard to name, so the help line is
    // dropped rather than listing keys a phone does not have.
    const helpLine = touchEnabled(this.game)
      ? ''
      : '← → move   ↑ jump   ↓ use   ESC pause   Shift+R restart';
    this.add
      .text(VIEW.width - 24, 50, helpLine, {
        fontFamily: FONT,
        fontSize: '14px',
        color: '#cfd9e8',
      })
      .setOrigin(1, 0)
      .setDepth(2);

    // Which skin is worn, and what its E (and H) key does, if anything.
    this.skinInfoText = this.add
      .text(VIEW.width - 24, 74, '', {
        fontFamily: FONT,
        fontSize: '14px',
        color: '#ffe27a',
      })
      .setOrigin(1, 0)
      .setDepth(2);

    // Held power-up slot.
    const slot = this.add.graphics().setDepth(0);
    slot.fillStyle(0x000000, 0.35);
    slot.fillRoundedRect(460, 14, 190, 74, 10);
    this.powerIcon = this.add.image(496, 51, 'pw-coin').setDepth(2).setVisible(false);
    this.powerText = this.add
      .text(524, 30, '', { fontFamily: FONT, fontSize: '15px', color: '#ffffff' })
      .setDepth(2);

    // Transformation timer, under the power-up slot.
    this.formBar = this.add.graphics().setDepth(1);
    this.formText = this.add
      .text(460, 96, '', {
        fontFamily: FONT,
        fontSize: '15px',
        color: '#ffe27a',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setDepth(2);

    // Nearly Impossible's tag, and God Tom's stack counter.
    this.modeTagText = this.add
      .text(VIEW.width / 2, 14, 'NEARLY IMPOSSIBLE', {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#ff7a4d',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0)
      .setDepth(2)
      .setVisible(false);
    this.powerStackText = this.add
      .text(30, 96, '', {
        fontFamily: FONT,
        fontSize: '16px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setDepth(2);

    this.bossBar = this.add.graphics().setDepth(1);
    this.bossText = this.add
      .text(VIEW.width / 2, VIEW.height - 74, '', {
        fontFamily: FONT,
        fontSize: '20px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(2)
      .setVisible(false);

    if (touchEnabled(this.game)) this.createTouchControls();

    const game = this.scene.get('Game');
    game.events.on('hud', (d: HudData) => {
      this.hud = d;
      this.redraw();
    });
    game.events.on('boss', (d: BossData) => {
      this.boss = d;
      this.redraw();
    });
    game.events.on('complete', (d: CompleteData) => this.showComplete(d));
    game.events.on('gameover', (d: GameOverData) => this.showGameOver(d));
    game.events.on('pause', (d: { levelName: string; levelId: number }) =>
      this.showPause(d.levelName, d.levelId),
    );
    game.events.on('resume', () => this.hidePause());
    game.events.on('holeWin', (d: HoleEndData) => this.showHoleEnd(true, d.originLevelId));
    game.events.on('holeLose', (d: HoleEndData) => this.showHoleEnd(false, d.originLevelId));
    // The hole's boss picker covers the screen like a card: no game buttons under it.
    game.events.on('holeOpen', () => this.setTouchControlsVisible(false));
    game.events.on('holeClose', () => this.setTouchControlsVisible(true));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      resetTouchInput();
      game.events.off('holeOpen');
      game.events.off('holeClose');
      game.events.off('hud');
      game.events.off('boss');
      game.events.off('complete');
      game.events.off('gameover');
      game.events.off('pause');
      game.events.off('resume');
      game.events.off('holeWin');
      game.events.off('holeLose');
    });

    this.redraw();
    // Tell the game we are listening now, so it can send the opening state.
    game.events.emit('ui-ready');
  }

  // -- Touch controls ---------------------------------------------------------

  /**
   * The on-screen movement/action buttons. Coordinates are in the 1280x720
   * game space; sizes and positions are placeholders, nudgeable for looks.
   * Left/Right/Jump/Down/Pause always show on a touch device; Attack and
   * Heal only when the current skin can use them (see refreshTouchControlVisibility).
   */
  private createTouchControls(): void {
    const press = (btn: TouchButton) => btn.circle.setFillStyle(0xffffff, 0.6);
    const release = (btn: TouchButton) => btn.circle.setFillStyle(0xffffff, 0.35);
    const wireHold = (btn: TouchButton, onDown: () => void, onUp: () => void) => {
      btn.zone.on('pointerdown', () => {
        press(btn);
        onDown();
      });
      btn.zone.on('pointerup', () => {
        release(btn);
        onUp();
      });
      btn.zone.on('pointerout', () => {
        release(btn);
        onUp();
      });
      btn.zone.on('pointerupoutside', () => {
        release(btn);
        onUp();
      });
    };
    const wireTap = (btn: TouchButton, onDown: () => void) => {
      btn.zone.on('pointerdown', () => {
        press(btn);
        onDown();
      });
      btn.zone.on('pointerup', () => release(btn));
      btn.zone.on('pointerout', () => release(btn));
      btn.zone.on('pointerupoutside', () => release(btn));
    };

    const left = this.makeCircleButton(110, 610, 62, '◀', 'always');
    wireHold(
      left,
      () => (touchInput.left = true),
      () => (touchInput.left = false),
    );

    const right = this.makeCircleButton(260, 610, 62, '▶', 'always');
    wireHold(
      right,
      () => (touchInput.right = true),
      () => (touchInput.right = false),
    );

    // Holding jump keeps jumpHeld true (variable jump height); jumpPressed is
    // the one-shot edge GameScene consumes to actually trigger the jump.
    const jump = this.makeCircleButton(1170, 590, 72, '⤒', 'always');
    wireHold(
      jump,
      () => {
        touchInput.jumpHeld = true;
        touchInput.jumpPressed = true;
      },
      () => (touchInput.jumpHeld = false),
    );

    const down = this.makeCircleButton(1030, 640, 52, '▼', 'always');
    wireTap(down, () => (touchInput.downPressed = true));

    const attack = this.makeCircleButton(1050, 500, 52, '✦', 'attack');
    wireTap(attack, () => (touchInput.attackPressed = true));

    const heal = this.makeCircleButton(930, 540, 40, '✚', 'heal');
    wireTap(heal, () => (touchInput.healPressed = true));

    // Below the top-right HUD lines (level name, help, "Skin: …" at y≈74-90).
    const pause = this.makeCircleButton(1215, 150, 34, '❚❚', 'always');
    wireTap(pause, () => (this.scene.get('Game') as GameSceneLike).requestPause?.());

    this.touchButtons = [left, right, jump, down, attack, heal, pause];
    this.setTouchControlsVisible(true);
  }

  private makeCircleButton(
    x: number,
    y: number,
    radius: number,
    glyph: string,
    kind: TouchButton['kind'],
  ): TouchButton {
    const circle = this.add
      .circle(x, y, radius, 0xffffff, 0.35)
      .setStrokeStyle(2, 0xffffff, 0.5)
      .setDepth(80);
    const glyphText = this.add
      .text(x, y, glyph, {
        fontFamily: FONT,
        fontSize: `${Math.round(radius * 0.85)}px`,
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(81);
    const zone = this.add
      .zone(x, y, radius * 2, radius * 2)
      .setDepth(82)
      .setInteractive({ useHandCursor: false });
    return { circle, glyph: glyphText, zone, kind };
  }

  /** Shows/hides every touch button at once — used while a card (pause,
   * game over, level clear, hole end) covers the screen. */
  private setTouchControlsVisible(visible: boolean): void {
    this.touchControlsVisible = visible;
    // A hidden button can no longer hear its finger lift, so let go of
    // everything now rather than leave the player running on their own.
    if (!visible) {
      resetTouchInput();
      for (const b of this.touchButtons) b.circle.setFillStyle(0xffffff, 0.35);
    }
    this.refreshTouchControlVisibility();
  }

  /** Re-applies visibility: on/off for the whole group, further narrowed for
   * Attack (needs an E attack, or God Tom) and Heal (Nurse only). */
  private refreshTouchControlVisibility(): void {
    for (const b of this.touchButtons) {
      let show = this.touchControlsVisible;
      if (b.kind === 'attack') {
        show = show && (this.hud.attackHint !== null || this.hud.skinLabel === 'God Tom' || this.hud.skinLabel === 'God Henry');
      }
      if (b.kind === 'heal') show = show && this.hud.skinLabel === 'Nurse';
      b.circle.setVisible(show);
      b.glyph.setVisible(show);
      b.zone.setVisible(show);
      if (b.zone.input) b.zone.input.enabled = show;
    }
  }

  /**
   * A rectangular tappable button for the cards below (pause, level-clear,
   * game-over, hole end) — min ~64 game px tall per the brief, drawn above
   * whatever veil that card uses. Returns the pieces so the caller can track
   * them for cleanup (only the pause card is shown/hidden repeatedly).
   */
  private addTapButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    onTap: () => void,
  ): Phaser.GameObjects.GameObject[] {
    const bg = this.add
      .rectangle(x, y, w, h, 0xffffff, 0.12)
      .setStrokeStyle(2, 0xffffff, 0.55)
      .setDepth(56);
    const text = this.add
      .text(x, y, label, { fontFamily: FONT, fontSize: '22px', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(57);
    const zone = this.add
      .zone(x, y, w, h)
      .setDepth(58)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      bg.setFillStyle(0xffffff, 0.3);
      onTap();
    });
    zone.on('pointerup', () => bg.setFillStyle(0xffffff, 0.12));
    zone.on('pointerout', () => bg.setFillStyle(0xffffff, 0.12));
    return [bg, text, zone];
  }

  private redraw(): void {
    const { hp, maxHp, score, coins, held, charges } = this.hud;

    this.hpBar.clear();
    this.hpBar.fillStyle(0x2a2f3d, 1);
    this.hpBar.fillRoundedRect(68, 22, 240, 22, 6);
    const frac = Phaser.Math.Clamp(hp / maxHp, 0, 1);
    // Green when healthy, amber when hurt, red when nearly gone.
    const colour = frac > 0.55 ? 0x4ad66d : frac > 0.25 ? 0xf5b32b : 0xe5484d;
    this.hpBar.fillStyle(colour, 1);
    this.hpBar.fillRoundedRect(70, 24, Math.max(0, 236 * frac), 18, 5);

    this.hpText.setText(`${hp}/${maxHp}`).setPosition(320, 24);
    this.scoreText.setText(`SCORE ${score}`);
    this.coinText.setText(`COINS ${coins}`);
    this.livesText.setText(`LIVES ${'♥'.repeat(Math.max(0, Math.min(6, this.hud.lives)))}`);

    const bits = [`Skin: ${this.hud.skinLabel}`];
    if (this.hud.attackHint) bits.push(this.hud.attackHint);
    if (this.hud.skinLabel === 'Nurse') bits.push('H = heal (20)');
    if (this.hud.skinLabel === 'God Tom' || this.hud.skinLabel === 'God Henry') bits.push('E = pick up / throw');
    this.skinInfoText
      .setText(bits.join('   '))
      .setColor(this.hud.canNurseHeal ? '#7ee6a0' : '#ffe27a');

    this.modeTagText.setVisible(this.hud.nearlyImpossible);
    this.powerStackText.setText(this.hud.godTomStacks > 0 ? `POWER ×${this.hud.godTomStacks}` : '');

    if (held) {
      const def = POWERUPS[held];
      this.powerIcon.setTexture(def.texture).setVisible(true).setScale(0.85);
      this.powerText.setText(
        held === 'fireball' ? `${def.label}  x${charges}\n${def.hint}` : `${def.label}\n${def.hint}`,
      );
    } else {
      this.powerIcon.setVisible(false);
      this.powerText.setText('No power-up\nfind a ? block');
    }

    // Transformation countdown.
    this.formBar.clear();
    if (this.hud.form !== 'none' && this.hud.formMs > 0) {
      const total = this.hud.formTotalMs || 1;
      const frac = Phaser.Math.Clamp(this.hud.formMs / total, 0, 1);
      this.formBar.fillStyle(0x000000, 0.4);
      this.formBar.fillRoundedRect(456, 92, 198, 24, 6);
      this.formBar.fillStyle(this.hud.form === 'star' ? 0xffd12b : 0x8ef0a8, 1);
      this.formBar.fillRect(460, 96, 190 * frac, 16);
      this.formText.setText(this.hud.formLabel).setVisible(true);
    } else {
      this.formText.setVisible(false);
    }

    this.bossBar.clear();
    if (this.boss && this.boss.hp > 0) {
      this.bossText.setVisible(true).setText(this.boss.name);
      const w = 520;
      const x = (VIEW.width - w) / 2;
      const y = VIEW.height - 56;
      this.bossBar.fillStyle(0x000000, 0.5);
      this.bossBar.fillRoundedRect(x - 4, y - 4, w + 8, 30, 8);
      this.bossBar.fillStyle(0x3a1216, 1);
      this.bossBar.fillRect(x, y, w, 22);
      this.bossBar.fillStyle(0xe5484d, 1);
      this.bossBar.fillRect(x, y, w * Phaser.Math.Clamp(this.boss.hp / this.boss.maxHp, 0, 1), 22);
    } else {
      this.bossText.setVisible(false);
    }

    // Attack/Heal buttons depend on the skin, which can change mid-level.
    this.refreshTouchControlVisibility();
  }

  /** The pause card. ESC closes it; Q leaves the level. Tapping RESUME,
   * RESTART or QUIT does exactly what those keys do. */
  private showPause(levelName: string, levelId: number): void {
    if (this.pauseCard) return;
    const cx = VIEW.width / 2;
    this.setTouchControlsVisible(false);

    const veil = this.add.graphics();
    veil.fillStyle(0x0a0e18, 0.78);
    veil.fillRect(0, 0, VIEW.width, VIEW.height);

    const title = this.add
      .text(cx, 150, 'PAUSED', {
        fontFamily: FONT,
        fontSize: '58px',
        color: '#ffe27a',
        stroke: '#000000',
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    const body = this.add
      .text(cx, 230, `${levelName}\n\nESC — keep playing\nShift+R — restart level\nQ — back to the menu`, {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);

    const contents: Phaser.GameObjects.GameObject[] = [veil, title, body];
    const extras: Phaser.GameObjects.GameObject[] = [];

    const gameScene = () => this.scene.get('Game') as GameSceneLike;
    const doQuit = () => {
      this.hidePause();
      gameScene().quitToMenu?.();
    };

    extras.push(
      ...this.addTapButton(cx - 220, 390, 190, 60, 'RESUME', () => gameScene().requestResume?.()),
      ...this.addTapButton(cx, 390, 190, 60, 'RESTART', () => gameScene().restartLevel?.()),
      ...this.addTapButton(cx + 220, 390, 190, 60, 'QUIT', doQuit),
    );

    let skinList: SkinId[] = [];
    let switchMsg: Phaser.GameObjects.Text | undefined;

    // Mid-level skin switching, behind its own flag — John asked for it over
    // Henry's objection, so it stays easy to switch back off.
    if (SKINS_CONFIG.switchMidLevel) {
      const save = loadSave();
      skinList = availableSkins(save, levelId);
      const listTop = 460;
      const lineHeight = 24;
      const pageSize = 6; // placeholder: not Henry's number
      let page = 0;
      const switchTitle = this.add
        .text(cx, listTop, 'Switch skin:', {
          fontFamily: FONT,
          fontSize: '18px',
          color: '#9fd8f0',
        })
        .setOrigin(0.5);
      contents.push(switchTitle);

      const trySwitch = (skinId: SkinId) => {
        const result = gameScene().trySwitchSkin?.(skinId);
        if (!result) return;
        switchMsg?.setText(
          result.ok ? `Now wearing ${SKINS[skinId].label}.` : (result.reason ?? "Can't switch."),
        );
        if (result.ok) {
          save.skin = skinId;
          showPage();
        }
      };

      // Keys 1-6 pick the shown page; - and = turn pages. Touch uses the
      // same rows and page buttons.
      const rows: Phaser.GameObjects.Text[] = [];
      for (let i = 0; i < pageSize; i++) {
        const row = this.add
          .text(cx, listTop + 26 + i * lineHeight, '', {
            fontFamily: FONT,
            fontSize: '17px',
            color: '#cfd9e8',
          })
          .setOrigin(0.5)
          .setDepth(56)
          .setInteractive({ useHandCursor: true });
        row.on('pointerdown', () => {
          const id = skinList[page * pageSize + i];
          if (id) trySwitch(id);
        });
        extras.push(row);
        rows.push(row);
      }

      const pageLabel = this.add.text(cx, 649, '', { fontFamily: FONT, fontSize: '16px', color: '#9fd8f0' }).setOrigin(0.5); // placeholder: not Henry's number
      contents.push(pageLabel);
      const showPage = () => {
        rows.forEach((row, i) => {
          const id = skinList[page * pageSize + i];
          row.setText(id ? `${i + 1} — ${SKINS[id].label}${id === save.skin ? ' (current)' : ''}` : '');
          row.setVisible(!!id);
        });
        pageLabel.setText(`Page ${page + 1}/${Math.ceil(skinList.length / pageSize)}   - previous   = next`);
      };
      const turnPage = (step: number) => {
        page = Phaser.Math.Wrap(page + step, 0, Math.ceil(skinList.length / pageSize));
        showPage();
      };
      showPage();
      extras.push(...this.addTapButton(cx - 190, 650, 100, 34, 'PREV', () => turnPage(-1))); // placeholder: not Henry's number
      extras.push(...this.addTapButton(cx + 190, 650, 100, 34, 'NEXT', () => turnPage(1))); // placeholder: not Henry's number

      switchMsg = this.add
        .text(cx, 690, '', { // placeholder: not Henry's number
          fontFamily: FONT,
          fontSize: '16px',
          color: '#ffe27a',
        })
        .setOrigin(0.5);
      contents.push(switchMsg);

      const handler = (ev: KeyboardEvent) => {
        if (ev.key === '-' || ev.key === '=') { turnPage(ev.key === '-' ? -1 : 1); return; }
        const n = Number(ev.key);
        if (!Number.isInteger(n) || n < 1 || n > pageSize) return;
        const id = skinList[page * pageSize + n - 1];
        if (id) trySwitch(id);
      };
      this.pauseDigitHandler = handler;
      this.input.keyboard!.on('keydown', handler);
    }

    this.pauseCard = this.add.container(0, 0, contents).setDepth(55);
    this.pauseExtras = extras;

    const kb = this.input.keyboard!;
    kb.once('keydown-Q', doQuit);
  }

  private hidePause(): void {
    this.pauseCard?.destroy(true);
    this.pauseCard = undefined;
    for (const obj of this.pauseExtras) obj.destroy();
    this.pauseExtras = [];
    this.input.keyboard?.off('keydown-Q');
    if (this.pauseDigitHandler) {
      this.input.keyboard?.off('keydown', this.pauseDigitHandler);
      this.pauseDigitHandler = undefined;
    }
    this.setTouchControlsVisible(true);
  }

  /**
   * Out of lives. Says plainly what was lost and what was not — a kid should
   * never have to guess whether their progress survived.
   */
  private showGameOver(d: GameOverData): void {
    this.setTouchControlsVisible(false);
    const cx = VIEW.width / 2;
    const veil = this.add.graphics().setDepth(50);
    veil.fillStyle(0x180a12, 0.88);
    veil.fillRect(0, 0, VIEW.width, VIEW.height);

    this.add
      .text(cx, 210, 'OUT OF LIVES', {
        fontFamily: FONT,
        fontSize: '58px',
        color: '#e5484d',
        stroke: '#000000',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(51);

    const lost = d.lockedLevel
      ? `Level ${d.lockedLevel} is locked again.\nBeat ${d.levelName} to win it back.`
      : 'Nothing was lost — every level you\nhave finished stays unlocked.';

    this.add
      .text(cx, 350, `${d.levelName}\nScore ${d.score}\n\n${lost}`, {
        fontFamily: FONT,
        fontSize: '23px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(51);

    this.add
      .text(cx, 500, 'SPACE — try again      ESC — menu', {
        fontFamily: FONT,
        fontSize: '20px',
        color: '#9fd8f0',
      })
      .setOrigin(0.5)
      .setDepth(51);

    const kb = this.input.keyboard!;
    const game = this.scene.get('Game');
    // One exit only, as on the level-clear card: two taps in the same frame
    // would otherwise queue two scene starts.
    let leaving = false;
    const tryAgain = () => {
      if (leaving) return;
      leaving = true;
      this.scene.stop();
      game.scene.start('Game', { levelId: this.levelId });
    };
    const toMenu = () => {
      if (leaving) return;
      leaving = true;
      this.scene.stop();
      game.scene.start('Menu');
    };
    kb.once('keydown-SPACE', tryAgain);
    kb.once('keydown-ESC', toMenu);

    this.addTapButton(cx - 140, 590, 240, 60, 'TRY AGAIN', tryAgain);
    this.addTapButton(cx + 140, 590, 240, 60, 'MENU', toMenu);
  }

  /**
   * The Moo Moo Hole ends here, win or lose. No coins, no best score, no
   * merchant — just a small card, then straight back to the level. A tap on
   * CONTINUE does the same thing as waiting the card out.
   */
  private showHoleEnd(won: boolean, originLevelId: number): void {
    this.setTouchControlsVisible(false);
    const cx = VIEW.width / 2;
    const veil = this.add.graphics().setDepth(50);
    veil.fillStyle(0x0a0e18, 0.8);
    veil.fillRect(0, 0, VIEW.width, VIEW.height);

    this.add
      .text(cx, 300, won ? 'YOU BEAT IT!' : 'NOT THIS TIME', {
        fontFamily: FONT,
        fontSize: '46px',
        color: won ? '#7ee6a0' : '#ff8a8a',
        stroke: '#000000',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(51);

    this.add
      .text(cx, 360, 'Back to the level…', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(51);

    const game = this.scene.get('Game');
    let left = false;
    const goOn = () => {
      if (left) return;
      left = true;
      this.scene.stop();
      game.scene.start('Game', won ? { levelId: originLevelId, spawnNearGoal: true } : { levelId: originLevelId });
    };
    this.time.delayedCall(1600, goOn);
    this.addTapButton(cx, 460, 240, 64, 'CONTINUE', goOn);
  }

  private showComplete(d: CompleteData): void {
    this.setTouchControlsVisible(false);
    const cx = VIEW.width / 2;
    const veil = this.add.graphics().setDepth(50);
    veil.fillStyle(0x0a0e18, 0.82);
    veil.fillRect(0, 0, VIEW.width, VIEW.height);

    const lines = [
      `${d.levelName} complete!`,
      '',
      `Score      ${d.score}`,
      `Coins earned  ${d.coins}`,
      `Coin bank     ${d.totalCoins}`,
      `Health bonus  ${d.bonus}`,
      `Deaths     ${d.deaths}`,
    ].join('\n');

    this.add
      .text(cx, 200, 'LEVEL CLEAR', {
        fontFamily: FONT,
        fontSize: '58px',
        color: '#ffe27a',
        stroke: '#000000',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(51);

    const statsText = this.add
      .text(cx, 360, lines, {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(51);

    if (d.tinyGuyUnlocked) {
      this.add
        .text(cx, statsText.y + statsText.displayHeight / 2 + 28, 'TINY GUY UNLOCKED!', {
          fontFamily: FONT,
          fontSize: '22px',
          color: '#8ef0a8',
          stroke: '#000000',
          strokeThickness: 5,
        })
        .setOrigin(0.5)
        .setDepth(51);
    }

    const prompt = d.nextLevelId
      ? 'Press SPACE for the next level   •   ESC for the menu'
      : 'Press SPACE to return to the menu';

    this.add
      .text(cx, 540, prompt, { fontFamily: FONT, fontSize: '20px', color: '#9fd8f0' })
      .setOrigin(0.5)
      .setDepth(51);

    // The card can be left three ways: SPACE, ESC, or clicking Boo. Only the
    // first counts, or two scene changes queue up and both scenes end up running.
    let leaving = false;
    const leave = (key: string, data?: object) => {
      if (leaving) return;
      leaving = true;
      const game = this.scene.get('Game');
      this.scene.stop();
      game.scene.start(key, data);
    };

    // Boo Mommy Bag sets up shop after every normal level; Big Bob after a
    // boss. Click either to buy — same guarded leave() either way.
    if (d.merchant === 'bob') {
      for (const [lx, flip] of [
        [830, false],
        [900, true],
        [1030, false],
        [1210, true],
        [1250, false],
      ] as const) {
        this.add.image(lx, 690, 'llama').setOrigin(0.5, 1).setDepth(51).setFlipX(flip);
      }
      const bob = this.add
        .image(1070, 700, 'merchant-bob')
        .setOrigin(0.5, 1)
        .setDepth(52)
        .setInteractive({ useHandCursor: true });
      this.add
        .text(1070, 350, 'Click Big Bob\nto go shopping!', {
          fontFamily: FONT,
          fontSize: '18px',
          color: '#ffd76b',
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(53);
      bob.on('pointerdown', () => leave('Shop', { nextLevelId: d.nextLevelId, merchant: 'bob' }));
    } else {
      this.add.image(985, 680, 'llama').setOrigin(0.5, 1).setDepth(51);
      this.add.image(1225, 680, 'llama').setOrigin(0.5, 1).setDepth(51).setFlipX(true);
      const boo = this.add
        .image(1110, 690, 'merchant-boo')
        .setOrigin(0.5, 1)
        .setDepth(52)
        .setInteractive({ useHandCursor: true });
      this.add
        .text(1110, 440, 'Click Boo Mommy Bag\nto go shopping!', {
          fontFamily: FONT,
          fontSize: '18px',
          color: '#ffd76b',
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(51);
      boo.on('pointerdown', () => leave('Shop', { nextLevelId: d.nextLevelId, merchant: 'boo' }));
    }

    const kb = this.input.keyboard!;
    kb.once('keydown-SPACE', () =>
      d.nextLevelId ? leave('Game', { levelId: d.nextLevelId }) : leave('Menu'),
    );
    kb.once('keydown-ESC', () => leave('Menu'));

    // Kept away from the merchant art (which sits to the right, x > 800) —
    // placeholder positions, nudgeable.
    if (d.nextLevelId) {
      this.addTapButton(320, 620, 220, 56, 'NEXT LEVEL', () => leave('Game', { levelId: d.nextLevelId }));
      this.addTapButton(560, 620, 220, 56, 'MENU', () => leave('Menu'));
    } else {
      this.addTapButton(440, 620, 220, 56, 'MENU', () => leave('Menu'));
    }
  }
}
