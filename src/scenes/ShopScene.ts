import Phaser from 'phaser';
import { VIEW } from '../config/game';
import { BOO_STOCK, type ShopItem } from '../config/shop';
import { loadSave, buyItem, blockedReason, type SaveData } from '../systems/SaveSystem';
import { play } from '../systems/SoundSystem';

const FONT = 'monospace';

/** Boo Mommy Bag's shop. Opened by clicking her on the level-clear card. */
export class ShopScene extends Phaser.Scene {
  private nextLevelId: number | null = null;
  private selected = 0;
  private rows: Phaser.GameObjects.Text[] = [];
  private coinText!: Phaser.GameObjects.Text;
  private note!: Phaser.GameObjects.Text;

  constructor() {
    super('Shop');
  }

  init(data: { nextLevelId?: number | null }): void {
    this.nextLevelId = data.nextLevelId ?? null;
    this.selected = 0;
    this.rows = [];
  }

  create(): void {
    // A market stall: striped awning, a counter, and Boo with her llamas.
    const g = this.add.graphics();
    g.fillStyle(0x2a1d3a, 1);
    g.fillRect(0, 0, VIEW.width, VIEW.height);
    g.fillStyle(0x3b2a52, 1);
    g.fillRect(0, 600, VIEW.width, VIEW.height - 600);
    for (let x = 0; x < VIEW.width; x += 80) {
      g.fillStyle((x / 80) % 2 ? 0xf2b134 : 0xe5484d, 1);
      g.fillRect(x, 0, 80, 54);
    }

    this.add.image(985, 640, 'llama').setOrigin(0.5, 1);
    this.add.image(1225, 640, 'llama').setOrigin(0.5, 1).setFlipX(true);
    this.add.image(1110, 650, 'merchant-boo').setOrigin(0.5, 1);

    this.add
      .text(440, 100, "BOO MOMMY BAG'S SHOP", {
        fontFamily: FONT,
        fontSize: '44px',
        color: '#ffe27a',
        stroke: '#000000',
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    this.coinText = this.add
      .text(440, 160, '', { fontFamily: FONT, fontSize: '24px', color: '#ffd76b' })
      .setOrigin(0.5);

    BOO_STOCK.forEach((item, i) => {
      const y = 240 + i * 84;
      this.add.image(120, y, item.texture).setScale(1.1);
      const row = this.add
        .text(170, y, '', { fontFamily: FONT, fontSize: '22px', color: '#ffffff' })
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true });
      // She was opened with a click, so the shelves take clicks too.
      row.on('pointerdown', () => {
        this.selected = i;
        this.buy();
      });
      this.rows.push(row);
    });

    this.note = this.add
      .text(440, 580, '', { fontFamily: FONT, fontSize: '22px', color: '#7ee6a0' })
      .setOrigin(0.5);

    const leave = this.nextLevelId ? 'SPACE next level   ESC menu' : 'SPACE or ESC menu';
    this.add
      .text(440, 660, `↑ ↓ choose   ENTER buy   ${leave}`, {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#cfd9e8',
      })
      .setOrigin(0.5);

    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => this.move(-1));
    kb.on('keydown-DOWN', () => this.move(1));
    kb.on('keydown-W', () => this.move(-1));
    kb.on('keydown-S', () => this.move(1));
    // Holding ENTER sends repeats. One press, one purchase.
    kb.on('keydown-ENTER', (ev: KeyboardEvent) => !ev.repeat && this.buy());
    kb.on('keydown-SPACE', () => this.leave(true));
    kb.on('keydown-ESC', () => this.leave(false));

    this.refresh();
  }

  private move(step: number): void {
    this.selected = Phaser.Math.Wrap(this.selected + step, 0, BOO_STOCK.length);
    play('block');
    this.refresh();
  }

  private buy(): void {
    const item = BOO_STOCK[this.selected];
    const reason = blockedReason(loadSave(), item);
    if (reason || !buyItem(item)) {
      this.cameras.main.shake(140, 0.006);
      this.note.setText(reason ?? 'Not enough coins!').setColor('#ff8a8a');
      play('hurt');
      this.refresh();
      return;
    }
    play('coin');
    this.note.setText(`You bought the ${item.label}!`).setColor('#7ee6a0');
    this.refresh();
  }

  private leave(toNextLevel: boolean): void {
    play('power');
    if (toNextLevel && this.nextLevelId) this.scene.start('Game', { levelId: this.nextLevelId });
    else this.scene.start('Menu');
  }

  /** What you already have waiting, so a kid can see the buy went through. */
  private owned(save: SaveData, item: ShopItem): string {
    if (item.id === 'star' && save.starLevels > 0) return `  (${save.starLevels} levels left)`;
    if (item.id === 'mushroom' && save.mushroomLevels > 0) return '  (ready!)';
    if (save.nextHeld === item.id) return '  (ready!)';
    return '';
  }

  private refresh(): void {
    const save = loadSave();
    this.coinText.setText(`Your coins: ${save.totalCoins}`);
    BOO_STOCK.forEach((item, i) => {
      const blocked = blockedReason(save, item) !== null;
      const picked = i === this.selected;
      this.rows[i]
        .setText(`${item.label}   ${item.price} coins${this.owned(save, item)}\n${item.blurb}`)
        .setColor(picked ? (blocked ? '#c08080' : '#ffe27a') : blocked ? '#8a8f9e' : '#ffffff')
        .setScale(picked ? 1.06 : 1);
    });
  }
}
