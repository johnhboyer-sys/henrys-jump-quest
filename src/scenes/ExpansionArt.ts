import Phaser from 'phaser';

/**
 * Art for the level 6-16 expansions: the kitty, Water Guy and Poison Flower enemies, the new bosses,
 * and their projectiles/props. Same one-function-per-texture pattern as
 * BootScene — see `tex` there. Kept in its own file so the two content slices
 * (skins vs. this expansion) never touch the same source lines.
 */
export function makeExpansionArt(scene: Phaser.Scene): void {
  /** Draw into a throwaway Graphics and bake it into a texture. */
  function tex(key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void): void {
    const g = scene.add.graphics();
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  // New expansion textures: all sizes and shapes are placeholders, not Henry's numbers.
  tex('enemy-waterGuy', 52, 58, (g) => { // placeholder: not Henry's number
    g.fillStyle(0x177bd1, 1); g.fillTriangle(26, 1, 2, 39, 50, 39); g.fillEllipse(26, 39, 48, 34); // placeholder: not Henry's number
    g.fillStyle(0x69d8ff, 1); g.fillEllipse(17, 38, 14, 20); // placeholder: not Henry's number
    g.fillStyle(0xffffff, 1); g.fillCircle(20, 38, 5); g.fillCircle(34, 38, 5); // placeholder: not Henry's number
    g.fillStyle(0x17345a, 1); g.fillCircle(20, 39, 2); g.fillCircle(34, 39, 2); // placeholder: not Henry's number
  });
  tex('enemy-poisonFlower', 56, 60, (g) => { // placeholder: not Henry's number
    g.lineStyle(7, 0x3a9b3d, 1); g.lineBetween(28, 58, 28, 27); // placeholder: not Henry's number
    g.fillStyle(0x3a9b3d, 1); g.fillEllipse(17, 48, 23, 12); g.fillEllipse(39, 44, 23, 12); // placeholder: not Henry's number
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.fillStyle(0xa243c1, 1); g.fillCircle(28 + Math.cos(a) * 15, 21 + Math.sin(a) * 15, 10); } // placeholder: not Henry's number
    g.fillStyle(0xe8c842, 1); g.fillCircle(28, 21, 10); g.fillStyle(0x26252a, 1); g.fillCircle(24, 19, 2); g.fillCircle(32, 19, 2); // placeholder: not Henry's number
  });
  tex('proj-water', 24, 28, (g) => { g.fillStyle(0x45baff, 1); g.fillTriangle(12, 1, 2, 18, 22, 18); g.fillEllipse(12, 19, 20, 16); }); // placeholder: not Henry's number
  tex('proj-poison', 26, 26, (g) => { g.fillStyle(0x80d14b, 1); g.fillCircle(13, 13, 11); g.fillStyle(0xc8ff87, 1); g.fillCircle(9, 9, 4); }); // placeholder: not Henry's number
  // Gardener Shellcracker: a garden growing on its shell, a straw hat and a
  // watering can. placeholder: not Henry's number — shapes, sizes and colours.
  tex('boss-gardener', 190, 170, (g) => {
    // Shell, with a moss bed and flowers along its top.
    g.fillStyle(0x5a3a22, 1);
    g.fillEllipse(95, 98, 180, 132);
    g.fillStyle(0x7a5232, 1);
    g.fillEllipse(95, 96, 172, 122);
    g.lineStyle(3, 0x5a3a22, 1);
    g.strokeEllipse(95, 100, 132, 84);
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI + 0.35 + (i / 8) * (Math.PI - 0.7);
      const x = 95 + Math.cos(a) * 78;
      const y = 98 + Math.sin(a) * 56;
      g.fillStyle(0x4f9a45, 1);
      g.fillCircle(x, y, 13);
      g.fillStyle(0x6fbf5a, 1);
      g.fillCircle(x - 3, y - 4, 7);
    }
    for (const [x, y, petal] of [
      [30, 70, 0xff8fb8],
      [58, 46, 0xffe27a],
      [140, 48, 0xff8fb8],
      [164, 72, 0xffffff],
    ] as const) {
      g.fillStyle(petal, 1);
      for (let k = 0; k < 5; k++) g.fillCircle(x + Math.cos((k * Math.PI * 2) / 5) * 4, y + Math.sin((k * Math.PI * 2) / 5) * 4, 3.2);
      g.fillStyle(0xf2a531, 1);
      g.fillCircle(x, y, 2.4);
    }
    // Left arm and feet, behind the body.
    g.fillStyle(0x5aa64f, 1);
    g.fillRoundedRect(38, 96, 20, 44, 9);
    g.fillEllipse(70, 162, 38, 16);
    g.fillEllipse(120, 162, 38, 16);
    // Body and overalls.
    g.fillStyle(0x6fbf62, 1);
    g.fillRoundedRect(52, 76, 86, 86, 30);
    g.fillStyle(0x3f6fa8, 1);
    g.fillRoundedRect(56, 120, 78, 42, 16);
    g.fillRoundedRect(72, 100, 46, 28, 6);
    g.lineStyle(5, 0x3f6fa8, 1);
    g.lineBetween(74, 102, 66, 84);
    g.lineBetween(116, 102, 124, 84);
    g.fillStyle(0xffd55d, 1);
    g.fillCircle(77, 106, 3);
    g.fillCircle(113, 106, 3);
    // A flower in the bib pocket.
    g.fillStyle(0x2f5f8f, 1);
    g.fillRoundedRect(85, 110, 20, 14, 3);
    g.lineStyle(2, 0x3f8a3a, 1);
    g.lineBetween(95, 110, 95, 98);
    g.fillStyle(0xff6f6f, 1);
    g.fillCircle(95, 96, 4.5);
    g.fillStyle(0xffe27a, 1);
    g.fillCircle(95, 96, 1.8);
    // Head and a cross face.
    g.fillStyle(0x6fbf62, 1);
    g.fillEllipse(95, 72, 88, 60);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(78, 72, 10);
    g.fillCircle(112, 72, 10);
    g.fillStyle(0x1c3029, 1);
    g.fillCircle(80, 74, 4.5);
    g.fillCircle(110, 74, 4.5);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(81.5, 72.5, 1.4);
    g.fillCircle(111.5, 72.5, 1.4);
    g.lineStyle(4, 0x2f6b2a, 1);
    g.lineBetween(66, 58, 88, 64);
    g.lineBetween(124, 58, 102, 64);
    g.lineStyle(3, 0x2a4a22, 1);
    g.beginPath();
    g.arc(95, 84, 11, 0.35, Math.PI - 0.35);
    g.strokePath();
    g.fillStyle(0xffffff, 1);
    g.fillRect(97, 92, 5, 4);
    // Straw hat with a green band and a flower.
    g.fillStyle(0xc49a45, 1);
    g.fillEllipse(95, 47, 150, 18);
    g.fillStyle(0xe0b75a, 1);
    g.fillEllipse(95, 43, 150, 20);
    g.fillStyle(0xe8c46a, 1);
    g.fillRoundedRect(62, 8, 66, 38, 14);
    g.fillStyle(0xf5d98a, 1);
    g.fillRoundedRect(68, 12, 18, 22, 8);
    g.fillStyle(0x3f7a3a, 1);
    g.fillRect(62, 31, 66, 8);
    g.fillStyle(0xff6f6f, 1);
    for (let k = 0; k < 5; k++) g.fillCircle(116 + Math.cos((k * Math.PI * 2) / 5) * 4, 35 + Math.sin((k * Math.PI * 2) / 5) * 4, 3.2);
    g.fillStyle(0xffe27a, 1);
    g.fillCircle(116, 35, 2.2);
    // Right arm holding the watering can.
    g.fillStyle(0x5aa64f, 1);
    g.fillRoundedRect(132, 92, 18, 36, 8);
    g.lineStyle(5, 0x5a87a6, 1);
    g.beginPath();
    g.arc(160, 110, 13, Math.PI, 0);
    g.strokePath();
    g.lineStyle(6, 0x6d9dbc, 1);
    g.lineBetween(176, 124, 184, 102);
    g.fillStyle(0x6d9dbc, 1);
    g.fillRoundedRect(142, 108, 38, 40, 6);
    g.fillStyle(0x8fbcd8, 1);
    g.fillRoundedRect(146, 112, 10, 30, 4);
    g.fillStyle(0x5a87a6, 1);
    g.fillRect(142, 108, 38, 5);
    g.fillCircle(185, 100, 5);
    g.fillStyle(0x6fbf62, 1);
    g.fillCircle(146, 124, 7);
  });

  // Thunder Raider: a storm cloud in a raider's visor, crowned with a bolt.
  // placeholder: not Henry's number — shapes, sizes and colours.
  tex('boss-thunder', 190, 140, (g) => {
    const bolt = (pts: [number, number][]) => g.fillPoints(pts.map(([x, y]) => new Phaser.Geom.Point(x, y)), true);
    // Cloud body: a dark mass with lighter puffs on top.
    g.fillStyle(0x2c3a55, 1);
    for (const [x, y, r] of [[50, 72, 40], [95, 56, 50], [142, 70, 42], [164, 90, 20], [24, 92, 20]] as const) g.fillCircle(x, y, r);
    g.fillEllipse(95, 94, 176, 50);
    g.fillStyle(0x46587a, 1);
    for (const [x, y, r] of [[46, 68, 31], [90, 50, 39], [138, 64, 33]] as const) g.fillCircle(x, y, r);
    g.fillStyle(0x2c3a55, 1);
    for (const [x, y, r] of [[50, 76, 28], [95, 60, 36], [142, 72, 30]] as const) g.fillCircle(x, y, r);
    g.fillEllipse(95, 94, 150, 40);
    g.fillStyle(0x1d263b, 1);
    g.fillEllipse(95, 108, 150, 20);
    // Bolt hanging underneath.
    g.fillStyle(0xffe967, 1);
    bolt([[88, 104], [110, 104], [100, 117], [113, 117], [84, 140], [93, 122], [80, 122]]);
    // Raider's visor with glowing eyes.
    g.fillStyle(0x161d30, 1);
    g.fillRoundedRect(50, 70, 90, 26, 12);
    g.fillStyle(0x9fd6ff, 1);
    g.fillRoundedRect(62, 77, 22, 11, 5);
    g.fillRoundedRect(106, 77, 22, 11, 5);
    g.fillStyle(0xeaf6ff, 1);
    g.fillRoundedRect(66, 79, 12, 4, 2);
    g.fillRoundedRect(110, 79, 12, 4, 2);
    // Crest.
    g.fillStyle(0xffe967, 1);
    bolt([[100, 0], [84, 22], [95, 22], [88, 38], [110, 13], [99, 13], [106, 0]]);
  });

  // -- Kitty enemy ------------------------------------------------------------

  tex('enemy-kitty', 58, 46, (g) => {
    // Tail, swishing behind
    g.fillStyle(0xe8933d, 1);
    g.fillTriangle(50, 30, 58, 8, 54, 34);
    // Body
    g.fillStyle(0xf0a24a, 1);
    g.fillEllipse(28, 30, 40, 26);
    // Head
    g.fillEllipse(16, 22, 26, 22);
    // Ears — pointy
    g.fillTriangle(4, 14, 12, 2, 16, 15);
    g.fillTriangle(16, 15, 20, 2, 26, 13);
    g.fillStyle(0xffd9b0, 1);
    g.fillTriangle(7, 12, 11, 6, 13, 13);
    g.fillTriangle(17, 13, 20, 6, 23, 12);
    // Eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(11, 21, 3.6);
    g.fillCircle(20, 20, 3.6);
    g.fillStyle(0x2f7a3a, 1);
    g.fillCircle(11, 21, 1.8);
    g.fillCircle(20, 20, 1.8);
    // Nose + whiskers
    g.fillStyle(0xc9678f, 1);
    g.fillTriangle(14, 25, 17, 25, 15.5, 27);
    g.lineStyle(1.2, 0xffffff, 0.9);
    g.lineBetween(2, 24, 13, 23);
    g.lineBetween(2, 28, 13, 27);
    g.lineBetween(19, 23, 30, 21);
    g.lineBetween(19, 27, 30, 26);
    // Paws
    g.fillStyle(0xf0a24a, 1);
    g.fillRoundedRect(14, 38, 10, 8, 4);
    g.fillRoundedRect(30, 38, 10, 8, 4);
  });

  // -- Shellcracker's Mom -------------------------------------------------------

  tex('boss-shellcrackerMom', 190, 190, (g) => {
    // Big blonde hair, behind and above the head
    g.fillStyle(0xf2d24a, 1);
    g.fillEllipse(105, 46, 170, 90);
    g.fillStyle(0xe0bd35, 1);
    g.fillEllipse(105, 70, 160, 60);
    // Shell
    g.fillStyle(0x3a8f5e, 1);
    g.fillEllipse(105, 118, 150, 108);
    g.fillStyle(0x2e7048, 1);
    g.fillEllipse(105, 132, 150, 72);
    g.lineStyle(4, 0x1f4d30, 1);
    g.strokeEllipse(105, 122, 128, 86);
    // Hair fringe over the forehead
    g.fillStyle(0xf2d24a, 1);
    g.fillEllipse(48, 78, 70, 34);
    g.fillEllipse(150, 78, 50, 30);
    // Head
    g.fillStyle(0x8fd88a, 1);
    g.fillEllipse(40, 114, 66, 58);
    // Eyelashes + big friendly-but-mean eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(38, 102, 12);
    g.fillCircle(60, 100, 12);
    g.fillStyle(0xd11a7a, 1);
    g.fillCircle(35, 103, 5.5);
    g.fillCircle(57, 101, 5.5);
    g.lineStyle(2.5, 0x1f4d30, 1);
    g.lineBetween(24, 90, 48, 96);
    g.lineBetween(74, 88, 52, 95);
    // Jaw + lipstick mouth
    g.fillStyle(0xc9678f, 1);
    g.fillEllipse(38, 128, 26, 10);
    // Feet
    g.fillStyle(0x6bc45a, 1);
    g.fillRoundedRect(52, 162, 40, 26, 10);
    g.fillRoundedRect(122, 162, 40, 26, 10);
  });

  // -- Kitty Raider --------------------------------------------------------

  tex('boss-kittyRaider', 170, 200, (g) => {
    // Tail
    g.fillStyle(0x6b53c4, 1);
    g.fillTriangle(150, 150, 168, 110, 160, 170);
    // Cloak/cape
    g.fillStyle(0x2a1d54, 1);
    g.fillTriangle(85, 70, 160, 198, 10, 198);
    g.fillStyle(0x372a6e, 1);
    g.fillTriangle(85, 84, 142, 194, 28, 194);
    // Shoulder & chest armour
    g.fillStyle(0x6b5bb0, 1);
    g.fillRoundedRect(20, 88, 40, 26, 10);
    g.fillRoundedRect(110, 88, 40, 26, 10);
    g.fillStyle(0x4a3a8f, 1);
    g.fillRoundedRect(52, 92, 66, 56, 12);
    g.fillStyle(0x7a68c4, 1);
    g.fillRoundedRect(60, 100, 50, 18, 8);
    // Head
    g.fillStyle(0xb9895a, 1);
    g.fillEllipse(85, 46, 68, 56);
    // Ears — pointy, over an armoured band
    g.fillStyle(0x5b4aa3, 1);
    g.fillRoundedRect(52, 18, 66, 20, 10);
    g.fillStyle(0xb9895a, 1);
    g.fillTriangle(56, 24, 66, 2, 76, 22);
    g.fillTriangle(94, 22, 104, 2, 114, 24);
    g.fillStyle(0xd8ae7e, 1);
    g.fillTriangle(61, 20, 67, 8, 72, 19);
    g.fillTriangle(98, 19, 103, 8, 109, 20);
    // Eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(72, 46, 8);
    g.fillCircle(98, 46, 8);
    g.fillStyle(0x7ef0ff, 1);
    g.fillCircle(72, 46, 4);
    g.fillCircle(98, 46, 4);
    // Nose + whiskers
    g.fillStyle(0x6b4a33, 1);
    g.fillTriangle(82, 54, 88, 54, 85, 58);
    g.lineStyle(1.4, 0xffffff, 0.85);
    g.lineBetween(56, 52, 76, 51);
    g.lineBetween(56, 58, 76, 57);
    g.lineBetween(94, 51, 114, 52);
    g.lineBetween(94, 57, 114, 58);
    // Crest
    g.fillStyle(0xffe27a, 1);
    g.fillTriangle(85, 0, 96, 18, 74, 18);
  });

  // -- Shellcracker's Dad ("Boo Boo Bot Head") ------------------------------

  function drawDad(g: Phaser.GameObjects.Graphics, angry: boolean): void {
    // Brown hair tuft
    g.fillStyle(0x5a3a20, 1);
    g.fillEllipse(105, 30, 90, 40);
    g.fillTriangle(70, 20, 90, -6, 100, 22);
    g.fillTriangle(100, 20, 118, -8, 130, 20);
    // Shell
    g.fillStyle(0x6b7a3a, 1);
    g.fillEllipse(105, 98, 150, 110);
    g.fillStyle(0x54602c, 1);
    g.fillEllipse(105, 112, 150, 74);
    g.fillStyle(0xd8c98a, 1);
    for (const [sx, sy] of [
      [70, 54],
      [105, 44],
      [140, 54],
      [55, 80],
      [155, 80],
    ] as const) {
      g.fillTriangle(sx - 12, sy + 16, sx + 12, sy + 16, sx, sy - 12);
    }
    g.lineStyle(4, 0x333d18, 1);
    g.strokeEllipse(105, 102, 128, 88);
    // Head
    g.fillStyle(0x8aa050, 1);
    g.fillEllipse(38, 94, 66, 58);
    // Jaw + fangs
    g.fillStyle(0xf5d94a, 1);
    g.fillTriangle(4, 90, 40, 80, 40, 100);
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(12, 96, 20, 96, 16, 108);
    g.fillTriangle(26, 98, 34, 98, 30, 110);
    // Very angry eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(36, 82, 11);
    g.fillCircle(58, 80, 11);
    g.fillStyle(angry ? 0xff2020 : 0xd11a1a, 1);
    g.fillCircle(33, 83, 5.5);
    g.fillCircle(55, 81, 5.5);
    g.lineStyle(5, 0x2a3312, 1);
    g.lineBetween(20, 66, 46, 76);
    g.lineBetween(74, 64, 50, 75);
    // Feet
    g.fillStyle(0x76863f, 1);
    g.fillRoundedRect(52, 142, 40, 26, 10);
    g.fillRoundedRect(122, 142, 40, 26, 10);
  }

  tex('boss-shellcrackerDad', 190, 170, (g) => drawDad(g, false));

  // -- Projectiles & props --------------------------------------------------

  // Mom & Dad's spanking hand.
  tex('proj-hand', 30, 26, (g) => {
    g.fillStyle(0xf6c9a0, 1);
    g.fillEllipse(15, 15, 22, 18);
    g.fillRoundedRect(9, 2, 4, 12, 2);
    g.fillRoundedRect(14, 0, 4, 13, 2);
    g.fillRoundedRect(19, 2, 4, 12, 2);
    g.fillRoundedRect(23, 6, 4, 11, 2);
  });

  // The short-range hand-whip / spank swipe: a visible arc plus its invisible
  // hitbox, same pattern as the Raider's sword.
  tex('hand-whip-arc', 150, 110, (g) => {
    g.fillStyle(0xffb3d0, 0.5);
    g.fillEllipse(75, 55, 145, 100);
    g.fillStyle(0xffe0ec, 0.55);
    g.fillEllipse(75, 55, 105, 66);
    g.fillStyle(0xffffff, 0.7);
    g.fillEllipse(75, 55, 62, 30);
  });
  tex('hand-whip-hit', 140, 100, (g) => {
    g.fillStyle(0xffffff, 0.001);
    g.fillRect(0, 0, 140, 100);
  });

  // Kitty Raider's furball.
  tex('proj-furball', 28, 28, (g) => {
    g.fillStyle(0xd9974a, 0.4);
    g.fillCircle(14, 14, 13);
    g.fillStyle(0xc4813a, 1);
    g.fillCircle(14, 14, 10);
    g.lineStyle(1.4, 0xa5672a, 0.8);
    g.lineBetween(6, 8, 10, 14);
    g.lineBetween(20, 7, 16, 13);
    g.lineBetween(7, 20, 12, 16);
    g.lineBetween(21, 19, 16, 15);
  });

  // Kitty Raider's scratch marks: a visible claw-mark arc, and its invisible
  // hitbox, same pattern as the Raider's sword.
  tex('scratch-arc', 260, 150, (g) => {
    g.lineStyle(10, 0xff5d8f, 0.7);
    g.lineBetween(20, 30, 230, 70);
    g.lineBetween(15, 65, 235, 105);
    g.lineBetween(20, 100, 230, 138);
    g.lineStyle(4, 0xffe0ea, 0.8);
    g.lineBetween(20, 30, 230, 70);
    g.lineBetween(15, 65, 235, 105);
    g.lineBetween(20, 100, 230, 138);
  });
  tex('scratch-hit', 240, 130, (g) => {
    g.fillStyle(0xffffff, 0.001);
    g.fillRect(0, 0, 240, 130);
  });

  // Boo Boo Bot Head's laser bolt.
  tex('proj-laser', 40, 14, (g) => {
    g.fillStyle(0xff3030, 0.4);
    g.fillEllipse(20, 7, 40, 14);
    g.fillStyle(0xff5040, 1);
    g.fillEllipse(20, 7, 30, 8);
    g.fillStyle(0xffe0d0, 1);
    g.fillEllipse(20, 7, 16, 4);
  });

  // Glasses he puts on before the laser-eye attack.
  tex('prop-glasses', 60, 22, (g) => {
    g.lineStyle(3, 0x1a1a1a, 1);
    g.strokeCircle(16, 11, 10);
    g.strokeCircle(44, 11, 10);
    g.lineBetween(26, 11, 34, 11);
    g.lineBetween(6, 9, 0, 5);
    g.lineBetween(54, 9, 60, 5);
    g.fillStyle(0x7ef0ff, 0.6);
    g.fillCircle(16, 11, 7);
    g.fillCircle(44, 11, 7);
  });

  // The computer he gets out to call in reinforcements.
  tex('prop-computer', 44, 32, (g) => {
    g.fillStyle(0x5a5a66, 1);
    g.fillRoundedRect(2, 2, 40, 22, 3);
    g.fillStyle(0x7ef0ff, 1);
    g.fillRoundedRect(5, 5, 34, 16, 2);
    g.fillStyle(0x2a2a33, 1);
    g.fillRoundedRect(0, 24, 44, 6, 2);
  });
}
