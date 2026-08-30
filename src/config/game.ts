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

export const SAVE_KEY = 'henrys-jump-quest-save';
