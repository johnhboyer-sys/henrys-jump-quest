/**
 * Skins are no longer cosmetic: each carries its own stats, and some carry an
 * attack on the E key. Stats marked "placeholder" below are the orchestrator's
 * numbers, not Henry's — see README.md's Decisions list for the full reasoning.
 */

export type SkinId =
  | 'tom'
  | 'henry'
  | 'james'
  | 'nurse'
  | 'tinyGuy'
  | 'shellcracker'
  | 'galacticRaider';

export type AttackKind = 'purse' | 'hammer' | 'sword' | 'backfire';

export interface SkinAttack {
  kind: AttackKind;
  /**
   * Flat damage per hit against an ordinary enemy. The sword ignores this and
   * computes a quarter of the target's own max HP instead — see
   * `RAIDER_SWORD_FRACTION` below.
   */
  damage: number;
  cooldownMs: number;
  /** Shown in the HUD, e.g. "E = purse". */
  hint: string;
}

export interface SkinDef {
  id: SkinId;
  label: string;
  maxHp: number;
  runSpeed: number;
  jumpVelocity: number;
  bodyW: number;
  bodyH: number;
  /** Size of the baked texture this skin draws into (body-offset math). */
  texW: number;
  texH: number;
  attack?: SkinAttack;
}

/** The Galactic Raider's sword removes this fraction of a target's max HP per hit. */
export const RAIDER_SWORD_FRACTION = 0.25;

export const SKINS: Record<SkinId, SkinDef> = {
  tom: {
    id: 'tom',
    label: 'Tom',
    maxHp: 100,
    runSpeed: 320,
    jumpVelocity: -760,
    bodyW: 42,
    bodyH: 58,
    texW: 48,
    texH: 62,
  },
  henry: {
    id: 'henry',
    label: 'Henry',
    maxHp: 100,
    runSpeed: 320,
    jumpVelocity: -760,
    bodyW: 42,
    bodyH: 58,
    texW: 48,
    texH: 62,
  },
  james: {
    id: 'james',
    label: 'James',
    maxHp: 90,
    // Henry was warned this overshoots and kept it anyway.
    runSpeed: 1000,
    jumpVelocity: -760,
    bodyW: 42,
    bodyH: 58,
    texW: 48,
    texH: 62,
  },
  nurse: {
    id: 'nurse',
    label: 'Nurse',
    maxHp: 100,
    runSpeed: 320,
    jumpVelocity: -760,
    bodyW: 42,
    bodyH: 58,
    texW: 48,
    texH: 62,
    attack: {
      kind: 'purse',
      damage: 20,
      cooldownMs: 400, // placeholder: not Henry's number
      hint: 'E = purse',
    },
  },
  tinyGuy: {
    id: 'tinyGuy',
    label: 'Tiny Guy',
    maxHp: 100, // placeholder: not Henry's number
    runSpeed: 370, // placeholder: not Henry's number
    jumpVelocity: -820, // placeholder: not Henry's number
    bodyW: 26, // placeholder: not Henry's number
    bodyH: 36, // placeholder: not Henry's number
    texW: 32, // placeholder: not Henry's number
    texH: 40, // placeholder: not Henry's number
    attack: {
      kind: 'hammer',
      damage: 30,
      cooldownMs: 450, // placeholder: not Henry's number
      hint: 'E = hammer',
    },
  },
  shellcracker: {
    id: 'shellcracker',
    label: 'Shellcracker',
    maxHp: 100, // placeholder: not Henry's number
    runSpeed: 320, // placeholder: not Henry's number
    jumpVelocity: -760, // placeholder: not Henry's number
    bodyW: 42,
    bodyH: 58,
    texW: 48,
    texH: 62,
    attack: {
      kind: 'backfire',
      damage: 50,
      cooldownMs: 500, // placeholder: not Henry's number
      hint: 'E = backfire',
    },
  },
  galacticRaider: {
    id: 'galacticRaider',
    label: 'Galactic Raider',
    maxHp: 100, // placeholder: not Henry's number
    runSpeed: 320, // placeholder: not Henry's number
    jumpVelocity: -760, // placeholder: not Henry's number
    bodyW: 42,
    bodyH: 58,
    texW: 48,
    texH: 62,
    attack: {
      kind: 'sword',
      // Unused: the sword computes RAIDER_SWORD_FRACTION of the target's own
      // max HP instead of a flat number, so it kills any ordinary enemy (and
      // any galactic minion) in exactly 4 hits regardless of its HP.
      damage: 0,
      cooldownMs: 400, // placeholder: not Henry's number
      hint: 'E = sword',
    },
  },
};

/** Shellcracker's backwards-walk speed while holding Left and Right together. */
export const SHELLCRACKER_BACKWARDS_SPEED = 160; // Henry's number

/**
 * John asked for mid-level skin switching from the pause card, over Henry's
 * objection that it is "cheating". This flag exists so it can be turned off
 * again without ripping the feature back out.
 */
export const SKINS_CONFIG = {
  switchMidLevel: true,
};
