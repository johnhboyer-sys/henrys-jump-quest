import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { ENEMIES } from '../../config/enemies';
import type { EnemySpawn } from '../../config/levels';

/**
 * Plods along until you come close, then charges and snaps. The bite is the
 * touch damage — 10 HP — so the lunge is the whole attack. Stompable.
 */
export class SnappyTurtle extends Enemy {
  private lungeUntil = 0;

  constructor(scene: Phaser.Scene, spawn: EnemySpawn, elite = false) {
    super(scene, spawn, ENEMIES.snappyTurtle, elite);
  }

  override shiftTimers(ms: number): void {
    super.shiftTimers(ms);
    this.lungeUntil += ms;
  }

  protected behave(time: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const p = this.world.player;

    if (time < this.lungeUntil) {
      // Mid-lunge: committed, keep going.
      body.setVelocityX(this.def.speed * 2.6 * this.dir);
      return;
    }

    if (this.canSeePlayer()) {
      this.dir = p.x < this.x ? -1 : 1;
      this.setFlipX(this.dir === -1);

      if (this.horizontalDistance() < 130 && this.ready(time)) {
        this.resetCooldown(time, 200);
        this.lungeUntil = time + 380;
        // Tell: rears back before the snap.
        this.scene.tweens.add({
          targets: this,
          scaleX: 0.8,
          duration: 130,
          yoyo: true,
        });
        body.setVelocityY(-180);
        return;
      }

      // Stalking speed: faster than the patrol, slower than the lunge.
      body.setVelocityX(this.def.speed * 1.5 * this.dir);
      return;
    }

    this.patrol();
  }
}
