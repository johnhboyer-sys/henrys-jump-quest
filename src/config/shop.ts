/**
 * Boo Mommy Bag's stock. Prices and durations are Henry's.
 *
 * Fireball and Cloud go into your hands at the start of the next level. Star
 * and Mushroom last whole levels, counted down each time you finish one.
 */

export type ShopItemId = 'fireball' | 'cloud' | 'star' | 'mushroom';

export interface ShopItem {
  id: ShopItemId;
  label: string;
  price: number;
  texture: string;
  blurb: string;
}

export const BOO_STOCK: ShopItem[] = [
  { id: 'fireball', label: 'Fireball', price: 50, texture: 'pw-fireball', blurb: 'start the next level with 12 fireballs' },
  { id: 'cloud', label: 'Cloud', price: 50, texture: 'pw-cloud', blurb: 'start the next level with the cloud' },
  { id: 'star', label: 'Super Star', price: 100, texture: 'pw-star', blurb: 'invincible for 3 whole levels' },
  { id: 'mushroom', label: 'God Mushroom', price: 1000, texture: 'pw-mushroom', blurb: 'God Mushroom for 1 whole level' },
];

/** How many levels a bought transformation lasts. */
export const BOUGHT_FORM_LEVELS = { star: 3, mushroom: 1 } as const;

/** Longer than any level runs. Finishing the level is what ends a bought form. */
export const BOUGHT_FORM_MS = 60 * 60 * 1000;
