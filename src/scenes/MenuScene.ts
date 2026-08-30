import Phaser from 'phaser';
import { VIEW } from '../config/game';
import { LEVELS } from '../config/levels';
import { loadSave, setSkin } from '../systems/SaveSystem';
import { toggleMute, isMuted, play } from '../systems/SoundSystem';
import type { SkinId } from '../entities/Player';

const FONT = 'monospace';

/** Title screen and level select. */
export class MenuScene extends Phaser.Scene {
  private selected = 0;
  private rows: Phaser.GameObjects.Text[] = [];
  private unlocked = 1;
  private muteText!: Phaser.GameObjects.Text;
  private skin: SkinId = 'tom';
  private hero!: Phaser.GameObjects.Image;
  private skinText!: Phaser.GameObjects.Text;
  private oneUpText!: Phaser.GameObjects.Text;

  constructor() {
    super('Menu');
  }

  create(): void {
    const cx = VIEW.width / 2;
    this.rows = [];
    this.selected = 0;

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

    const save = loadSave();
    this.skin = save.skin;
    this.hero = this.add.image(cx, 648, `${this.skin}-idle`).setOrigin(0.5, 1).setScale(1.7);
    this.tweens.add({
      targets: this.hero,
      y: 636,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    this.add
      .text(cx, 96, 'JUMP QUEST', {
        fontFamily: FONT,
        fontSize: '74px',
        color: '#ffe27a',
        stroke: '#000000',
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 152, 'Henry and Tom vs. Shellcracker', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#9fd8f0',
      })
      .setOrigin(0.5);

    this.unlocked = save.unlockedLevel;

    LEVELS.forEach((level, i) => {
      const locked = level.id > this.unlocked;
      const best = save.bestScores[level.id];
      const label = locked
        ? `${level.id}. ??? — locked`
        : `${level.id}. ${level.name}${best ? `   best ${best}` : ''}`;
      const row = this.add
        .text(cx, 210 + i * 38, label, {
          fontFamily: FONT,
          fontSize: '24px',
          color: locked ? '#6b7385' : '#ffffff',
        })
        .setOrigin(0.5);
      this.rows.push(row);
      void i;
    });

    this.skinText = this.add
      .text(cx, 416, '', { fontFamily: FONT, fontSize: '20px', color: '#ffe27a' })
      .setOrigin(0.5);

    this.add
      .text(cx, 446, '↑ ↓ choose level    ENTER start    S skin    M mute', {
        fontFamily: FONT,
        fontSize: '17px',
        color: '#cfd9e8',
      })
      .setOrigin(0.5);

    this.add
      .text(
        cx,
        486,
        '← → run    ↑ jump    ↓ use power-up    ESC pause\n' +
          'Cloud = double jump    Fireball = throw fire\n' +
          'Star and God Mushroom make you unstoppable for a while',
        { fontFamily: FONT, fontSize: '16px', color: '#9fd8f0', align: 'center' },
      )
      .setOrigin(0.5);

    this.oneUpText = this.add
      .text(20, VIEW.height - 28, '', { fontFamily: FONT, fontSize: '16px', color: '#7ee6a0' })
      .setOrigin(0, 0.5);
    this.oneUpText.setText(save.oneUps > 0 ? `1-UPs banked: ${save.oneUps}` : '');

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
    kb.on('keydown-ENTER', () => this.start());
    kb.on('keydown-SPACE', () => this.start());
    kb.on('keydown-S', () => this.swapSkin());
    kb.on('keydown-M', () => {
      toggleMute();
      this.refreshMute();
    });

    this.refreshSkin();
    this.highlight();
  }

  /** Flip between the two player skins and remember the choice. */
  private swapSkin(): void {
    this.skin = this.skin === 'tom' ? 'henry' : 'tom';
    setSkin(this.skin);
    this.hero.setTexture(`${this.skin}-idle`);
    this.tweens.add({ targets: this.hero, scale: { from: 2.1, to: 1.7 }, duration: 220 });
    this.refreshSkin();
    play('power');
  }

  private refreshSkin(): void {
    const name = this.skin === 'henry' ? 'HENRY' : 'TOM';
    this.skinText.setText(`Playing as ${name}   (press S to swap)`);
  }

  private refreshMute(): void {
    this.muteText.setText(isMuted() ? 'sound: off (M)' : 'sound: on (M)');
  }

  private move(step: number): void {
    this.selected = Phaser.Math.Wrap(this.selected + step, 0, LEVELS.length);
    play('block');
    this.highlight();
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
