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
  tex('boss-gardener', 190, 170, (g) => { // placeholder: not Henry's number
    g.fillStyle(0x6b472d, 1); g.fillEllipse(95, 98, 155, 120); g.fillStyle(0x438c54, 1); g.fillRoundedRect(62, 82, 72, 78, 8); // placeholder: not Henry's number
    g.fillStyle(0x314f27, 1); g.fillRect(32, 31, 126, 12); g.fillRoundedRect(55, 4, 82, 35, 9); // placeholder: not Henry's number
    g.fillStyle(0xc9e3a0, 1); g.fillCircle(72, 79, 10); g.fillCircle(116, 79, 10); // placeholder: not Henry's number
    g.fillStyle(0x1c3029, 1); g.fillCircle(72, 79, 4); g.fillCircle(116, 79, 4); // placeholder: not Henry's number
    g.fillStyle(0x6d9dbc, 1); g.fillRoundedRect(142, 100, 34, 42, 6); g.lineStyle(6, 0x6d9dbc, 1); g.strokeCircle(174, 109, 12); // placeholder: not Henry's number
  });
  tex('boss-thunder', 190, 140, (g) => { // placeholder: not Henry's number
    g.fillStyle(0x303e59, 1); g.fillEllipse(90, 84, 164, 76); g.fillCircle(49, 60, 38); g.fillCircle(95, 46, 48); g.fillCircle(139, 62, 39); // placeholder: not Henry's number
    g.fillStyle(0xb8d6ff, 1); g.fillCircle(68, 80, 8); g.fillCircle(117, 80, 8); // placeholder: not Henry's number
    g.fillStyle(0x192638, 1); g.fillCircle(68, 81, 4); g.fillCircle(117, 81, 4); // placeholder: not Henry's number
    g.fillStyle(0xffe967, 1); g.fillTriangle(91, 96, 109, 96, 91, 130); g.fillTriangle(91, 130, 79, 130, 101, 107); // placeholder: not Henry's number
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
