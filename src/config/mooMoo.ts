/**
 * The Moo Moo Cow Mom Hole: a generic rematch against a boss you have already
 * beaten, reachable from a hole at the start of every normal level. See
 * `HoleScene.ts` for the picker and `GameScene`'s `holeBossId` scene data for
 * how the fight itself is built and how winning or losing it is handled.
 */

import { FLOOR_Y, type LevelDef } from './levels';
import { MOO_MOO, type GameMode } from './game';
import type { BossDef } from './bosses';

/**
 * Flat arena, a little dodge furniture, four refilling power-up blocks and
 * the chosen boss near the far end. Not part of `LEVELS` — built fresh for
 * each hole fight, generically over whichever boss id is chosen.
 */
export function mooMooArena(bossId: string): LevelDef {
  return {
    id: -1,
    name: 'Moo Moo Cow Mom Hole',
    theme: 'shore',
    worldWidth: 2400,
    playerStart: { x: 120, y: FLOOR_Y },
    startingPowerUp: 'fireball',
    platforms: [
      { x: 0, y: FLOOR_Y, w: 2400, h: 80, kind: 'ground' },
      // Two dodge ledges and a high one, like level 3's arena.
      { x: 700, y: 460, w: 200, h: 24, kind: 'platform' },
      { x: 1400, y: 460, w: 200, h: 24, kind: 'platform' },
      { x: 1050, y: 320, w: 200, h: 24, kind: 'platform' },
    ],
    enemies: [],
    blocks: [
      // All within 900px of the boss, so GameScene's existing arena-refill
      // rule (`buildTerrain`) makes every one of these refill on its own.
      { x: 1500, y: 340, contains: 'fireball' },
      { x: 2000, y: 340, contains: 'fireball' },
      { x: 1100, y: 200, contains: 'star' },
      { x: 1750, y: 200, contains: 'heart' },
    ],
    coins: [],
    icicles: [],
    checkpoints: [],
    boss: { id: bossId, x: MOO_MOO.holeBossX, y: FLOOR_Y },
  };
}

/**
 * A weaker copy of the boss for the hole fight. Normal mode: 1000 HP, with
 * `hitsToKill` scaled down to match (minimum 6, so it is never a one-hit
 * kill). Nearly Impossible: the boss's own normal-mode stats, untouched — no
 * +1000 bonus in the hole.
 */
export function weakenHoleBoss(def: BossDef, mode: GameMode): BossDef {
  if (mode === 'nearlyImpossible') return def;
  const hp = MOO_MOO.normalHoleBossHp;
  const hitsToKill = Math.max(MOO_MOO.minHitsToKill, Math.round(def.hitsToKill * (hp / def.hp)));
  return { ...def, hp, hitsToKill };
}
