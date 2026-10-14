import Phaser from 'phaser';

/**
 * Helpers for textures painted with the canvas 2D API rather than a Phaser
 * Graphics — for the gradients, curves and pixel passes Graphics cannot do.
 */

export type Ctx = CanvasRenderingContext2D;

/** Small seeded random, so painted detail lands in the same place every run. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Paint a canvas texture once; if the key already exists it is left alone. */
export function paintTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: Ctx, w: number, h: number) => void): string {
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, w, h);
    if (tex) {
      draw(tex.getContext(), w, h);
      tex.refresh();
    }
  }
  return key;
}

/** Calls draw at x, and again one period to either side when x is near an edge. */
export function wrapped(period: number, x: number, margin: number, draw: (x: number) => void): void {
  draw(x);
  if (x < margin) draw(x + period);
  if (x > period - margin) draw(x - period);
}

/** As `wrapped`, in both directions, for detail on a tile that repeats both ways. */
export function wrapped2(w: number, h: number, x: number, y: number, margin: number, draw: (x: number, y: number) => void): void {
  for (const ox of [-w, 0, w]) {
    for (const oy of [-h, 0, h]) {
      const px = x + ox;
      const py = y + oy;
      if (px > -margin && px < w + margin && py > -margin && py < h + margin) draw(px, py);
    }
  }
}

export function vGradient(ctx: Ctx, y0: number, y1: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [at, colour] of stops) g.addColorStop(at, colour);
  return g;
}

export interface InkOptions {
  /** Outline thickness in pixels. */
  width?: number;
  /** Outline colour. */
  colour?: number;
  /** How far in, in pixels, the lit and shaded rims reach. */
  rim?: number;
  /** How much edges facing up-left brighten, 0..1. */
  light?: number;
  /** How much edges facing down-right darken, 0..1. */
  shade?: number;
}

/**
 * Give a baked sprite a cartoon finish, in place: a dark outline around its
 * silhouette, a lit rim along its top edges and a shaded rim along its
 * bottom ones. Only the solid parts count as silhouette, so faint glows and
 * auras keep their soft edges. The texture keeps its key and size.
 */
export function inkTexture(scene: Phaser.Scene, key: string, opts: InkOptions = {}): void {
  const tex = scene.textures.get(key);
  if (!(tex instanceof Phaser.Textures.CanvasTexture)) return;
  const width = opts.width ?? 2;
  const colour = opts.colour ?? 0x1d1830;
  const rim = opts.rim ?? 2;
  const light = opts.light ?? 0.22;
  const shade = opts.shade ?? 0.24;
  const or = (colour >> 16) & 0xff;
  const og = (colour >> 8) & 0xff;
  const ob = colour & 0xff;

  const w = tex.width;
  const h = tex.height;
  const ctx = tex.getContext();
  const img = ctx.getImageData(0, 0, w, h);
  const px = img.data;

  const solid = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    solid[i] = Math.min(1, Math.max(0, (px[i * 4 + 3] / 255 - 0.45) / 0.3));
  }
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : solid[y * w + x]);

  // Neighbours within the outline's reach, each with an anti-aliased weight.
  const reach: [number, number, number][] = [];
  const span = Math.ceil(width + 1);
  for (let dy = -span; dy <= span; dy++) {
    for (let dx = -span; dx <= span; dx++) {
      const weight = Math.min(1, Math.max(0, width + 0.5 - Math.hypot(dx, dy)));
      if (weight > 0) reach.push([dx, dy, weight]);
    }
  }

  const out = ctx.createImageData(w, h);
  const o = out.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const p = i * 4;
      let r = px[p];
      let g = px[p + 1];
      let b = px[p + 2];
      const a = px[p + 3] / 255;

      if (solid[i] > 0) {
        const lit = (1 - at(x - 1, y - rim)) * light;
        const dark = Math.max(1 - at(x + 1, y + rim), 0.6 * (1 - at(x + rim, y))) * shade;
        if (dark > 0) {
          r *= 1 - dark;
          g *= 1 - dark;
          b *= 1 - dark;
        }
        if (lit > 0) {
          r += (255 - r) * lit;
          g += (255 - g) * lit;
          b += (255 - b) * lit;
        }
      }

      let cover = 0;
      if (a < 1) {
        for (const [dx, dy, weight] of reach) {
          const c = at(x + dx, y + dy) * weight;
          if (c > cover) {
            cover = c;
            if (cover >= 1) break;
          }
        }
      }
      // The sprite's own pixel, laid over the outline.
      const oa = cover * (1 - a);
      const fa = a + oa;
      if (fa > 0) {
        o[p] = (r * a + or * oa) / fa;
        o[p + 1] = (g * a + og * oa) / fa;
        o[p + 2] = (b * a + ob * oa) / fa;
      }
      o[p + 3] = fa * 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  tex.refresh();
}
