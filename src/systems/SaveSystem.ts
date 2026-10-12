import { SAVE_KEY, SAVE_KEY_NI, LIVES } from '../config/game';
import { LEVELS } from '../config/levels';
import { BOUGHT_FORM_LEVELS, type ShopItem } from '../config/shop';
import { SKINS, type SkinId } from '../config/skins';
import { getMode } from './ModeSystem';

/** Normal and Nearly Impossible are fully separate saves — unlocks, scores,
 * coins, skins, everything. Every read/write below goes through this. */
function currentSaveKey(): string {
  return getMode() === 'nearlyImpossible' ? SAVE_KEY_NI : SAVE_KEY;
}

export interface SaveData {
  /** Highest level the player may pick from the menu. */
  unlockedLevel: number;
  /** Highest level actually finished. Never lost, whatever happens. */
  clearedLevel: number;
  bestScores: Record<number, number>;
  totalCoins: number;
  /** One-ups banked from boss arenas, carried between attempts. */
  oneUps: number;
  skin: SkinId;
  /** A Fireball or Cloud bought in the shop, handed over when the next level starts. */
  nextHeld: 'fireball' | 'cloud' | null;
  /** Levels left on a bought Super Star / God Mushroom. Count down on each clear. */
  starLevels: number;
  mushroomLevels: number;
  /** Skins bought forever. */
  ownedSkins: SkinId[];
  /** Skins currently rented, levels left. Deleted from here at 0. */
  skinRentals: Partial<Record<SkinId, number>>;
}

const EMPTY: SaveData = {
  unlockedLevel: 1,
  clearedLevel: 0,
  bestScores: {},
  totalCoins: 0,
  oneUps: 0,
  skin: 'tom',
  nextHeld: null,
  starLevels: 0,
  mushroomLevels: 0,
  ownedSkins: [],
  skinRentals: {},
};

function blank(): SaveData {
  return { ...EMPTY, bestScores: {}, ownedSkins: [], skinRentals: {} };
}

function isSkinId(id: unknown): id is SkinId {
  return typeof id === 'string' && id in SKINS;
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(currentSaveKey());
    if (!raw) return blank();
    const p = JSON.parse(raw) as Partial<SaveData>;
    const cleared = p.clearedLevel ?? 0;
    const ownedSkins = Array.isArray(p.ownedSkins) ? p.ownedSkins.filter(isSkinId) : [];
    const skinRentals: Partial<Record<SkinId, number>> = {};
    if (p.skinRentals && typeof p.skinRentals === 'object') {
      for (const [k, v] of Object.entries(p.skinRentals)) {
        if (isSkinId(k) && typeof v === 'number' && v > 0) skinRentals[k] = v;
      }
    }
    return {
      // Never below "everything you have finished, plus the next one".
      unlockedLevel: Math.max(p.unlockedLevel ?? 1, cleared + 1, 1),
      clearedLevel: cleared,
      bestScores: p.bestScores ?? {},
      totalCoins: p.totalCoins ?? 0,
      oneUps: Math.min(p.oneUps ?? 0, LIVES.maxBanked),
      skin: isSkinId(p.skin) ? p.skin : 'tom',
      nextHeld: p.nextHeld === 'fireball' || p.nextHeld === 'cloud' ? p.nextHeld : null,
      starLevels: Math.max(0, p.starLevels ?? 0),
      mushroomLevels: Math.max(0, p.mushroomLevels ?? 0),
      ownedSkins,
      skinRentals,
    };
  } catch {
    // A corrupt or blocked localStorage must never stop the game starting.
    return blank();
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(currentSaveKey(), JSON.stringify(data));
  } catch {
    /* Private browsing, quota, whatever — losing progress beats crashing. */
  }
}

export function recordLevelClear(levelId: number, score: number, coins: number): SaveData {
  const save = loadSave();
  save.clearedLevel = Math.max(save.clearedLevel, levelId);
  save.unlockedLevel = Math.max(save.unlockedLevel, levelId + 1);
  save.bestScores[levelId] = Math.max(save.bestScores[levelId] ?? 0, score);
  save.totalCoins += coins;
  // Shop buys are used up by finishing a level, never by quitting one.
  save.nextHeld = null;
  save.starLevels = Math.max(0, save.starLevels - 1);
  save.mushroomLevels = Math.max(0, save.mushroomLevels - 1);
  // Every active rental counts down by one, regardless of which skin was
  // actually worn this level — tracking per-skin play-time is more machinery
  // than a kid's shop needs.
  for (const id of Object.keys(save.skinRentals) as SkinId[]) {
    const left = (save.skinRentals[id] ?? 0) - 1;
    if (left <= 0) delete save.skinRentals[id];
    else save.skinRentals[id] = left;
  }
  writeSave(save);
  return save;
}

/** Which boss must be beaten before Big Bob will sell that boss's skin. */
const BOSS_UNLOCK: Partial<Record<SkinId, { level: number; name: string }>> = {
  shellcracker: { level: 3, name: 'Shellcracker' },
  shellcrackerMom: { level: 8, name: "Shellcracker's Mom" }, // level from Henry's boss plan
  shellcrackerDad: { level: 11, name: "Shellcracker's Dad" }, // level from Henry's boss plan
  galacticRaider: { level: 5, name: 'the Galactic Raider' },
};

/** Every skin the player may currently wear. `levelId` unlocks a boss's own skin for free while replaying its level. */
export function availableSkins(save: SaveData, levelId?: number): SkinId[] {
  const list: SkinId[] = ['tom', 'henry'];
  if (save.ownedSkins.includes('james') || (save.skinRentals.james ?? 0) > 0) list.push('james');
  if (save.ownedSkins.includes('nurse') || (save.skinRentals.nurse ?? 0) > 0) list.push('nurse');
  if (save.clearedLevel >= 5) list.push('tinyGuy');
  if (save.ownedSkins.includes('shellcracker') || (levelId === 3 && save.clearedLevel >= 3)) {
    list.push('shellcracker');
  }
  if (save.ownedSkins.includes('shellcrackerMom') || (levelId === 8 && save.clearedLevel >= 8)) list.push('shellcrackerMom');
  if (save.ownedSkins.includes('shellcrackerDad') || (levelId === 11 && save.clearedLevel >= 11)) list.push('shellcrackerDad');
  if (save.ownedSkins.includes('galacticRaider') || (levelId === 5 && save.clearedLevel >= 5)) {
    list.push('galacticRaider');
  }
  // Henry: God Tom is free once you beat the game, so he unlocks by himself
  // then (like Tiny Guy after level 5) instead of waiting in the shop.
  if (save.ownedSkins.includes('godTom') || save.ownedSkins.includes('godHenry') || hasBeatenGame(save)) list.push('godTom', 'godHenry');
  if (save.ownedSkins.includes('primrose') || save.clearedLevel >= 11) list.push('primrose');
  return list;
}

/** The last level's id — beating it is what makes God Tom free. */
function lastLevelId(): number {
  return LEVELS[LEVELS.length - 1].id;
}

/** True once the game itself has been beaten, in the current mode's save. */
export function hasBeatenGame(save: SaveData): boolean {
  return save.clearedLevel >= lastLevelId();
}

/** Why an item cannot be bought right now, or null if it can. */
export function blockedReason(save: SaveData, item: ShopItem): string | null {
  if (item.kind === 'skin') {
    const owned = save.ownedSkins.includes(item.skin) || (item.skin === 'godTom' && save.ownedSkins.includes('godHenry'));
    const rented = (save.skinRentals[item.skin] ?? 0) > 0;
    const req = BOSS_UNLOCK[item.skin];
    if (req && save.clearedLevel < req.level && !owned) return `Beat ${req.name} first!`;
    if (owned) return 'You already own it!';
    if (item.skin === 'primrose' && save.clearedLevel >= 11) return 'Primrose is already free!';
    if (item.skin === 'godTom' && hasBeatenGame(save)) return 'Both god skins are already free!';
    if (item.mode === 'rent' && rented) return `You already have ${SKINS[item.skin].label}!`;
    // God Tom is free once the game has been beaten, whatever it costs.
    if (save.totalCoins < item.price) return 'Not enough coins!';
    return null;
  }

  // A Star and a Mushroom cannot both run, so only one is ever bought at a time.
  if (item.id === 'star' && save.mushroomLevels > 0) return 'Your God Mushroom is still going!';
  if (item.id === 'mushroom' && save.starLevels > 0) return 'Your Super Star is still going!';
  // Nothing is sold twice: a second click would only waste coins.
  if (item.id === 'star' && save.starLevels > 0) return 'You already have the Super Star!';
  if (item.id === 'mushroom' && save.mushroomLevels > 0) return 'You already have the God Mushroom!';
  // One held slot, so a second Fireball or Cloud would push the first one out.
  if ((item.id === 'fireball' || item.id === 'cloud') && save.nextHeld) {
    return `You already have a ${save.nextHeld === 'fireball' ? 'Fireball' : 'Cloud'} waiting!`;
  }
  if (save.totalCoins < item.price) return 'Not enough coins!';
  return null;
}

/** Spend coins on a shop item. Returns the new save, or null if it could not be bought. */
export function buyItem(item: ShopItem): SaveData | null {
  const save = loadSave();
  if (blockedReason(save, item)) return null;
  // God Tom is free once the game has been beaten — nothing to spend.
  save.totalCoins -= item.price;

  if (item.kind === 'skin') {
    if (item.mode === 'own') {
      if (!save.ownedSkins.includes(item.skin)) save.ownedSkins.push(item.skin);
      if (item.skin === 'godTom' && !save.ownedSkins.includes('godHenry')) save.ownedSkins.push('godHenry');
      delete save.skinRentals[item.skin];
    } else {
      save.skinRentals[item.skin] = item.levels ?? 0;
    }
    // Buying a skin puts it on straight away.
    save.skin = item.skin;
  } else if (item.id === 'star') {
    save.starLevels = BOUGHT_FORM_LEVELS.star;
  } else if (item.id === 'mushroom') {
    save.mushroomLevels = BOUGHT_FORM_LEVELS.mushroom;
  } else {
    save.nextHeld = item.id;
  }
  writeSave(save);
  return save;
}

/** Spend coins outside the shop (the Nurse's heal). Returns the new save, or null if short. */
export function spendCoins(amount: number): SaveData | null {
  const save = loadSave();
  if (save.totalCoins < amount) return null;
  save.totalCoins -= amount;
  writeSave(save);
  return save;
}

/**
 * Running out of lives costs you the level you had not finished yet.
 *
 * Henry and Tom asked for levels to re-lock on death. This is the version that
 * stays fair: you can only ever lose the *unearned* unlock — the next level you
 * had been given but never beaten. A level you have actually completed stays
 * open forever, so no amount of bad luck can wall you out of your own progress.
 *
 * Returns the level that was locked, or null if there was nothing to lose.
 */
export function penaliseRunOut(): { save: SaveData; lockedLevel: number | null } {
  const save = loadSave();
  const floor = Math.max(1, save.clearedLevel + 1);
  if (save.unlockedLevel > floor) {
    save.unlockedLevel -= 1;
    writeSave(save);
    return { save, lockedLevel: save.unlockedLevel + 1 };
  }
  writeSave(save);
  return { save, lockedLevel: null };
}

/** Spend a banked one-up to avoid the penalty. Returns true if one was spent. */
export function spendOneUp(): boolean {
  const save = loadSave();
  if (save.oneUps <= 0) return false;
  save.oneUps -= 1;
  writeSave(save);
  return true;
}

export function bankOneUp(): SaveData {
  const save = loadSave();
  save.oneUps = Math.min(LIVES.maxBanked, save.oneUps + LIVES.oneUpValue);
  writeSave(save);
  return save;
}

export function setSkin(skin: SkinId): SaveData {
  const save = loadSave();
  save.skin = skin;
  writeSave(save);
  return save;
}
