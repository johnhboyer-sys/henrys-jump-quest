import Phaser from 'phaser';
import { VIEW } from '../config/game';
import type { LevelDef } from '../config/levels';
import { paintTexture, rng, vGradient, wrapped, type Ctx } from './Paint';

/**
 * Parallax scenery. Every layer is painted once with the canvas 2D API (for
 * real gradients and curves) into a texture that tiles sideways, then shown
 * as a TileSprite with a scroll factor below 1 so it drifts behind the
 * action. Textures are cached by key, so replaying a theme costs nothing.
 */
export function buildBackdrop(scene: Phaser.Scene, level: LevelDef): void {
  buildThemeBackdrop(scene, level.theme, level.worldWidth);
}

export type BackdropTheme = LevelDef['theme'];

export function buildThemeBackdrop(scene: Phaser.Scene, theme: BackdropTheme, worldWidth: number): void {
  const bd = new Painter(scene, worldWidth, theme);
  switch (theme) {
    case 'grass':
      grassBackdrop(bd);
      break;
    case 'ice':
      iceBackdrop(bd);
      break;
    case 'shore':
      shoreBackdrop(bd);
      break;
    case 'storm':
      stormBackdrop(bd);
      break;
    case 'galactic':
      galacticBackdrop(bd);
      break;
  }
}

type Stop = [number, string];
interface Pt {
  x: number;
  y: number;
}

/** A smooth top edge that wraps: every wave fits a whole number of times in W. */
function wave(W: number, base: number, parts: [amp: number, cycles: number, phase: number][]): (x: number) => number {
  return (x) => parts.reduce((y, [amp, cycles, phase]) => y + amp * Math.sin((x / W) * cycles * Math.PI * 2 + phase), base);
}

/**
 * Paints and places one theme's layers. Every texture it makes is named
 * `bd-<theme>-…`, so switching theme can drop the last one's textures.
 */
class Painter {
  constructor(
    readonly scene: Phaser.Scene,
    readonly worldWidth: number,
    readonly theme: string,
  ) {
    evictOtherBackdrops(scene, theme);
  }

  key(name: string): string {
    return `bd-${this.theme}-${name}`;
  }

  /**
   * Paint a texture once; later levels in the same theme reuse it. With
   * `scale` above 1 the texture is painted that many times smaller (the
   * drawing code still works in full-size units) and shown scaled back up —
   * fine for soft things like nebulae, and a quarter of the memory.
   */
  bake(name: string, w: number, h: number, draw: (ctx: Ctx, w: number, h: number) => void, scale = 1): string {
    return paintTexture(this.scene, this.key(name), Math.ceil(w / scale), Math.ceil(h / scale), (ctx) => {
      ctx.scale(1 / scale, 1 / scale);
      draw(ctx, w, h);
    });
  }

  image(name: string, x: number, y: number): Phaser.GameObjects.Image {
    return this.scene.add.image(x, y, this.key(name));
  }

  /** Full-screen vertical gradient, pinned to the camera. */
  sky(stops: Stop[]): Phaser.GameObjects.Image {
    this.bake('sky', 4, VIEW.height, (ctx, w, h) => {
      ctx.fillStyle = vGradient(ctx, 0, h, stops);
      ctx.fillRect(0, 0, w, h);
    });
    // A margin past every edge, so a camera shake never shows bare page behind it.
    return this.image('sky', -24, -24)
      .setOrigin(0, 0)
      .setDisplaySize(VIEW.width + 48, VIEW.height + 48)
      .setScrollFactor(0)
      .setDepth(-100);
  }

  /** A soft round glow (sun, moon halo) that barely moves. */
  glow(name: string, x: number, y: number, radius: number, stops: Stop[], factor: number, depth: number): Phaser.GameObjects.Image {
    this.bake(name, radius * 2, radius * 2, (ctx) => {
      const g = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
      for (const [at, colour] of stops) g.addColorStop(at, colour);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, radius * 2, radius * 2);
    });
    return this.image(name, x, y).setScrollFactor(factor, 0).setDepth(depth);
  }

  /**
   * A layer that tiles sideways and scrolls at `factor` of the camera's speed.
   * The texture's top sits at screen y `top`.
   */
  layer(name: string, w: number, top: number, factor: number, depth: number, draw: (ctx: Ctx, w: number, h: number) => void): Phaser.GameObjects.TileSprite {
    return this.strip(name, w, VIEW.height - top, top, factor, depth, draw);
  }

  /** Like `layer`, but for a texture that does not reach the bottom of the screen. */
  strip(
    name: string,
    w: number,
    h: number,
    top: number,
    factor: number,
    depth: number,
    draw: (ctx: Ctx, w: number, h: number) => void,
    scale = 1,
  ): Phaser.GameObjects.TileSprite {
    this.bake(name, w, h, draw, scale);
    const span = Math.ceil(this.worldWidth * factor + VIEW.width + 4);
    return this.scene.add
      .tileSprite(0, top, span, h, this.key(name))
      .setTileScale(scale, scale)
      .setOrigin(0, 0)
      .setScrollFactor(factor, 0)
      .setDepth(depth);
  }

  /** Slow sideways drift, for clouds and nebulae. */
  drift(layer: Phaser.GameObjects.TileSprite, pixelsPerSecond: number): void {
    const w = layer.texture.getSourceImage().width;
    this.scene.tweens.add({
      targets: layer,
      tilePositionX: { from: 0, to: w },
      duration: ((w * layer.tileScaleX) / pixelsPerSecond) * 1000,
      repeat: -1,
    });
  }

  /**
   * Falling weather: a pinned tiling layer whose pattern slides down forever.
   * `slant` is sideways travel per pixel of fall (negative drifts right); the
   * sideways tween always covers one whole tile so its loop has no jump.
   */
  fall(name: string, size: number, depth: number, msPerTile: number, slant: number, draw: (ctx: Ctx, w: number, h: number) => void): Phaser.GameObjects.TileSprite {
    this.bake(name, size, size, draw);
    const layer = this.scene.add.tileSprite(0, 0, VIEW.width, VIEW.height, this.key(name)).setOrigin(0, 0).setScrollFactor(0).setDepth(depth);
    this.scene.tweens.add({ targets: layer, tilePositionY: { from: 0, to: -size }, duration: msPerTile, repeat: -1 });
    if (slant !== 0) {
      this.scene.tweens.add({
        targets: layer,
        tilePositionX: { from: 0, to: slant > 0 ? size : -size },
        duration: msPerTile / Math.abs(slant),
        repeat: -1,
      });
    }
    return layer;
  }
}

/**
 * Drop every backdrop texture that belongs to another theme. Only one
 * backdrop is ever on screen, and together they would take a lot of a
 * phone's memory. Called from a scene's create, after the scene that used
 * the old textures has shut down.
 */
function evictOtherBackdrops(scene: Phaser.Scene, theme: string): void {
  const keep = `bd-${theme}-`;
  for (const key of scene.textures.getTextureKeys()) {
    if (key.startsWith('bd-') && !key.startsWith(keep)) scene.textures.remove(key);
  }
}

// -- Shared drawing ----------------------------------------------------------

/** Fill everything below a wrapping top edge, shaded top to bottom, with a lit rim. */
function hills(ctx: Ctx, w: number, h: number, top: (x: number) => number, fill: Stop[], rim?: string, rimWidth = 3): void {
  let minY = h;
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 4) {
    const y = top(x);
    minY = Math.min(minY, y);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = vGradient(ctx, minY, h, fill);
  ctx.fill();
  if (rim) {
    ctx.beginPath();
    for (let x = -4; x <= w + 4; x += 4) ctx.lineTo(x, top(x) + rimWidth / 2);
    ctx.strokeStyle = rim;
    ctx.lineWidth = rimWidth;
    ctx.stroke();
  }
}

/**
 * Faceted peaks: a lit face, a shaded face to the right of every summit and
 * optional snow caps. The outline wraps, so the strip tiles without a seam.
 */
function peaks(
  ctx: Ctx,
  w: number,
  h: number,
  rand: () => number,
  opts: { count: number; baseY: number; minH: number; maxH: number; light: string; shade: string; cap?: string; capDepth?: number; haze?: string },
): void {
  const tops: Pt[] = [];
  for (let i = 0; i < opts.count; i++) {
    tops.push({ x: ((i + 0.25 + rand() * 0.5) * w) / opts.count, y: opts.baseY - (opts.minH + rand() * (opts.maxH - opts.minH)) });
  }
  const one: Pt[] = [];
  tops.forEach((a, i) => {
    const b = i + 1 < tops.length ? tops[i + 1] : { x: tops[0].x + w, y: tops[0].y };
    one.push(a);
    one.push({ x: (a.x + b.x) / 2 + (rand() - 0.5) * (b.x - a.x) * 0.35, y: Math.min(opts.baseY, Math.max(a.y, b.y) + 40 + rand() * 80) });
  });
  const pts = [-w, 0, w].flatMap((off) => one.map((p) => ({ x: p.x + off, y: p.y })));

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0].x, h);
  for (const p of pts) ctx.lineTo(p.x, p.y);
  ctx.lineTo(pts[pts.length - 1].x, h);
  ctx.closePath();
  ctx.fillStyle = opts.light;
  ctx.fill();
  ctx.clip();

  for (let i = 0; i + 1 < pts.length; i += 2) {
    const p = pts[i];
    if (opts.cap) {
      const d = opts.capDepth ?? 40;
      ctx.beginPath();
      ctx.moveTo(p.x - 220, p.y - 60);
      ctx.lineTo(p.x + 220, p.y - 60);
      for (let x = p.x + 220; x >= p.x - 220; x -= 12) {
        ctx.lineTo(x, p.y + d + (((x * 13) | 0) % 3) * 6 - 6 - Math.abs(x - p.x) * 0.05);
      }
      ctx.closePath();
      ctx.fillStyle = opts.cap;
      ctx.fill();
    }
  }
  for (let i = 0; i + 1 < pts.length; i += 2) {
    const p = pts[i];
    const v = pts[i + 1];
    // The shaded face runs from the summit down to the right-hand valley,
    // its inner edge slanting away from the summit like a ridge line.
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(v.x, v.y);
    ctx.lineTo(v.x, h);
    ctx.lineTo(p.x + (v.x - p.x) * 0.25, h);
    ctx.lineTo(p.x + (v.x - p.x) * 0.12, p.y + (h - p.y) * 0.45);
    ctx.closePath();
    ctx.fillStyle = opts.shade;
    ctx.fill();
  }
  if (opts.haze) {
    const top = Math.min(...tops.map((t) => t.y));
    ctx.fillStyle = vGradient(ctx, top, h, [
      [0, 'rgba(0,0,0,0)'],
      [1, opts.haze],
    ]);
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

/** One cloud: overlapping puffs filled as a single shape, lit from above. */
function cloud(ctx: Ctx, x: number, y: number, s: number, top: string, bottom: string): void {
  const puffs: [number, number, number][] = [
    [0, 0, 26],
    [30, -14, 34],
    [64, -4, 28],
    [90, 6, 20],
    [-22, 8, 18],
  ];
  ctx.beginPath();
  for (const [px, py, r] of puffs) {
    ctx.moveTo(x + px * s + r * s, y + py * s);
    ctx.arc(x + px * s, y + py * s, r * s, 0, Math.PI * 2);
  }
  ctx.rect(x - 22 * s, y + 4 * s, 112 * s, 22 * s);
  ctx.fillStyle = vGradient(ctx, y - 48 * s, y + 26 * s, [
    [0, top],
    [0.55, top],
    [1, bottom],
  ]);
  ctx.fill();
}

/** A row of clouds that tiles sideways. */
function cloudBand(ctx: Ctx, w: number, h: number, rand: () => number, count: number, minS: number, maxS: number, top: string, bottom: string): void {
  for (let i = 0; i < count; i++) {
    const s = minS + rand() * (maxS - minS);
    const x = ((i + rand() * 0.6) * w) / count;
    const y = 50 * s + rand() * (h - 80 * s);
    wrapped(w, x, 140 * s, (cx) => cloud(ctx, cx, y, s, top, bottom));
  }
}

function roundTree(ctx: Ctx, x: number, y: number, s: number, leaf: string, leafLit: string, trunk: string): void {
  ctx.fillStyle = trunk;
  ctx.fillRect(x - 3 * s, y - 22 * s, 6 * s, 24 * s);
  ctx.beginPath();
  ctx.arc(x, y - 34 * s, 17 * s, 0, Math.PI * 2);
  ctx.moveTo(x - 10 * s, y - 24 * s);
  ctx.arc(x - 11 * s, y - 24 * s, 12 * s, 0, Math.PI * 2);
  ctx.moveTo(x + 23 * s, y - 25 * s);
  ctx.arc(x + 11 * s, y - 25 * s, 12 * s, 0, Math.PI * 2);
  ctx.fillStyle = leaf;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - 5 * s, y - 40 * s, 8 * s, 0, Math.PI * 2);
  ctx.fillStyle = leafLit;
  ctx.fill();
}

function pine(ctx: Ctx, x: number, y: number, s: number, leaf: string, snow?: string): void {
  ctx.fillStyle = leaf;
  ctx.fillRect(x - 2.5 * s, y - 10 * s, 5 * s, 12 * s);
  for (let tier = 0; tier < 3; tier++) {
    const ty = y - 8 * s - tier * 15 * s;
    const half = (19 - tier * 4.5) * s;
    ctx.beginPath();
    ctx.moveTo(x - half, ty);
    ctx.lineTo(x, ty - 24 * s);
    ctx.lineTo(x + half, ty);
    ctx.closePath();
    ctx.fillStyle = leaf;
    ctx.fill();
    if (snow) {
      ctx.beginPath();
      ctx.moveTo(x - half * 0.45, ty - 13 * s);
      ctx.lineTo(x, ty - 24 * s);
      ctx.lineTo(x + half * 0.45, ty - 13 * s);
      ctx.lineTo(x + half * 0.15, ty - 15 * s);
      ctx.lineTo(x - half * 0.1, ty - 12 * s);
      ctx.closePath();
      ctx.fillStyle = snow;
      ctx.fill();
    }
  }
}

function palm(ctx: Ctx, x: number, y: number, s: number, colour: string, lean: number): void {
  const tx = x + lean * 30 * s;
  const ty = y - 78 * s;
  ctx.strokeStyle = colour;
  ctx.lineCap = 'round';
  ctx.lineWidth = 5 * s;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * 4 * s, y - 50 * s, tx, ty);
  ctx.stroke();
  ctx.fillStyle = colour;
  for (const a of [-2.7, -2.2, -1.6, -1.0, -0.45, 0.1, 3.3]) {
    const ex = tx + Math.cos(a) * 38 * s;
    const ey = ty + Math.sin(a) * 22 * s + 14 * s;
    const mx = tx + Math.cos(a) * 20 * s;
    const my = ty + Math.sin(a) * 22 * s - 6 * s;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(mx, my - 6 * s, ex, ey);
    ctx.quadraticCurveTo(mx, my + 4 * s, tx, ty + 3 * s);
    ctx.fill();
  }
}

function stars(ctx: Ctx, w: number, h: number, rand: () => number, count: number, colour: string, maxR: number, maxY = h): void {
  ctx.fillStyle = colour;
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = 0.25 + rand() * 0.75;
    ctx.beginPath();
    ctx.arc(rand() * w, rand() * maxY, 0.5 + rand() * maxR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** A four-point twinkle, for the few stars bright enough to sparkle. */
function sparkle(ctx: Ctx, x: number, y: number, r: number, colour: string): void {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

/** A gentle band of light near the horizon, so far layers sit back in the air. */
function horizonHaze(bd: Painter, key: string, top: number, height: number, rgb: string, peak: number, depth: number): void {
  bd.bake(key, 4, height, (ctx, w, h) => {
    ctx.fillStyle = vGradient(ctx, 0, h, [
      [0, `rgba(${rgb},0)`],
      [0.6, `rgba(${rgb},${peak})`],
      [1, `rgba(${rgb},0)`],
    ]);
    ctx.fillRect(0, 0, w, h);
  });
  bd.image(key, 0, top).setOrigin(0, 0).setDisplaySize(VIEW.width, height).setScrollFactor(0).setDepth(depth);
}

// -- Themes ------------------------------------------------------------------

function grassBackdrop(bd: Painter): void {
  bd.sky([
    [0, '#3c95dc'],
    [0.45, '#79c2ee'],
    [0.72, '#bfe6f9'],
    [1, '#e9f8ff'],
  ]);
  bd.glow('sun', VIEW.width * 0.8, 120, 170, [
    [0, 'rgba(255,253,235,1)'],
    [0.2, 'rgba(255,248,205,1)'],
    [0.24, 'rgba(255,240,180,0.55)'],
    [0.6, 'rgba(255,236,170,0.16)'],
    [1, 'rgba(255,236,170,0)'],
  ], 0.03, -98);

  // Painted at half size: far clouds are soft enough not to show it.
  const farClouds = bd.strip(
    'clouds-far', 1024, 230, 30, 0.08, -96,
    (ctx, w, h) => cloudBand(ctx, w, h, rng(11), 6, 0.55, 0.8, 'rgba(255,255,255,0.75)', 'rgba(214,232,247,0.75)'),
    2,
  );
  bd.drift(farClouds, 4);

  bd.layer('mountains', 2048, 250, 0.12, -92, (ctx, w, h) =>
    peaks(ctx, w, h, rng(5), { count: 7, baseY: 300, minH: 120, maxH: 230, light: '#a4c8e4', shade: 'rgba(60,96,150,0.22)', cap: '#eef6ff', capDepth: 34, haze: 'rgba(225,242,252,0.55)' }),
  );

  const nearClouds = bd.strip('clouds-near', 2048, 260, 20, 0.2, -90, (ctx, w, h) =>
    cloudBand(ctx, w, h, rng(23), 6, 0.9, 1.35, '#ffffff', '#d9e9f6'),
  );
  bd.drift(nearClouds, 7);

  horizonHaze(bd, 'haze', 360, 200, '236,248,255', 0.45, -88);

  bd.layer('hills-far', 2048, 380, 0.28, -84, (ctx, w, h) => {
    const top = wave(w, 110, [
      [34, 3, 0.4],
      [18, 7, 1.9],
      [8, 13, 0.2],
    ]);
    hills(ctx, w, h, top, [
      [0, '#86c58c'],
      [1, '#5b9f6b'],
    ], '#a6dba0');
    const r = rng(41);
    for (let i = 0; i < 26; i++) {
      const x = r() * w;
      const s = 0.55 + r() * 0.35;
      wrapped(w, x, 40, (tx) => roundTree(ctx, tx, top(tx) + 10, s, '#5f9f69', '#7dba80', '#6a5a48'));
    }
  });

  bd.layer('hills-near', 2048, 440, 0.5, -76, (ctx, w, h) => {
    const top = wave(w, 120, [
      [40, 2, 2.2],
      [22, 5, 0.7],
      [9, 11, 2.9],
    ]);
    hills(ctx, w, h, top, [
      [0, '#5cb85a'],
      [0.5, '#3e9a49'],
      [1, '#2f7d3e'],
    ], '#9ee07a', 4);
    const r = rng(77);
    for (let i = 0; i < 16; i++) {
      const x = r() * w;
      const s = 0.8 + r() * 0.5;
      wrapped(w, x, 50, (tx) => roundTree(ctx, tx, top(tx) + 14, s, '#2f8a3e', '#55b35a', '#6b4a2f'));
    }
    // Little flowers dotted over the slope.
    const petals = ['#ffffff', '#ffe27a', '#ff9ec4', '#ffd0e0'];
    for (let i = 0; i < 140; i++) {
      const x = r() * w;
      const y = top(x) + 18 + r() * (h - top(x) - 30);
      ctx.fillStyle = petals[i % petals.length];
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(x, y, 1.6 + r() * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}

function iceBackdrop(bd: Painter): void {
  bd.sky([
    [0, '#0a0f2e'],
    [0.4, '#1a275e'],
    [0.75, '#3a559e'],
    [1, '#6f8fd0'],
  ]);
  bd.strip('stars', 1024, 360, 0, 0.02, -99, (ctx, w, h) => {
    const r = rng(3);
    stars(ctx, w, h, r, 160, '#ffffff', 1.1);
    for (let i = 0; i < 8; i++) sparkle(ctx, r() * w, r() * h * 0.8, 4 + r() * 3, 'rgba(255,255,255,0.8)');
  });
  bd.glow('moon', VIEW.width * 0.2, 110, 120, [
    [0, 'rgba(244,248,255,1)'],
    [0.28, 'rgba(232,240,255,1)'],
    [0.32, 'rgba(190,210,255,0.35)'],
    [1, 'rgba(160,190,255,0)'],
  ], 0.03, -98);

  // Aurora ribbons.
  const aurora = bd.strip('aurora', 2048, 290, 0, 0.05, -97, (ctx, w) => {
    const bands: [string, number, number][] = [
      ['rgba(110,255,200,', 100, 0.6],
      ['rgba(120,200,255,', 150, 2.4],
      ['rgba(190,140,255,', 125, 4.1],
    ];
    for (const [colour, mid, phase] of bands) {
      const top = wave(w, mid, [
        [34, 2, phase],
        [14, 5, phase * 2],
      ]);
      for (let x = 0; x < w; x += 3) {
        const y = top(x);
        const len = 70 + 30 * Math.sin((x / w) * Math.PI * 6 + phase);
        const g = ctx.createLinearGradient(0, y - len, 0, y + 6);
        g.addColorStop(0, colour + '0)');
        g.addColorStop(0.85, colour + '0.22)');
        g.addColorStop(1, colour + '0)');
        ctx.fillStyle = g;
        ctx.fillRect(x, y - len, 3, len + 6);
      }
    }
  }, 2);
  bd.drift(aurora, 6);

  bd.layer('peaks-far', 2048, 220, 0.12, -92, (ctx, w, h) =>
    peaks(ctx, w, h, rng(9), { count: 8, baseY: 330, minH: 150, maxH: 270, light: '#4a62a8', shade: 'rgba(14,22,60,0.35)', cap: '#dfe9ff', capDepth: 46, haze: 'rgba(100,130,200,0.55)' }),
  );

  bd.layer('peaks-mid', 2048, 330, 0.28, -84, (ctx, w, h) => {
    peaks(ctx, w, h, rng(19), { count: 9, baseY: 260, minH: 90, maxH: 190, light: '#34488a', shade: 'rgba(10,16,50,0.35)', cap: '#c9d8f8', capDepth: 30, haze: 'rgba(60,84,150,0.5)' });
  });

  bd.layer('forest', 2048, 450, 0.5, -76, (ctx, w, h) => {
    const top = wave(w, 110, [
      [28, 3, 1.1],
      [12, 8, 0.3],
    ]);
    const r = rng(29);
    for (let i = 0; i < 70; i++) {
      const x = r() * w;
      const s = 0.7 + r() * 0.6;
      wrapped(w, x, 30, (tx) => pine(ctx, tx, top(tx) + 16, s, '#1f2d5c', '#e6efff'));
    }
    hills(ctx, w, h, top, [
      [0, '#dbe7ff'],
      [0.15, '#a9bde8'],
      [1, '#5f77b5'],
    ], '#ffffff', 3);
  });

  // Two layers of snow, near and far, drifting a little sideways.
  bd.fall('snow-far', 256, -60, 9000, 0.15, (ctx, w, h) => {
    const r = rng(53);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(r() * w, r() * h, 1 + r() * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  bd.fall('snow-near', 384, -59, 6500, -0.2, (ctx, w, h) => {
    const r = rng(61);
    for (let i = 0; i < 14; i++) {
      const x = r() * w;
      const y = r() * h;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 4.5);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 5, y - 5, 10, 10);
    }
  });
}

function shoreBackdrop(bd: Painter): void {
  bd.sky([
    [0, '#24163f'],
    [0.32, '#5b2a5e'],
    [0.55, '#b4505a'],
    [0.7, '#ec8a4e'],
    [0.8, '#f8c06a'],
    [1, '#f8c06a'],
  ]);
  bd.strip('stars', 1024, 200, 0, 0.02, -99, (ctx, w, h) => stars(ctx, w, h, rng(7), 50, '#ffe9d0', 0.9));

  bd.glow('sun', VIEW.width * 0.66, 486, 230, [
    [0, 'rgba(255,246,214,1)'],
    [0.3, 'rgba(255,214,128,1)'],
    [0.34, 'rgba(255,190,110,0.5)'],
    [0.6, 'rgba(255,150,90,0.18)'],
    [1, 'rgba(255,140,80,0)'],
  ], 0.06, -97);

  const wisps = bd.strip('wisps', 2048, 300, 60, 0.1, -95, (ctx, w) => {
    const r = rng(13);
    for (let i = 0; i < 16; i++) {
      const x = r() * w;
      const y = 30 + r() * 250;
      const len = 120 + r() * 220;
      const thick = 6 + r() * 10;
      // Lit from below by the low sun: warm underside, dusky top.
      wrapped(w, x, len, (cx) => {
        ctx.fillStyle = vGradient(ctx, y - thick, y + thick, [
          [0, 'rgba(120,60,110,0.55)'],
          [0.6, 'rgba(255,150,120,0.6)'],
          [1, 'rgba(255,200,140,0.7)'],
        ]);
        ctx.beginPath();
        ctx.ellipse(cx, y, len / 2, thick, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  });
  bd.drift(wisps, 5);

  // Headlands with a few palms, dark against the sunset.
  bd.layer('headlands', 2048, 330, 0.3, -90, (ctx, w, h) => {
    const top = wave(w, 150, [
      [46, 2, 0.6],
      [22, 5, 2.1],
      [10, 9, 0.4],
    ]);
    hills(ctx, w, h, (x) => Math.max(top(x), 105), [
      [0, '#5a2f58'],
      [1, '#3a2040'],
    ], 'rgba(255,170,120,0.55)', 2);
    const r = rng(17);
    for (let i = 0; i < 16; i++) {
      const x = r() * w;
      if (top(x) > 160) continue;
      wrapped(w, x, 60, (tx) => palm(ctx, tx, Math.max(top(tx), 105) + 4, 0.7 + r() * 0.4, '#3a2040', r() - 0.5));
    }
  });

  // The sea: deep blue, sunlit towards the horizon, with glinting swells.
  bd.layer('sea', 1024, 500, 0.5, -80, (ctx, w, h) => {
    ctx.fillStyle = vGradient(ctx, 0, 96, [
      [0, '#f2a067'],
      [0.12, '#b8667a'],
      [0.5, '#3d4f86'],
      [1, '#25406e'],
    ]);
    ctx.fillRect(0, 0, w, h);
    const r = rng(31);
    for (let i = 0; i < 90; i++) {
      const y = 4 + r() * 88;
      const len = 10 + (y / 96) * 50 * r();
      const x = r() * w;
      ctx.fillStyle = y < 30 ? 'rgba(255,220,170,0.7)' : 'rgba(170,210,255,0.45)';
      wrapped(w, x, len, (cx) => ctx.fillRect(cx, y, len, 1 + y / 60));
    }
    // Wet sand behind the playfield, so the sea stops at a shoreline.
    ctx.fillStyle = vGradient(ctx, 96, h, [
      [0, '#d6ad7c'],
      [1, '#b48a5c'],
    ]);
    ctx.fillRect(0, 96, w, h - 96);
    ctx.fillStyle = 'rgba(255,240,220,0.85)';
    ctx.beginPath();
    for (let x = 0; x <= w; x += 8) ctx.lineTo(x, 94 + Math.sin((x / w) * Math.PI * 16) * 2.5);
    ctx.lineTo(w, 99);
    ctx.lineTo(0, 99);
    ctx.fill();
  });

  // The sun's reflection, a column of glitter on the water.
  bd.bake('glitter', 256, 90, (ctx, w, h) => {
    const r = rng(37);
    for (let i = 0; i < 46; i++) {
      const y = r() * h;
      const spread = 30 + (y / h) * 70;
      const x = w / 2 + (r() - 0.5) * spread * 2;
      ctx.fillStyle = `rgba(255,${200 + ((r() * 50) | 0)},150,${0.5 + r() * 0.4})`;
      ctx.fillRect(x, y, 6 + r() * 18, 2);
    }
  });
  bd.image('glitter', VIEW.width * 0.66, 502).setOrigin(0.5, 0).setScrollFactor(0.06, 0).setDepth(-79);
}

/**
 * Deep space. Star layers at different scroll rates do most of the work: the
 * parallax between them is what sells depth on a flat 2D stage.
 */
function galacticBackdrop(bd: Painter): void {
  bd.sky([
    [0, '#04020d'],
    [0.5, '#100b2c'],
    [0.85, '#1e1449'],
    [1, '#2a1a5c'],
  ]);

  bd.strip('stars-far', 1024, 520, 0, 0.04, -99, (ctx, w, h) => stars(ctx, w, h, rng(2), 340, '#ffffff', 0.9));

  bd.strip('nebula', 2048, VIEW.height, 0, 0.1, -97, (ctx, w) => {
    const r = rng(43);
    const tints = ['120,60,200', '50,100,200', '200,60,150', '80,40,160'];
    for (let i = 0; i < 22; i++) {
      const x = r() * w;
      const y = 90 + r() * 380;
      const rad = 90 + r() * 150;
      const tint = tints[i % tints.length];
      wrapped(w, x, rad, (cx) => {
        const g = ctx.createRadialGradient(cx, y, 0, cx, y, rad);
        g.addColorStop(0, `rgba(${tint},0.32)`);
        g.addColorStop(0.5, `rgba(${tint},0.14)`);
        g.addColorStop(1, `rgba(${tint},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(cx - rad, y - rad, rad * 2, rad * 2);
      });
    }
  }, 2);

  // A ringed planet, big enough to be a landmark: back half of the ring,
  // the shaded globe, then the front half of the ring.
  bd.bake('planet', 340, 220, (ctx) => {
    const cx = 170;
    const cy = 110;
    const ring = (front: boolean) => {
      ctx.save();
      ctx.beginPath();
      if (front) ctx.rect(0, cy, 340, 110);
      else ctx.rect(0, 0, 340, cy);
      ctx.clip();
      ctx.lineWidth = 10;
      ctx.strokeStyle = 'rgba(190,170,255,0.75)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 160, 34, -0.18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(240,230,255,0.6)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 146, 30, -0.18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };
    ring(false);
    const g = ctx.createRadialGradient(cx - 34, cy - 40, 8, cx, cy, 96);
    g.addColorStop(0, '#8a76e0');
    g.addColorStop(0.55, '#4d3c9a');
    g.addColorStop(1, '#1d1544');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, 92, 0, Math.PI * 2);
    ctx.fill();
    // Bands across the globe.
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#c9b8ff';
    for (const [y, t] of [[-40, 10], [-8, 6], [22, 12], [52, 5]]) {
      ctx.beginPath();
      ctx.ellipse(cx, cy + y, 110, t, -0.18, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ring(true);
  });
  bd.image('planet', VIEW.width * 0.76, 200).setScrollFactor(0.06, 0).setDepth(-96);
  bd.glow('moon', VIEW.width * 0.2 + 300, 110, 26, [
    [0, '#e6dcff'],
    [0.75, '#9d8ad8'],
    [0.82, 'rgba(160,140,230,0.4)'],
    [1, 'rgba(160,140,230,0)'],
  ], 0.08, -95);

  bd.strip('stars-near', 1024, 560, 0, 0.3, -88, (ctx, w, h) => {
    const r = rng(8);
    stars(ctx, w, h, r, 90, '#fff2b8', 1.4, h * 0.85);
    for (let i = 0; i < 18; i++) sparkle(ctx, r() * w, r() * h * 0.75, 5 + r() * 5, 'rgba(255,244,200,0.85)');
  });

  bd.layer('crags-far', 2048, 380, 0.3, -84, (ctx, w, h) =>
    peaks(ctx, w, h, rng(71), { count: 10, baseY: 250, minH: 80, maxH: 180, light: '#2a1f5a', shade: 'rgba(6,4,20,0.4)', cap: 'rgba(160,140,255,0.35)', capDepth: 10, haze: 'rgba(40,26,90,0.6)' }),
  );
  bd.layer('crags-near', 2048, 470, 0.5, -76, (ctx, w, h) => {
    peaks(ctx, w, h, rng(83), { count: 12, baseY: 200, minH: 50, maxH: 140, light: '#1c1440', shade: 'rgba(0,0,10,0.45)', cap: 'rgba(170,150,255,0.5)', capDepth: 6 });
    // Glowing crystals poking out of the rock.
    const r = rng(89);
    for (let i = 0; i < 26; i++) {
      const x = r() * w;
      const y = 150 + r() * 90;
      const s = 0.6 + r() * 0.8;
      const hue = r() < 0.5 ? '125,240,255' : '200,150,255';
      wrapped(w, x, 30, (cx) => {
        const g = ctx.createRadialGradient(cx, y - 10 * s, 0, cx, y - 10 * s, 30 * s);
        g.addColorStop(0, `rgba(${hue},0.35)`);
        g.addColorStop(1, `rgba(${hue},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(cx - 30 * s, y - 40 * s, 60 * s, 60 * s);
        ctx.fillStyle = `rgba(${hue},0.9)`;
        ctx.beginPath();
        ctx.moveTo(cx - 6 * s, y);
        ctx.lineTo(cx - 3 * s, y - 22 * s);
        ctx.lineTo(cx + 1 * s, y - 28 * s);
        ctx.lineTo(cx + 5 * s, y - 20 * s);
        ctx.lineTo(cx + 6 * s, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillRect(cx - 1.5 * s, y - 22 * s, 2 * s, 16 * s);
      });
    }
  });
}

/** Heavy grey sky, slow clouds and slanting rain behind the playable space. */
function stormBackdrop(bd: Painter): void {
  // All storm colours, cloud counts and rain density are art choices, not Henry's numbers.
  bd.sky([
    [0, '#161c29'],
    [0.45, '#2e3a4d'],
    [0.8, '#56667a'],
    [1, '#7a8a99'],
  ]);

  const high = bd.strip(
    'clouds-far', 2048, 300, 0, 0.08, -96,
    (ctx, w, h) => cloudBand(ctx, w, h, rng(97), 9, 1.2, 1.9, '#4a566a', '#2a3242'),
    2,
  );
  bd.drift(high, 10);

  // Now and then the sky lights up behind the hills.
  const flash = bd.scene.add.rectangle(0, 0, VIEW.width, VIEW.height, 0xdde8ff, 0).setOrigin(0, 0).setScrollFactor(0).setDepth(-95);
  const strike = () => {
    bd.scene.tweens.chain({
      targets: flash,
      tweens: [
        { alpha: 0.32, duration: 60 },
        { alpha: 0.05, duration: 90 },
        { alpha: 0.24, duration: 50 },
        { alpha: 0, duration: 420 },
      ],
    });
    bd.scene.time.delayedCall(6000 + Math.random() * 7000, strike);
  };
  bd.scene.time.delayedCall(2500, strike);

  const low = bd.strip('clouds-near', 2048, 280, 40, 0.18, -92, (ctx, w, h) =>
    cloudBand(ctx, w, h, rng(101), 8, 1.0, 1.6, '#5d6a7d', '#353f50'),
  );
  bd.drift(low, 16);

  horizonHaze(bd, 'haze', 360, 220, '120,136,152', 0.5, -88);

  bd.layer('hills-far', 2048, 380, 0.28, -84, (ctx, w, h) => {
    const top = wave(w, 140, [
      [40, 3, 0.9],
      [16, 7, 2.6],
    ]);
    hills(ctx, w, h, top, [
      [0, '#3b4a5a'],
      [1, '#2a3644'],
    ], 'rgba(150,170,190,0.35)', 2);
  });
  bd.layer('hills-near', 2048, 450, 0.5, -76, (ctx, w, h) => {
    const top = wave(w, 120, [
      [34, 2, 1.7],
      [16, 6, 0.2],
    ]);
    const r = rng(107);
    for (let i = 0; i < 14; i++) {
      const x = r() * w;
      const s = 0.8 + r() * 0.5;
      wrapped(w, x, 50, (tx) => roundTree(ctx, tx, top(tx) + 14, s, '#24382f', '#30483c', '#22231f'));
    }
    hills(ctx, w, h, top, [
      [0, '#2f4a3c'],
      [1, '#1c2d27'],
    ], 'rgba(150,190,170,0.35)', 3);
  });

  bd.fall('rain', 256, -60, 520, 0.27, (ctx, w, h) => {
    const r = rng(113);
    ctx.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const x = r() * w;
      const y = r() * h;
      const len = 14 + r() * 12;
      ctx.strokeStyle = `rgba(190,215,240,${0.25 + r() * 0.25})`;
      ctx.lineWidth = 1.5;
      // Draw each streak and its wrapped copies so the tile has no seam.
      for (const ox of [-w, 0, w]) {
        for (const oy of [-h, 0, h]) {
          ctx.beginPath();
          ctx.moveTo(x + ox, y + oy);
          ctx.lineTo(x + ox - len * 0.27, y + oy + len);
          ctx.stroke();
        }
      }
    }
  });
}

/** The title screen: Green Hills by night, with fireflies over the slopes. */
export function buildMenuBackdrop(scene: Phaser.Scene): void {
  const bd = new Painter(scene, VIEW.width, 'menu');
  bd.sky([
    [0, '#070b24'],
    [0.45, '#16225a'],
    [0.8, '#2c4386'],
    [1, '#3f5ba3'],
  ]);
  bd.strip('stars', 1024, 380, 0, 0, -99, (ctx, w, h) => {
    const r = rng(131);
    stars(ctx, w, h, r, 150, '#ffffff', 1.1);
    for (let i = 0; i < 9; i++) sparkle(ctx, r() * w, r() * h * 0.8, 4 + r() * 3, 'rgba(255,255,255,0.8)');
  });
  bd.glow('moon', VIEW.width * 0.88, 92, 110, [
    [0, 'rgba(255,250,232,1)'],
    [0.3, 'rgba(250,240,210,1)'],
    [0.34, 'rgba(220,220,255,0.3)'],
    [1, 'rgba(180,190,255,0)'],
  ], 0, -98);
  bd.layer('peaks', 2048, 300, 0, -92, (ctx, w, h) =>
    peaks(ctx, w, h, rng(137), { count: 7, baseY: 300, minH: 130, maxH: 230, light: '#2c3f7a', shade: 'rgba(8,12,40,0.35)', cap: '#9fb4e6', capDepth: 36, haze: 'rgba(40,60,120,0.55)' }),
  );
  bd.layer('hills-far', 2048, 420, 0, -84, (ctx, w, h) => {
    const top = wave(w, 90, [
      [30, 3, 0.4],
      [14, 7, 1.9],
    ]);
    hills(ctx, w, h, top, [
      [0, '#2a5c5c'],
      [1, '#1c4044'],
    ], '#4f8f80');
    const r = rng(139);
    for (let i = 0; i < 22; i++) {
      const x = r() * w;
      wrapped(w, x, 40, (tx) => roundTree(ctx, tx, top(tx) + 10, 0.55 + r() * 0.3, '#1f4a46', '#2f6a60', '#1a2a2a'));
    }
  });
  bd.layer('hills-near', 2048, 480, 0, -76, (ctx, w, h) => {
    const top = wave(w, 90, [
      [34, 2, 2.2],
      [16, 5, 0.7],
    ]);
    hills(ctx, w, h, top, [
      [0, '#2b6e47'],
      [1, '#1b4a31'],
    ], '#5fae6a', 4);
  });

  // Fireflies, blinking slowly over the hills.
  bd.bake('firefly', 16, 16, (ctx) => {
    const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, 'rgba(255,255,200,1)');
    g.addColorStop(0.3, 'rgba(230,255,140,0.8)');
    g.addColorStop(1, 'rgba(200,255,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 16);
  });
  const r = rng(149);
  for (let i = 0; i < 16; i++) {
    const fly = bd.image('firefly', r() * VIEW.width, 440 + r() * 170).setDepth(-70).setAlpha(0);
    scene.tweens.add({
      targets: fly,
      alpha: { from: 0, to: 0.9 },
      y: fly.y - 14 - r() * 16,
      x: fly.x + (r() - 0.5) * 40,
      duration: 1400 + r() * 1600,
      delay: r() * 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }
}
