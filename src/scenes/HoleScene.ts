import Phaser from 'phaser';
import { VIEW } from '../config/game';
import { LEVELS } from '../config/levels';
import { BOSSES } from '../config/bosses';
import { loadSave } from '../systems/SaveSystem';
import { play } from '../systems/SoundSystem';

const FONT = 'monospace';

interface HoleSceneData {
  originLevelId: number;
}

/** A scene handle carrying the two methods GameScene exposes to this picker. */
type HoleHost = Phaser.Scene & {
  resumeFromHole?: () => void;
  startHoleFight?: (bossId: string) => void;
};

/**
 * The Moo Moo Cow Mom Hole's boss picker. Generic over `LEVELS`: only bosses
 * already beaten in the current mode show up, found by scanning every level
 * with a boss and keeping the ones at or below `clearedLevel`.
 */
export class HoleScene extends Phaser.Scene {
  private bossIds: string[] = [];
  private selected = 0;
  private rows: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('Hole');
  }

  init(_data: HoleSceneData): void {
    this.selected = 0;
    this.rows = [];
    const save = loadSave();
    this.bossIds = LEVELS.filter((l) => l.boss && save.clearedLevel >= l.id).map((l) => l.boss!.id);
  }

  create(): void {
    const cx = VIEW.width / 2;
    const veil = this.add.graphics();
    veil.fillStyle(0x0a0e18, 0.85);
    veil.fillRect(0, 0, VIEW.width, VIEW.height);

    this.add
      .text(cx, 140, 'MOO MOO COW MOM HOLE', {
        fontFamily: FONT,
        fontSize: '38px',
        color: '#ffe27a',
        stroke: '#000000',
        strokeThickness: 7,
      })
      .setOrigin(0.5);

    if (this.bossIds.length === 0) {
      this.add
        .text(cx, 300, 'Beat a boss first!', {
          fontFamily: FONT,
          fontSize: '26px',
          color: '#ff8a8a',
        })
        .setOrigin(0.5);
      this.add
        .text(cx, 360, 'ESC — climb back out', { fontFamily: FONT, fontSize: '18px', color: '#9fd8f0' })
        .setOrigin(0.5);
      this.addTapButton(cx, 420, 220, 60, 'CLIMB OUT', () => this.leave());
    } else {
      this.add
        .text(cx, 200, 'A weaker rematch. Pick your boss:', {
          fontFamily: FONT,
          fontSize: '20px',
          color: '#9fd8f0',
        })
        .setOrigin(0.5);

      this.bossIds.forEach((id, i) => {
        const name = BOSSES[id]?.name ?? id;
        const row = this.add
          .text(cx, 260 + i * 44, name, { fontFamily: FONT, fontSize: '26px', color: '#ffffff' })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true });
        row.on('pointerdown', () => {
          this.selected = i;
          this.pick();
        });
        this.rows.push(row);
      });

      this.add
        .text(cx, 260 + this.bossIds.length * 44 + 30, '↑ ↓ choose   ENTER fight   ESC climb back out', {
          fontFamily: FONT,
          fontSize: '17px',
          color: '#cfd9e8',
        })
        .setOrigin(0.5);
      this.addTapButton(cx, 260 + this.bossIds.length * 44 + 84, 220, 60, 'CLIMB OUT', () => this.leave());

      this.highlight();
    }

    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => this.move(-1));
    kb.on('keydown-DOWN', () => this.move(1));
    kb.on('keydown-ENTER', () => this.pick());
    kb.on('keydown-ESC', () => this.leave());
  }

  private move(step: number): void {
    if (this.bossIds.length === 0) return;
    this.selected = Phaser.Math.Wrap(this.selected + step, 0, this.bossIds.length);
    play('block');
    this.highlight();
  }

  private highlight(): void {
    this.rows.forEach((row, i) => {
      row.setColor(i === this.selected ? '#ffe27a' : '#ffffff');
      row.setScale(i === this.selected ? 1.08 : 1);
    });
  }

  private pick(): void {
    if (this.bossIds.length === 0) return;
    play('power');
    const game = this.scene.get('Game') as HoleHost;
    game.startHoleFight?.(this.bossIds[this.selected]);
  }

  /** A rectangular tappable button — same look as the rest of the touch layer. */
  private addTapButton(x: number, y: number, w: number, h: number, label: string, onTap: () => void): void {
    const bg = this.add.rectangle(x, y, w, h, 0xffffff, 0.12).setStrokeStyle(2, 0xffffff, 0.55);
    this.add.text(x, y, label, { fontFamily: FONT, fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      bg.setFillStyle(0xffffff, 0.3);
      onTap();
    });
    zone.on('pointerup', () => bg.setFillStyle(0xffffff, 0.12));
    zone.on('pointerout', () => bg.setFillStyle(0xffffff, 0.12));
  }

  private leave(): void {
    play('block');
    const game = this.scene.get('Game') as HoleHost;
    game.resumeFromHole?.();
    this.scene.stop();
  }
}
