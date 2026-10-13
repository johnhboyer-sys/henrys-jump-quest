/**
 * Merchants' stock. Prices and durations are Henry's unless noted.
 *
 * A shop item is either a power-up (as before — Fireball and Cloud go into
 * your hands at the start of the next level; Star and Mushroom last whole
 * levels, counted down each time you finish one) or a skin purchase, which is
 * either a rental (levels left, counted down the same way) or forever.
 */

import type { SkinId } from './skins';

export type ShopItemId = 'fireball' | 'cloud' | 'star' | 'mushroom';

export interface PowerUpShopItem {
  kind: 'powerup';
  id: ShopItemId;
  label: string;
  price: number;
  texture: string;
  blurb: string;
}

export interface SkinShopItem {
  kind: 'skin';
  /** Unique row id — a skin can appear twice (rent and own). */
  id: string;
  skin: SkinId;
  mode: 'rent' | 'own';
  /** Levels the rental lasts. Required when mode is 'rent'. */
  levels?: number;
  label: string;
  price: number;
  texture: string;
  blurb: string;
}

export type ShopItem = PowerUpShopItem | SkinShopItem;

/** Boo Mommy Bag's stall: a stick man with two llamas (Henry kept the name). */
export const BOO_STOCK: ShopItem[] = [
  { kind: 'powerup', id: 'fireball', label: 'Fireball', price: 50, texture: 'pw-fireball', blurb: 'start the next level with 12 fireballs' },
  { kind: 'powerup', id: 'cloud', label: 'Cloud', price: 50, texture: 'pw-cloud', blurb: 'start the next level with the cloud' },
  { kind: 'powerup', id: 'star', label: 'Super Star', price: 100, texture: 'pw-star', blurb: 'invincible for 3 whole levels' },
  { kind: 'powerup', id: 'mushroom', label: 'God Mushroom', price: 1000, texture: 'pw-mushroom', blurb: 'God Mushroom for 1 whole level' },
  { kind: 'skin', id: 'james-rent', skin: 'james', mode: 'rent', levels: 3, label: 'James (rent)', price: 20, texture: 'james-idle', blurb: 'wear James for 3 levels' },
  { kind: 'skin', id: 'james-own', skin: 'james', mode: 'own', label: 'James (forever)', price: 1000, texture: 'james-idle', blurb: 'own James for good' },
  { kind: 'skin', id: 'nurse-rent', skin: 'nurse', mode: 'rent', levels: 20, label: 'Nurse (rent)', price: 100, texture: 'nurse-idle', blurb: 'wear the Nurse for 20 levels' },
  { kind: 'skin', id: 'nurse-own', skin: 'nurse', mode: 'own', label: 'Nurse (forever)', price: 1000, texture: 'nurse-idle', blurb: 'own the Nurse for good' },
  { kind: 'skin', id: 'primrose-own', skin: 'primrose', mode: 'own', label: 'Primrose', price: 750, texture: 'primrose-idle', blurb: 'lightning and fireball shots — free after level 11' }, // Henry's number
  // Listed from the start so it is a visible goal. 1,000 coins, or free once
  // the game itself has been beaten — see SaveSystem.hasBeatenGame.
  { kind: 'skin', id: 'godTom-own', skin: 'godTom', mode: 'own', label: 'God Tom + God Henry', price: 1000, texture: 'godTom-idle', blurb: 'both god skins — free once you beat the game' }, // Henry's number
];

/** Big Bob's stall: boss skins, only once you have beaten the boss. */
export const BOB_STOCK: ShopItem[] = [
  { kind: 'skin', id: 'shellcracker-own', skin: 'shellcracker', mode: 'own', label: 'Shellcracker', price: 100, texture: 'shellcracker-idle', blurb: 'own the Shellcracker skin for good' },
  { kind: 'skin', id: 'shellcrackerMom-own', skin: 'shellcrackerMom', mode: 'own', label: "Shellcracker's Mom", price: 100, texture: 'shellcrackerMom-idle', blurb: 'own her skin after beating her' }, // Henry's number
  { kind: 'skin', id: 'shellcrackerDad-own', skin: 'shellcrackerDad', mode: 'own', label: "Shellcracker's Dad", price: 100, texture: 'shellcrackerDad-idle', blurb: 'own his skin after beating him' }, // Henry's number
  { kind: 'skin', id: 'galacticRaider-own', skin: 'galacticRaider', mode: 'own', label: 'Galactic Raider', price: 100, texture: 'galacticRaider-idle', blurb: 'own the Galactic Raider skin for good' },
];

/** How many levels a bought transformation lasts. */
export const BOUGHT_FORM_LEVELS = { star: 3, mushroom: 1 } as const;

/** Longer than any level runs. Finishing the level is what ends a bought form. */
export const BOUGHT_FORM_MS = 60 * 60 * 1000;
