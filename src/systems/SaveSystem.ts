import { SAVE_KEY, LIVES } from '../config/game';
import type { SkinId } from '../entities/Player';

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
}

const EMPTY: SaveData = {
  unlockedLevel: 1,
  clearedLevel: 0,
  bestScores: {},
  totalCoins: 0,
  oneUps: 0,
  skin: 'tom',
};

function blank(): SaveData {
  return { ...EMPTY, bestScores: {} };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return blank();
    const p = JSON.parse(raw) as Partial<SaveData>;
    const cleared = p.clearedLevel ?? 0;
    return {
      // Never below "everything you have finished, plus the next one".
      unlockedLevel: Math.max(p.unlockedLevel ?? 1, cleared + 1, 1),
      clearedLevel: cleared,
      bestScores: p.bestScores ?? {},
      totalCoins: p.totalCoins ?? 0,
      oneUps: Math.min(p.oneUps ?? 0, LIVES.maxBanked),
      skin: p.skin === 'henry' ? 'henry' : 'tom',
    };
  } catch {
    // A corrupt or blocked localStorage must never stop the game starting.
    return blank();
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
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
