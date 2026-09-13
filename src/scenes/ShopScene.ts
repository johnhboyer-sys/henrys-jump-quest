import Phaser from 'phaser';
import { VIEW } from '../config/game';
import { BOO_STOCK, BOB_STOCK, type ShopItem } from '../config/shop';
import { loadSave, buyItem, blockedReason, type SaveData } from '../systems/SaveSystem';
import { play } from '../systems/SoundSystem';

const FONT = 'monospace';

type Merchant = 'boo' | 'bob';

/** Boo Mommy Bag's or Big Bob's shop. Opened from the level-clear card. */
export class ShopScene extends Phaser.Scene {
  private nextLevelId: number | null = null;
  private merchant: Merchant = 'boo';
  private stock: ShopItem[] = BOO_STOCK;
  private selected = 0;
  private rows: Phaser.GameObjects.Text[] = [];
  private coinText!: Phaser.GameObjects.Text;
  private detailText!: Phaser.GameObjects.Text;
  private note!: Phaser.GameObjects.Text;

  constructor() {
    super('Shop');
  }

  init(data: { nextLevelId?: number | null; merchant?: Merchant }): void {
    this.nextLevelId = data.nextLevelId ?? null;
    this.merchant = data.merchant ?? 'boo';
    this.stock = this.merchant === 'bob' ? BOB_STOCK : BOO_STOCK;
    this.selected = 0;
    this.rows = [];
  }

  create(): void {
    // A market stall: striped awning, a counter, and the merchant with their
    // llamas (Big Bob only has five real ones — the "twelve hundred" is a joke).
    const g = this.add.graphics();
    g.fillStyle(0x2a1d3a, 1);
    g.fillRect(0, 0, VIEW.width, VIEW.height);
    g.fillStyle(0x3b2a52, 1);
    g.fillRect(0, 600, VIEW.width, VIEW.height - 600);
    for (let x = 0; x < VIEW.width; x += 80) {
      g.fillStyle((x / 80) % 2 ? 0xf2b134 : 0xe5484d, 1);
      g.fillRect(x, 0, 80, 54);
    }

    if (this.merchant === 'bob') {
      for (const [lx, flip] of [
        [900, false],
        [960, true],
        [1080, false],
        [1230, true],
        [1270, false],
      ] as const) {
        this.add.image(lx, 640, 'llama').setOrigin(0.5, 1).setFlipX(flip);
      }
      this.add.image(1110, 660, 'merchant-bob').setOrigin(0.5, 1);
    } else {
      this.add.image(985, 640, 'llama').setOrigin(0.5, 1);
      this.add.image(1225, 640, 'llama').setOrigin(0.5, 1).setFlipX(true);
      this.add.image(1110, 650, 'merchant-boo').setOrigin(0.5, 1);
    }

    this.add
      .text(440, 90, this.merchant === 'bob' ? "BIG BOB'S SHOP" : "BOO MOMMY BAG'S SHOP", {
        fontFamily: FONT,
        fontSize: '40px',
        color: '#ffe27a',
        stroke: '#000000',
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    this.coinText = this.add
      .text(440, 132, '', { fontFamily: FONT, fontSize: '22px', color: '#ffd76b' })
      .setOrigin(0.5);

    const rowTop = 172;
    const rowGap = 40;
    this.stock.forEach((item, i) => {
      const y = rowTop + i * rowGap;
      this.add.image(90, y, item.texture).setScale(0.7);
      const row = this.add
        .text(140, y, '', { fontFamily: FONT, fontSize: '19px', color: '#ffffff' })
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true });
      // She (or he) was opened with a click, so the shelves take clicks too.
      row.on('pointerdown', () => {
        this.selected = i;
        this.buy();
      });
      this.rows.push(row);
    });

    this.detailText = this.add
      .text(440, rowTop + this.stock.length * rowGap + 26, '', {
        fontFamily: FONT,
        fontSize: '17px',
        color: '#9fd8f0',
        align: 'center',
        wordWrap: { width: 760 },
      })
      .setOrigin(0.5);

    this.note = this.add
      .text(440, 590, '', { fontFamily: FONT, fontSize: '20px', color: '#7ee6a0' })
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
    this.selected = Phaser.Math.Wrap(this.selected + step, 0, this.stock.length);
    play('block');
    this.refresh();
  }

  private buy(): void {
    const item = this.stock[this.selected];
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
  private suffix(save: SaveData, item: ShopItem): string {
    if (item.kind === 'skin') {
      if (save.ownedSkins.includes(item.skin)) return '  (owned)';
      const left = save.skinRentals[item.skin] ?? 0;
      if (left > 0) return `  (${left} levels left)`;
      return '';
    }
    if (item.id === 'star' && save.starLevels > 0) return `  (${save.starLevels} levels left)`;
    if (item.id === 'mushroom' && save.mushroomLevels > 0) return '  (ready!)';
    if (save.nextHeld === item.id) return '  (ready!)';
    return '';
  }

  private refresh(): void {
    const save = loadSave();
    this.coinText.setText(`Your coins: ${save.totalCoins}`);
    this.stock.forEach((item, i) => {
      const blocked = blockedReason(save, item) !== null;
      const picked = i === this.selected;
      this.rows[i]
        .setText(`${item.label}   ${item.price} coins${this.suffix(save, item)}`)
        .setColor(picked ? (blocked ? '#c08080' : '#ffe27a') : blocked ? '#8a8f9e' : '#ffffff')
        .setScale(picked ? 1.06 : 1);
    });
    this.detailText.setText(this.stock[this.selected]?.blurb ?? '');
  }
}
