/**
 * Nearly Impossible mode. Everything here is a pure function over a `LevelDef`
 * or a `BossDef` — never mutates its input, always returns a new object — so a
 * level or boss stays plain data whichever mode is picked on the menu.
 *
 * Applying this is generic over `LEVELS`: it reads whatever platforms,
 * enemies, blocks, coins, icicles, checkpoints, goal and boss a level already
 * has and transforms them the same way regardless of how many levels there
 * are or what they contain.
 *
 * Adding a new kind of placed object to `LevelDef` means adding a line for it
 * to `widenGaps` below, the same way it handles platforms, enemies, blocks,
 * coins, icicles, checkpoints, tunnels, the goal and the boss.
 */

import { NEARLY_IMPOSSIBLE } from './game';
import type {
  BlockDef,
  CoinDef,
  EnemySpawn,
  IcicleDef,
  LevelDef,
  PlatformDef,
} from './levels';
import type { BossDef } from './bosses';

/**
 * Widens every gap between consecutive ground slabs by `gapWidenPx`, by
 * shifting everything at or right of the gap's far edge. Boss levels are one
 * ground slab, so there are no gaps and nothing moves.
 */
function widenGaps(level: LevelDef): LevelDef {
  const grounds = level.platforms
    .filter((p) => p.kind === 'ground')
    .slice()
    .sort((a, b) => a.x - b.x);

  // The far edge (start x) of every gap, in the level's ORIGINAL coordinates.
  const breakpoints: number[] = [];
  for (let i = 1; i < grounds.length; i++) {
    const prevEnd = grounds[i - 1].x + grounds[i - 1].w;
    if (grounds[i].x > prevEnd) breakpoints.push(grounds[i].x);
  }
  if (breakpoints.length === 0) return level;

  const widenBy = NEARLY_IMPOSSIBLE.gapWidenPx;
  // Everything at or past a gap's far edge moves right by one widenBy for
  // every gap at or before it — so things between the 2nd and 3rd gap have
  // moved twice, etc.
  const shift = (x: number): number => x + widenBy * breakpoints.filter((bp) => bp <= x).length;

  return {
    ...level,
    worldWidth: level.worldWidth + widenBy * breakpoints.length,
    platforms: level.platforms.map((p: PlatformDef) => ({ ...p, x: shift(p.x) })),
    enemies: level.enemies.map((e: EnemySpawn) => ({
      ...e,
      x: shift(e.x),
      left: e.left !== undefined ? shift(e.left) : undefined,
      right: e.right !== undefined ? shift(e.right) : undefined,
    })),
    blocks: level.blocks.map((b: BlockDef) => ({ ...b, x: shift(b.x) })),
    coins: level.coins.map((c: CoinDef) => ({ ...c, x: shift(c.x) })),
    icicles: level.icicles.map((i: IcicleDef) => ({ ...i, x: shift(i.x) })),
    checkpoints: level.checkpoints.map((cp) => ({ x: shift(cp.x), y: cp.y })),
    tunnels: level.tunnels?.map((t) => ({ ...t, x: shift(t.x) })),
    goal: level.goal ? { x: shift(level.goal.x), y: level.goal.y } : undefined,
    boss: level.boss ? { ...level.boss, x: shift(level.boss.x) } : undefined,
    playerStart: { x: shift(level.playerStart.x), y: level.playerStart.y },
  };
}

/** A second copy of every enemy, offset inside its own patrol bounds. */
function densifyEnemies(level: LevelDef): LevelDef {
  const offset = NEARLY_IMPOSSIBLE.enemyDensityOffsetPx;
  const extra: EnemySpawn[] = level.enemies.map((e) => {
    const left = e.left ?? e.x - 120;
    const right = e.right ?? e.x + 120;
    const x = Math.max(left, Math.min(right, e.x + offset));
    return { ...e, x };
  });
  return { ...level, enemies: [...level.enemies, ...extra] };
}

/**
 * Normal levels keep only the first power-up block (coin blocks always stay).
 * Boss levels keep the first three power-up blocks inside the arena, plus
 * every power-up block outside the arena untouched.
 */
function reduceBlocks(level: LevelDef): LevelDef {
  const arenaStart = level.boss ? level.boss.x - 900 : undefined;
  const keepCount = level.boss ? 3 : 1;
  let kept = 0;
  const blocks: BlockDef[] = [];

  for (const b of level.blocks) {
    if (b.contains === 'coin') {
      blocks.push(b);
      continue;
    }
    const inArena = arenaStart !== undefined && b.x > arenaStart;
    if (arenaStart !== undefined && !inArena) {
      // Boss level, but this block sits outside the arena — kept as is.
      blocks.push(b);
      continue;
    }
    if (kept < keepCount) {
      kept += 1;
      blocks.push(b);
    }
    // Otherwise dropped.
  }

  return { ...level, blocks };
}

/** Every remaining power-up block rolls a random power-up instead of a fixed one. */
function randomizeBlocks(level: LevelDef): LevelDef {
  return {
    ...level,
    blocks: level.blocks.map((b) => (b.contains === 'coin' ? b : { ...b, contains: 'random' })),
  };
}

/** All four Nearly Impossible level changes, applied in one call. */
export function nearlyImpossible(level: LevelDef): LevelDef {
  return randomizeBlocks(reduceBlocks(densifyEnemies(widenGaps(level))));
}

/** +1000 HP on a boss, with `hitsToKill` scaled up so the fight is not just longer for free. */
export function nearlyImpossibleBoss(def: BossDef): BossDef {
  const hp = def.hp + NEARLY_IMPOSSIBLE.bossHpBonus;
  const hitsToKill = Math.round(def.hitsToKill * (hp / def.hp));
  return { ...def, hp, hitsToKill };
}
