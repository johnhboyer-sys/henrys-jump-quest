import Phaser from 'phaser';
import { VIEW } from '../config/game';
import { LEVELS } from '../config/levels';
import { loadSave, setSkin, availableSkins, type SaveData } from '../systems/SaveSystem';
import { toggleMute, isMuted, play } from '../systems/SoundSystem';
import { SKINS, type SkinId } from '../config/skins';
import { getMode, setMode, type GameMode } from '../systems/ModeSystem';

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

    // Sky and hills, so the menu looks like the game rather than a form.
    const g = this.add.graphics();
    g.fillStyle(0x1b2450, 1);
    g.fillRect(0, 0, VIEW.width, VIEW.height);
    g.fillStyle(0x27356e, 1);
    g.fillRect(0, 260, VIEW.width, VIEW.height - 260);
    g.fillStyle(0x2f7d4a, 1);
    for (let x = -80; x < VIEW.width + 160; x += 190) g.fillCircle(x, 640, 150);
    g.fillStyle(0x3fa34d, 1);
    g.fillRect(0, 660, VIEW.width, 60);

    for (let i = 0; i < 26; i++) {
      g.fillStyle(0xffffff, 0.5 + ((i * 37) % 40) / 100);
      g.fillCircle((i * 251) % VIEW.width, (i * 89) % 240, 1.6);
    }

    // Cast members, standing about on the title screen.
    this.add.image(150, 640, 'enemy-mushroom').setOrigin(0.5, 1);
    this.add.image(258, 640, 'enemy-turtle').setOrigin(0.5, 1);
    this.add.image(1040, 640, 'enemy-firefoe').setOrigin(0.5, 1);
    this.add.image(1140, 560, 'enemy-butterfly').setOrigin(0.5, 1);

    this.save = loadSave();
    const save = this.save;
    this.hero = this.add.image(cx, 648, `${save.skin}-idle`).setOrigin(0.5, 1).setScale(1.7);
    this.tweens.add({
      targets: this.hero,
      y: 636,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    this.add
      .text(cx, 56, 'JUMP QUEST', {
        fontFamily: FONT,
        fontSize: '62px',
        color: '#ffe27a',
        stroke: '#000000',
        strokeThickness: 9,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 98, 'Henry and Tom vs. Shellcracker', {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#9fd8f0',
      })
      .setOrigin(0.5);

    // Mode selector: ← → switches between Normal and Nearly Impossible, each
    // with its own fully separate save.
    const modeY = 126;
    this.modeNormalText = this.add
      .text(cx - 16, modeY, 'NORMAL', { fontFamily: FONT, fontSize: '20px' })
      .setOrigin(1, 0.5);
    this.modeHardText = this.add
      .text(cx + 16, modeY, 'NEARLY IMPOSSIBLE', { fontFamily: FONT, fontSize: '20px' })
      .setOrigin(0, 0.5);
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
        .setOrigin(0.5);
      this.rows.push(rowText);
    });

    const gridBottom = gridTop + (rowsPerCol - 1) * rowH + 24;

    this.skinText = this.add
      .text(cx, gridBottom + 24, '', { fontFamily: FONT, fontSize: '20px', color: '#ffe27a' })
      .setOrigin(0.5);

    this.add
      .text(cx, gridBottom + 54, '↑ ↓ choose level   ← → mode   ENTER start   S skin   M mute', {
        fontFamily: FONT,
        fontSize: '16px',
        color: '#cfd9e8',
      })
      .setOrigin(0.5);

    this.add
      .text(
        cx,
        gridBottom + 90,
        '← → run    ↑ jump    ↓ use power-up    ESC pause\n' +
          'Cloud = double jump    Fireball = throw fire\n' +
          'Star and God Mushroom make you unstoppable for a while',
        { fontFamily: FONT, fontSize: '15px', color: '#9fd8f0', align: 'center' },
      )
      .setOrigin(0.5);

    this.oneUpText = this.add
      .text(20, VIEW.height - 28, '', { fontFamily: FONT, fontSize: '16px', color: '#7ee6a0' })
      .setOrigin(0, 0.5);
    const bank = [`Coins: ${save.totalCoins}`];
    if (save.oneUps > 0) bank.push(`1-UPs banked: ${save.oneUps}`);
    this.oneUpText.setText(bank.join('    '));

    this.muteText = this.add
      .text(VIEW.width - 20, VIEW.height - 28, '', {
        fontFamily: FONT,
        fontSize: '16px',
        color: '#cfd9e8',
      })
      .setOrigin(1, 0.5);
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
    this.skinText.setText(`Playing as ${SKINS[this.skin].label.toUpperCase()}   (press S to swap)`);
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
