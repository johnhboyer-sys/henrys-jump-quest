import Phaser from 'phaser';
import { VIEW } from '../config/game';
import type { LevelDef } from '../config/levels';

/**
 * Parallax scenery. One drawer per theme; each returns nothing and just adds
 * layers with a scrollFactor below 1 so they drift behind the action.
 */
export function buildBackdrop(scene: Phaser.Scene, level: LevelDef): void {
  const w = level.worldWidth;
  switch (level.theme) {
    case 'grass':
      grassBackdrop(scene, w);
      break;
    case 'ice':
      iceBackdrop(scene, w);
      break;
    case 'shore':
      shoreBackdrop(scene, w);
      break;
    case 'galactic':
      galacticBackdrop(scene, w);
      break;
  }
}

/** Flat colour band pinned to the camera. */
function sky(scene: Phaser.Scene, bands: [number, number][]): void {
  const g = scene.add.graphics().setScrollFactor(0).setDepth(-100);
  let y = 0;
  const step = VIEW.height / bands.length;
  for (const [colour] of bands) {
    g.fillStyle(colour, 1);
    g.fillRect(0, y, VIEW.width, step + 1);
    y += step;
  }
}

/** A row of overlapping circles — hills, dunes, whatever the colour says. */
function humps(
  scene: Phaser.Scene,
  worldWidth: number,
  colour: number,
  baseY: number,
  radius: number,
  spacing: number,
  scrollFactor: number,
  depth: number,
): void {
  const g = scene.add.graphics().setScrollFactor(scrollFactor).setDepth(depth);
  g.fillStyle(colour, 1);
  const span = worldWidth * scrollFactor + VIEW.width;
  for (let x = -radius; x < span; x += spacing) {
    const wobble = ((x * 7919) % 60) - 30;
    g.fillCircle(x, baseY + wobble * 0.4, radius);
  }
  g.fillRect(0, baseY, span, VIEW.height - baseY);
}

function jaggedRidge(
  scene: Phaser.Scene,
  worldWidth: number,
  colour: number,
  baseY: number,
  height: number,
  step: number,
  scrollFactor: number,
  depth: number,
): void {
  const g = scene.add.graphics().setScrollFactor(scrollFactor).setDepth(depth);
  g.fillStyle(colour, 1);
  const span = worldWidth * scrollFactor + VIEW.width;
  for (let x = 0; x < span; x += step) {
    const h = height * (0.55 + (((x * 2654435761) >>> 8) % 100) / 220);
    g.fillTriangle(x, baseY, x + step / 2, baseY - h, x + step, baseY);
  }
  g.fillRect(0, baseY, span, VIEW.height - baseY);
}

function puffyClouds(
  scene: Phaser.Scene,
  worldWidth: number,
  count: number,
  alpha: number,
  scrollFactor: number,
): void {
  const g = scene.add.graphics().setScrollFactor(scrollFactor).setDepth(-90);
  g.fillStyle(0xffffff, alpha);
  const span = worldWidth * scrollFactor + VIEW.width;
  for (let i = 0; i < count; i++) {
    const x = (i * span) / count + ((i * 137) % 90);
    const y = 60 + ((i * 61) % 170);
    const s = 0.7 + ((i * 29) % 60) / 100;
    g.fillCircle(x, y, 26 * s);
    g.fillCircle(x + 26 * s, y - 10 * s, 32 * s);
    g.fillCircle(x + 56 * s, y, 22 * s);
    g.fillRect(x, y, 56 * s, 20 * s);
  }
}

function grassBackdrop(scene: Phaser.Scene, w: number): void {
  sky(scene, [
    [0x6ec6f2, 0],
    [0x8fd6f7, 0],
    [0xb9e7fb, 0],
    [0xdaf3ff, 0],
  ]);
  puffyClouds(scene, w, 14, 0.85, 0.25);
  humps(scene, w, 0x2f7d4a, 520, 150, 210, 0.35, -80);
  humps(scene, w, 0x3fa34d, 600, 120, 170, 0.6, -70);
}

function iceBackdrop(scene: Phaser.Scene, w: number): void {
  sky(scene, [
    [0x1b2450, 0],
    [0x27356e, 0],
    [0x3a4d8f, 0],
    [0x5a72b5, 0],
  ]);
  puffyClouds(scene, w, 10, 0.16, 0.2);
  jaggedRidge(scene, w, 0x2c3c72, 560, 260, 200, 0.3, -80);
  jaggedRidge(scene, w, 0x4b62a6, 620, 190, 150, 0.55, -70);

  // Falling snow, pinned to the camera so it never runs out.
  const flakes = scene.add.graphics().setScrollFactor(0).setDepth(-60);
  flakes.fillStyle(0xffffff, 0.5);
  for (let i = 0; i < 60; i++) {
    flakes.fillCircle((i * 211) % VIEW.width, (i * 97) % VIEW.height, 1.5 + (i % 3));
  }
  scene.tweens.add({
    targets: flakes,
    y: VIEW.height,
    duration: 9000,
    repeat: -1,
    onRepeat: () => flakes.setY(-VIEW.height),
  });
}

function shoreBackdrop(scene: Phaser.Scene, w: number): void {
  sky(scene, [
    [0x2b1b44, 0],
    [0x6a2e5c, 0],
    [0xc85a4a, 0],
    [0xf0a04b, 0],
  ]);

  // Low sun sitting on the horizon.
  const sun = scene.add.graphics().setScrollFactor(0.1).setDepth(-92);
  sun.fillStyle(0xffd27a, 0.9);
  sun.fillCircle(VIEW.width * 0.68, 470, 74);

  puffyClouds(scene, w, 9, 0.28, 0.22);

  // Distant headlands, dark against the sunset.
  humps(scene, w, 0x3a2a4a, 470, 70, 150, 0.3, -85);

  // Sea below them, with a few highlight bands.
  const span = w * 0.5 + VIEW.width;
  const sea = scene.add.graphics().setScrollFactor(0.5).setDepth(-70);
  sea.fillStyle(0x264c73, 1);
  sea.fillRect(0, 500, span, VIEW.height - 500);
  sea.fillStyle(0x3e7ba8, 1);
  for (let x = 0; x < span; x += 90) {
    sea.fillRect(x, 520 + ((x * 13) % 60), 50, 4);
  }
  // Beach behind the playfield, so the sea stops at a shoreline instead of
  // running on underneath the sand the player stands on.
  sea.fillStyle(0xc9a874, 1);
  sea.fillRect(0, 596, span, VIEW.height - 596);
  sea.fillStyle(0xbfe0f2, 0.85);
  sea.fillRect(0, 592, span, 6);
  // Foam line at the far horizon too.
  sea.fillStyle(0xbfe0f2, 0.7);
  sea.fillRect(0, 500, span, 4);
}

/**
 * Deep space. Three star layers at different scroll rates do most of the work:
 * the parallax between them is what sells depth on a flat 2D stage.
 */
function galacticBackdrop(scene: Phaser.Scene, w: number): void {
  sky(scene, [
    [0x05030f, 0],
    [0x0d0a24, 0],
    [0x161036, 0],
    [0x1e1547, 0],
  ]);

  // Far stars: dense, dim, barely move.
  const far = scene.add.graphics().setScrollFactor(0.06).setDepth(-95);
  for (let i = 0; i < 260; i++) {
    const x = (i * 613) % (w * 0.06 + VIEW.width);
    const y = (i * 271) % VIEW.height;
    far.fillStyle(0xffffff, 0.25 + ((i * 17) % 40) / 100);
    far.fillCircle(x, y, 0.9 + ((i * 7) % 3) * 0.35);
  }

  // Nebula clouds.
  const neb = scene.add.graphics().setScrollFactor(0.14).setDepth(-93);
  const span = w * 0.14 + VIEW.width;
  for (let i = 0; i < 10; i++) {
    const x = (i * span) / 10 + ((i * 137) % 120);
    const y = 90 + ((i * 83) % 320);
    const tint = [0x4b2a7a, 0x27406e, 0x6a2a5c][i % 3];
    neb.fillStyle(tint, 0.28);
    neb.fillCircle(x, y, 120);
    neb.fillCircle(x + 90, y + 30, 90);
    neb.fillStyle(tint, 0.18);
    neb.fillCircle(x - 70, y + 40, 110);
  }

  // A ringed planet, big enough to be a landmark.
  const planet = scene.add.graphics().setScrollFactor(0.1).setDepth(-92);
  const px = VIEW.width * 0.74;
  const py = 210;
  planet.fillStyle(0x3a2f6e, 1);
  planet.fillCircle(px, py, 96);
  planet.fillStyle(0x50418f, 1);
  planet.fillCircle(px - 24, py - 22, 74);
  planet.fillStyle(0x2a2352, 1);
  planet.fillCircle(px + 44, py + 40, 34);
  planet.lineStyle(9, 0xa38dff, 0.65);
  planet.strokeEllipse(px, py + 10, 250, 62);

  // Near stars: sparse, bright, move a lot. This layer reads as depth.
  const near = scene.add.graphics().setScrollFactor(0.42).setDepth(-72);
  const nearSpan = w * 0.42 + VIEW.width;
  for (let i = 0; i < 90; i++) {
    const x = (i * 907) % nearSpan;
    const y = (i * 149) % VIEW.height;
    near.fillStyle(0xfff0a8, 0.75);
    near.fillCircle(x, y, 1.7);
  }

  // Distant crags along the bottom, so the floor has something behind it.
  jaggedRidge(scene, w, 0x1a1338, 600, 190, 170, 0.3, -80);
  jaggedRidge(scene, w, 0x2a1f56, 650, 130, 130, 0.55, -75);
}
