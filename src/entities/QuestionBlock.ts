import Phaser from 'phaser';
import type { PowerUpKind } from '../config/powerups';

/**
 * Hit it from below and something comes out. Solid from every side.
 * Blocks in a boss arena can refill themselves so the fight never dead-ends.
 */
export class QuestionBlock extends Phaser.Physics.Arcade.Sprite {
  readonly contains: PowerUpKind;
  private spent = false;
  private bumps = 0;
  private readonly homeY: number;
  private readonly refillMs?: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    contains: PowerUpKind,
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

  /** Returns what popped out, or null if the block was already empty. */
  bump(): PowerUpKind | null {
    if (this.spent) return null;
    this.spent = true;
    this.bumps += 1;
    this.setTexture('block-used');

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

    return this.contains;
  }
}
