import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { ENEMIES, ENEMY_PROJECTILE } from '../../config/enemies';
import type { EnemySpawn } from '../../config/levels';

export class PoisonFlower extends Enemy {
  constructor(scene: Phaser.Scene, spawn: EnemySpawn, elite = false) {
    super(scene, spawn, ENEMIES.poisonFlower, elite);
  }

  protected behave(time: number): void {
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
    if (!this.canSeePlayer() || !this.ready(time)) return;
    this.resetCooldown(time);
    this.setTint(0xb5ff8a);
    this.scene.time.delayedCall(240, () => { // placeholder: not Henry's number
      if (!this.active) return;
      this.clearTint();
      const p = this.world.player;
      const poison = ENEMY_PROJECTILE.poison;
      const angle = Phaser.Math.Angle.Between(this.x, this.y - 35, p.x, p.y - 20); // placeholder: not Henry's number
      this.world.shoot(this.x, this.y - 35, { // placeholder: not Henry's number
        bossShot: this.owner !== undefined, texture: poison.texture, damage: 0,
        vx: Math.cos(angle) * poison.speed, vy: Math.sin(angle) * poison.speed,
        status: 'poison', lifetimeMs: 2600, // placeholder: not Henry's number
      });
    });
  }
}
