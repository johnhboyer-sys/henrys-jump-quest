import Phaser from 'phaser';
import { rollRandomPowerUp, type BlockContent, type PowerUpKind } from '../config/powerups';

/**
 * Hit it from below and something comes out. Solid from every side.
 * Blocks in a boss arena can refill themselves so the fight never dead-ends.
 *
 * `contains: 'random'` (Nearly Impossible mode) rolls a fresh power-up every
 * time it pays out, including on a refill — `bump()` always returns a real
 * `PowerUpKind`, never 'random' itself.
 */
export class QuestionBlock extends Phaser.Physics.Arcade.Sprite {
  readonly contains: BlockContent;
  private spent = false;
  private bumps = 0;
  private readonly homeY: number;
  private readonly refillMs?: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    contains: BlockContent,
    refillMs?: number,
  ) {
    super(scene, x, y, 'block-question');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.contains = contains;
    this.homeY = y;
    this.refillMs = refillMs;
    this.setDepth(6);
  }

  get isSpent(): boolean {
    return this.spent;
  }

  /** How many times it has paid out. Refilling blocks go past 1. */
  get bumpCount(): number {
    return this.bumps;
  }

  /** Returns what popped out, or null if the block was already empty. Never
   * returns 'random' — a random block resolves to a real kind on every payout. */
  bump(): PowerUpKind | null {
    if (this.spent) return null;
    this.spent = true;
    this.bumps += 1;
    this.setTexture('block-used');
    const resolved: PowerUpKind = this.contains === 'random' ? rollRandomPowerUp() : this.contains;

    // The classic nudge upwards.
    this.scene.tweens.add({
      targets: this,
      y: this.homeY - 12,
      duration: 90,
      yoyo: true,
      onComplete: () => {
        this.y = this.homeY;
        (this.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      },
    });

    if (this.refillMs !== undefined) {
      this.scene.time.delayedCall(this.refillMs, () => {
        if (!this.active) return;
        this.spent = false;
        this.setTexture('block-question');
        this.scene.tweens.add({ targets: this, scale: { from: 1.25, to: 1 }, duration: 200 });
      });
    }

    return resolved;
  }
}
