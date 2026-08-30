/**
 * Power-ups. The player holds one usable power-up at a time; Down Arrow uses
 * it. Star and Mushroom are transformations — they take effect the moment you
 * touch them, run on a timer, and never carry into the next level.
 */

export type PowerUpKind =
  | 'cloud'
  | 'fireball'
  | 'heart'
  | 'coin'
  | 'star'
  | 'mushroom'
  | 'oneup';

export interface PowerUpDef {
  kind: PowerUpKind;
  texture: string;
  label: string;
  /** Shown in the HUD so the player knows what Down Arrow will do. */
  hint: string;
  /** Transformations fire on pickup instead of filling the held slot. */
  instant: boolean;
}

export const POWERUPS: Record<PowerUpKind, PowerUpDef> = {
  cloud: {
    kind: 'cloud',
    texture: 'pw-cloud',
    label: 'Cloud',
    hint: 'DOWN = cloud hop',
    instant: false,
  },
  fireball: {
    kind: 'fireball',
    texture: 'pw-fireball',
    label: 'Fireball',
    hint: 'DOWN = throw fire',
    instant: false,
  },
  heart: {
    kind: 'heart',
    texture: 'pw-heart',
    label: 'Heart',
    hint: '+30 HP',
    instant: true,
  },
  coin: {
    kind: 'coin',
    texture: 'pw-coin',
    label: 'Coin',
    hint: '',
    instant: true,
  },
  star: {
    kind: 'star',
    texture: 'pw-star',
    label: 'Super Star',
    hint: 'Invincible!',
    instant: true,
  },
  mushroom: {
    kind: 'mushroom',
    texture: 'pw-mushroom',
    label: 'God Mushroom',
    hint: 'Unstoppable!',
    instant: true,
  },
  oneup: {
    kind: 'oneup',
    texture: 'pw-oneup',
    label: '1-UP',
    hint: '+1 life',
    instant: true,
  },
};

export const HEART_HEAL = 30;
