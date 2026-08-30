/**
 * Boss definitions.
 *
 * Big HP numbers are for show. What actually decides how long a fight runs is
 * `hitsToKill`: every landed power-up hit removes maxHp/hitsToKill, so a
 * 10,000 HP boss and a 1,000 HP boss both die in a sensible number of hits.
 */

export type BossKind = 'shellcracker' | 'galacticRaider';

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
}

export const SHELLCRACKER: BossDef = {
  id: 'shellcracker',
  kind: 'shellcracker',
  name: 'Shellcracker',
  title: 'The Snapping Tyrant',
  texture: 'boss-shellcracker',
  hp: 1000,
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

export const BOSSES: Record<string, BossDef> = {
  shellcracker: SHELLCRACKER,
  galacticRaider: GALACTIC_RAIDER,
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
