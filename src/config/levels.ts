/**
 * Level data. A level is plain data: rectangles for the floor, a list of things
 * to put on it, and somewhere to finish. Adding a level means adding an entry
 * to LEVELS — no new code.
 *
 * Co-ordinate rules, so hand-authoring stays sane:
 *  - Platform x/y is the TOP-LEFT corner.
 *  - Everything that stands on the floor (player, enemies, the flag) is placed
 *    by its FEET, so y is the surface it stands on.
 *  - The world floor is at y = 640. Falling past y = 800 is death.
 */

import type { EnemyKind } from './enemies';
import type { BlockContent, PowerUpKind } from './powerups';

export const FLOOR_Y = 640;
export const DEATH_Y = 800;

export type SurfaceKind = 'ground' | 'platform' | 'ice';

export interface PlatformDef {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: SurfaceKind;
}

export interface EnemySpawn {
  kind: EnemyKind;
  /** Feet position. */
  x: number;
  y: number;
  /** Patrol bounds. Defaults to 120px either side of the spawn. */
  left?: number;
  right?: number;
}

export interface BlockDef {
  /** Centre of the block. */
  x: number;
  y: number;
  contains: BlockContent;
}

export interface CoinDef {
  x: number;
  y: number;
}

export interface IcicleDef {
  /** Centre of rotation. */
  x: number;
  y: number;
  radius: number;
  /** Radians per second. Negative spins the other way. */
  speed: number;
  arms: number;
}

export interface LevelDef {
  id: number;
  name: string;
  theme: 'grass' | 'ice' | 'shore' | 'galactic' | 'storm';
  worldWidth: number;
  /** Feet position. */
  playerStart: { x: number; y: number };
  platforms: PlatformDef[];
  enemies: EnemySpawn[];
  blocks: BlockDef[];
  coins: CoinDef[];
  icicles: IcicleDef[];
  /** Feet positions of the mid-level flags you respawn at. */
  checkpoints: { x: number; y: number }[];
  /** Feet position of the finish flag. Omitted on boss levels. */
  goal?: { x: number; y: number };
  /** Feet position of the boss, if this level is a boss fight. */
  boss?: { id: string; x: number; y: number };
  /** Power-up the player is handed on entry, so a boss fight is winnable. */
  startingPowerUp?: PowerUpKind;
  /**
   * Solid walls with a 44px slot above the floor — too short for Tom (58
   * tall) but not for Tiny Guy (36 tall). See buildTerrain in GameScene.
   */
  tunnels?: { x: number; w: number }[];
}

/** Floor slab from x to x + w. */
function ground(x: number, w: number): PlatformDef {
  return { x, y: FLOOR_Y, w, h: 80, kind: 'ground' };
}

/** Floating platform, 24px thick. */
function plat(x: number, y: number, w: number, kind: SurfaceKind = 'platform'): PlatformDef {
  return { x, y, w, h: 24, kind };
}

/** A run of coins, evenly spaced. */
function coinRow(x: number, y: number, count: number, gap = 56): CoinDef[] {
  return Array.from({ length: count }, (_, i) => ({ x: x + i * gap, y }));
}

/** A coin arc, the shape of a jump. */
function coinArc(x: number, y: number, count: number, gap = 56, lift = 46): CoinDef[] {
  const mid = (count - 1) / 2;
  return Array.from({ length: count }, (_, i) => ({
    x: x + i * gap,
    y: y - (mid * mid - (i - mid) * (i - mid)) * (lift / Math.max(1, mid * mid)),
  }));
}

// ---------------------------------------------------------------------------
// Level 1 — a gentle introduction: run, jump, stomp, find the cloud.
// ---------------------------------------------------------------------------
const LEVEL_1: LevelDef = {
  id: 1,
  name: 'Green Hills',
  theme: 'grass',
  worldWidth: 5200,
  playerStart: { x: 120, y: FLOOR_Y },
  platforms: [
    ground(0, 1400),
    ground(1560, 1040),
    ground(2780, 1120),
    ground(4060, 1140),

    plat(520, 500, 200),
    plat(880, 400, 180),
    plat(1240, 470, 160),

    plat(1700, 500, 200),
    plat(2040, 400, 220),
    plat(2400, 480, 180),

    plat(2960, 500, 180),
    plat(3260, 390, 200),
    plat(3600, 490, 200),

    plat(4200, 480, 200),
    plat(4520, 380, 220),
  ],
  enemies: [
    { kind: 'mushroom', x: 760, y: FLOOR_Y, left: 620, right: 980 },
    { kind: 'snappyTurtle', x: 1220, y: FLOOR_Y, left: 1060, right: 1360 },
    { kind: 'mushroom', x: 1900, y: FLOOR_Y, left: 1700, right: 2160 },
    { kind: 'snappyTurtle', x: 2420, y: FLOOR_Y, left: 2240, right: 2560 },
    { kind: 'mushroom', x: 2140, y: 400, left: 2060, right: 2240 },
    { kind: 'snappyTurtle', x: 3100, y: FLOOR_Y, left: 2880, right: 3300 },
    { kind: 'mushroom', x: 3520, y: FLOOR_Y, left: 3360, right: 3800 },
    { kind: 'snappyTurtle', x: 4300, y: FLOOR_Y, left: 4100, right: 4520 },
    { kind: 'mushroom', x: 4760, y: FLOOR_Y, left: 4600, right: 5000 },
  ],
  blocks: [
    { x: 620, y: 380, contains: 'coin' },
    { x: 684, y: 380, contains: 'cloud' },
    { x: 748, y: 380, contains: 'coin' },
    { x: 2140, y: 280, contains: 'coin' },
    { x: 2980, y: 380, contains: 'heart' },
    { x: 3700, y: 370, contains: 'cloud' },
    { x: 4620, y: 260, contains: 'coin' },
  ],
  coins: [
    ...coinArc(300, 560, 5),
    ...coinRow(560, 440, 3),
    ...coinRow(920, 340, 3),
    ...coinArc(1420, 560, 5),
    ...coinRow(2080, 340, 4),
    ...coinArc(2640, 560, 5),
    ...coinRow(3300, 330, 3),
    ...coinArc(3940, 560, 5),
    ...coinRow(4560, 320, 4),
    ...coinRow(4900, 560, 4),
  ],
  icicles: [],
  // A flag before every pit, so falling in never costs more than the run-up.
  checkpoints: [
    { x: 1180, y: FLOOR_Y },
    { x: 2420, y: FLOOR_Y },
    { x: 3720, y: FLOOR_Y },
  ],
  goal: { x: 5060, y: FLOOR_Y },
};

// ---------------------------------------------------------------------------
// Level 2 — fire, ice and sky. Introduces fireballs, icicles and butterflies.
// ---------------------------------------------------------------------------
const LEVEL_2: LevelDef = {
  id: 2,
  name: 'Frostfire Caves',
  theme: 'ice',
  worldWidth: 5800,
  playerStart: { x: 120, y: FLOOR_Y },
  startingPowerUp: 'cloud',
  platforms: [
    // Every gap here is 180 wide — the same as the other levels, and a
    // comfortable margin inside a full-speed jump.
    ground(0, 900),
    ground(1080, 820),
    ground(2080, 960),
    ground(3220, 820),
    ground(4220, 1580),

    plat(420, 490, 180),
    plat(700, 380, 160),

    plat(960, 520, 140, 'ice'),
    plat(1240, 430, 180, 'ice'),
    plat(1560, 340, 180),

    plat(1960, 500, 160, 'ice'),
    plat(2260, 400, 200),
    plat(2600, 470, 180, 'ice'),

    plat(3060, 520, 160),
    plat(3400, 400, 220, 'ice'),
    plat(3760, 480, 180),
    plat(4040, 360, 160),

    plat(4460, 480, 200, 'ice'),
    plat(4800, 380, 200),
    plat(5140, 470, 200),
  ],
  enemies: [
    { kind: 'fireFoe', x: 620, y: FLOOR_Y, left: 380, right: 860 },
    { kind: 'mushroom', x: 1300, y: 430, left: 1250, right: 1400 },
    { kind: 'snappyTurtle', x: 1700, y: FLOOR_Y, left: 1520, right: 1860 },
    { kind: 'butterfly', x: 2200, y: 260, left: 1980, right: 2560 },
    { kind: 'fireFoe', x: 2500, y: FLOOR_Y, left: 2360, right: 2820 },
    { kind: 'snappyTurtle', x: 2900, y: FLOOR_Y, left: 2760, right: 3000 },
    { kind: 'fireFoe', x: 3500, y: FLOOR_Y, left: 3320, right: 3900 },
    { kind: 'butterfly', x: 3900, y: 240, left: 3620, right: 4200 },
    { kind: 'mushroom', x: 4400, y: FLOOR_Y, left: 4280, right: 4680 },
    { kind: 'snappyTurtle', x: 4900, y: FLOOR_Y, left: 4720, right: 5100 },
    { kind: 'fireFoe', x: 5400, y: FLOOR_Y, left: 5240, right: 5680 },
  ],
  blocks: [
    { x: 480, y: 370, contains: 'fireball' },
    { x: 544, y: 370, contains: 'coin' },
    { x: 2320, y: 280, contains: 'heart' },
    { x: 3120, y: 400, contains: 'fireball' },
    { x: 4120, y: 240, contains: 'coin' },
    { x: 4880, y: 260, contains: 'fireball' },
    { x: 5200, y: 350, contains: 'heart' },
  ],
  coins: [
    ...coinRow(440, 430, 3),
    ...coinArc(960, 560, 4),
    ...coinRow(1600, 280, 3),
    ...coinArc(1900, 560, 4),
    ...coinRow(2300, 340, 4),
    ...coinArc(3020, 560, 4),
    ...coinRow(3440, 340, 4),
    ...coinArc(4080, 560, 4),
    ...coinRow(4840, 320, 4),
    ...coinRow(5180, 410, 4),
  ],
  // Hubs are placed so the lowest icicle tip stops just above a standing
  // player's head: walking underneath is safe, jumping through needs timing.
  // They also sit clear of the platforms, so nothing sweeps through solid ground.
  // Kept well back from the pit edges. A hit taken on the lip of a gap knocks
  // you in, and no amount of skill saves you from that.
  icicles: [
    { x: 1480, y: 250, radius: 80, speed: 1.6, arms: 2 },
    { x: 2600, y: 300, radius: 100, speed: -1.4, arms: 3 },
    { x: 4600, y: 310, radius: 100, speed: 1.8, arms: 2 },
    { x: 5450, y: 410, radius: 100, speed: -1.9, arms: 3 },
  ],
  checkpoints: [
    { x: 760, y: FLOOR_Y },
    { x: 1780, y: FLOOR_Y },
    { x: 2900, y: FLOOR_Y },
    { x: 4300, y: FLOOR_Y },
  ],
  goal: { x: 5660, y: FLOOR_Y },
};

// ---------------------------------------------------------------------------
// Level 3 — a short approach, then Shellcracker.
// ---------------------------------------------------------------------------
const LEVEL_3: LevelDef = {
  id: 3,
  name: "Shellcracker's Shore",
  theme: 'shore',
  worldWidth: 2560,
  playerStart: { x: 120, y: FLOOR_Y },
  startingPowerUp: 'fireball',
  platforms: [
    ground(0, 2560),
    plat(420, 480, 180),
    plat(760, 380, 160),
    // Arena furniture: two ledges to dodge onto, out of the fire breath.
    plat(1400, 460, 200),
    plat(2000, 460, 200),
    plat(1700, 320, 200),
  ],
  enemies: [
    { kind: 'snappyTurtle', x: 700, y: FLOOR_Y, left: 540, right: 900 },
    { kind: 'mushroom', x: 1060, y: FLOOR_Y, left: 940, right: 1180 },
  ],
  blocks: [
    { x: 480, y: 360, contains: 'heart' },
    { x: 820, y: 260, contains: 'fireball' },
    // Refills inside the arena, so you never run dry mid-fight.
    { x: 1480, y: 340, contains: 'fireball' },
    { x: 2080, y: 340, contains: 'fireball' },
    { x: 1760, y: 200, contains: 'star' },
    { x: 1620, y: 200, contains: 'heart' },
    // Boss arenas are the only place a 1-UP appears.
    { x: 1900, y: 200, contains: 'oneup' },
  ],
  coins: [
    ...coinRow(300, 560, 4),
    ...coinRow(460, 420, 3),
    ...coinRow(800, 320, 3),
    ...coinRow(1180, 560, 4),
  ],
  icicles: [],
  checkpoints: [
    { x: 640, y: FLOOR_Y },
    { x: 1240, y: FLOOR_Y },
  ],
  boss: { id: 'shellcracker', x: 2200, y: FLOOR_Y },
};

// ---------------------------------------------------------------------------
// Level 4 — the galactic run. Long drops onto drifting rock, and the first
// place the Super Star and the God Mushroom turn up.
// ---------------------------------------------------------------------------
const LEVEL_4: LevelDef = {
  id: 4,
  name: 'The Star Road',
  theme: 'galactic',
  worldWidth: 6200,
  playerStart: { x: 120, y: FLOOR_Y },
  startingPowerUp: 'cloud',
  platforms: [
    ground(0, 820),
    ground(1000, 720),
    ground(1900, 640),
    ground(2720, 900),
    ground(3800, 700),
    ground(4680, 1520),

    plat(360, 500, 180),
    plat(640, 390, 160),

    plat(880, 520, 140),
    plat(1180, 420, 200),
    plat(1500, 330, 180),

    plat(1760, 470, 160),
    plat(2060, 380, 200),
    plat(2380, 300, 180),
    plat(2600, 470, 160),

    plat(2960, 500, 180),
    plat(3260, 390, 200),
    plat(3560, 300, 180),
    plat(3660, 500, 140),

    plat(4020, 470, 180),
    plat(4320, 360, 200),
    plat(4560, 500, 160),

    plat(4900, 440, 200),
    plat(5240, 340, 200),
    plat(5580, 460, 200),
    plat(5900, 360, 180),
  ],
  enemies: [
    { kind: 'fireFoe', x: 560, y: FLOOR_Y, left: 300, right: 780 },
    { kind: 'butterfly', x: 900, y: 250, left: 700, right: 1200 },
    { kind: 'snappyTurtle', x: 1300, y: FLOOR_Y, left: 1040, right: 1660 },
    { kind: 'mushroom', x: 1240, y: 420, left: 1190, right: 1360 },
    { kind: 'fireFoe', x: 2100, y: FLOOR_Y, left: 1940, right: 2480 },
    { kind: 'butterfly', x: 2400, y: 220, left: 2120, right: 2700 },
    { kind: 'snappyTurtle', x: 2900, y: FLOOR_Y, left: 2760, right: 3200 },
    { kind: 'mushroom', x: 3340, y: 390, left: 3280, right: 3440 },
    { kind: 'fireFoe', x: 3500, y: FLOOR_Y, left: 3300, right: 3760 },
    { kind: 'butterfly', x: 4100, y: 230, left: 3860, right: 4400 },
    { kind: 'snappyTurtle', x: 4900, y: FLOOR_Y, left: 4720, right: 5120 },
    { kind: 'fireFoe', x: 5400, y: FLOOR_Y, left: 5220, right: 5680 },
    { kind: 'mushroom', x: 5960, y: 360, left: 5910, right: 6060 },
  ],
  blocks: [
    { x: 420, y: 370, contains: 'fireball' },
    { x: 700, y: 260, contains: 'coin' },
    // The Super Star's first appearance, right before a hard stretch.
    { x: 1560, y: 200, contains: 'star' },
    { x: 2120, y: 250, contains: 'heart' },
    { x: 2440, y: 170, contains: 'coin' },
    { x: 3320, y: 260, contains: 'fireball' },
    // And the God Mushroom, guarding the run to the finish.
    { x: 3620, y: 170, contains: 'mushroom' },
    { x: 4380, y: 230, contains: 'heart' },
    { x: 5300, y: 210, contains: 'fireball' },
    { x: 5960, y: 230, contains: 'star' },
  ],
  coins: [
    ...coinArc(240, 560, 5),
    ...coinRow(400, 430, 3),
    ...coinArc(830, 560, 4),
    ...coinRow(1220, 360, 4),
    ...coinArc(1740, 560, 4),
    ...coinRow(2100, 320, 4),
    ...coinArc(2640, 560, 5),
    ...coinRow(3300, 330, 4),
    ...coinArc(3720, 560, 4),
    ...coinRow(4360, 300, 4),
    ...coinArc(4600, 560, 5),
    ...coinRow(5280, 280, 4),
    ...coinRow(5940, 300, 3),
  ],
  // Spinning debris rather than ice out here. Kept well clear of the pit
  // edges: a hit taken on the lip of a gap knocks you in, and that reads as
  // the game cheating rather than as a mistake you made.
  icicles: [
    { x: 1300, y: 250, radius: 80, speed: 1.7, arms: 3 },
    { x: 2980, y: 380, radius: 100, speed: -1.5, arms: 2 },
    { x: 4150, y: 400, radius: 100, speed: 2.0, arms: 3 },
    { x: 5060, y: 400, radius: 100, speed: -1.8, arms: 3 },
  ],
  checkpoints: [
    { x: 700, y: FLOOR_Y },
    { x: 1600, y: FLOOR_Y },
    { x: 2760, y: FLOOR_Y },
    { x: 3840, y: FLOOR_Y },
    { x: 4760, y: FLOOR_Y },
  ],
  goal: { x: 6060, y: FLOOR_Y },
};

// ---------------------------------------------------------------------------
// Level 5 — the Galactic Raider. Ordinary attacks do nothing to it, so the
// arena is stocked with the power-ups that do.
// ---------------------------------------------------------------------------
const LEVEL_5: LevelDef = {
  id: 5,
  name: 'Raider of the Void',
  theme: 'galactic',
  worldWidth: 2900,
  playerStart: { x: 120, y: FLOOR_Y },
  startingPowerUp: 'fireball',
  platforms: [
    ground(0, 2900),
    plat(400, 480, 180),
    plat(720, 370, 160),
    // Arena furniture: high ground to break line of fire from the volleys.
    plat(1500, 460, 200),
    plat(2160, 460, 200),
    plat(1820, 320, 220),
  ],
  enemies: [
    { kind: 'snappyTurtle', x: 700, y: FLOOR_Y, left: 540, right: 900 },
    { kind: 'fireFoe', x: 1080, y: FLOOR_Y, left: 940, right: 1220 },
  ],
  blocks: [
    { x: 460, y: 360, contains: 'heart' },
    { x: 780, y: 250, contains: 'fireball' },
    // Everything below refills, because nothing else can hurt this boss.
    { x: 1580, y: 340, contains: 'fireball' },
    { x: 2240, y: 340, contains: 'fireball' },
    { x: 1760, y: 200, contains: 'star' },
    { x: 1880, y: 200, contains: 'mushroom' },
    { x: 2000, y: 200, contains: 'heart' },
    { x: 1640, y: 200, contains: 'oneup' },
  ],
  coins: [
    ...coinRow(280, 560, 4),
    ...coinRow(440, 420, 3),
    ...coinRow(760, 310, 3),
    ...coinRow(1180, 560, 4),
  ],
  icicles: [],
  checkpoints: [
    { x: 620, y: FLOOR_Y },
    { x: 1280, y: FLOOR_Y },
  ],
  boss: { id: 'galacticRaider', x: 2500, y: FLOOR_Y },
};

// ---------------------------------------------------------------------------
// Level 6 — Kitty Meadows. A gentle return to grass, introducing kitties
// alongside the mushrooms and turtles from level 1.
// ---------------------------------------------------------------------------
const LEVEL_6: LevelDef = {
  id: 6,
  name: 'Kitty Meadows',
  theme: 'grass',
  worldWidth: 5400,
  playerStart: { x: 120, y: FLOOR_Y },
  platforms: [
    ground(0, 1300),
    ground(1460, 1200),
    ground(2830, 1200),
    ground(4190, 1210),

    plat(500, 500, 200),
    plat(860, 400, 180),
    plat(1220, 470, 160),

    plat(1700, 500, 200),
    plat(2040, 400, 220),
    plat(2400, 480, 180),

    plat(2960, 500, 180),
    plat(3260, 390, 200),
    plat(3600, 490, 200),

    plat(4200, 480, 200),
    plat(4520, 380, 220),
    plat(4900, 460, 180),
  ],
  enemies: [
    { kind: 'kitty', x: 700, y: FLOOR_Y, left: 560, right: 900 },
    { kind: 'mushroom', x: 1080, y: FLOOR_Y, left: 940, right: 1220 },
    { kind: 'kitty', x: 1900, y: FLOOR_Y, left: 1700, right: 2160 },
    { kind: 'snappyTurtle', x: 2420, y: FLOOR_Y, left: 2240, right: 2560 },
    { kind: 'kitty', x: 2140, y: 400, left: 2060, right: 2240 },
    { kind: 'snappyTurtle', x: 3100, y: FLOOR_Y, left: 2880, right: 3300 },
    { kind: 'kitty', x: 3520, y: FLOOR_Y, left: 3360, right: 3800 },
    { kind: 'mushroom', x: 4300, y: FLOOR_Y, left: 4100, right: 4520 },
    { kind: 'kitty', x: 4760, y: FLOOR_Y, left: 4600, right: 5000 },
    { kind: 'snappyTurtle', x: 5100, y: FLOOR_Y, left: 4950, right: 5300 },
  ],
  blocks: [
    { x: 620, y: 380, contains: 'coin' },
    { x: 684, y: 380, contains: 'cloud' },
    { x: 748, y: 380, contains: 'coin' },
    // The kitty suit's first appearance, where the kitties start. Placeholder
    // placement, not Henry's.
    { x: 2140, y: 280, contains: 'kittySuit' },
    { x: 2980, y: 380, contains: 'fireball' },
    { x: 3700, y: 370, contains: 'coin' },
    { x: 4620, y: 260, contains: 'heart' },
  ],
  coins: [
    ...coinArc(300, 560, 5),
    ...coinRow(560, 440, 3),
    ...coinRow(920, 340, 3),
    ...coinArc(1420, 560, 5),
    ...coinRow(2080, 340, 4),
    ...coinArc(2640, 560, 5),
    ...coinRow(3300, 330, 3),
    ...coinArc(3940, 560, 5),
    ...coinRow(4560, 320, 4),
    ...coinRow(4900, 560, 4),
    ...coinRow(5150, 420, 3),
  ],
  icicles: [],
  checkpoints: [
    { x: 1240, y: FLOOR_Y },
    { x: 2600, y: FLOOR_Y },
    { x: 3970, y: FLOOR_Y },
  ],
  goal: { x: 5340, y: FLOOR_Y },
};

// ---------------------------------------------------------------------------
// Level 7 — Frozen Falls. Ice platforms and icicles again, now with kitties
// alongside the fire foes and butterflies.
// ---------------------------------------------------------------------------
const LEVEL_7: LevelDef = {
  id: 7,
  name: 'Frozen Falls',
  theme: 'ice',
  worldWidth: 5800,
  playerStart: { x: 120, y: FLOOR_Y },
  startingPowerUp: 'cloud',
  platforms: [
    // Every gap here is 150-170 wide, comfortably inside a full-speed jump.
    ground(0, 900),
    ground(1050, 850),
    ground(2060, 950),
    ground(3160, 850),
    ground(4180, 1620),

    plat(420, 490, 180),
    plat(700, 380, 160),

    plat(960, 520, 140, 'ice'),
    plat(1240, 430, 180, 'ice'),
    plat(1560, 340, 180),

    plat(2100, 500, 160, 'ice'),
    plat(2400, 400, 200),
    plat(2700, 470, 180, 'ice'),

    plat(3200, 520, 160),
    plat(3500, 400, 220, 'ice'),
    plat(3800, 480, 180),
    plat(4050, 360, 160),

    plat(4400, 480, 200, 'ice'),
    plat(4750, 380, 200),
    plat(5100, 470, 200),
    plat(5450, 380, 180),
  ],
  enemies: [
    { kind: 'fireFoe', x: 620, y: FLOOR_Y, left: 380, right: 860 },
    { kind: 'kitty', x: 1300, y: 430, left: 1250, right: 1400 },
    { kind: 'snappyTurtle', x: 1700, y: FLOOR_Y, left: 1520, right: 1860 },
    { kind: 'butterfly', x: 2200, y: 260, left: 1980, right: 2560 },
    { kind: 'kitty', x: 2500, y: FLOOR_Y, left: 2360, right: 2820 },
    { kind: 'fireFoe', x: 2900, y: FLOOR_Y, left: 2760, right: 3000 },
    { kind: 'kitty', x: 3500, y: FLOOR_Y, left: 3320, right: 3900 },
    { kind: 'butterfly', x: 3900, y: 240, left: 3620, right: 4200 },
    { kind: 'mushroom', x: 4400, y: FLOOR_Y, left: 4280, right: 4680 },
    { kind: 'kitty', x: 4900, y: FLOOR_Y, left: 4720, right: 5100 },
    { kind: 'fireFoe', x: 5400, y: FLOOR_Y, left: 5240, right: 5680 },
  ],
  blocks: [
    { x: 480, y: 370, contains: 'fireball' },
    { x: 544, y: 370, contains: 'coin' },
    // Placeholder placement, not Henry's: a kitty suit among the kitties.
    { x: 2320, y: 280, contains: 'kittySuit' },
    { x: 3120, y: 400, contains: 'fireball' },
    { x: 4120, y: 240, contains: 'coin' },
    { x: 4880, y: 260, contains: 'fireball' },
    { x: 5200, y: 350, contains: 'heart' },
  ],
  coins: [
    ...coinRow(440, 430, 3),
    ...coinArc(960, 560, 5),
    ...coinRow(1600, 280, 4),
    ...coinArc(2100, 560, 5),
    ...coinRow(2400, 340, 4),
    ...coinArc(3200, 560, 5),
    ...coinRow(3500, 340, 4),
    ...coinArc(4180, 560, 5),
    ...coinRow(4750, 320, 4),
    ...coinRow(5100, 410, 4),
    ...coinRow(5450, 300, 3),
  ],
  // Kept well back from every pit edge, and clear of the platforms — walking
  // underneath is always safe, jumping through needs timing.
  icicles: [
    { x: 1480, y: 250, radius: 80, speed: 1.6, arms: 2 },
    { x: 2600, y: 300, radius: 100, speed: -1.4, arms: 3 },
    { x: 4600, y: 310, radius: 100, speed: 1.8, arms: 2 },
    { x: 5450, y: 410, radius: 100, speed: -1.9, arms: 3 },
  ],
  checkpoints: [
    { x: 850, y: FLOOR_Y },
    { x: 1850, y: FLOOR_Y },
    { x: 2960, y: FLOOR_Y },
    { x: 3960, y: FLOOR_Y },
  ],
  goal: { x: 5760, y: FLOOR_Y },
};

// ---------------------------------------------------------------------------
// Level 8 — a short approach, a tiny tunnel, then Shellcracker's Mom.
// ---------------------------------------------------------------------------
const LEVEL_8: LevelDef = {
  id: 8,
  name: "Mom's Beach House",
  theme: 'shore',
  worldWidth: 2900,
  playerStart: { x: 120, y: FLOOR_Y },
  startingPowerUp: 'fireball',
  platforms: [
    ground(0, 2900),
    plat(420, 480, 180),
    plat(680, 380, 160),
    plat(1350, 460, 200),
    // Arena furniture: ledges to dodge onto, like levels 3 and 5.
    plat(1600, 460, 200),
    plat(2200, 460, 200),
    plat(1900, 320, 200),
  ],
  enemies: [
    { kind: 'snappyTurtle', x: 700, y: FLOOR_Y, left: 540, right: 860 },
    { kind: 'mushroom', x: 1150, y: FLOOR_Y, left: 1050, right: 1300 },
  ],
  blocks: [
    { x: 560, y: 360, contains: 'heart' },
    { x: 820, y: 260, contains: 'fireball' },
    // Boss-arena blocks refill (see buildTerrain), so the fight can't run dry.
    { x: 1650, y: 340, contains: 'fireball' },
    { x: 2250, y: 340, contains: 'fireball' },
    { x: 1950, y: 200, contains: 'star' },
    { x: 1850, y: 200, contains: 'heart' },
    { x: 2050, y: 200, contains: 'oneup' },
    { x: 2150, y: 200, contains: 'mushroom' },
  ],
  coins: [
    ...coinRow(300, 560, 4),
    ...coinRow(460, 420, 3),
    ...coinRow(600, 300, 3),
    ...coinRow(760, 320, 3),
    ...coinRow(950, 300, 3),
    ...coinRow(1100, 560, 4),
    ...coinRow(1300, 560, 4),
    ...coinArc(1750, 300, 5),
    ...coinRow(2000, 560, 4),
    ...coinRow(2300, 300, 4),
    ...coinArc(2450, 560, 5),
  ],
  icicles: [],
  // A flag right before the sign, so the tunnel is never a surprise.
  checkpoints: [
    { x: 820, y: FLOOR_Y },
    { x: 1200, y: FLOOR_Y },
  ],
  boss: { id: 'shellcrackerMom', x: 2400, y: FLOOR_Y },
  // The whole tunnel sits well before boss.x - 900 (1500), so the arena
  // blocks refill and the boss hasn't woken by the time it's crossed.
  tunnels: [{ x: 900, w: 100 }],
};

// ---------------------------------------------------------------------------
// Level 9 — The Impossible Climb. Henry's deliberately hard level: the
// densest enemies and hardest platforming so far, but every gap is still
// jumpable and every platform still reachable.
// ---------------------------------------------------------------------------
const LEVEL_9: LevelDef = {
  id: 9,
  name: 'The Impossible Climb',
  theme: 'galactic',
  worldWidth: 6400,
  playerStart: { x: 120, y: FLOOR_Y },
  startingPowerUp: 'cloud',
  platforms: [
    ground(0, 820),
    ground(990, 720),
    ground(1870, 660),
    ground(2700, 900),
    ground(3760, 700),
    ground(4630, 1770),

    plat(360, 500, 180),
    plat(640, 390, 160),

    plat(880, 520, 140),
    plat(1180, 420, 200),
    plat(1500, 330, 180),

    plat(1760, 470, 160),
    plat(2060, 380, 200),
    plat(2380, 300, 180),
    plat(2600, 470, 160),

    plat(2960, 500, 180),
    plat(3260, 390, 200),
    plat(3560, 300, 180),
    plat(3660, 500, 140),

    plat(4020, 470, 180),
    plat(4320, 360, 200),
    plat(4560, 500, 160),

    plat(4900, 440, 200),
    plat(5240, 340, 200),
    plat(5580, 460, 200),
    plat(5900, 360, 180),
  ],
  enemies: [
    { kind: 'fireFoe', x: 560, y: FLOOR_Y, left: 300, right: 780 },
    { kind: 'kitty', x: 820, y: FLOOR_Y, left: 700, right: 960 },
    { kind: 'butterfly', x: 900, y: 250, left: 700, right: 1200 },
    { kind: 'snappyTurtle', x: 1300, y: FLOOR_Y, left: 1040, right: 1660 },
    { kind: 'mushroom', x: 1240, y: 420, left: 1190, right: 1360 },
    { kind: 'kitty', x: 1600, y: FLOOR_Y, left: 1500, right: 1700 },
    { kind: 'fireFoe', x: 2100, y: FLOOR_Y, left: 1940, right: 2480 },
    { kind: 'butterfly', x: 2400, y: 220, left: 2120, right: 2700 },
    { kind: 'kitty', x: 2650, y: FLOOR_Y, left: 2550, right: 2800 },
    { kind: 'snappyTurtle', x: 2900, y: FLOOR_Y, left: 2760, right: 3200 },
    { kind: 'mushroom', x: 3340, y: 390, left: 3280, right: 3440 },
    { kind: 'kitty', x: 3480, y: FLOOR_Y, left: 3300, right: 3600 },
    { kind: 'fireFoe', x: 3520, y: FLOOR_Y, left: 3320, right: 3780 },
    { kind: 'butterfly', x: 4100, y: 230, left: 3860, right: 4400 },
    { kind: 'kitty', x: 4300, y: FLOOR_Y, left: 4180, right: 4460 },
    { kind: 'snappyTurtle', x: 4900, y: FLOOR_Y, left: 4720, right: 5120 },
    { kind: 'fireFoe', x: 5400, y: FLOOR_Y, left: 5220, right: 5680 },
    { kind: 'kitty', x: 5750, y: FLOOR_Y, left: 5620, right: 5900 },
    { kind: 'mushroom', x: 5960, y: 360, left: 5910, right: 6060 },
    { kind: 'kitty', x: 6200, y: FLOOR_Y, left: 6080, right: 6350 },
  ],
  blocks: [
    { x: 420, y: 370, contains: 'fireball' },
    { x: 700, y: 260, contains: 'coin' },
    { x: 1560, y: 200, contains: 'star' },
    { x: 2120, y: 250, contains: 'heart' },
    { x: 2440, y: 170, contains: 'coin' },
    { x: 3320, y: 260, contains: 'fireball' },
    { x: 3620, y: 170, contains: 'mushroom' },
    { x: 4380, y: 230, contains: 'heart' },
    { x: 5300, y: 210, contains: 'fireball' },
    { x: 5960, y: 230, contains: 'star' },
    { x: 6200, y: 230, contains: 'coin' },
  ],
  coins: [
    ...coinArc(240, 560, 5),
    ...coinRow(400, 430, 3),
    ...coinArc(830, 560, 4),
    ...coinRow(1220, 360, 4),
    ...coinArc(1740, 560, 4),
    ...coinRow(2100, 320, 4),
    ...coinArc(2640, 560, 5),
    ...coinRow(3300, 330, 4),
    ...coinArc(3720, 560, 4),
    ...coinRow(4360, 300, 4),
    ...coinArc(4600, 560, 5),
    ...coinRow(5280, 280, 4),
    ...coinRow(5940, 300, 3),
    ...coinRow(6150, 560, 4),
  ],
  icicles: [
    { x: 1300, y: 250, radius: 80, speed: 1.7, arms: 3 },
    { x: 2980, y: 380, radius: 100, speed: -1.5, arms: 2 },
    { x: 4150, y: 400, radius: 100, speed: 2.0, arms: 3 },
    { x: 5060, y: 400, radius: 100, speed: -1.8, arms: 3 },
    { x: 6150, y: 300, radius: 90, speed: 1.6, arms: 2 },
  ],
  checkpoints: [
    { x: 780, y: FLOOR_Y },
    { x: 1680, y: FLOOR_Y },
    { x: 2500, y: FLOOR_Y },
    { x: 3570, y: FLOOR_Y },
    { x: 4430, y: FLOOR_Y },
  ],
  goal: { x: 6360, y: FLOOR_Y },
};

// ---------------------------------------------------------------------------
// Level 10 — a short approach, a tiny tunnel, then the Kitty Raider.
// ---------------------------------------------------------------------------
const LEVEL_10: LevelDef = {
  id: 10,
  name: "Kitty Raider's Lair",
  theme: 'galactic',
  worldWidth: 3000,
  playerStart: { x: 120, y: FLOOR_Y },
  startingPowerUp: 'fireball',
  platforms: [
    ground(0, 3000),
    plat(420, 480, 180),
    plat(700, 380, 160),
    plat(1300, 460, 200),
    // Arena furniture: ledges to dodge onto, like levels 3 and 5.
    plat(1700, 460, 200),
    plat(2300, 460, 200),
    plat(2000, 320, 200),
  ],
  enemies: [
    { kind: 'kitty', x: 750, y: FLOOR_Y, left: 600, right: 900 },
    { kind: 'snappyTurtle', x: 1200, y: FLOOR_Y, left: 1150, right: 1300 },
  ],
  blocks: [
    // Henry: power-up blocks in the Kitty Raider's level are "normal random",
    // in every mode. Star and Mushroom hurt bosses too, so a random roll
    // never leaves the fight unwinnable, and arena blocks refill.
    { x: 480, y: 360, contains: 'random' },
    { x: 820, y: 250, contains: 'random' },
    // Boss-arena blocks refill (see buildTerrain), so the fight can't run dry.
    { x: 1780, y: 340, contains: 'random' },
    { x: 2380, y: 340, contains: 'random' },
    { x: 2080, y: 200, contains: 'random' },
    { x: 1980, y: 200, contains: 'random' },
    { x: 2180, y: 200, contains: 'random' },
    { x: 2280, y: 200, contains: 'random' },
  ],
  coins: [
    ...coinRow(300, 560, 4),
    ...coinRow(460, 420, 3),
    ...coinRow(600, 300, 3),
    ...coinRow(760, 320, 3),
    ...coinRow(950, 300, 3),
    ...coinRow(1150, 560, 4),
    ...coinRow(1350, 560, 4),
    ...coinArc(1850, 300, 5),
    ...coinRow(2100, 560, 4),
    ...coinRow(2400, 300, 4),
    ...coinArc(2550, 560, 5),
  ],
  icicles: [],
  checkpoints: [
    { x: 920, y: FLOOR_Y },
    { x: 1350, y: FLOOR_Y },
  ],
  boss: { id: 'kittyRaider', x: 2500, y: FLOOR_Y },
  // Well before boss.x - 900 (1600), so the arena blocks refill and the boss
  // hasn't woken by the time it's crossed.
  tunnels: [{ x: 1000, w: 100 }],
};

// ---------------------------------------------------------------------------
// Level 11 — a short approach, a tiny tunnel, then Boo Boo
// Bot Head.
// ---------------------------------------------------------------------------
const LEVEL_11: LevelDef = {
  id: 11,
  name: "Boo Boo Bot's Base",
  theme: 'ice',
  worldWidth: 3100,
  playerStart: { x: 120, y: FLOOR_Y },
  startingPowerUp: 'fireball',
  platforms: [
    ground(0, 3100),
    plat(420, 480, 180, 'ice'),
    plat(850, 460, 180, 'ice'),
    plat(1350, 460, 200),
    // Arena furniture: ledges to dodge onto, like levels 3 and 5.
    plat(1900, 460, 200),
    plat(2500, 460, 200),
    plat(2200, 320, 200),
  ],
  enemies: [
    { kind: 'kitty', x: 700, y: FLOOR_Y, left: 550, right: 900 },
    { kind: 'fireFoe', x: 1300, y: FLOOR_Y, left: 1250, right: 1400 },
  ],
  blocks: [
    { x: 480, y: 360, contains: 'heart' },
    { x: 900, y: 260, contains: 'fireball' },
    // Boss-arena blocks refill (see buildTerrain), so the fight can't run dry.
    { x: 1980, y: 340, contains: 'fireball' },
    { x: 2580, y: 340, contains: 'fireball' },
    { x: 2280, y: 200, contains: 'star' },
    { x: 2180, y: 200, contains: 'heart' },
    { x: 2380, y: 200, contains: 'oneup' },
    { x: 2480, y: 200, contains: 'mushroom' },
  ],
  coins: [
    ...coinRow(300, 560, 4),
    ...coinRow(460, 420, 3),
    ...coinRow(600, 300, 3),
    ...coinRow(760, 320, 3),
    ...coinRow(1150, 300, 3),
    ...coinRow(1350, 560, 4),
    ...coinRow(1550, 560, 4),
    ...coinArc(1950, 300, 5),
    ...coinRow(2200, 560, 4),
    ...coinRow(2500, 300, 4),
    ...coinArc(2650, 560, 5),
  ],
  // Clear of every platform, well above head height.
  icicles: [
    { x: 500, y: 280, radius: 80, speed: 1.6, arms: 2 },
    { x: 1450, y: 300, radius: 90, speed: -1.5, arms: 3 },
  ],
  checkpoints: [
    { x: 1020, y: FLOOR_Y },
    { x: 1550, y: FLOOR_Y },
  ],
  boss: { id: 'shellcrackerDad', x: 2600, y: FLOOR_Y },
  // Well before boss.x - 900 (1700), so the arena blocks refill and the boss
  // hasn't woken by the time it's crossed.
  tunnels: [{ x: 1100, w: 100 }],
};

// Levels 12-16: layouts and all positions are placeholders, not Henry's numbers.
const LEVEL_12: LevelDef = { // placeholder: not Henry's number
  id: 12, name: 'Primrose Gardens', theme: 'grass', worldWidth: 5400, // placeholder: not Henry's number
  playerStart: { x: 120, y: FLOOR_Y }, startingPowerUp: 'fireball', // placeholder: not Henry's number
  platforms: [ground(0, 1300), ground(1460, 1200), ground(2820, 1200), ground(4180, 1220), // placeholder: not Henry's number
    plat(480, 500, 190), plat(840, 400, 180), plat(1200, 480, 180), plat(1730, 500, 200), plat(2100, 400, 200), plat(2470, 490, 160), // placeholder: not Henry's number
    plat(2990, 500, 180), plat(3330, 390, 200), plat(3720, 480, 180), plat(4380, 480, 200), plat(4790, 390, 200)], // placeholder: not Henry's number
  enemies: [
    { kind: 'waterGuy', x: 700, y: FLOOR_Y, left: 570, right: 1000 }, // placeholder: not Henry's number
    { kind: 'mushroom', x: 1200, y: FLOOR_Y }, // placeholder: not Henry's number
    { kind: 'poisonFlower', x: 1910, y: FLOOR_Y }, // placeholder: not Henry's number
    { kind: 'kitty', x: 2400, y: FLOOR_Y }, // placeholder: not Henry's number
    { kind: 'waterGuy', x: 3200, y: FLOOR_Y, left: 3020, right: 3500 }, // placeholder: not Henry's number
    { kind: 'poisonFlower', x: 3900, y: FLOOR_Y }, // placeholder: not Henry's number
    { kind: 'butterfly', x: 4650, y: 270 }, // placeholder: not Henry's number
  ],
  blocks: [{ x: 360, y: 390, contains: 'fireball' }, { x: 920, y: 280, contains: 'heart' }, { x: 1800, y: 370, contains: 'fireball' }, { x: 3320, y: 260, contains: 'fireball' }, { x: 4500, y: 350, contains: 'heart' }], // placeholder: not Henry's number
  coins: [...coinArc(260, 560, 5), ...coinRow(850, 340, 4), ...coinArc(1400, 560, 5), ...coinRow(2100, 340, 4), ...coinArc(2760, 560, 5), ...coinRow(3330, 330, 4), ...coinArc(4080, 560, 5), ...coinRow(4790, 330, 4)], // placeholder: not Henry's number
  icicles: [], checkpoints: [{ x: 1250, y: FLOOR_Y }, { x: 2600, y: FLOOR_Y }, { x: 4020, y: FLOOR_Y }], goal: { x: 5340, y: FLOOR_Y }, // placeholder: not Henry's number
};

const LEVEL_13: LevelDef = { // placeholder: not Henry's number
  id: 13, name: 'Puddle Path', theme: 'grass', worldWidth: 5800, // placeholder: not Henry's number
  playerStart: { x: 120, y: FLOOR_Y }, startingPowerUp: 'fireball', // placeholder: not Henry's number
  platforms: [ground(0, 920), ground(1080, 1000), ground(2250, 1050), ground(3460, 980), ground(4600, 1200), // placeholder: not Henry's number
    plat(450, 490, 190), plat(800, 390, 180), plat(1190, 510, 170), plat(1550, 400, 200), plat(1920, 480, 180), // placeholder: not Henry's number
    plat(2370, 500, 180), plat(2770, 390, 200), plat(3190, 480, 180), plat(3590, 500, 190), plat(3950, 390, 200), plat(4330, 490, 180), plat(4790, 480, 190), plat(5150, 380, 200)], // placeholder: not Henry's number
  enemies: [
    { kind: 'waterGuy', x: 600, y: FLOOR_Y }, { kind: 'poisonFlower', x: 1500, y: FLOOR_Y }, // placeholder: not Henry's number
    { kind: 'waterGuy', x: 1930, y: FLOOR_Y }, { kind: 'kitty', x: 2510, y: FLOOR_Y }, // placeholder: not Henry's number
    { kind: 'poisonFlower', x: 3070, y: FLOOR_Y }, { kind: 'waterGuy', x: 3730, y: FLOOR_Y }, // placeholder: not Henry's number
    { kind: 'butterfly', x: 4190, y: 250 }, { kind: 'poisonFlower', x: 4920, y: FLOOR_Y }, // placeholder: not Henry's number
    { kind: 'waterGuy', x: 5380, y: FLOOR_Y }, { kind: 'snappyTurtle', x: 5600, y: FLOOR_Y }, // placeholder: not Henry's number
  ],
  blocks: [{ x: 480, y: 370, contains: 'fireball' }, { x: 1580, y: 280, contains: 'fireball' }, { x: 2760, y: 260, contains: 'heart' }, { x: 3940, y: 270, contains: 'fireball' }, { x: 5160, y: 250, contains: 'fireball' }], // placeholder: not Henry's number
  coins: [...coinArc(280, 560, 5), ...coinRow(800, 330, 4), ...coinArc(1040, 560, 5), ...coinRow(1550, 340, 4), ...coinArc(2170, 560, 5), ...coinRow(2770, 330, 4), ...coinArc(3400, 560, 5), ...coinRow(3950, 330, 4), ...coinArc(4540, 560, 5), ...coinRow(5150, 320, 4)], // placeholder: not Henry's number
  icicles: [], checkpoints: [{ x: 870, y: FLOOR_Y }, { x: 2130, y: FLOOR_Y }, { x: 3300, y: FLOOR_Y }, { x: 4450, y: FLOOR_Y }], goal: { x: 5740, y: FLOOR_Y }, // placeholder: not Henry's number
};

const LEVEL_14: LevelDef = { // placeholder: not Henry's number
  id: 14, name: "The Gardener's Greenhouse", theme: 'grass', worldWidth: 3100, // placeholder: not Henry's number
  playerStart: { x: 120, y: FLOOR_Y }, startingPowerUp: 'fireball', // placeholder: not Henry's number
  platforms: [ground(0, 3100), plat(400, 480, 190), plat(760, 390, 180), plat(1300, 470, 190), // placeholder: not Henry's number
    plat(1900, 550, 180), plat(2220, 420, 180), plat(2710, 550, 180), plat(2820, 420, 180)], // placeholder: not Henry's number
  enemies: [{ kind: 'waterGuy', x: 690, y: FLOOR_Y }, { kind: 'poisonFlower', x: 1250, y: FLOOR_Y }], // placeholder: not Henry's number
  blocks: [{ x: 480, y: 350, contains: 'fireball' }, { x: 1440, y: 340, contains: 'heart' }, { x: 1960, y: 430, contains: 'fireball' }, { x: 2740, y: 430, contains: 'fireball' }, { x: 2250, y: 290, contains: 'heart' }], // placeholder: not Henry's number
  coins: [...coinRow(280, 560, 5), ...coinRow(760, 330, 4), ...coinArc(1450, 560, 5), ...coinRow(1900, 490, 4), ...coinRow(2700, 490, 4)], // placeholder: not Henry's number
  icicles: [], checkpoints: [{ x: 1100, y: FLOOR_Y }, { x: 1630, y: FLOOR_Y }], boss: { id: 'gardenerShellcracker', x: 2500, y: FLOOR_Y }, // placeholder: not Henry's number
};

const LEVEL_15: LevelDef = { // placeholder: not Henry's number
  id: 15, name: 'Stormy Heights', theme: 'storm', worldWidth: 6200, // placeholder: not Henry's number
  playerStart: { x: 120, y: FLOOR_Y }, startingPowerUp: 'cloud', // placeholder: not Henry's number
  platforms: [ground(0, 830), ground(1000, 850), ground(2020, 900), ground(3090, 900), ground(4160, 800), ground(5130, 1070), // placeholder: not Henry's number
    plat(380, 490, 180), plat(700, 390, 180), plat(1080, 520, 160), plat(1410, 410, 190), plat(1780, 330, 180), // placeholder: not Henry's number
    plat(2150, 500, 190), plat(2500, 390, 190), plat(2850, 480, 180), plat(3220, 500, 180), plat(3580, 380, 200), plat(3950, 480, 180), // placeholder: not Henry's number
    plat(4290, 510, 180), plat(4640, 390, 200), plat(5020, 500, 180), plat(5370, 390, 200), plat(5750, 480, 180)], // placeholder: not Henry's number
  enemies: [
    { kind: 'waterGuy', x: 560, y: FLOOR_Y }, { kind: 'poisonFlower', x: 1400, y: FLOOR_Y }, { kind: 'butterfly', x: 1760, y: 260 }, // placeholder: not Henry's number
    { kind: 'waterGuy', x: 2220, y: FLOOR_Y }, { kind: 'fireFoe', x: 2680, y: FLOOR_Y }, { kind: 'poisonFlower', x: 2930, y: FLOOR_Y }, // placeholder: not Henry's number
    { kind: 'waterGuy', x: 3440, y: FLOOR_Y }, { kind: 'kitty', x: 3860, y: FLOOR_Y }, { kind: 'poisonFlower', x: 4400, y: FLOOR_Y }, // placeholder: not Henry's number
    { kind: 'butterfly', x: 4800, y: 250 }, { kind: 'waterGuy', x: 5500, y: FLOOR_Y }, { kind: 'poisonFlower', x: 5830, y: FLOOR_Y }, // placeholder: not Henry's number
  ],
  blocks: [{ x: 450, y: 360, contains: 'fireball' }, { x: 1500, y: 280, contains: 'heart' }, { x: 2520, y: 260, contains: 'fireball' }, { x: 3630, y: 250, contains: 'fireball' }, { x: 4670, y: 260, contains: 'heart' }, { x: 5400, y: 260, contains: 'fireball' }], // placeholder: not Henry's number
  coins: [...coinArc(260, 560, 5), ...coinRow(700, 330, 4), ...coinArc(960, 560, 5), ...coinRow(1410, 350, 4), ...coinArc(1960, 560, 5), ...coinRow(2500, 330, 4), ...coinArc(3030, 560, 5), ...coinRow(3580, 320, 4), ...coinArc(4100, 560, 5), ...coinRow(4640, 330, 4), ...coinArc(5080, 560, 5), ...coinRow(5370, 330, 4)], // placeholder: not Henry's number
  icicles: [], checkpoints: [{ x: 780, y: FLOOR_Y }, { x: 1880, y: FLOOR_Y }, { x: 2960, y: FLOOR_Y }, { x: 4010, y: FLOOR_Y }, { x: 4990, y: FLOOR_Y }], goal: { x: 6140, y: FLOOR_Y }, // placeholder: not Henry's number
};

const LEVEL_16: LevelDef = { // placeholder: not Henry's number
  id: 16, name: "Thunder Raider's Sky", theme: 'storm', worldWidth: 3100, // placeholder: not Henry's number
  playerStart: { x: 120, y: FLOOR_Y }, startingPowerUp: 'fireball', // placeholder: not Henry's number
  platforms: [ground(0, 3100), plat(420, 480, 180), plat(760, 390, 180), plat(1350, 480, 190), plat(1770, 520, 190), plat(2100, 420, 200), plat(2470, 520, 190), plat(2760, 420, 180)], // placeholder: not Henry's number
  enemies: [{ kind: 'waterGuy', x: 700, y: FLOOR_Y }, { kind: 'poisonFlower', x: 1270, y: FLOOR_Y }], // placeholder: not Henry's number
  blocks: [{ x: 480, y: 350, contains: 'fireball' }, { x: 1400, y: 350, contains: 'heart' }, { x: 1840, y: 400, contains: 'fireball' }, { x: 2500, y: 400, contains: 'fireball' }, { x: 2800, y: 290, contains: 'heart' }], // placeholder: not Henry's number
  coins: [...coinRow(260, 560, 5), ...coinRow(760, 330, 4), ...coinArc(1480, 560, 5), ...coinRow(1800, 460, 4), ...coinRow(2500, 460, 4)], // placeholder: not Henry's number
  icicles: [], checkpoints: [{ x: 1050, y: FLOOR_Y }, { x: 1580, y: FLOOR_Y }], boss: { id: 'thunderRaider', x: 2500, y: FLOOR_Y }, // placeholder: not Henry's number
};

export const LEVELS: LevelDef[] = [
  LEVEL_1,
  LEVEL_2,
  LEVEL_3,
  LEVEL_4,
  LEVEL_5,
  LEVEL_6,
  LEVEL_7,
  LEVEL_8,
  LEVEL_9,
  LEVEL_10,
  LEVEL_11,
  LEVEL_12,
  LEVEL_13,
  LEVEL_14,
  LEVEL_15,
  LEVEL_16,
];

export function getLevel(id: number): LevelDef {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0];
}
