import Phaser from 'phaser';
import { makeExpansionArt } from './ExpansionArt';
import { makeTerrainTextures } from '../systems/Terrain';
import { inkTexture } from '../systems/Paint';

/**
 * Every texture in the game is drawn here in code — no image files, no asset
 * pipeline. Each maker is one small function that bakes a Graphics into a
 * texture, so any single sprite can be redrawn without touching the rest.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.makePlayer();
    this.makeMushroom();
    this.makeFireFoe();
    this.makeTurtle();
    this.makeButterfly();
    this.makeBoss();
    this.makeRaider();
    this.makeMerchant();
    this.makeBigBob();
    this.makeProjectiles();
    this.makeAttackEffects();
    this.makePowerUps();
    this.makeBlocks();
    makeTerrainTextures(this);
    this.makeIcicle();
    this.makeFlags();
    this.makeMooMooHole();
    this.makeBits();
    makeExpansionArt(this);
    this.inkAll();

    this.scene.start('Menu');
  }

  /**
   * The cartoon finish: outlines and rim shading on everything solid — the
   * cast, pickups, blocks and props. Glows, swings, sparks and hitboxes stay
   * soft, so they are left off this list.
   */
  private inkAll(): void {
    const skins = ['tom', 'henry', 'james', 'nurse', 'shellcracker', 'galacticRaider', 'tinyGuy', 'godTom', 'godHenry', 'shellcrackerMom', 'shellcrackerDad', 'primrose', 'godshroom'];
    for (const skin of skins) {
      for (const pose of ['idle', 'run1', 'run2', 'jump']) {
        inkTexture(this, `${skin}-${pose}`, skin === 'tinyGuy' ? { width: 1.5 } : {});
      }
    }
    for (const key of ['enemy-mushroom', 'enemy-firefoe', 'enemy-turtle', 'enemy-butterfly', 'enemy-kitty', 'enemy-waterGuy', 'enemy-poisonFlower']) {
      inkTexture(this, key);
    }
    for (const key of ['boss-shellcracker', 'boss-raider', 'boss-shellcrackerMom', 'boss-kittyRaider', 'boss-shellcrackerDad', 'boss-gardener', 'boss-thunder', 'merchant-boo', 'merchant-bob', 'llama']) {
      inkTexture(this, key, { width: 3, rim: 3 });
    }
    for (const key of [
      'pw-cloud', 'pw-fireball', 'pw-heart', 'pw-star', 'pw-mushroom', 'pw-oneup', 'pw-kittysuit', 'pw-coin',
      'block-question', 'block-used', 'icicle', 'flag-goal', 'flag-check-off', 'flag-check-on', 'hole-moomoo',
      'proj-shell', 'proj-hand', 'proj-furball', 'proj-water', 'proj-poison', 'proj-rain', 'proj-spore', 'proj-playerfire', 'proj-galactic', 'prop-computer',
    ]) {
      inkTexture(this, key, { width: 1.5 });
    }
  }

  /** Draw into a throwaway Graphics and bake it into a texture. */
  private tex(key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void): void {
    const g = this.add.graphics();
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  // -- Player ---------------------------------------------------------------
  // Two skins share one body: Tom in a red cap, Henry with brown hair, blue
  // eyes and a starry shirt. Four poses each so running and jumping read.

  private drawKid(
    g: Phaser.GameObjects.Graphics,
    legs: 'stand' | 'runA' | 'runB' | 'air',
    skin: 'tom' | 'henry' | 'james' | 'nurse',
  ): void {
    const henry = skin === 'henry';
    const james = skin === 'james';
    const nurse = skin === 'nurse';

    // Cape / scarf trailing behind
    g.fillStyle(henry ? 0x6a8fd8 : james ? 0x8fd36a : nurse ? 0xffb6c9 : 0xf2b134, 1);
    g.fillTriangle(14, 22, 14, 40, 0, 34);

    // Legs
    g.fillStyle(0x2b4c8c, 1);
    if (legs === 'stand') {
      g.fillRect(16, 44, 10, 14);
      g.fillRect(28, 44, 10, 14);
    } else if (legs === 'runA') {
      g.fillRect(12, 44, 11, 13);
      g.fillRect(30, 46, 11, 11);
    } else if (legs === 'runB') {
      g.fillRect(14, 46, 11, 11);
      g.fillRect(28, 44, 11, 13);
    } else {
      g.fillRect(13, 43, 10, 11);
      g.fillRect(29, 46, 10, 12);
    }

    // Shoes
    g.fillStyle(0x8b3a1f, 1);
    if (legs === 'air') {
      g.fillRect(11, 52, 13, 6);
      g.fillRect(28, 55, 13, 5);
    } else {
      g.fillRect(14, 55, 13, 5);
      g.fillRect(27, 55, 13, 5);
    }

    // Body. Henry's shirt is midnight blue with stars; James's is orange;
    // the Nurse's is white with a red cross.
    g.fillStyle(henry ? 0x2a2f6b : james ? 0xffa63d : nurse ? 0xffffff : 0x3563c9, 1);
    g.fillRoundedRect(12, 26, 28, 22, 6);
    if (henry) {
      g.fillStyle(0xffe27a, 1);
      for (const [sx, sy, r] of [
        [18, 32, 2.4],
        [27, 38, 3],
        [35, 31, 2.2],
        [22, 43, 2],
        [33, 44, 2.4],
      ] as const) {
        g.fillCircle(sx, sy, r);
      }
    } else if (nurse) {
      g.fillStyle(0xd7263d, 1);
      g.fillRect(24, 33, 10, 4);
      g.fillRect(27, 30, 4, 10);
    } else {
      g.fillStyle(0xe8f1ff, 1);
      g.fillRect(16, 26, 20, 5);
    }
    // A little shade along the bottom of the shirt, so it reads as rounded.
    g.fillStyle(0x000000, 0.14);
    g.fillRoundedRect(12, 41, 28, 7, { tl: 0, tr: 0, bl: 6, br: 6 });

    // Arms
    g.fillStyle(0xf6c9a0, 1);
    if (legs === 'air') {
      g.fillRect(6, 20, 8, 12);
      g.fillRect(38, 20, 8, 12);
    } else {
      g.fillRect(7, 30, 7, 13);
      g.fillRect(38, 30, 7, 13);
    }

    // The Nurse carries a little bag everywhere.
    if (nurse) {
      g.fillStyle(0xd7263d, 1);
      g.fillRoundedRect(39, 36, 11, 13, 3);
      g.fillStyle(0x8c1d1d, 1);
      g.fillRect(42, 33, 5, 4);
    }

    // Head
    g.fillStyle(0xf6c9a0, 1);
    g.fillRoundedRect(13, 8, 26, 21, 8);

    if (henry) {
      // Brown hair, no cap: a rounded mop with a fringe.
      g.fillStyle(0x6b4423, 1);
      g.fillRoundedRect(12, 4, 28, 14, 7);
      g.fillRect(12, 12, 28, 4);
      g.fillStyle(0x7d5330, 1);
      g.fillRect(14, 14, 9, 4);
      g.fillRect(28, 14, 9, 4);
      g.fillStyle(0x9a6a3e, 1);
      g.fillRoundedRect(17, 6, 12, 3, 1.5);
    } else if (james) {
      g.fillStyle(0x1f6b3a, 1);
      g.fillRoundedRect(11, 4, 30, 12, 6);
      g.fillRect(11, 12, 30, 4);
      g.fillStyle(0x164f2a, 1);
      g.fillRect(36, 12, 12, 5);
      g.fillStyle(0xffffff, 0.22);
      g.fillRoundedRect(15, 6, 14, 3, 1.5);
    } else if (nurse) {
      // A white nurse cap with a red cross.
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(13, 2, 26, 12, 5);
      g.fillStyle(0xd7263d, 1);
      g.fillRect(24, 3, 4, 9);
      g.fillRect(21, 6, 10, 4);
    } else {
      g.fillStyle(0xd7263d, 1);
      g.fillRoundedRect(11, 4, 30, 12, 6);
      g.fillRect(11, 12, 30, 4);
      g.fillStyle(0xb01c30, 1);
      g.fillRect(36, 12, 12, 5);
      g.fillStyle(0xffffff, 0.25);
      g.fillRoundedRect(15, 6, 14, 3, 1.5);
    }

    // Eyes — Henry's are blue.
    g.fillStyle(0xffffff, 1);
    g.fillCircle(24, 21, 4.5);
    g.fillCircle(34, 21, 4.5);
    g.fillStyle(henry ? 0x2f7fd4 : 0x18202e, 1);
    g.fillCircle(25, 21, 2.4);
    g.fillCircle(35, 21, 2.4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(25.9, 20, 0.9);
    g.fillCircle(35.9, 20, 0.9);
    g.fillStyle(0xff7f7f, 0.4);
    g.fillCircle(19, 26, 2.6);
    g.fillCircle(38, 26, 2.4);

    // Grin
    g.lineStyle(2, 0xb5714b, 1);
    g.beginPath();
    g.arc(29, 25, 5, 0.2, Math.PI - 0.2);
    g.strokePath();
  }

  /** Shellcracker's costume: the kid's body under a spiky green shell. */
  private drawShellKid(g: Phaser.GameObjects.Graphics, legs: 'stand' | 'runA' | 'runB' | 'air'): void {
    this.drawKid(g, legs, 'tom');
    g.fillStyle(0x17542e, 1);
    g.fillEllipse(26, 30, 34, 26);
    g.fillStyle(0x1f6b3a, 1);
    g.fillEllipse(26, 26, 34, 16);
    g.fillStyle(0xf1e4b8, 1);
    g.fillTriangle(16, 20, 26, 8, 36, 20);
    g.lineStyle(2, 0x0f3d20, 1);
    g.strokeEllipse(26, 28, 26, 16);
  }

  /** Galactic Raider's costume: the kid's body under purple star armour. */
  private drawRaiderKid(g: Phaser.GameObjects.Graphics, legs: 'stand' | 'runA' | 'runB' | 'air'): void {
    this.drawKid(g, legs, 'tom');
    g.fillStyle(0x4a3a8f, 1);
    g.fillRoundedRect(10, 24, 30, 22, 6);
    g.fillStyle(0x7a68c4, 1);
    g.fillRoundedRect(14, 28, 22, 8, 3);
    g.fillStyle(0xfff0a8, 1);
    g.fillCircle(18, 33, 1.6);
    g.fillCircle(30, 33, 1.6);
    // A glowing sword, held low.
    g.fillStyle(0x9ff0ff, 0.9);
    g.fillTriangle(40, 34, 46, 32, 42, 60);
    g.fillStyle(0xffe27a, 1);
    g.fillRoundedRect(38, 30, 8, 5, 2);
  }

  /** Tiny Guy — a much smaller kid with a big hammer. */
  private drawTinyGuy(g: Phaser.GameObjects.Graphics, legs: 'stand' | 'runA' | 'runB' | 'air'): void {
    // Legs
    g.fillStyle(0x2b4c8c, 1);
    if (legs === 'stand') {
      g.fillRect(10, 30, 6, 9);
      g.fillRect(18, 30, 6, 9);
    } else if (legs === 'runA') {
      g.fillRect(8, 30, 7, 8);
      g.fillRect(19, 31, 7, 7);
    } else if (legs === 'runB') {
      g.fillRect(9, 31, 7, 7);
      g.fillRect(18, 30, 7, 8);
    } else {
      g.fillRect(8, 29, 6, 7);
      g.fillRect(19, 31, 6, 8);
    }

    // Shoes
    g.fillStyle(0x8b3a1f, 1);
    g.fillRect(9, 37, 8, 3);
    g.fillRect(17, 37, 8, 3);

    // Body
    g.fillStyle(0x3563c9, 1);
    g.fillRoundedRect(8, 18, 18, 14, 4);

    // Arms
    g.fillStyle(0xf6c9a0, 1);
    g.fillRect(4, 20, 5, 9);
    g.fillRect(25, 18, 5, 10);

    // Head
    g.fillStyle(0xf6c9a0, 1);
    g.fillRoundedRect(8, 4, 18, 15, 6);
    g.fillStyle(0x6b4423, 1);
    g.fillRoundedRect(7, 1, 20, 10, 5);

    // Eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(14, 12, 2.6);
    g.fillCircle(20, 12, 2.6);
    g.fillStyle(0x18202e, 1);
    g.fillCircle(14.6, 12, 1.4);
    g.fillCircle(20.6, 12, 1.4);

    // Hammer, held out to the side.
    g.fillStyle(0x8a5a35, 1);
    g.fillRect(27, 12, 4, 18);
    g.fillStyle(0x7a7f8c, 1);
    g.fillRoundedRect(24, 4, 12, 10, 3);
  }

  /** The God Mushroom form: the kid, but as an enormous angry toadstool. */
  private drawGodShroom(
    g: Phaser.GameObjects.Graphics,
    legs: 'stand' | 'runA' | 'runB' | 'air',
  ): void {
    // Legs
    g.fillStyle(0xf3e3c8, 1);
    if (legs === 'runA') {
      g.fillRoundedRect(13, 42, 11, 16, 4);
      g.fillRoundedRect(29, 45, 11, 13, 4);
    } else if (legs === 'runB') {
      g.fillRoundedRect(15, 45, 11, 13, 4);
      g.fillRoundedRect(27, 42, 11, 16, 4);
    } else if (legs === 'air') {
      g.fillRoundedRect(12, 41, 11, 14, 4);
      g.fillRoundedRect(30, 45, 11, 14, 4);
    } else {
      g.fillRoundedRect(15, 42, 11, 16, 4);
      g.fillRoundedRect(28, 42, 11, 16, 4);
    }

    // Stalk
    g.fillStyle(0xfff4e0, 1);
    g.fillRoundedRect(14, 26, 24, 22, 7);

    // Cap
    g.fillStyle(0xd93b2b, 1);
    g.fillEllipse(26, 20, 50, 30);
    g.fillStyle(0xb82f22, 1);
    g.fillEllipse(26, 26, 50, 16);
    g.fillStyle(0xfff0dc, 1);
    g.fillCircle(13, 16, 5);
    g.fillCircle(28, 10, 6.5);
    g.fillCircle(40, 18, 4.5);

    // Fierce little face
    g.fillStyle(0xffffff, 1);
    g.fillCircle(21, 34, 5);
    g.fillCircle(32, 34, 5);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(21, 35, 2.6);
    g.fillCircle(32, 35, 2.6);
    g.lineStyle(2.5, 0x8c2118, 1);
    g.lineBetween(15, 28, 25, 32);
    g.lineBetween(38, 28, 28, 32);
    g.lineBetween(20, 44, 32, 44);
  }

  /** God Tom: Tom, but with a golden glow and a crown. */
  private drawGodTom(g: Phaser.GameObjects.Graphics, legs: 'stand' | 'runA' | 'runB' | 'air', henry = false): void {
    // Golden aura, drawn behind the body: soft rings that fit the frame.
    for (const r of [23, 19, 15]) {
      g.fillStyle(0xffe27a, 0.12);
      g.fillCircle(24, 32, r);
    }
    this.drawKid(g, legs, henry ? 'henry' : 'tom');
    // A little crown, perched on top of the cap.
    g.fillStyle(0xffd700, 1);
    g.fillRect(13, 1, 22, 4);
    g.fillTriangle(13, 2, 18, -4, 23, 2);
    g.fillTriangle(20, 2, 27, -6, 34, 2);
    g.fillTriangle(31, 2, 36, -4, 41, 2);
    g.fillStyle(0xfff0a0, 1);
    g.fillCircle(18, -2, 2);
    g.fillCircle(27, -4, 2.4);
    g.fillCircle(36, -2, 2);
  }

  private makePlayer(): void {
    const poses = ['idle', 'run1', 'run2', 'jump'] as const;
    const legsFor = { idle: 'stand', run1: 'runA', run2: 'runB', jump: 'air' } as const;

    for (const skin of ['tom', 'henry', 'james', 'nurse'] as const) {
      for (const pose of poses) {
        this.tex(`${skin}-${pose}`, 48, 62, (g) => this.drawKid(g, legsFor[pose], skin));
      }
    }
    for (const pose of poses) {
      this.tex(`shellcracker-${pose}`, 48, 62, (g) => this.drawShellKid(g, legsFor[pose]));
      this.tex(`galacticRaider-${pose}`, 48, 62, (g) => this.drawRaiderKid(g, legsFor[pose]));
      this.tex(`tinyGuy-${pose}`, 32, 40, (g) => this.drawTinyGuy(g, legsFor[pose]));
      this.tex(`godTom-${pose}`, 48, 62, (g) => this.drawGodTom(g, legsFor[pose]));
      this.tex(`godHenry-${pose}`, 48, 62, (g) => this.drawGodTom(g, legsFor[pose], true));
      this.tex(`shellcrackerMom-${pose}`, 48, 62, (g) => {
        // placeholder: not Henry's number — curl positions, size and colour.
        this.drawShellKid(g, legsFor[pose]);
        g.fillStyle(0xf2d24a, 1);
        for (const [x, y] of [[10, 13], [8, 21], [8, 30], [8, 39], [8, 48], [41, 13], [43, 21], [43, 30], [43, 39], [43, 48]] as const) g.fillCircle(x, y, 5); // placeholder: not Henry's number
      });
      this.tex(`shellcrackerDad-${pose}`, 48, 62, (g) => {
        // placeholder: not Henry's number — glasses positions and size.
        this.drawShellKid(g, legsFor[pose]);
        g.lineStyle(2, 0x1a1a1a, 1);
        g.strokeCircle(24, 21, 6); g.strokeCircle(34, 21, 6); g.lineBetween(30, 21, 28, 21); // placeholder: not Henry's number
      });
      this.tex(`primrose-${pose}`, 48, 62, (g) => {
        // placeholder: not Henry's number — armor shapes, sizes and colours.
        this.drawKid(g, legsFor[pose], 'henry');
        g.fillStyle(0x6d35a4, 1); g.fillRoundedRect(10, 25, 32, 23, 5); // placeholder: not Henry's number
        g.fillStyle(0xc93450, 1); g.fillTriangle(10, 26, 25, 29, 10, 40); g.fillTriangle(42, 26, 27, 29, 42, 40);
        g.fillStyle(0xffd55d, 1); g.fillCircle(26, 36, 4);
      });
    }
    for (const pose of poses) {
      this.tex(`godshroom-${pose}`, 48, 62, (g) => this.drawGodShroom(g, legsFor[pose]));
    }

    // Glows that sit behind a transformed player.
    this.tex('aura-star', 96, 96, (g) => {
      g.fillStyle(0xffe27a, 0.35);
      g.fillCircle(48, 48, 46);
      g.fillStyle(0xfff6c8, 0.5);
      g.fillCircle(48, 48, 30);
    });
    this.tex('aura-mushroom', 96, 96, (g) => {
      g.fillStyle(0x8ef0a8, 0.32);
      g.fillCircle(48, 48, 46);
      g.fillStyle(0xd6ffe2, 0.45);
      g.fillCircle(48, 48, 30);
    });
  }

  // -- Enemies --------------------------------------------------------------

  private makeMushroom(): void {
    this.tex('enemy-mushroom', 56, 52, (g) => {
      // Stalk
      g.fillStyle(0xf3e3c8, 1);
      g.fillRoundedRect(18, 24, 20, 26, 6);
      // Cap
      g.fillStyle(0xc8452f, 1);
      g.fillEllipse(28, 22, 54, 32);
      g.fillStyle(0xa53522, 1);
      g.fillEllipse(28, 28, 54, 18);
      // Spots
      g.fillStyle(0xffeede, 1);
      g.fillCircle(15, 18, 5);
      g.fillCircle(30, 12, 6.5);
      g.fillCircle(43, 20, 4.5);
      // Grumpy eyes
      g.fillStyle(0x2a1a18, 1);
      g.fillCircle(23, 36, 3.4);
      g.fillCircle(34, 36, 3.4);
      g.lineStyle(2, 0x2a1a18, 1);
      g.lineBetween(19, 31, 27, 34);
      g.lineBetween(38, 31, 30, 34);
      // Little scowl
      g.lineBetween(24, 44, 33, 44);
    });
  }

  private makeFireFoe(): void {
    this.tex('enemy-firefoe', 52, 58, (g) => {
      // Outer flame body
      g.fillStyle(0xff7a1a, 1);
      g.fillTriangle(26, 0, 50, 40, 2, 40);
      g.fillEllipse(26, 40, 48, 34);
      // Inner flame
      g.fillStyle(0xffc93c, 1);
      g.fillTriangle(26, 12, 42, 42, 10, 42);
      g.fillEllipse(26, 42, 32, 24);
      // Eyes — the "living fireball" Tom asked for
      g.fillStyle(0xffffff, 1);
      g.fillCircle(19, 38, 6);
      g.fillCircle(33, 38, 6);
      g.fillStyle(0x2a0d02, 1);
      g.fillCircle(19, 39, 3);
      g.fillCircle(33, 39, 3);
      // Angry brows
      g.lineStyle(2.5, 0xc23c00, 1);
      g.lineBetween(13, 31, 24, 35);
      g.lineBetween(39, 31, 28, 35);
      // Mouth
      g.fillStyle(0x8c1d00, 1);
      g.fillEllipse(26, 50, 14, 8);
    });
  }

  private makeTurtle(): void {
    this.tex('enemy-turtle', 64, 50, (g) => {
      // Shell
      g.fillStyle(0x2f8f4e, 1);
      g.fillEllipse(34, 26, 50, 36);
      g.fillStyle(0x246e3d, 1);
      g.fillEllipse(34, 30, 50, 22);
      // Shell plates
      g.lineStyle(2, 0x18512c, 1);
      g.strokeEllipse(34, 26, 30, 20);
      g.lineBetween(20, 20, 48, 20);
      // Head
      g.fillStyle(0x8fd36a, 1);
      g.fillEllipse(11, 28, 24, 20);
      // Snapping beak
      g.fillStyle(0xf5e06a, 1);
      g.fillTriangle(1, 26, 14, 22, 14, 30);
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(3, 28, 10, 26, 10, 31);
      // Eye
      g.fillStyle(0xffffff, 1);
      g.fillCircle(13, 23, 4);
      g.fillStyle(0x1a1a1a, 1);
      g.fillCircle(11, 23, 2.2);
      // Feet
      g.fillStyle(0x8fd36a, 1);
      g.fillRoundedRect(18, 40, 14, 9, 4);
      g.fillRoundedRect(40, 40, 14, 9, 4);
    });
  }

  private makeButterfly(): void {
    this.tex('enemy-butterfly', 80, 56, (g) => {
      // Wings
      g.fillStyle(0x9b6bdb, 1);
      g.fillEllipse(20, 20, 38, 30);
      g.fillEllipse(60, 20, 38, 30);
      g.fillStyle(0x7a4bc4, 1);
      g.fillEllipse(22, 38, 30, 24);
      g.fillEllipse(58, 38, 30, 24);
      // Wing spots
      g.fillStyle(0xffe27a, 1);
      g.fillCircle(18, 18, 6);
      g.fillCircle(62, 18, 6);
      g.fillStyle(0x4fd6ff, 1);
      g.fillCircle(23, 39, 4);
      g.fillCircle(57, 39, 4);
      // Body
      g.fillStyle(0x3a2a52, 1);
      g.fillRoundedRect(35, 12, 10, 34, 5);
      // Antennae
      g.lineStyle(2, 0x3a2a52, 1);
      g.lineBetween(37, 12, 30, 2);
      g.lineBetween(43, 12, 50, 2);
      // Eyes
      g.fillStyle(0xffffff, 1);
      g.fillCircle(37, 20, 3.2);
      g.fillCircle(43, 20, 3.2);
      g.fillStyle(0x1a1a1a, 1);
      g.fillCircle(37, 20, 1.6);
      g.fillCircle(43, 20, 1.6);
    });
  }

  private makeBoss(): void {
    this.tex('boss-shellcracker', 190, 150, (g) => {
      // Spiked shell
      g.fillStyle(0x1f6b3a, 1);
      g.fillEllipse(105, 78, 150, 110);
      g.fillStyle(0x17542e, 1);
      g.fillEllipse(105, 92, 150, 74);
      g.fillStyle(0xf1e4b8, 1);
      for (const [sx, sy] of [
        [70, 34],
        [105, 24],
        [140, 34],
        [55, 60],
        [155, 60],
      ] as const) {
        g.fillTriangle(sx - 12, sy + 16, sx + 12, sy + 16, sx, sy - 12);
      }
      // Shell rim
      g.lineStyle(4, 0x0f3d20, 1);
      g.strokeEllipse(105, 82, 128, 88);
      // Head
      g.fillStyle(0x76c552, 1);
      g.fillEllipse(38, 74, 66, 58);
      // Jaw + fangs
      g.fillStyle(0xf5d94a, 1);
      g.fillTriangle(4, 70, 40, 60, 40, 80);
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(12, 76, 20, 76, 16, 88);
      g.fillTriangle(26, 78, 34, 78, 30, 90);
      // Eyes — mean
      g.fillStyle(0xffffff, 1);
      g.fillCircle(36, 62, 11);
      g.fillCircle(58, 60, 11);
      g.fillStyle(0xd11a1a, 1);
      g.fillCircle(33, 63, 5.5);
      g.fillCircle(55, 61, 5.5);
      g.lineStyle(5, 0x2c6b1f, 1);
      g.lineBetween(22, 48, 46, 56);
      g.lineBetween(72, 46, 50, 55);
      // Feet
      g.fillStyle(0x5aa63d, 1);
      g.fillRoundedRect(52, 122, 40, 26, 10);
      g.fillRoundedRect(122, 122, 40, 26, 10);
      // Claws
      g.fillStyle(0xf1e4b8, 1);
      for (const cx of [56, 66, 76, 126, 136, 146]) {
        g.fillTriangle(cx, 148, cx + 8, 148, cx + 4, 138);
      }
    });
  }

  private makeRaider(): void {
    this.tex('boss-raider', 170, 210, (g) => {
      // Cloak
      g.fillStyle(0x2a1d54, 1);
      g.fillTriangle(85, 40, 168, 208, 2, 208);
      g.fillStyle(0x372a6e, 1);
      g.fillTriangle(85, 56, 148, 204, 22, 204);
      // Stars scattered across the cloak
      g.fillStyle(0xfff0a8, 1);
      for (const [sx, sy, r] of [
        [52, 130, 3.4], [110, 112, 3], [78, 168, 3.8], [126, 168, 2.6],
        [40, 182, 2.6], [96, 146, 2.2], [136, 140, 2.4], [64, 106, 2.2],
      ] as const) {
        g.fillCircle(sx, sy, r);
      }
      // Shoulder plates
      g.fillStyle(0x6b5bb0, 1);
      g.fillRoundedRect(18, 62, 42, 28, 10);
      g.fillRoundedRect(110, 62, 42, 28, 10);
      g.fillStyle(0x8d7bd6, 1);
      g.fillRoundedRect(22, 64, 34, 12, 6);
      g.fillRoundedRect(114, 64, 34, 12, 6);
      // Chest armour
      g.fillStyle(0x4a3a8f, 1);
      g.fillRoundedRect(52, 66, 66, 62, 12);
      g.fillStyle(0x7a68c4, 1);
      g.fillRoundedRect(60, 74, 50, 22, 8);
      // Helmet
      g.fillStyle(0x5b4aa3, 1);
      g.fillRoundedRect(50, 12, 70, 56, 18);
      g.fillStyle(0x33265f, 1);
      g.fillRoundedRect(56, 32, 58, 22, 8);
      // Glowing eyes
      g.fillStyle(0x7ef0ff, 1);
      g.fillRoundedRect(64, 38, 16, 9, 4);
      g.fillRoundedRect(92, 38, 16, 9, 4);
      g.fillStyle(0xd8fbff, 1);
      g.fillRoundedRect(67, 40, 8, 4, 2);
      g.fillRoundedRect(95, 40, 8, 4, 2);
      // Crest
      g.fillStyle(0xffe27a, 1);
      g.fillTriangle(85, 0, 96, 20, 74, 20);
      // Glowing blade, held low
      g.fillStyle(0x9ff0ff, 0.85);
      g.fillTriangle(6, 96, 22, 92, 16, 176);
      g.fillStyle(0xe6ffff, 1);
      g.fillTriangle(11, 100, 17, 99, 15, 168);
      g.fillStyle(0xffe27a, 1);
      g.fillRoundedRect(4, 88, 22, 8, 3);
    });
  }

  // -- Shopkeepers ----------------------------------------------------------

  /** Boo Mommy Bag: a stick man between the two llamas placed by the UI. */
  private makeMerchant(): void {
    this.tex('merchant-boo', 160, 210, (g) => {
      // placeholder: not Henry's number — stick man art coordinates and colours.
      g.lineStyle(7, 0x292536, 1);
      g.lineBetween(80, 73, 80, 153);
      g.lineBetween(80, 95, 48, 126); g.lineBetween(80, 95, 112, 126);
      g.lineBetween(80, 153, 53, 204); g.lineBetween(80, 153, 107, 204);
      g.fillStyle(0xf0bd91, 1); g.fillCircle(80, 48, 25);
      g.fillStyle(0x4a3024, 1); g.fillEllipse(80, 32, 51, 20);
      g.fillStyle(0x222222, 1); g.fillCircle(72, 49, 3); g.fillCircle(88, 49, 3);
      g.lineStyle(2, 0x8d5241, 1); g.lineBetween(72, 60, 88, 60);
    });

    // One of her llamas. Faces left; flip it for the other side.
    this.tex('llama', 84, 104, (g) => {
      const wool = 0xf3e6cf;
      const shade = 0xdcc9a8;
      // Legs
      g.fillStyle(shade, 1);
      for (const lx of [16, 30, 52, 66]) g.fillRect(lx, 74, 8, 30);
      // Body, neck and head
      g.fillStyle(wool, 1);
      g.fillEllipse(44, 66, 70, 36);
      g.fillRect(8, 20, 18, 50);
      g.fillEllipse(14, 18, 26, 18);
      // Ears
      g.fillTriangle(8, 12, 12, 0, 16, 12);
      g.fillTriangle(18, 12, 22, 1, 26, 12);
      // Tail
      g.fillCircle(78, 58, 6);
      // Eye and snout
      g.fillStyle(0x2a1a18, 1);
      g.fillCircle(11, 16, 2.4);
      g.fillStyle(shade, 1);
      g.fillEllipse(5, 22, 10, 8);
    });
  }

  /**
   * Big Bob: a giant teddy bear, "bigger than everything on screen". Henry
   * says he has "twelve hundred llamas" — a joke, so he gets five real ones,
   * drawn on the level-clear card and in the shop with the existing texture.
   */
  private makeBigBob(): void {
    this.tex('merchant-bob', 300, 340, (g) => {
      const fur = 0x9c6b3f;
      const furDark = 0x7d5330;
      // Ears
      g.fillStyle(fur, 1);
      g.fillCircle(70, 60, 38);
      g.fillCircle(230, 60, 38);
      g.fillStyle(0xe8c9a0, 1);
      g.fillCircle(70, 60, 20);
      g.fillCircle(230, 60, 20);
      // Body
      g.fillStyle(fur, 1);
      g.fillEllipse(150, 220, 220, 200);
      // Belly patch
      g.fillStyle(0xe8c9a0, 1);
      g.fillEllipse(150, 240, 120, 130);
      // Head
      g.fillStyle(fur, 1);
      g.fillCircle(150, 110, 90);
      // Snout
      g.fillStyle(0xe8c9a0, 1);
      g.fillEllipse(150, 132, 70, 52);
      g.fillStyle(furDark, 1);
      g.fillEllipse(150, 118, 20, 14);
      // Eyes
      g.fillStyle(0x2a1a18, 1);
      g.fillCircle(118, 92, 8);
      g.fillCircle(182, 92, 8);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(121, 89, 2.6);
      g.fillCircle(185, 89, 2.6);
      // Mouth
      g.lineStyle(4, furDark, 1);
      g.lineBetween(150, 132, 150, 144);
      g.beginPath();
      g.arc(150, 144, 16, 0.2, Math.PI - 0.2);
      g.strokePath();
      // Arms
      g.fillStyle(fur, 1);
      g.fillEllipse(30, 210, 56, 130);
      g.fillEllipse(270, 210, 56, 130);
      // Feet
      g.fillStyle(fur, 1);
      g.fillEllipse(95, 320, 70, 40);
      g.fillEllipse(205, 320, 70, 40);
      g.fillStyle(0xe8c9a0, 1);
      g.fillEllipse(95, 330, 40, 20);
      g.fillEllipse(205, 330, 40, 20);
    });
  }

  // -- Projectiles ----------------------------------------------------------

  private makeProjectiles(): void {
    // Mushroom spore: a fuzzy green puff.
    this.tex('proj-spore', 26, 26, (g) => {
      g.fillStyle(0x7fbf50, 0.55);
      g.fillCircle(13, 13, 12);
      g.fillStyle(0x5ea33a, 1);
      g.fillCircle(13, 13, 8);
      g.fillStyle(0xd6f0b8, 1);
      g.fillCircle(10, 10, 3);
    });

    // Enemy fireball.
    this.tex('proj-fire', 26, 26, (g) => {
      g.fillStyle(0xff9d2e, 0.5);
      g.fillCircle(13, 13, 12);
      g.fillStyle(0xff5f1f, 1);
      g.fillCircle(13, 13, 9);
      g.fillStyle(0xffe066, 1);
      g.fillCircle(13, 13, 4.5);
    });

    // The player's fireball has eyes, as the brief asked.
    this.tex('proj-playerfire', 30, 30, (g) => {
      g.fillStyle(0x4fc3ff, 0.45);
      g.fillCircle(15, 15, 14);
      g.fillStyle(0xff7a1a, 1);
      g.fillCircle(15, 15, 11);
      g.fillStyle(0xffd75e, 1);
      g.fillCircle(15, 15, 7);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(11, 13, 3.4);
      g.fillCircle(19, 13, 3.4);
      g.fillStyle(0x2a0d02, 1);
      g.fillCircle(11, 13, 1.8);
      g.fillCircle(19, 13, 1.8);
    });

    this.tex('proj-lightning', 44, 22, (g) => { // placeholder: not Henry's number
      // placeholder: not Henry's number — bolt shape, line widths and colours.
      g.fillStyle(0xffe45c, 0.35);
      g.fillTriangle(0, 11, 25, 0, 17, 11);
      g.fillTriangle(12, 18, 44, 7, 19, 9);
      g.lineStyle(5, 0xffe45c, 1);
      g.lineBetween(1, 12, 17, 5); g.lineBetween(17, 5, 12, 17); g.lineBetween(12, 17, 43, 9);
      g.lineStyle(2, 0xffffff, 1);
      g.lineBetween(1, 12, 17, 5); g.lineBetween(17, 5, 12, 17); g.lineBetween(12, 17, 43, 9);
    });

    // Sticky rain drop.
    this.tex('proj-rain', 18, 26, (g) => {
      g.fillStyle(0x63d2ff, 0.9);
      g.fillCircle(9, 17, 8);
      g.fillTriangle(1, 17, 17, 17, 9, 1);
      g.fillStyle(0xd8f5ff, 1);
      g.fillCircle(6, 15, 2.4);
    });

    // Boss shell.
    this.tex('proj-shell', 40, 34, (g) => {
      g.fillStyle(0xe6b56b, 1);
      g.fillEllipse(20, 18, 38, 30);
      g.fillStyle(0xc9924a, 1);
      g.fillEllipse(20, 22, 38, 18);
      g.lineStyle(2, 0x8f6431, 1);
      for (let i = -2; i <= 2; i++) {
        g.lineBetween(20, 18, 20 + i * 9, 2);
      }
      g.strokeEllipse(20, 18, 30, 22);
    });

    // Galactic bullet — the instant-kill one, so it is loud and unmistakable.
    this.tex('proj-galactic', 34, 34, (g) => {
      g.fillStyle(0xff7ae6, 0.35);
      g.fillCircle(17, 17, 16);
      g.fillStyle(0xc46bff, 1);
      g.fillCircle(17, 17, 11);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(17, 17, 5.5);
      g.fillStyle(0xffe6ff, 0.9);
      g.fillTriangle(17, 0, 21, 12, 13, 12);
      g.fillTriangle(17, 34, 21, 22, 13, 22);
      g.fillTriangle(0, 17, 12, 21, 12, 13);
      g.fillTriangle(34, 17, 22, 21, 22, 13);
    });

    // The sword's visible arc, and the invisible box that actually bites.
    this.tex('sword-arc', 260, 150, (g) => {
      g.fillStyle(0x9ff0ff, 0.5);
      g.fillEllipse(130, 75, 250, 140);
      g.fillStyle(0xe6ffff, 0.55);
      g.fillEllipse(130, 75, 190, 96);
      g.fillStyle(0xffffff, 0.7);
      g.fillEllipse(130, 75, 120, 46);
    });
    this.tex('sword-hit', 240, 130, (g) => {
      g.fillStyle(0xffffff, 0.001);
      g.fillRect(0, 0, 240, 130);
    });

    // The green puff, purely for comic timing.
    this.tex('proj-stink', 30, 30, (g) => {
      g.fillStyle(0x9fd36a, 0.4);
      g.fillCircle(15, 15, 14);
      g.fillStyle(0xb6e86a, 0.55);
      g.fillCircle(12, 13, 8);
      g.fillCircle(19, 17, 6);
    });

    // Boss fire breath puff.
    this.tex('proj-bossfire', 40, 40, (g) => {
      g.fillStyle(0xff4d1a, 0.45);
      g.fillCircle(20, 20, 19);
      g.fillStyle(0xff7a1a, 1);
      g.fillCircle(20, 20, 14);
      g.fillStyle(0xffd75e, 1);
      g.fillCircle(20, 20, 7);
    });
  }

  // -- Skin E attacks ---------------------------------------------------------

  private makeAttackEffects(): void {
    // Nurse's purse swing.
    this.tex('swing-purse', 64, 50, (g) => {
      g.fillStyle(0xd7263d, 0.85);
      g.fillEllipse(32, 25, 56, 34);
      g.fillStyle(0x8c1d1d, 0.9);
      g.fillRect(24, 8, 16, 8);
      g.lineStyle(2, 0xffffff, 0.5);
      g.lineBetween(6, 14, 20, 24);
      g.lineBetween(6, 36, 20, 28);
    });

    // Tiny Guy's hammer swing.
    this.tex('swing-hammer', 64, 50, (g) => {
      g.fillStyle(0x7a7f8c, 0.9);
      g.fillRoundedRect(14, 8, 30, 22, 5);
      g.fillStyle(0x8a5a35, 1);
      g.fillRect(40, 16, 20, 8);
      g.lineStyle(2, 0xffffff, 0.5);
      g.lineBetween(10, 40, 24, 30);
      g.lineBetween(10, 46, 28, 34);
    });

    // Galactic Raider's sword swing.
    this.tex('swing-sword', 64, 50, (g) => {
      g.fillStyle(0x9ff0ff, 0.55);
      g.fillEllipse(32, 25, 60, 40);
      g.fillStyle(0xe6ffff, 0.7);
      g.fillEllipse(32, 25, 40, 20);
      g.fillStyle(0xffe27a, 1);
      g.fillRoundedRect(4, 20, 10, 10, 2);
    });

    // Shellcracker's backside fire, shot opposite the way it is facing.
    this.tex('proj-backfire', 30, 30, (g) => {
      g.fillStyle(0x3fa34d, 0.4);
      g.fillCircle(15, 15, 14);
      g.fillStyle(0x1f6b3a, 1);
      g.fillCircle(15, 15, 10);
      g.fillStyle(0xd6f0b8, 1);
      g.fillCircle(15, 15, 5);
    });
  }

  // -- Power-ups ------------------------------------------------------------

  private makePowerUps(): void {
    this.tex('pw-cloud', 60, 40, (g) => {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(18, 24, 14);
      g.fillCircle(34, 20, 17);
      g.fillCircle(48, 26, 12);
      g.fillRect(18, 24, 30, 13);
      g.fillStyle(0xdbe9ff, 1);
      g.fillRect(14, 32, 38, 6);
      // Sleepy face, so it reads as a friend not a hazard
      g.fillStyle(0x3a4a63, 1);
      g.fillCircle(28, 22, 2.6);
      g.fillCircle(40, 22, 2.6);
      g.lineStyle(2, 0x3a4a63, 1);
      g.beginPath();
      g.arc(34, 26, 5, 0.25, Math.PI - 0.25);
      g.strokePath();
    });

    this.tex('pw-fireball', 44, 44, (g) => {
      g.fillStyle(0xff9d2e, 0.4);
      g.fillCircle(22, 22, 21);
      g.fillStyle(0xff5f1f, 1);
      g.fillCircle(22, 22, 16);
      g.fillStyle(0xffd75e, 1);
      g.fillCircle(22, 22, 10);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(17, 19, 4.6);
      g.fillCircle(27, 19, 4.6);
      g.fillStyle(0x2a0d02, 1);
      g.fillCircle(17, 20, 2.4);
      g.fillCircle(27, 20, 2.4);
      g.lineStyle(2, 0x8c1d00, 1);
      g.beginPath();
      g.arc(22, 26, 5, 0.2, Math.PI - 0.2);
      g.strokePath();
    });

    this.tex('pw-heart', 38, 34, (g) => {
      g.fillStyle(0xff4d6d, 1);
      g.fillCircle(12, 12, 10);
      g.fillCircle(26, 12, 10);
      g.fillTriangle(2, 15, 36, 15, 19, 33);
      g.fillStyle(0xffa6b8, 1);
      g.fillCircle(10, 9, 3.4);
    });

    // Super Star
    this.tex('pw-star', 46, 46, (g) => {
      g.fillStyle(0xffe27a, 0.4);
      g.fillCircle(23, 23, 22);
      g.fillStyle(0xffd12b, 1);
      const pts: number[] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 20 : 8.5;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push(23 + Math.cos(a) * r, 23 + Math.sin(a) * r);
      }
      g.fillPoints(
        Array.from({ length: 10 }, (_, i) => new Phaser.Geom.Point(pts[i * 2], pts[i * 2 + 1])),
        true,
      );
      g.fillStyle(0xffffff, 1);
      g.fillCircle(18, 21, 3.4);
      g.fillCircle(28, 21, 3.4);
      g.fillStyle(0x8a5a00, 1);
      g.fillCircle(18, 21, 1.8);
      g.fillCircle(28, 21, 1.8);
    });

    // God Mushroom
    this.tex('pw-mushroom', 46, 42, (g) => {
      g.fillStyle(0x8ef0a8, 0.35);
      g.fillCircle(23, 21, 21);
      g.fillStyle(0xfff4e0, 1);
      g.fillRoundedRect(15, 20, 16, 20, 5);
      g.fillStyle(0xd93b2b, 1);
      g.fillEllipse(23, 17, 42, 24);
      g.fillStyle(0xfff0dc, 1);
      g.fillCircle(12, 15, 4);
      g.fillCircle(25, 9, 5);
      g.fillCircle(35, 16, 3.5);
      g.fillStyle(0x1a1a1a, 1);
      g.fillCircle(19, 29, 2.4);
      g.fillCircle(28, 29, 2.4);
    });

    // 1-UP
    this.tex('pw-oneup', 46, 34, (g) => {
      g.fillStyle(0x2ecc71, 1);
      g.fillRoundedRect(0, 0, 46, 34, 8);
      g.fillStyle(0x27ae60, 1);
      g.fillRoundedRect(3, 3, 40, 24, 6);
      g.fillStyle(0xffffff, 1);
      // "1UP", drawn as blocks
      g.fillRect(9, 9, 3, 14);
      g.fillRect(6, 12, 3, 3);
      g.fillRect(16, 9, 3, 11);
      g.fillRect(23, 9, 3, 11);
      g.fillRect(16, 20, 10, 3);
      g.fillRect(30, 9, 3, 14);
      g.fillRect(33, 9, 6, 3);
      g.fillRect(36, 12, 3, 4);
      g.fillRect(33, 15, 6, 3);
    });

    // Kitty suit: a little cat-ear hood.
    this.tex('pw-kittysuit', 44, 40, (g) => {
      g.fillStyle(0xf2b134, 1);
      g.fillTriangle(6, 20, 14, 2, 20, 20);
      g.fillTriangle(24, 20, 30, 2, 38, 20);
      g.fillStyle(0xffd7a0, 1);
      g.fillTriangle(10, 17, 14, 7, 18, 17);
      g.fillTriangle(26, 17, 30, 7, 34, 17);
      g.fillStyle(0xf2b134, 1);
      g.fillRoundedRect(4, 18, 36, 20, 10);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(16, 28, 3);
      g.fillCircle(28, 28, 3);
      g.fillStyle(0x1a1a1a, 1);
      g.fillCircle(16, 28, 1.4);
      g.fillCircle(28, 28, 1.4);
      g.lineStyle(1.5, 0xffffff, 0.8);
      g.lineBetween(2, 30, 12, 30);
      g.lineBetween(2, 34, 12, 33);
      g.lineBetween(32, 30, 42, 30);
      g.lineBetween(32, 33, 42, 34);
    });

    this.tex('pw-coin', 30, 30, (g) => {
      // Rim, face, and a raised centre lit from the top left.
      g.fillStyle(0xc98a13, 1);
      g.fillCircle(15, 15, 14);
      g.fillStyle(0xf2ac25, 1);
      g.fillCircle(15, 15, 12);
      g.fillStyle(0xffd76b, 1);
      g.fillCircle(14, 14, 9.5);
      // The stamp, with a lit edge.
      g.fillStyle(0xd9900f, 1);
      g.fillRoundedRect(12.5, 8, 5, 14, 2);
      g.fillStyle(0xfff0b0, 1);
      g.fillRoundedRect(12.5, 8, 2, 14, 1);
      // Glint.
      g.fillStyle(0xffffff, 0.9);
      g.fillEllipse(9.5, 9.5, 5, 3);
    });
  }

  // -- Blocks ---------------------------------------------------------------

  private makeBlocks(): void {
    // The question mark, drawn twice: once as a shadow, once on top.
    const questionMark = (g: Phaser.GameObjects.Graphics, dx: number, dy: number) => {
      g.fillRoundedRect(21 + dx, 14 + dy, 15, 7, 3);
      g.fillRoundedRect(29 + dx, 18 + dy, 7, 11, 3);
      g.fillRoundedRect(24 + dx, 26 + dy, 12, 7, 3);
      g.fillRoundedRect(24 + dx, 31 + dy, 7, 6, 3);
      g.fillRoundedRect(24 + dx, 40 + dy, 7, 7, 3);
    };
    const rivets = (g: Phaser.GameObjects.Graphics, dark: number, lit: number) => {
      for (const [cx, cy] of [
        [7, 7],
        [49, 7],
        [7, 47],
        [49, 47],
      ] as const) {
        g.fillStyle(dark, 1);
        g.fillCircle(cx, cy, 3);
        g.fillStyle(lit, 1);
        g.fillCircle(cx - 0.8, cy - 0.8, 1.1);
      }
    };

    this.tex('block-question', 56, 56, (g) => {
      // A darker lip along the bottom gives the block some depth.
      g.fillStyle(0xb06d0c, 1);
      g.fillRoundedRect(0, 0, 56, 56, 6);
      g.fillStyle(0xe8a020, 1);
      g.fillRoundedRect(0, 0, 56, 52, 6);
      g.fillStyle(0xffc44d, 1);
      g.fillRoundedRect(4, 4, 48, 42, 4);
      g.fillStyle(0xffe08f, 1);
      g.fillRoundedRect(6, 5, 44, 4, 2);
      g.fillStyle(0xf0a830, 1);
      g.fillRoundedRect(6, 41, 44, 4, 2);
      rivets(g, 0x9c5f08, 0xffe08f);
      g.fillStyle(0xd08a1a, 1);
      questionMark(g, 2, 2);
      g.fillStyle(0x7a4405, 1);
      questionMark(g, 0, 0);
    });

    this.tex('block-used', 56, 56, (g) => {
      g.fillStyle(0x6d5137, 1);
      g.fillRoundedRect(0, 0, 56, 56, 6);
      g.fillStyle(0x8a6a4a, 1);
      g.fillRoundedRect(0, 0, 56, 52, 6);
      g.fillStyle(0xa88257, 1);
      g.fillRoundedRect(4, 4, 48, 42, 4);
      g.fillStyle(0xbf9a6c, 1);
      g.fillRoundedRect(6, 5, 44, 4, 2);
      rivets(g, 0x6d5137, 0xbf9a6c);
      g.lineStyle(2, 0x6d5137, 1);
      g.strokeRect(12, 13, 32, 24);
    });
  }

  // Terrain textures live in systems/Terrain.ts.

  private makeIcicle(): void {
    this.tex('icicle', 26, 64, (g) => {
      g.fillStyle(0xbfe9fb, 1);
      g.fillTriangle(0, 4, 26, 4, 13, 62);
      g.fillStyle(0xe9f9ff, 1);
      g.fillTriangle(6, 6, 15, 6, 11, 42);
      g.fillStyle(0x8fd0ea, 1);
      g.fillRoundedRect(0, 0, 26, 8, 3);
    });
  }

  private makeFlags(): void {
    // A shaded pole with a ball on top and a stone foot.
    const pole = (g: Phaser.GameObjects.Graphics, ball: number) => {
      g.fillStyle(0xa9aab8, 1);
      g.fillRect(5, 8, 7, 106);
      g.fillStyle(0xe6e7ef, 1);
      g.fillRect(6, 8, 2, 106);
      g.fillStyle(0x6f7083, 1);
      g.fillRoundedRect(0, 110, 17, 10, 3);
      g.fillStyle(0x8f90a3, 1);
      g.fillRoundedRect(1, 110, 15, 4, 2);
      g.fillStyle(ball, 1);
      g.fillCircle(8.5, 6, 5.5);
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(7, 4.5, 1.8);
    };
    // A pennant with a fold: the lower half sits in shadow.
    const pennant = (g: Phaser.GameObjects.Graphics, top: number, tipX: number, bottom: number, lit: number, dark: number) => {
      const mid = (top + bottom) / 2;
      g.fillStyle(lit, 1);
      g.fillTriangle(12, top, tipX, mid, 12, bottom);
      g.fillStyle(dark, 1);
      g.fillTriangle(12, mid + 2, tipX, mid, 12, bottom);
    };

    this.tex('flag-goal', 76, 120, (g) => {
      pole(g, 0xffd12b);
      pennant(g, 10, 74, 46, 0x2ecc71, 0x22a85a);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(32, 28, 7);
      g.fillStyle(0x2ecc71, 1);
      g.fillCircle(32, 28, 3.5);
    });

    this.tex('flag-check-off', 76, 120, (g) => {
      pole(g, 0x9a9cab);
      pennant(g, 12, 62, 42, 0x7a8391, 0x646c79);
    });

    this.tex('flag-check-on', 76, 120, (g) => {
      pole(g, 0xffd12b);
      pennant(g, 10, 70, 44, 0x3aa9ff, 0x2386d6);
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(24, 21, 38, 21, 31, 33);
    });
  }

  /** The Moo Moo Cow Mom Hole: a dark hole with a cow-print rim, drawn on the ground. */
  private makeMooMooHole(): void {
    this.tex('hole-moomoo', 120, 50, (g) => {
      // Cow-print rim.
      g.fillStyle(0xffffff, 1);
      g.fillEllipse(60, 30, 116, 40);
      g.fillStyle(0x1a1a1a, 1);
      g.fillEllipse(38, 20, 20, 13);
      g.fillEllipse(82, 24, 24, 15);
      g.fillEllipse(58, 40, 18, 9);
      g.fillEllipse(16, 32, 13, 9);
      g.fillEllipse(102, 34, 15, 9);
      // The hole itself.
      g.fillStyle(0x120e1a, 1);
      g.fillEllipse(60, 28, 92, 26);
      g.fillStyle(0x000000, 0.85);
      g.fillEllipse(60, 30, 66, 16);
    });

    // A little carry-glow, used under an enemy God Tom is carrying.
    this.tex('carry-glow', 40, 16, (g) => {
      g.fillStyle(0xffe27a, 0.55);
      g.fillEllipse(20, 8, 36, 10);
    });
  }

  // -- Odds and ends --------------------------------------------------------

  private makeBits(): void {
    // The puff that appears under a cloud double-jump.
    this.tex('puff', 64, 40, (g) => {
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(18, 24, 13);
      g.fillCircle(34, 19, 16);
      g.fillCircle(48, 25, 11);
      g.fillRect(18, 24, 30, 12);
    });

    // A soft puff of dust from the player's feet on a jump or a hard landing.
    this.tex('dust', 24, 18, (g) => {
      g.fillStyle(0xffffff, 0.55);
      g.fillCircle(8, 11, 6);
      g.fillCircle(15, 9, 7);
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(12, 10, 4.5);
    });

    // Generic 6px square used for sparks, coin pops and hit flashes.
    this.tex('spark', 8, 8, (g) => {
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 8, 8);
    });

    // Ice block that encases a frozen player.
    this.tex('ice-shell', 60, 76, (g) => {
      g.fillStyle(0xa8dcf0, 0.55);
      g.fillRoundedRect(0, 0, 60, 76, 10);
      g.lineStyle(3, 0xe9f9ff, 0.9);
      g.strokeRoundedRect(2, 2, 56, 72, 10);
      g.lineBetween(14, 8, 26, 40);
      g.lineBetween(44, 14, 34, 52);
    });

    // Sticky goo blob that pins the player after a rain hit.
    this.tex('goo', 60, 40, (g) => {
      g.fillStyle(0x63d2ff, 0.55);
      g.fillEllipse(30, 24, 56, 30);
      g.fillStyle(0xd8f5ff, 0.8);
      g.fillCircle(18, 16, 5);
    });
  }
}
