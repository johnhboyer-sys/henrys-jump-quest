/**
 * Enemy stat block. Adding an enemy means adding an entry here, a texture in
 * BootScene and a behaviour class in entities/enemies.
 */

export type EnemyKind =
  | 'mushroom'
  | 'fireFoe'
  | 'snappyTurtle'
  | 'butterfly'
  | 'kitty'
  | 'waterGuy'
  | 'poisonFlower';

export interface EnemyDef {
  kind: EnemyKind;
  texture: string;
  hp: number;
  /** Damage done by simply walking into the enemy. */
  touchDamage: number;
  /** Horizontal patrol speed. 0 for stationary enemies. */
  speed: number;
  /** Can the player kill it by landing on its head? */
  stompable: boolean;
  bodyWidth: number;
  bodyHeight: number;
  /** How close the player must be (px) before the enemy starts attacking. */
  aggroRange: number;
  attackCooldownMs: number;
  /** Enemies with no gravity fly. */
  flies?: boolean;
  scoreValue: number;
}

export const ENEMIES: Record<EnemyKind, EnemyDef> = {
  /** Walks, then lobs a spore that slows the player down. */
  mushroom: {
    kind: 'mushroom',
    texture: 'enemy-mushroom',
    hp: 25,
    touchDamage: 6,
    speed: 60,
    stompable: true,
    bodyWidth: 46,
    bodyHeight: 44,
    aggroRange: 460,
    attackCooldownMs: 2100,
    scoreValue: 50,
  },

  /** A living flame. Spits fireballs, and burns you if you land on it. */
  fireFoe: {
    kind: 'fireFoe',
    texture: 'enemy-firefoe',
    hp: 25,
    touchDamage: 12,
    speed: 90,
    stompable: false,
    bodyWidth: 44,
    bodyHeight: 50,
    aggroRange: 520,
    attackCooldownMs: 1700,
    scoreValue: 70,
  },

  waterGuy: {
    kind: 'waterGuy', texture: 'enemy-waterGuy', hp: 25, touchDamage: 12, // placeholder: not Henry's number (copied touch damage)
    speed: 90, stompable: false, bodyWidth: 44, bodyHeight: 50, // placeholder: not Henry's number
    aggroRange: 520, attackCooldownMs: 1700, scoreValue: 70, // placeholder: not Henry's number
  },
  poisonFlower: {
    kind: 'poisonFlower', texture: 'enemy-poisonFlower', hp: 25, touchDamage: 12, // placeholder: not Henry's number (copied touch damage)
    speed: 0, stompable: false, bodyWidth: 44, bodyHeight: 50, // placeholder: not Henry's number
    aggroRange: 520, attackCooldownMs: 2100, scoreValue: 70, // placeholder: not Henry's number
  },

  /** Slow until you get close, then it lunges and bites for 10. */
  snappyTurtle: {
    kind: 'snappyTurtle',
    texture: 'enemy-turtle',
    hp: 50,
    touchDamage: 10,
    speed: 70,
    stompable: true,
    bodyWidth: 54,
    bodyHeight: 42,
    aggroRange: 240,
    attackCooldownMs: 1400,
    scoreValue: 80,
  },

  /** Sky enemy. Drops sticky rain: tiny damage, but it pins you in place. */
  butterfly: {
    kind: 'butterfly',
    texture: 'enemy-butterfly',
    hp: 25,
    touchDamage: 4,
    speed: 80,
    stompable: false,
    bodyWidth: 70,
    bodyHeight: 48,
    aggroRange: 420,
    attackCooldownMs: 1500,
    flies: true,
    scoreValue: 60,
  },

  /** Patrols, then dashes in close for a scratch. Stompable. */
  kitty: {
    kind: 'kitty',
    texture: 'enemy-kitty',
    hp: 25, // placeholder: not Henry's number
    // Henry's: a scratch takes an eighth of Tom's 100 max HP, rounded up.
    touchDamage: 13, // placeholder: not Henry's number
    speed: 110, // placeholder: not Henry's number
    stompable: true,
    bodyWidth: 40, // placeholder: not Henry's number
    bodyHeight: 34, // placeholder: not Henry's number
    aggroRange: 320, // placeholder: not Henry's number
    attackCooldownMs: 900, // placeholder: not Henry's number
    scoreValue: 60, // placeholder: not Henry's number
  },
};

/** Damage dealt by the things enemies throw at you. */
export const ENEMY_PROJECTILE = {
  spore: { damage: 5, speed: 300, texture: 'proj-spore' },
  fire: { damage: 8, speed: 340, texture: 'proj-fire' },
  water: { damage: 8, speed: 340, texture: 'proj-water' }, // placeholder: not Henry's number (speed)
  poison: { damage: 0, speed: 300, texture: 'proj-poison' }, // placeholder: not Henry's number
  rain: { damage: 1, speed: 260, texture: 'proj-rain' },
  shell: { damage: 15, speed: 420, texture: 'proj-shell' },
  bossFire: { damage: 12, speed: 300, texture: 'proj-bossfire' },
  // Shellcracker's Mom and Dad's spanking hands.
  hand: { damage: 12, speed: 380, texture: 'proj-hand' }, // placeholder: not Henry's number
  // Kitty Raider's furballs — Henry's damage, placeholder speed.
  furball: { damage: 50, speed: 380, texture: 'proj-furball' },
  // Kitty Raider's scratch marks: a stationary hitbox, like the sword swipe.
  scratch: { damage: 100, speed: 0, texture: 'scratch-hit' },
  // Boo Boo Bot Head's laser eyes.
  laser: { damage: 20, speed: 700, texture: 'proj-laser' }, // placeholder: not Henry's number
} as const;

export type EnemyProjectileKind = keyof typeof ENEMY_PROJECTILE;
