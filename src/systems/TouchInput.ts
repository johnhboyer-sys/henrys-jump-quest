import type Phaser from 'phaser';

/**
 * Shared touch state. UIScene's on-screen buttons are the only thing that
 * writes to this; GameScene reads it every frame alongside the keyboard, and
 * clears the one-shot flags once it has consumed them. A single module-level
 * object is the simplest way for two independent scenes to talk without an
 * event bus.
 */
export interface TouchState {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
  /** One-shot: true for one frame after a tap, then cleared by GameScene. */
  jumpPressed: boolean;
  downPressed: boolean;
  attackPressed: boolean;
  healPressed: boolean;
}

export const touchInput: TouchState = {
  left: false,
  right: false,
  jumpHeld: false,
  jumpPressed: false,
  downPressed: false,
  attackPressed: false,
  healPressed: false,
};

/**
 * True on an actual touch device, or with `?touch=1` in the URL — the latter
 * is only there so the on-screen buttons can be tested from a desktop browser.
 */
export function touchEnabled(game: Phaser.Game): boolean {
  if (game.device.input.touch) return true;
  try {
    return new URLSearchParams(window.location.search).get('touch') === '1';
  } catch {
    return false;
  }
}
