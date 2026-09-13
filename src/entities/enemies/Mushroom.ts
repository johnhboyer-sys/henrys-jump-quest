import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { ENEMIES, ENEMY_PROJECTILE } from '../../config/enemies';
import type { EnemySpawn } from '../../config/levels';

/**
 * Walks a patrol. When it spots you it plants itself, wobbles its cap as a
 * tell, then lobs a spore. A spore hit slows you right down for a couple of
 * seconds and chips 5 HP — annoying, not fatal.
 */
export class Mushroom extends Enemy {
  private plantedUntil = 0;

  constructor(scene: Phaser.Scene, spawn: EnemySpawn, elite = false) {
    super(scene, spawn, ENEMIES.mushroom, elite);
  }

  override shiftTimers(ms: number): void {
    super.shiftTimers(ms);
    this.plantedUntil += ms;
  }

  protected behave(time: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (time < this.plantedUntil) {
      body.setVelocityX(0);
      return;
    }

    if (this.canSeePlayer() && this.ready(time)) {
      this.plantedUntil = time + 420;
      body.setVelocityX(0);
      this.dir = this.world.player.x < this.x ? -1 : 1;
      this.setFlipX(this.dir === -1);
      this.resetCooldown(time);

      // Tell: the cap squashes down before the spore comes out.
      this.scene.tweens.add({
        targets: this,
        scaleY: 0.82,
        scaleX: 1.15,
        duration: 190,
        yoyo: true,
        onComplete: () => this.active && this.throwSpore(),
      });
      return;
    }

    this.patrol();
  }

  private throwSpore(): void {
    const p = this.world.player;
    const spore = ENEMY_PROJECTILE.spore;
    const dx = p.x - this.x;
    // Lob it: fixed horizontal speed, upward kick scaled by distance.
    const vx = Math.sign(dx || 1) * spore.speed;
    const vy = -260 - Math.min(200, Math.abs(dx) * 0.28);

    this.world.shoot(this.x, this.y - this.def.bodyHeight * 0.9, {
      texture: spore.texture,
      damage: spore.damage,
      vx,
      vy,
      gravity: 700,
      lifetimeMs: 3200,
      status: 'slow',
      spin: 180,
    });
  }
}
