import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { ENEMIES } from '../../config/enemies';
import type { EnemySpawn } from '../../config/levels';

// placeholder: not Henry's numbers
const DASH_SPEED_MULT = 1.6;
const DASH_RANGE = 60;
const PAUSE_MS = 500;

/**
 * Patrols until you come close, then dashes in fast for a scratch, then pauses
 * briefly before going again. Stompable.
 */
export class Kitty extends Enemy {
  private pausedUntil = 0;

  constructor(scene: Phaser.Scene, spawn: EnemySpawn, elite = false) {
    super(scene, spawn, ENEMIES.kitty, elite);
  }

  protected behave(time: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (time < this.pausedUntil) {
      body.setVelocityX(0);
      return;
    }

    if (this.canSeePlayer()) {
      const p = this.world.player;
      this.dir = p.x < this.x ? -1 : 1;
      this.setFlipX(this.dir === -1);
      body.setVelocityX(this.def.speed * DASH_SPEED_MULT * this.dir);

      if (this.horizontalDistance() < DASH_RANGE && this.ready(time)) {
        this.resetCooldown(time, 200);
        this.pausedUntil = time + PAUSE_MS;
      }
      return;
    }

    this.patrol();
  }
}
