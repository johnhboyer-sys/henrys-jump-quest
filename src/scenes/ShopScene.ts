import Phaser from 'phaser';
import { VIEW } from '../config/game';
import { paintTexture, vGradient, type Ctx } from '../systems/Paint';
import { BOO_STOCK, BOB_STOCK, type ShopItem } from '../config/shop';
import { loadSave, buyItem, blockedReason, hasBeatenGame, type SaveData } from '../systems/SaveSystem';
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
    paintTexture(this, 'bd-shop-stall', VIEW.width, VIEW.height, paintStall);
    this.add.image(0, 0, 'bd-shop-stall').setOrigin(0, 0);

    const rowTop = 160; // placeholder: not Henry's number
    const rowGap = 36; // placeholder: not Henry's number

    // Dark glass behind the shelves, so the list stays easy to read.
    const glass = this.add.graphics();
    const glassBottom = rowTop + this.stock.length * rowGap + 34;
    glass.fillStyle(0x0b1020, 0.5);
    glass.fillRoundedRect(50, 112, 780, glassBottom - 112, 16);
    glass.lineStyle(2, 0xffffff, 0.14);
    glass.strokeRoundedRect(51, 113, 778, glassBottom - 114, 15);

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
      .text(440, rowTop + this.stock.length * rowGap + 6, '', { // placeholder: not Henry's number
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

    // Tappable equivalents of SPACE/ESC. Kept close together (the row list
    // above can run long) — placeholder position, nudgeable.
    if (this.nextLevelId) {
      this.addTapButton(320, 620, 200, 52, 'NEXT LEVEL', () => this.leave(true));
      this.addTapButton(560, 620, 200, 52, 'MENU', () => this.leave(false));
    } else {
      this.addTapButton(440, 620, 200, 52, 'MENU', () => this.leave(false));
    }

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

  /** A rectangular tappable button — same look as the rest of the touch layer. */
  private addTapButton(x: number, y: number, w: number, h: number, label: string, onTap: () => void): void {
    const bg = this.add.rectangle(x, y, w, h, 0xffffff, 0.12).setStrokeStyle(2, 0xffffff, 0.55);
    this.add.text(x, y, label, { fontFamily: FONT, fontSize: '19px', color: '#ffffff' }).setOrigin(0.5);
    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      bg.setFillStyle(0xffffff, 0.3);
      onTap();
    });
    zone.on('pointerup', () => bg.setFillStyle(0xffffff, 0.12));
    zone.on('pointerout', () => bg.setFillStyle(0xffffff, 0.12));
  }

  /** Set by the first exit, so a second tap in the same frame cannot start another scene. */
  private leaving = false;

  private leave(toNextLevel: boolean): void {
    if (this.leaving) return;
    this.leaving = true;
    // The scene object is reused for the next visit, so clear the flag on the way out.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => (this.leaving = false));
    play('power');
    if (toNextLevel && this.nextLevelId) this.scene.start('Game', { levelId: this.nextLevelId });
    else this.scene.start('Menu');
  }

  /** What you already have waiting, so a kid can see the buy went through. */
  private suffix(save: SaveData, item: ShopItem): string {
    if (item.kind === 'skin') {
      if (save.ownedSkins.includes(item.skin) || (item.skin === 'godTom' && save.ownedSkins.includes('godHenry'))) return '  (owned)';
      if (item.skin === 'primrose' && save.clearedLevel >= 11) return '  (free)';
      if (item.skin === 'godTom' && hasBeatenGame(save)) return '  (free)';
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

/**
 * The market stall behind the shop: a plank wall, a scalloped striped awning
 * with a string of warm lights under it, and a wooden floor.
 */
function paintStall(ctx: Ctx, w: number, h: number): void {
  const floorY = 600;
  ctx.fillStyle = vGradient(ctx, 0, floorY, [
    [0, '#3a2950'],
    [1, '#241a33'],
  ]);
  ctx.fillRect(0, 0, w, floorY);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let x = 0; x < w; x += 64) ctx.fillRect(x, 0, 3, floorY);

  // Floor planks, lit along the front edge.
  ctx.fillStyle = vGradient(ctx, floorY, h, [
    [0, '#5a3f72'],
    [1, '#33244a'],
  ]);
  ctx.fillRect(0, floorY, w, h - floorY);
  ctx.fillStyle = 'rgba(255,220,180,0.25)';
  ctx.fillRect(0, floorY, w, 3);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  for (const y of [632, 670, 704]) ctx.fillRect(0, y, w, 2);

  // Awning: red and gold stripes, shaded at the top, with a scalloped hem.
  const stripe = 80;
  const hem = 40;
  for (let x = 0; x < w; x += stripe) {
    const red = (x / stripe) % 2 === 0;
    ctx.fillStyle = vGradient(ctx, 0, hem + 14, [
      [0, red ? '#b8323a' : '#c98a1e'],
      [1, red ? '#ec5a5f' : '#f7c04a'],
    ]);
    ctx.fillRect(x, 0, stripe, hem);
    ctx.beginPath();
    ctx.ellipse(x + stripe / 2, hem, stripe / 2, 14, 0, 0, Math.PI);
    ctx.fill();
  }
  // The shadow the awning casts on the wall.
  ctx.fillStyle = vGradient(ctx, hem, hem + 70, [
    [0, 'rgba(0,0,0,0.35)'],
    [1, 'rgba(0,0,0,0)'],
  ]);
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillRect(0, hem, w, 70);
  ctx.globalCompositeOperation = 'source-over';

  // A string of lights sagging between the scallops.
  ctx.strokeStyle = '#1b1426';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= w; x += 4) ctx.lineTo(x, hem + 22 + Math.sin((x / 160) * Math.PI) ** 2 * 14);
  ctx.stroke();
  const bulbs = ['#ffe27a', '#ff9ec4', '#9fe8ff', '#b6f28a'];
  for (let i = 0; i < 32; i++) {
    const x = 20 + i * 40;
    const y = hem + 26 + Math.sin((x / 160) * Math.PI) ** 2 * 14;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 22);
    glow.addColorStop(0, 'rgba(255,230,160,0.35)');
    glow.addColorStop(1, 'rgba(255,230,160,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 22, y - 22, 44, 44);
    ctx.fillStyle = bulbs[i % bulbs.length];
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
