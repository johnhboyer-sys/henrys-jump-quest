/**
 * Global tuning knobs. Everything a grown-up (or Henry) might want to tweak
 * lives here rather than being buried in the entity code.
 */

export const VIEW = {
  width: 1280,
  height: 720,
} as const;

export const PHYSICS = {
  gravity: 1800,
  maxFallSpeed: 1200,
} as const;

export const PLAYER = {
  maxHp: 100,
  width: 42,
  height: 58,
  runSpeed: 320,
  airControl: 0.85,
  accel: 2600,
  drag: 2200,
  jumpVelocity: -760,
  doubleJumpVelocity: -700,
  /** Extra ms after walking off a ledge where a jump still counts. */
  coyoteTimeMs: 110,
  /** Pressing jump this far before landing still buffers the jump. */
  jumpBufferMs: 140,
  /** Ignore all damage for this long after being hit. */
  invulnMs: 1100,
  /** Longer grace after respawning, so you never wake up inside an enemy. */
  respawnInvulnMs: 2200,
  /** Bounce given after stomping an enemy. */
  stompBounce: -560,
  respawnDelayMs: 900,
} as const;

export const STATUS = {
  /** Mushroom spores: slow the player down but keep them in control. */
  slowMultiplier: 0.45,
  slowMs: 2600,
  /** Icicles / sticky rain: player cannot move at all. Kept short on purpose. */
  freezeMs: 900,
  stickMs: 700,
} as const;

export const FIREBALL = {
  /** Charges granted by one pickup. */
  charges: 12,
  speed: 620,
  cooldownMs: 320,
  damage: 25,
  gravity: 500,
  bounce: 0.55,
  lifetimeMs: 2400,
} as const;

export const CLOUD = {
  /** Extra mid-air jumps granted by the cloud. Refills on landing. */
  airJumps: 1,
} as const;

/**
 * Temporary transformations. Both wear off on a timer, and both are wiped when
 * a new level starts — a power-up never carries between levels.
 */
export const STAR = {
  durationMs: 9000,
  /** Fraction of a boss's max HP removed the first time a star touches it. */
  bossHalveTo: 0.5,
} as const;

export const MUSHROOM = {
  durationMs: 12000,
  /** Damage multiplier while transformed. */
  damageScale: 3,
  runSpeed: 430,
  jumpVelocity: -900,
  /** Extra mid-air jumps while transformed, on top of anything else held. */
  airJumps: 1,
} as const;

/** Lives, and what running out of them costs. */
export const LIVES = {
  perAttempt: 5,
  /** Lives added by a one-up, and the most you can bank between levels. */
  oneUpValue: 1,
  maxBanked: 9,
} as const;

/**
 * How often the game quietly remembers where you were standing safely, so a
 * death never rewinds you further than the ground you last stood on.
 */
export const SAFE_GROUND_SAMPLE_MS = 350;

export const SCORE = {
  coin: 10,
  oneUp: 300,
  starPickup: 150,
  mushroomPickup: 150,
  enemyStomp: 50,
  enemyBurned: 40,
  levelClear: 500,
  bossClear: 2000,
  hpBonusPerPoint: 5,
} as const;

/** Coins, which Boo Mommy Bag's shop spends. Henry's numbers. */
export const COIN_REWARD = {
  enemyKill: 2,
  boss: 300,
  /** A power-up block has this chance of popping coins as well as its power-up. */
  blockBonusChance: 0.5,
  blockBonus: 4,
} as const;

export const SAVE_KEY = 'henrys-jump-quest-save';
/** Nearly Impossible mode keeps its own save, entirely separate from Normal. */
export const SAVE_KEY_NI = 'henrys-jump-quest-save-nearly-impossible';
/** Which mode was last chosen on the menu. Its own key — not part of a save. */
export const MODE_KEY = 'henrys-jump-quest-mode';

export type GameMode = 'normal' | 'nearlyImpossible';

/** The Kitty suit's scratch (Down Arrow). Same kind of melee rect as the skins' E attacks. */
export const KITTY_SUIT = {
  /** Henry's number: a scratch takes an eighth of the target's max HP. */
  fraction: 1 / 8,
  cooldownMs: 250, // placeholder: not Henry's number
} as const;

/** God Tom: kill-stacking stat gain, and picking up/throwing ordinary enemies. */
export const GOD_TOM = {
  price: 10000, // Henry's number
  /** Henry's number: 9 seconds per stack. */
  stackDurationMs: 9000,
  /** What "the enemy's stats" means: full max HP, and this fraction of its speed. */
  speedFraction: 0.5, // placeholder: not Henry's number
  pickupRangePx: 80, // placeholder: not Henry's number
  throwSpeed: 560, // placeholder: not Henry's number
  throwLifetimeMs: 1500, // placeholder: not Henry's number
} as const;

/** Nearly Impossible mode's level changes. See src/config/hardMode.ts. */
export const NEARLY_IMPOSSIBLE = {
  /** Henry's number: a second copy of every enemy. */
  enemyCopies: 2,
  enemyDensityOffsetPx: 90, // placeholder: not Henry's number
  /** 180 -> 220. Still inside a full-speed jump of ~270px. */
  gapWidenPx: 40, // placeholder: not Henry's number
  /** Henry's number: +1000 HP on every boss. */
  bossHpBonus: 1000,
} as const;

/** The Moo Moo Cow Mom Hole: a weaker boss rematch at the start of every normal level. */
export const MOO_MOO = {
  holeOffsetX: 260, // placeholder: not Henry's number
  holeBossX: 1800, // placeholder: not Henry's number
  /** Henry's number: the hole boss has 1000 HP in Normal mode. */
  normalHoleBossHp: 1000,
  minHitsToKill: 6, // placeholder: not Henry's number
  returnBeforeGoalPx: 200, // placeholder: not Henry's number
} as const;
