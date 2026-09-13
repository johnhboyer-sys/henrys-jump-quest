import { MODE_KEY, type GameMode } from '../config/game';

export type { GameMode };

/** Which mode is active. Its own localStorage key — never part of a save. */
export function getMode(): GameMode {
  try {
    return localStorage.getItem(MODE_KEY) === 'nearlyImpossible' ? 'nearlyImpossible' : 'normal';
  } catch {
    return 'normal';
  }
}

export function setMode(mode: GameMode): void {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    /* Private browsing, quota, whatever — losing the choice beats crashing. */
  }
}
