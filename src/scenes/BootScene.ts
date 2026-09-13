import Phaser from 'phaser';
import { makeExpansionArt } from './ExpansionArt';

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
    this.makeProjectiles();
    this.makePowerUps();
    this.makeBlocks();
    this.makeTiles();
    this.makeIcicle();
    this.makeFlags();
    this.makeBits();
    makeExpansionArt(this);

    this.scene.start('Menu');
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
    skin: 'tom' | 'henry',
  ): void {
    const henry = skin === 'henry';

    // Cape / scarf trailing behind
    g.fillStyle(henry ? 0x6a8fd8 : 0xf2b134, 1);
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

    // Body. Henry's shirt is midnight blue with stars on it.
    g.fillStyle(henry ? 0x2a2f6b : 0x3563c9, 1);
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
    } else {
      g.fillStyle(0xe8f1ff, 1);
      g.fillRect(16, 26, 20, 5);
    }

    // Arms
    g.fillStyle(0xf6c9a0, 1);
    if (legs === 'air') {
      g.fillRect(6, 20, 8, 12);
      g.fillRect(38, 20, 8, 12);
    } else {
      g.fillRect(7, 30, 7, 13);
      g.fillRect(38, 30, 7, 13);
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
    } else {
      g.fillStyle(0xd7263d, 1);
      g.fillRoundedRect(11, 4, 30, 12, 6);
      g.fillRect(11, 12, 30, 4);
      g.fillStyle(0xb01c30, 1);
      g.fillRect(36, 12, 12, 5);
    }

    // Eyes — Henry's are blue.
    g.fillStyle(0xffffff, 1);
    g.fillCircle(24, 21, 4.5);
    g.fillCircle(34, 21, 4.5);
    g.fillStyle(henry ? 0x2f7fd4 : 0x18202e, 1);
    g.fillCircle(25, 21, 2.4);
    g.fillCircle(35, 21, 2.4);

    // Grin
    g.lineStyle(2, 0xb5714b, 1);
    g.beginPath();
    g.arc(29, 25, 5, 0.2, Math.PI - 0.2);
    g.strokePath();
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

  private makePlayer(): void {
    const poses = ['idle', 'run1', 'run2', 'jump'] as const;
    const legsFor = { idle: 'stand', run1: 'runA', run2: 'runB', jump: 'air' } as const;

    for (const skin of ['tom', 'henry'] as const) {
      for (const pose of poses) {
        this.tex(`${skin}-${pose}`, 48, 62, (g) => this.drawKid(g, legsFor[pose], skin));
      }
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

    this.tex('pw-coin', 30, 30, (g) => {
      g.fillStyle(0xf5b32b, 1);
      g.fillCircle(15, 15, 14);
      g.fillStyle(0xffd76b, 1);
      g.fillCircle(15, 15, 10);
      g.lineStyle(2.5, 0xc98a13, 1);
      g.strokeCircle(15, 15, 14);
      g.fillStyle(0xc98a13, 1);
      g.fillRect(13, 8, 4, 14);
    });
  }

  // -- Blocks ---------------------------------------------------------------

  private makeBlocks(): void {
    this.tex('block-question', 56, 56, (g) => {
      g.fillStyle(0xe8a020, 1);
      g.fillRoundedRect(0, 0, 56, 56, 6);
      g.fillStyle(0xffc44d, 1);
      g.fillRoundedRect(4, 4, 48, 44, 4);
      g.fillStyle(0x9c5f08, 1);
      for (const [cx, cy] of [
        [7, 7],
        [49, 7],
        [7, 49],
        [49, 49],
      ] as const) {
        g.fillCircle(cx, cy, 3);
      }
      // The question mark
      g.fillStyle(0x7a4405, 1);
      g.fillRoundedRect(21, 14, 15, 7, 3);
      g.fillRoundedRect(29, 18, 7, 11, 3);
      g.fillRoundedRect(24, 26, 12, 7, 3);
      g.fillRoundedRect(24, 31, 7, 6, 3);
      g.fillRoundedRect(24, 40, 7, 7, 3);
    });

    this.tex('block-used', 56, 56, (g) => {
      g.fillStyle(0x8a6a4a, 1);
      g.fillRoundedRect(0, 0, 56, 56, 6);
      g.fillStyle(0xa88257, 1);
      g.fillRoundedRect(4, 4, 48, 44, 4);
      g.lineStyle(2, 0x6d5137, 1);
      g.strokeRect(10, 12, 36, 28);
    });
  }

  // -- Terrain --------------------------------------------------------------

  private makeTiles(): void {
    // Grass-topped dirt, used as a repeating 64px tile.
    this.tex('tile-ground', 64, 64, (g) => {
      g.fillStyle(0x6b4a2f, 1);
      g.fillRect(0, 0, 64, 64);
      g.fillStyle(0x7c573a, 1);
      g.fillRect(8, 22, 18, 12);
      g.fillRect(36, 40, 20, 12);
      g.fillStyle(0x3fa34d, 1);
      g.fillRect(0, 0, 64, 16);
      g.fillStyle(0x54c265, 1);
      g.fillRect(0, 0, 64, 7);
    });

    this.tex('tile-platform', 64, 24, (g) => {
      g.fillStyle(0x6b4a2f, 1);
      g.fillRect(0, 0, 64, 24);
      g.fillStyle(0x3fa34d, 1);
      g.fillRect(0, 0, 64, 9);
      g.fillStyle(0x54c265, 1);
      g.fillRect(0, 0, 64, 4);
    });

    // Snow over frozen rock, for the ice caves.
    this.tex('tile-ground-snow', 64, 64, (g) => {
      g.fillStyle(0x3d4a7a, 1);
      g.fillRect(0, 0, 64, 64);
      g.fillStyle(0x4a5890, 1);
      g.fillRect(8, 24, 18, 12);
      g.fillRect(36, 42, 20, 12);
      g.fillStyle(0xdfe9ff, 1);
      g.fillRect(0, 0, 64, 16);
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 64, 8);
    });

    this.tex('tile-platform-snow', 64, 24, (g) => {
      g.fillStyle(0x3d4a7a, 1);
      g.fillRect(0, 0, 64, 24);
      g.fillStyle(0xdfe9ff, 1);
      g.fillRect(0, 0, 64, 9);
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 64, 4);
    });

    // Wet sand, for the boss's shore.
    this.tex('tile-ground-sand', 64, 64, (g) => {
      g.fillStyle(0x9c7448, 1);
      g.fillRect(0, 0, 64, 64);
      g.fillStyle(0xad8455, 1);
      g.fillRect(8, 26, 18, 12);
      g.fillRect(36, 44, 20, 12);
      g.fillStyle(0xe8cd94, 1);
      g.fillRect(0, 0, 64, 16);
      g.fillStyle(0xf5e3b8, 1);
      g.fillRect(0, 0, 64, 7);
      g.fillStyle(0xcbb27f, 1);
      g.fillCircle(20, 11, 3);
      g.fillCircle(46, 9, 2.4);
    });

    this.tex('tile-platform-sand', 64, 24, (g) => {
      g.fillStyle(0x9c7448, 1);
      g.fillRect(0, 0, 64, 24);
      g.fillStyle(0xe8cd94, 1);
      g.fillRect(0, 0, 64, 9);
      g.fillStyle(0xf5e3b8, 1);
      g.fillRect(0, 0, 64, 4);
    });

    // Star-flecked rock, for the galactic levels.
    this.tex('tile-ground-star', 64, 64, (g) => {
      g.fillStyle(0x241a44, 1);
      g.fillRect(0, 0, 64, 64);
      g.fillStyle(0x2f2258, 1);
      g.fillRect(8, 26, 18, 12);
      g.fillRect(36, 44, 20, 12);
      g.fillStyle(0x6b53c4, 1);
      g.fillRect(0, 0, 64, 14);
      g.fillStyle(0xa38dff, 1);
      g.fillRect(0, 0, 64, 6);
      g.fillStyle(0xfff0a8, 1);
      g.fillCircle(14, 34, 1.6);
      g.fillCircle(44, 26, 1.4);
      g.fillCircle(30, 52, 1.8);
    });

    this.tex('tile-platform-star', 64, 24, (g) => {
      g.fillStyle(0x241a44, 1);
      g.fillRect(0, 0, 64, 24);
      g.fillStyle(0x6b53c4, 1);
      g.fillRect(0, 0, 64, 9);
      g.fillStyle(0xa38dff, 1);
      g.fillRect(0, 0, 64, 4);
      g.fillStyle(0xfff0a8, 1);
      g.fillCircle(20, 16, 1.4);
      g.fillCircle(48, 18, 1.2);
    });

    // Slippery ice.
    this.tex('tile-ice', 64, 24, (g) => {
      g.fillStyle(0x6fb7d8, 1);
      g.fillRect(0, 0, 64, 24);
      g.fillStyle(0xa8dcf0, 1);
      g.fillRect(0, 0, 64, 8);
      g.fillStyle(0xd8f3ff, 1);
      g.fillRect(6, 2, 16, 3);
      g.fillRect(38, 2, 12, 3);
    });
  }

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
    const pole = (g: Phaser.GameObjects.Graphics) => {
      g.fillStyle(0xc9c9d4, 1);
      g.fillRect(4, 0, 8, 120);
      g.fillStyle(0x8f8fa0, 1);
      g.fillRect(0, 112, 16, 8);
    };

    this.tex('flag-goal', 76, 120, (g) => {
      pole(g);
      g.fillStyle(0x2ecc71, 1);
      g.fillTriangle(12, 8, 74, 26, 12, 46);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(34, 26, 7);
      g.fillStyle(0x2ecc71, 1);
      g.fillCircle(34, 26, 3.5);
    });

    this.tex('flag-check-off', 76, 120, (g) => {
      pole(g);
      g.fillStyle(0x7a8391, 1);
      g.fillTriangle(12, 10, 62, 26, 12, 42);
    });

    this.tex('flag-check-on', 76, 120, (g) => {
      pole(g);
      g.fillStyle(0x3aa9ff, 1);
      g.fillTriangle(12, 8, 70, 26, 12, 44);
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(26, 22, 40, 22, 33, 34);
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
