import Phaser from 'phaser';
import { VIEW } from '../config/game';
import { LEVELS } from '../config/levels';
import { loadSave, setSkin, availableSkins, type SaveData } from '../systems/SaveSystem';
import { toggleMute, isMuted, play } from '../systems/SoundSystem';
import { SKINS, isGodSkin, type SkinId } from '../config/skins';
import { getMode, setMode, type GameMode } from '../systems/ModeSystem';
import { buildMenuBackdrop } from '../systems/Backdrop';
import { dressSlab, surfaceLook } from '../systems/Terrain';

const FONT = 'monospace';

/** Title screen and level select. */
export class MenuScene extends Phaser.Scene {
  private selected = 0;
  private rows: Phaser.GameObjects.Text[] = [];
  private unlocked = 1;
  private muteText!: Phaser.GameObjects.Text;
  private save!: SaveData;
  private skin: SkinId = 'tom';
  private hero!: Phaser.GameObjects.Image;
  private skinText!: Phaser.GameObjects.Text;
  private oneUpText!: Phaser.GameObjects.Text;
  private mode: GameMode = 'normal';
  private modeNormalText!: Phaser.GameObjects.Text;
  private modeHardText!: Phaser.GameObjects.Text;

  constructor() {
    super('Menu');
  }

  create(): void {
    const cx = VIEW.width / 2;
    this.rows = [];
    this.selected = 0;
    this.mode = getMode();

    // Green Hills by night, standing on real ground, so the menu looks like
    // the game rather than a form.
    buildMenuBackdrop(this);
    const ground = { x: -20, y: 640, w: VIEW.width + 40, h: 80 };
    const look = surfaceLook('grass', 'ground');
    this.add.tileSprite(ground.x, ground.y, ground.w, ground.h, look.fill).setOrigin(0, 0).setDepth(-10);
    dressSlab(this, ground, look, -10);

    // Dark glass behind the mode switch and level list, so they stay easy to read.
    const glass = this.add.graphics().setDepth(-5);
    glass.fillStyle(0x0b1020, 0.55);
    glass.fillRoundedRect(cx - 430, 108, 860, 264, 16);
    glass.lineStyle(2, 0xffffff, 0.16);
    glass.strokeRoundedRect(cx - 429, 109, 858, 262, 15);

    // Cast members, standing about on the title screen.
    this.add.image(150, 640, 'enemy-mushroom').setOrigin(0.5, 1);
    this.add.image(258, 640, 'enemy-turtle').setOrigin(0.5, 1);
    this.add.image(1040, 640, 'enemy-firefoe').setOrigin(0.5, 1);
    this.add.image(1140, 560, 'enemy-butterfly').setOrigin(0.5, 1);

    this.save = loadSave();
    const save = this.save;
    this.hero = this.add
      .image(cx, 648, `${save.skin}-idle`)
      .setOrigin(0.5, 1)
      .setScale(1.7)
      .setInteractive({ useHandCursor: true });
    this.hero.on('pointerdown', () => this.swapSkin());
    this.tweens.add({
      targets: this.hero,
      y: 636,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    const title = this.add
      .text(cx, 56, 'JUMP QUEST', {
        fontFamily: FONT,
        fontSize: '62px',
        fontStyle: 'bold',
        color: '#ffe27a',
        stroke: '#1d1830',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setShadow(0, 6, '#05081a', 0, true, true);
    // Sunny gold, lighter at the top of the letters.
    const gold = title.context.createLinearGradient(0, 10, 0, title.height - 10);
    gold.addColorStop(0, '#fff6c2');
    gold.addColorStop(0.5, '#ffd84a');
    gold.addColorStop(1, '#ff9f1c');
    title.setFill(gold);
    this.tweens.add({ targets: title, y: 50, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    this.add
      .text(cx, 96, 'Henry and Tom vs. Shellcracker', {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#bfe6f7',
        stroke: '#0b1020',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Mode selector: ← → switches between Normal and Nearly Impossible, each
    // with its own fully separate save.
    const modeY = 126;
    this.modeNormalText = this.add
      .text(cx - 16, modeY, 'NORMAL', { fontFamily: FONT, fontSize: '20px' })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });
    this.modeHardText = this.add
      .text(cx + 16, modeY, 'NEARLY IMPOSSIBLE', { fontFamily: FONT, fontSize: '20px' })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    this.modeNormalText.on('pointerdown', () => this.chooseMode('normal'));
    this.modeHardText.on('pointerdown', () => this.chooseMode('nearlyImpossible'));
    this.refreshMode();

    this.unlocked = save.unlockedLevel;

    // Adaptive grid: one column up to 6 levels, two columns beyond that, so
    // the list never overlaps the rest of the menu regardless of how many
    // levels LEVELS holds.
    const columns = LEVELS.length > 6 ? 2 : 1;
    const rowsPerCol = Math.ceil(LEVELS.length / columns);
    const rowH = 28;
    const gridTop = 158;
    const colX = columns === 1 ? [cx] : [cx - 260, cx + 260];
    const rowFontSize = columns === 1 ? '24px' : '18px';

    LEVELS.forEach((level, i) => {
      const locked = level.id > this.unlocked;
      const best = save.bestScores[level.id];
      const label = locked
        ? `${level.id}. ??? — locked`
        : `${level.id}. ${level.name}${best ? `  best ${best}` : ''}`;
      const col = Math.floor(i / rowsPerCol);
      const row = i % rowsPerCol;
      const rowText = this.add
        .text(colX[col], gridTop + row * rowH, label, {
          fontFamily: FONT,
          fontSize: rowFontSize,
          color: locked ? '#6b7385' : '#ffffff',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      // Tapping the already-selected row starts it (start() itself refuses a
      // locked one, same as ENTER); tapping any other row just selects it.
      rowText.on('pointerdown', () => {
        if (this.selected === i) {
          this.start();
        } else {
          this.selected = i;
          play('block');
          this.highlight();
          this.refreshSkinForSelection();
        }
      });
      this.rows.push(rowText);
    });

    const gridBottom = gridTop + (rowsPerCol - 1) * rowH + 24;

    this.skinText = this.add
      .text(cx, gridBottom + 24, '', { fontFamily: FONT, fontSize: '20px', color: '#ffe27a', stroke: '#0b1020', strokeThickness: 4 })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.skinText.on('pointerdown', () => this.swapSkin());

    // A tappable PLAY button, doing what ENTER/SPACE already do.
    const playY = gridBottom + 58;
    const playBg = this.add
      .rectangle(cx, playY, 160, 48, 0xffd84a, 0.9)
      .setStrokeStyle(3, 0x1d1830, 1)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(cx, playY, 'PLAY', { fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#3a2205' })
      .setOrigin(0.5);
    playBg.on('pointerover', () => playBg.setFillStyle(0xfff0a0, 1));
    playBg.on('pointerout', () => playBg.setFillStyle(0xffd84a, 0.9));
    playBg.on('pointerdown', () => this.start());

    this.add
      .text(cx, gridBottom + 96, '↑ ↓ choose level   ← → mode   ENTER start   S skin   M mute', {
        fontFamily: FONT,
        fontSize: '16px',
        color: '#e3ebf5',
        stroke: '#0b1020',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(
        cx,
        gridBottom + 134,
        '← → run    ↑ jump    ↓ use power-up    ESC pause\n' +
          'Cloud = double jump    Fireball = throw fire\n' +
          'Star and God Mushroom make you unstoppable for a while',
        { fontFamily: FONT, fontSize: '14px', color: '#bfe6f7', align: 'center', stroke: '#0b1020', strokeThickness: 4, lineSpacing: 2 },
      )
      .setOrigin(0.5);

    this.oneUpText = this.add
      .text(20, VIEW.height - 28, '', { fontFamily: FONT, fontSize: '16px', color: '#7ee6a0', stroke: '#0b1020', strokeThickness: 4 })
      .setOrigin(0, 0.5);
    const bank = [`Coins: ${save.totalCoins}`];
    if (save.oneUps > 0) bank.push(`1-UPs banked: ${save.oneUps}`);
    this.oneUpText.setText(bank.join('    '));

    this.muteText = this.add
      .text(VIEW.width - 20, VIEW.height - 28, '', {
        fontFamily: FONT,
        fontSize: '16px',
        color: '#e3ebf5',
        stroke: '#0b1020',
        strokeThickness: 4,
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });
    this.muteText.on('pointerdown', () => {
      toggleMute();
      this.refreshMute();
    });
    this.refreshMute();

    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => this.move(-1));
    kb.on('keydown-DOWN', () => this.move(1));
    kb.on('keydown-W', () => this.move(-1));
    kb.on('keydown-LEFT', () => this.chooseMode('normal'));
    kb.on('keydown-RIGHT', () => this.chooseMode('nearlyImpossible'));
    kb.on('keydown-ENTER', () => this.start());
    kb.on('keydown-SPACE', () => this.start());
    kb.on('keydown-S', () => this.swapSkin());
    kb.on('keydown-M', () => {
      toggleMute();
      this.refreshMute();
    });

    this.refreshSkinForSelection();
    this.highlight();
  }

  /** Every skin the player may currently wear, for the highlighted level. */
  private availableForSelection(): SkinId[] {
    return availableSkins(this.save, LEVELS[this.selected].id);
  }

  /**
   * Shows the saved skin if it still fits the highlighted level, or Tom if it
   * does not — moving the highlight never overwrites the save, only the menu
   * display.
   */
  private refreshSkinForSelection(): void {
    const avail = this.availableForSelection();
    this.skin = avail.includes(this.save.skin) ? this.save.skin : 'tom';
    this.hero.setTexture(`${this.skin}-idle`);
    this.refreshSkin();
  }

  /** Cycle through every skin available for the highlighted level. */
  private swapSkin(): void {
    const avail = this.availableForSelection();
    const next = avail[(avail.indexOf(this.skin) + 1) % avail.length] ?? avail[0];
    this.skin = next;
    this.save = setSkin(next);
    this.hero.setTexture(`${this.skin}-idle`);
    this.tweens.add({ targets: this.hero, scale: { from: 2.1, to: 1.7 }, duration: 220 });
    this.refreshSkin();
    play('power');
  }

  private refreshSkin(): void {
    // A save that won God Tom by beating the old last level (11) lost him when
    // levels 12-16 arrived. Bought god skins stay owned, so they never show this.
    const lost = isGodSkin(this.save.skin) && this.skin !== this.save.skin;
    const lastId = LEVELS[LEVELS.length - 1].id;
    this.skinText.setText(
      lost
        ? `Beat level ${lastId} to get ${SKINS[this.save.skin].label} back   (press S to swap)`
        : `Playing as ${SKINS[this.skin].label.toUpperCase()}   (press S to swap)`,
    );
  }

  /** Highlights whichever of Normal / Nearly Impossible is current. */
  private refreshMode(): void {
    const isNormal = this.mode === 'normal';
    this.modeNormalText.setColor(isNormal ? '#ffe27a' : '#6b7385').setScale(isNormal ? 1.08 : 1);
    this.modeHardText.setColor(!isNormal ? '#ffe27a' : '#6b7385').setScale(!isNormal ? 1.08 : 1);
  }

  /** ← → on the menu. Normal and Nearly Impossible are fully separate saves,
   * so switching rebuilds the whole menu against the newly-current one. */
  private chooseMode(mode: GameMode): void {
    if (mode === this.mode) return;
    setMode(mode);
    play('block');
    this.scene.restart();
  }

  private refreshMute(): void {
    this.muteText.setText(isMuted() ? 'sound: off (M)' : 'sound: on (M)');
  }

  private move(step: number): void {
    this.selected = Phaser.Math.Wrap(this.selected + step, 0, LEVELS.length);
    play('block');
    this.highlight();
    this.refreshSkinForSelection();
  }

  private highlight(): void {
    this.rows.forEach((row, i) => {
      const locked = LEVELS[i].id > this.unlocked;
      row.setColor(i === this.selected ? (locked ? '#a06060' : '#ffe27a') : locked ? '#6b7385' : '#ffffff');
      row.setScale(i === this.selected ? 1.08 : 1);
    });
  }

  private start(): void {
    const level = LEVELS[this.selected];
    if (level.id > this.unlocked) {
      this.cameras.main.shake(140, 0.006);
      return;
    }
    play('power');
    this.scene.start('Game', { levelId: level.id });
  }
}
