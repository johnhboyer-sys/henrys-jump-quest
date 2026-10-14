import Phaser from 'phaser';
import type { LevelDef, PlatformDef } from '../config/levels';
import { paintTexture, rng, vGradient, wrapped, wrapped2, type Ctx } from './Paint';

/**
 * How ground and platforms look. Each slab is still one TileSprite carrying
 * its physics body (see GameScene.addPlatform); this module paints the
 * textures and adds the purely visual dressing around it — a strip of turf,
 * snow, sand or crystal along the top, rounded ends, and shaded edges.
 */

type Look = 'grass' | 'snow' | 'sand' | 'star' | 'ice';

export interface SurfaceLook {
  /** Repeating 64×64 fill: the slab itself. */
  fill: string;
  /** Strip along the top edge; its texture starts CAP_LIFT above the surface. */
  cap: string;
  /** Rounded tip of the strip, past the right-hand end (flipped for the left). */
  end: string;
}

const TILE = 64;
const CAP_LIFT = 10;
const CAP_H = 32;
const END_W = 8;
const SHADE = 16;

export function surfaceLook(theme: LevelDef['theme'], kind: PlatformDef['kind']): SurfaceLook {
  const look: Look =
    kind === 'ice' ? 'ice' : theme === 'ice' ? 'snow' : theme === 'shore' ? 'sand' : theme === 'galactic' ? 'star' : 'grass';
  return { fill: `tile-${look}`, cap: `tile-${look}-cap`, end: `tile-${look}-end` };
}

/** Everything drawn around a slab. None of it has a body. */
export function dressSlab(scene: Phaser.Scene, def: { x: number; y: number; w: number; h: number }, look: SurfaceLook, depth: number): void {
  const { x, y, w, h } = def;
  scene.add.image(x, y, 'tile-shade-side').setOrigin(0, 0).setDisplaySize(Math.min(SHADE, w / 2), h).setDepth(depth + 0.1);
  scene.add
    .image(x + w, y, 'tile-shade-side')
    .setOrigin(1, 0)
    .setFlipX(true)
    .setDisplaySize(Math.min(SHADE, w / 2), h)
    .setDepth(depth + 0.1);
  scene.add.image(x, y + h, 'tile-shade-bottom').setOrigin(0, 1).setDisplaySize(w, Math.min(SHADE, h)).setDepth(depth + 0.1);

  const cap = scene.add.tileSprite(x, y - CAP_LIFT, w, CAP_H, look.cap).setOrigin(0, 0).setDepth(depth + 0.2);
  cap.tilePositionX = x;
  scene.add.image(x + w, y - CAP_LIFT, look.end).setOrigin(0, 0).setDepth(depth + 0.2);
  scene.add.image(x, y - CAP_LIFT, look.end).setOrigin(1, 0).setFlipX(true).setDepth(depth + 0.2);
}

/** Painted once at boot. */
export function makeTerrainTextures(scene: Phaser.Scene): void {
  const tex = (key: string, w: number, h: number, draw: (ctx: Ctx, w: number, h: number) => void) => paintTexture(scene, key, w, h, draw);

  // Edge shading, shared by every look.
  tex('tile-shade-side', SHADE, 4, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(10,6,20,0.42)');
    g.addColorStop(1, 'rgba(10,6,20,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(10,6,20,0.5)';
    ctx.fillRect(0, 0, 2, h);
  });
  tex('tile-shade-bottom', 4, SHADE, (ctx, w, h) => {
    ctx.fillStyle = vGradient(ctx, 0, h, [
      [0, 'rgba(10,6,20,0)'],
      [1, 'rgba(10,6,20,0.45)'],
    ]);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(10,6,20,0.5)';
    ctx.fillRect(0, h - 2, w, 2);
  });

  // -- Grass over dirt --------------------------------------------------------
  tex('tile-grass', TILE, TILE, (ctx, w, h) => {
    ctx.fillStyle = '#7a5131';
    ctx.fillRect(0, 0, w, h);
    blotches(ctx, w, h, rng(1), 7, 'rgba(92,58,32,0.6)');
    pebbles(ctx, w, h, rng(2), 6, '#9b7150', '#bb926b', '#4e321e');
    specks(ctx, w, h, rng(3), 14, 'rgba(60,36,20,0.6)');
  });
  tex('tile-grass-cap', TILE, CAP_H, (ctx, w) => {
    underShadow(ctx, w, 'rgba(40,20,10,0.5)');
    scallops(ctx, w, 19, [4.8, 3.6], '#3c963f');
    ctx.fillStyle = '#56b84f';
    ctx.fillRect(0, 8, w, 10);
    ctx.fillStyle = '#86dc68';
    ctx.fillRect(0, 8, w, 3);
    blades(ctx, w, rng(4), ['#6fcf5c', '#9be877', '#56b84f']);
  });
  tex('tile-grass-end', END_W, CAP_H, (ctx) => {
    tip(ctx, '#3c963f', 8, 23);
    tip(ctx, '#56b84f', 8, 18, 1.5);
    ctx.fillStyle = '#86dc68';
    ctx.fillRect(0, 8, 4, 3);
  });

  // -- Snow over frozen rock ---------------------------------------------------
  tex('tile-snow', TILE, TILE, (ctx, w, h) => {
    ctx.fillStyle = '#3d4b80';
    ctx.fillRect(0, 0, w, h);
    blotches(ctx, w, h, rng(11), 7, 'rgba(28,36,78,0.55)');
    pebbles(ctx, w, h, rng(12), 5, '#4f5f9a', '#6c7dbd', '#262e58');
    cracks(ctx, w, h, rng(13), 3, 'rgba(18,24,58,0.65)');
    specks(ctx, w, h, rng(14), 12, 'rgba(210,228,255,0.45)');
  });
  tex('tile-snow-cap', TILE, CAP_H, (ctx, w) => {
    underShadow(ctx, w, 'rgba(10,16,50,0.5)');
    icicles(ctx, w, rng(15));
    ctx.fillStyle = '#c4d5f2';
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) ctx.lineTo(x, 19 + Math.sin((x / w) * Math.PI * 6) * 1.6);
    ctx.lineTo(w, 9);
    ctx.lineTo(0, 9);
    ctx.fill();
    ctx.fillStyle = '#f4f8ff';
    ctx.fillRect(0, 9, w, 7);
    // Soft lumps along the top.
    for (let i = 0; i < 8; i++) {
      const cx = i * 8 + 4;
      const r = i % 2 ? 4.5 : 5.5;
      ctx.beginPath();
      ctx.arc(cx, 11, r, Math.PI, 0);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(0, 9, w, 2);
  });
  tex('tile-snow-end', END_W, CAP_H, (ctx) => {
    tip(ctx, '#c4d5f2', 6, 20);
    tip(ctx, '#f4f8ff', 6, 16, 1.5);
  });

  // -- Wet sand ----------------------------------------------------------------
  tex('tile-sand', TILE, TILE, (ctx, w, h) => {
    ctx.fillStyle = '#c4935f';
    ctx.fillRect(0, 0, w, h);
    for (const [y, amp, alpha] of [
      [12, 2, 0.35],
      [30, 3, 0.3],
      [50, 2, 0.35],
    ] as const) {
      ctx.strokeStyle = `rgba(150,100,55,${alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) ctx.lineTo(x, y + Math.sin((x / w) * Math.PI * 2) * amp);
      ctx.stroke();
    }
    pebbles(ctx, w, h, rng(21), 4, '#dcb482', '#efcf9f', '#8f6438');
    specks(ctx, w, h, rng(22), 18, 'rgba(255,236,200,0.5)');
  });
  tex('tile-sand-cap', TILE, CAP_H, (ctx, w) => {
    underShadow(ctx, w, 'rgba(90,50,20,0.4)');
    ctx.fillStyle = '#dcb880';
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) ctx.lineTo(x, 19 + Math.sin((x / w) * Math.PI * 4) * 2);
    ctx.lineTo(w, 8);
    ctx.lineTo(0, 8);
    ctx.fill();
    ctx.fillStyle = '#f0d6a2';
    ctx.fillRect(0, 8, w, 8);
    ctx.fillStyle = '#fcebc6';
    ctx.fillRect(0, 8, w, 3);
    specks(ctx, w, 8, rng(23), 8, 'rgba(190,150,100,0.7)', 10);
  });
  tex('tile-sand-end', END_W, CAP_H, (ctx) => {
    tip(ctx, '#dcb880', 8, 20);
    tip(ctx, '#f0d6a2', 8, 16, 1.5);
    ctx.fillStyle = '#fcebc6';
    ctx.fillRect(0, 8, 4, 3);
  });

  // -- Star-flecked rock ---------------------------------------------------------
  tex('tile-star', TILE, TILE, (ctx, w, h) => {
    ctx.fillStyle = '#251a4a';
    ctx.fillRect(0, 0, w, h);
    blotches(ctx, w, h, rng(31), 7, 'rgba(14,8,38,0.55)');
    const r = rng(32);
    for (let i = 0; i < 4; i++) {
      const x = r() * w;
      const y = r() * h;
      const s = 0.7 + r() * 0.6;
      wrapped2(w, h, x, y, 12, (px, py) => {
        ctx.fillStyle = '#4a3896';
        ctx.beginPath();
        ctx.moveTo(px - 5 * s, py + 4 * s);
        ctx.lineTo(px - 2 * s, py - 6 * s);
        ctx.lineTo(px + 4 * s, py - 4 * s);
        ctx.lineTo(px + 5 * s, py + 5 * s);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#8f7cf0';
        ctx.fillRect(px - 2 * s, py - 5 * s, 2 * s, 7 * s);
      });
    }
    specks(ctx, w, h, rng(33), 10, '#fff0a8');
  });
  tex('tile-star-cap', TILE, CAP_H, (ctx, w) => {
    underShadow(ctx, w, 'rgba(0,0,0,0.5)');
    // Rounded crystal lumps under the rim — round, so nobody reads them as spikes.
    scallops(ctx, w, 18, [4.2, 3.2], '#4e3aa6');
    ctx.fillStyle = '#6b53c4';
    ctx.fillRect(0, 8, w, 10);
    ctx.fillStyle = '#b3a2ff';
    ctx.fillRect(0, 8, w, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (const x of [9, 37, 55]) ctx.fillRect(x, 9, 4, 1);
  });
  tex('tile-star-end', END_W, CAP_H, (ctx) => {
    tip(ctx, '#6b53c4', 8, 18);
    ctx.fillStyle = '#b3a2ff';
    ctx.fillRect(0, 8, 4, 3);
  });

  // -- Slippery ice --------------------------------------------------------------
  tex('tile-ice', TILE, TILE, (ctx, w, h) => {
    ctx.fillStyle = vGradient(ctx, 0, h, [
      [0, '#8fd2ee'],
      [0.4, '#6cb8de'],
      [1, '#5ea8d2'],
    ]);
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 4;
    for (const x of [8, 40]) {
      wrapped(w, x, 40, (px) => {
        ctx.beginPath();
        ctx.moveTo(px, h);
        ctx.lineTo(px + 32, 0);
        ctx.stroke();
      });
    }
    specks(ctx, w, h, rng(41), 8, 'rgba(255,255,255,0.55)');
  });
  tex('tile-ice-cap', TILE, CAP_H, (ctx, w) => {
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillRect(0, 9, w, 3);
    ctx.fillStyle = 'rgba(214,244,255,0.85)';
    ctx.fillRect(0, 12, w, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (const [x, len] of [
      [6, 14],
      [30, 8],
      [46, 12],
    ]) {
      ctx.fillRect(x, 16, len, 2);
    }
  });
  tex('tile-ice-end', END_W, CAP_H, (ctx) => {
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillRect(0, 9, 2, 3);
  });
}

// -- Painting helpers ----------------------------------------------------------

function blotches(ctx: Ctx, w: number, h: number, r: () => number, count: number, colour: string): void {
  ctx.fillStyle = colour;
  for (let i = 0; i < count; i++) {
    const x = r() * w;
    const y = r() * h;
    const rx = 7 + r() * 10;
    const ry = 4 + r() * 5;
    wrapped2(w, h, x, y, 20, (px, py) => {
      ctx.beginPath();
      ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

/** Little stones: a dark underside, the stone, and a lit top. */
function pebbles(ctx: Ctx, w: number, h: number, r: () => number, count: number, body: string, lit: string, dark: string): void {
  for (let i = 0; i < count; i++) {
    const x = r() * w;
    const y = r() * h;
    const rx = 3 + r() * 3;
    const ry = 2 + r() * 1.6;
    wrapped2(w, h, x, y, 8, (px, py) => {
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.ellipse(px, py + 1.2, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = lit;
      ctx.beginPath();
      ctx.ellipse(px - rx * 0.3, py - ry * 0.35, rx * 0.45, ry * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

function specks(ctx: Ctx, w: number, h: number, r: () => number, count: number, colour: string, top = 0): void {
  ctx.fillStyle = colour;
  for (let i = 0; i < count; i++) {
    ctx.fillRect(Math.floor(r() * w), top + Math.floor(r() * h), 2, 2);
  }
}

function cracks(ctx: Ctx, w: number, h: number, r: () => number, count: number, colour: string): void {
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < count; i++) {
    const x = 8 + r() * (w - 16);
    const y = 8 + r() * (h - 24);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 4 + r() * 4, y + 5 + r() * 3);
    ctx.lineTo(x + 2 + r() * 6, y + 11 + r() * 4);
    ctx.stroke();
  }
}

/** The shadow a cap casts on the slab just under it. */
function underShadow(ctx: Ctx, w: number, colour: string): void {
  ctx.fillStyle = vGradient(ctx, 16, CAP_H, [
    [0, colour],
    [1, colour.replace(/[\d.]+\)$/, '0)')],
  ]);
  ctx.fillRect(0, 16, w, CAP_H - 16);
}

/** Round lumps hanging under a strip, alternating sizes, eight to a tile. */
function scallops(ctx: Ctx, w: number, y: number, sizes: number[], colour: string): void {
  ctx.fillStyle = colour;
  ctx.fillRect(0, 8, w, y - 8);
  for (let i = 0; i < 8; i++) {
    const r = sizes[i % sizes.length];
    wrapped(w, i * 8 + 4, 6, (x) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

/** Grass blades poking up past the surface line. */
function blades(ctx: Ctx, w: number, r: () => number, colours: string[]): void {
  for (let i = 0; i < 20; i++) {
    const x = i * (w / 20) + r() * 2;
    const tall = 3 + r() * 5;
    const lean = (r() - 0.5) * 3;
    ctx.fillStyle = colours[i % colours.length];
    wrapped(w, x, 4, (px) => {
      ctx.beginPath();
      ctx.moveTo(px - 1.6, 11);
      ctx.lineTo(px + lean, 10 - tall);
      ctx.lineTo(px + 1.6, 11);
      ctx.fill();
    });
  }
}

/** Icicles hanging from a snow strip. */
function icicles(ctx: Ctx, w: number, r: () => number): void {
  const gap = w / 4;
  for (let i = 0; i < 4; i++) {
    const x = i * gap + 4 + r() * 8;
    const len = 5 + r() * 8;
    ctx.fillStyle = '#cfe6ff';
    ctx.beginPath();
    ctx.moveTo(x - 3, 17);
    ctx.lineTo(x, 18 + len);
    ctx.lineTo(x + 3, 17);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(x - 1, 18, 1, len * 0.6);
  }
}

/** A rounded tip closing off a strip, from its top (y0) to its bottom (y1). */
function tip(ctx: Ctx, colour: string, y0: number, y1: number, inset = 0): void {
  const r = (y1 - y0) / 2;
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(0, y0);
  ctx.lineTo(Math.max(0, END_W - r - 2 - inset), y0);
  ctx.quadraticCurveTo(END_W - inset, y0, END_W - inset, y0 + r);
  ctx.quadraticCurveTo(END_W - inset, y1, Math.max(0, END_W - r - 2 - inset), y1);
  ctx.lineTo(0, y1);
  ctx.closePath();
  ctx.fill();
}
