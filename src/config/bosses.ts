/**
 * Boss definitions.
 *
 * Big HP numbers are for show. What actually decides how long a fight runs is
 * `hitsToKill`: every landed power-up hit removes maxHp/hitsToKill, so a
 * 10,000 HP boss and a 1,000 HP boss both die in a sensible number of hits.
 */

export type BossKind =
  | 'shellcracker'
  | 'galacticRaider'
  | 'shellcrackerMom'
  | 'kittyRaider'
  | 'shellcrackerDad';

export interface BossDef {
  id: string;
  kind: BossKind;
  name: string;
  title: string;
  texture: string;
  hp: number;
  /** Hits from an ordinary power-up attack needed to finish it. */
  hitsToKill: number;
  bodyWidth: number;
  bodyHeight: number;
  touchDamage: number;
  attackIntervalMs: number;
  /** Wind-up before an attack lands. Long enough to read and dodge. */
  telegraphMs: number;
  walkSpeed: number;
  /** Only power-up attacks can hurt it; stomps and everything else bounce off. */
  powerUpOnly: boolean;
  /** HP fraction below which it gets faster and angrier. */
  enrageAt: number;
  /** On death, every minion this boss spawned is cleared out with it. */
  clearMinionsOnDeath?: boolean;
}

export const SHELLCRACKER: BossDef = {
  id: 'shellcracker',
  kind: 'shellcracker',
  name: 'Shellcracker',
  title: 'The Snapping Tyrant',
  texture: 'boss-shellcracker',
  hp: 1010, // Henry's number
  hitsToKill: 16,
  bodyWidth: 160,
  bodyHeight: 130,
  touchDamage: 15,
  attackIntervalMs: 2000,
  telegraphMs: 850,
  walkSpeed: 105,
  powerUpOnly: false,
  enrageAt: 0.5,
};

export const GALACTIC_RAIDER: BossDef = {
  id: 'galacticRaider',
  kind: 'galacticRaider',
  name: 'Galactic Raider',
  title: 'Pillager of Stars',
  texture: 'boss-raider',
  hp: 10000,
  hitsToKill: 26,
  bodyWidth: 150,
  bodyHeight: 190,
  touchDamage: 20,
  attackIntervalMs: 2300,
  // Its attacks kill outright, so the warning is deliberately generous.
  telegraphMs: 1150,
  walkSpeed: 120,
  powerUpOnly: true,
  enrageAt: 0.45,
};

/** Shellcracker's Mom, "The Big-Haired Menace". Keeps three minions alive. */
export const SHELLCRACKER_MOM: BossDef = {
  id: 'shellcrackerMom',
  kind: 'shellcrackerMom',
  name: "Shellcracker's Mom",
  title: 'The Big-Haired Menace', // placeholder: not Henry's number
  texture: 'boss-shellcrackerMom',
  hp: 2000, // Henry's number
  hitsToKill: 18, // placeholder: not Henry's number
  bodyWidth: 170, // placeholder: not Henry's number
  bodyHeight: 150, // placeholder: not Henry's number
  touchDamage: 15, // placeholder: not Henry's number
  attackIntervalMs: 2100, // placeholder: not Henry's number
  telegraphMs: 900, // placeholder: not Henry's number
  walkSpeed: 100, // placeholder: not Henry's number
  powerUpOnly: false,
  enrageAt: 0.5, // placeholder: not Henry's number
  clearMinionsOnDeath: true,
};

/** Kitty Raider, "Queen of Scratches". Starts with three kitties and refills them. */
export const KITTY_RAIDER: BossDef = {
  id: 'kittyRaider',
  kind: 'kittyRaider',
  name: 'Kitty Raider',
  title: 'Queen of Scratches', // placeholder: not Henry's number
  texture: 'boss-kittyRaider',
  hp: 2000, // Henry's number
  hitsToKill: 20, // placeholder: not Henry's number
  bodyWidth: 150, // placeholder: not Henry's number
  bodyHeight: 170, // placeholder: not Henry's number
  touchDamage: 20, // placeholder: not Henry's number
  attackIntervalMs: 2300, // placeholder: not Henry's number
  // Two of its attacks are near-lethal, hence the generous telegraph.
  telegraphMs: 1150, // placeholder: not Henry's number
  walkSpeed: 120, // placeholder: not Henry's number
  powerUpOnly: false,
  enrageAt: 0.5, // placeholder: not Henry's number
  clearMinionsOnDeath: true,
};

/** Shellcracker's Dad, "Boo Boo Bot Head". Puts on glasses, then a computer. */
export const SHELLCRACKER_DAD: BossDef = {
  id: 'shellcrackerDad',
  kind: 'shellcrackerDad',
  name: 'Boo Boo Bot Head',
  title: "Shellcracker's Dad", // placeholder: not Henry's number
  texture: 'boss-shellcrackerDad',
  hp: 2500, // Henry's number
  hitsToKill: 22, // placeholder: not Henry's number
  bodyWidth: 170, // placeholder: not Henry's number
  bodyHeight: 150, // placeholder: not Henry's number
  touchDamage: 18, // placeholder: not Henry's number
  attackIntervalMs: 2200, // placeholder: not Henry's number
  telegraphMs: 950, // placeholder: not Henry's number
  walkSpeed: 105, // placeholder: not Henry's number
  powerUpOnly: false,
  enrageAt: 0.5, // placeholder: not Henry's number
  clearMinionsOnDeath: true,
};

export const BOSSES: Record<string, BossDef> = {
  shellcracker: SHELLCRACKER,
  galacticRaider: GALACTIC_RAIDER,
  shellcrackerMom: SHELLCRACKER_MOM,
  kittyRaider: KITTY_RAIDER,
  shellcrackerDad: SHELLCRACKER_DAD,
};

/** Shellcracker's specifics. */
export const SHELLCRACKER_ATTACKS = {
  shellCount: 3,
  breathMs: 1400,
} as const;

/** The Raider's specifics. */
export const RAIDER_ATTACKS = {
  /** Bullets and the sword both kill outright — hence the long telegraphs. */
  bulletCount: 5,
  bulletSpreadMs: 130,
  swordReach: 260,
  swordMs: 420,
  minionCount: 2,
  /** It cannot spawn more than this many minions at once. */
  minionCap: 4,
} as const;

/** Shellcracker's Mom's specifics. */
export const MOM_ATTACKS = {
  handWhipReach: 150, // placeholder: not Henry's number
  handWhipMs: 260, // placeholder: not Henry's number
  handWhipDamage: 15, // placeholder: not Henry's number
  spankCount: 3, // Henry's number
  // The Green Hills enemies, plus the kitty — Henry's pick.
  minionKinds: ['mushroom', 'snappyTurtle', 'kitty'] as const,
  minionKeepAlive: 3, // Henry's number
  minionRespawnMs: 2500, // placeholder: not Henry's number
} as const;

/** Kitty Raider's specifics. */
export const KITTY_RAIDER_ATTACKS = {
  furballCount: 3, // Henry's number
  scratchReach: 260, // placeholder: not Henry's number
  scratchMs: 420, // placeholder: not Henry's number
  screechStunMs: 3000, // Henry's number
  // John's fairness rule: no new attack may start until the stun has ended
  // plus this much.
  screechFairnessBufferMs: 600, // placeholder: not Henry's number
  startingKittyCount: 3, // Henry's number
  kittyDeathReplacementCount: 3, // Henry's number
} as const;

/** Boo Boo Bot Head's specifics. */
export const DAD_ATTACKS = {
  laserBoltCount: 3, // placeholder: not Henry's number
  laserBoltSpreadMs: 90, // placeholder: not Henry's number
  spankReach: 150, // placeholder: not Henry's number
  spankMs: 260, // placeholder: not Henry's number
  spankDamage: 15, // placeholder: not Henry's number
  computeSpawnCount: 2, // Henry's number
  computeMinionKinds: ['kitty', 'mushroom', 'snappyTurtle'] as const, // Henry's
  computeMinionCap: 4, // placeholder: not Henry's number
} as const;
