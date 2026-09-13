import Phaser from 'phaser';
import { VIEW, PLAYER } from '../config/game';
import { POWERUPS, type PowerUpKind } from '../config/powerups';
import { SKINS, SKINS_CONFIG, type SkinId } from '../config/skins';
import { availableSkins, loadSave } from '../systems/SaveSystem';

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

const FONT = 'monospace';

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

  constructor() {
    super('UI');
  }

  create(data: { levelName: string; levelId?: number }): void {
    this.levelId = data.levelId ?? 1;
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

    this.add
      .text(VIEW.width - 24, 50, '← → move   ↑ jump   ↓ use   ESC pause   Shift+R restart', {
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

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
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
    if (this.hud.skinLabel === 'God Tom') bits.push('E = pick up / throw');
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
  }

  /** The pause card. ESC closes it; Q leaves the level. */
  private showPause(levelName: string, levelId: number): void {
    if (this.pauseCard) return;
    const cx = VIEW.width / 2;

    const veil = this.add.graphics();
    veil.fillStyle(0x0a0e18, 0.78);
    veil.fillRect(0, 0, VIEW.width, VIEW.height);

    const title = this.add
      .text(cx, 190, 'PAUSED', {
        fontFamily: FONT,
        fontSize: '58px',
        color: '#ffe27a',
        stroke: '#000000',
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    const body = this.add
      .text(cx, 280, `${levelName}\n\nESC — keep playing\nShift+R — restart level\nQ — back to the menu`, {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);

    const contents: Phaser.GameObjects.GameObject[] = [veil, title, body];
    let skinList: SkinId[] = [];
    let switchMsg: Phaser.GameObjects.Text | undefined;

    // Mid-level skin switching, behind its own flag — John asked for it over
    // Henry's objection, so it stays easy to switch back off.
    if (SKINS_CONFIG.switchMidLevel) {
      const save = loadSave();
      skinList = availableSkins(save, levelId);
      const lines = skinList
        .map((id, i) => `${i + 1} — ${SKINS[id].label}${id === save.skin ? ' (current)' : ''}`)
        .join('\n');
      const listTop = 430;
      const lineHeight = 20;
      const switchTitle = this.add
        .text(cx, listTop, 'Switch skin:', {
          fontFamily: FONT,
          fontSize: '18px',
          color: '#9fd8f0',
        })
        .setOrigin(0.5);
      const switchList = this.add
        .text(cx, listTop + 26, lines, {
          fontFamily: FONT,
          fontSize: '17px',
          color: '#cfd9e8',
          align: 'center',
          lineSpacing: 4,
        })
        .setOrigin(0.5, 0);
      switchMsg = this.add
        .text(cx, listTop + 26 + skinList.length * lineHeight + 20, '', {
          fontFamily: FONT,
          fontSize: '16px',
          color: '#ffe27a',
        })
        .setOrigin(0.5);
      contents.push(switchTitle, switchList, switchMsg);
    }

    this.pauseCard = this.add.container(0, 0, contents).setDepth(55);

    const kb = this.input.keyboard!;
    kb.once('keydown-Q', () => {
      const game = this.scene.get('Game') as Phaser.Scene & { quitToMenu?: () => void };
      this.hidePause();
      game.quitToMenu?.();
    });

    if (SKINS_CONFIG.switchMidLevel) {
      const handler = (ev: KeyboardEvent) => {
        const n = Number(ev.key);
        if (!Number.isInteger(n) || n < 1 || n > skinList.length) return;
        const game = this.scene.get('Game') as Phaser.Scene & {
          trySwitchSkin?: (id: SkinId) => { ok: boolean; reason?: string };
        };
        const result = game.trySwitchSkin?.(skinList[n - 1]);
        if (!result) return;
        switchMsg?.setText(result.ok ? `Now wearing ${SKINS[skinList[n - 1]].label}.` : (result.reason ?? "Can't switch."));
      };
      this.pauseDigitHandler = handler;
      kb.on('keydown', handler);
    }
  }

  private hidePause(): void {
    this.pauseCard?.destroy(true);
    this.pauseCard = undefined;
    this.input.keyboard?.off('keydown-Q');
    if (this.pauseDigitHandler) {
      this.input.keyboard?.off('keydown', this.pauseDigitHandler);
      this.pauseDigitHandler = undefined;
    }
  }

  /**
   * Out of lives. Says plainly what was lost and what was not — a kid should
   * never have to guess whether their progress survived.
   */
  private showGameOver(d: GameOverData): void {
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
      .text(cx, 520, 'SPACE — try again      ESC — menu', {
        fontFamily: FONT,
        fontSize: '20px',
        color: '#9fd8f0',
      })
      .setOrigin(0.5)
      .setDepth(51);

    const kb = this.input.keyboard!;
    const game = this.scene.get('Game');
    kb.once('keydown-SPACE', () => {
      this.scene.stop();
      game.scene.start('Game', { levelId: this.levelId });
    });
    kb.once('keydown-ESC', () => {
      this.scene.stop();
      game.scene.start('Menu');
    });
  }

  /**
   * The Moo Moo Hole ends here, win or lose. No coins, no best score, no
   * merchant — just a small card, then straight back to the level.
   */
  private showHoleEnd(won: boolean, originLevelId: number): void {
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
    this.time.delayedCall(1600, () => {
      this.scene.stop();
      game.scene.start('Game', won ? { levelId: originLevelId, spawnNearGoal: true } : { levelId: originLevelId });
    });
  }

  private showComplete(d: CompleteData): void {
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
  }
}
