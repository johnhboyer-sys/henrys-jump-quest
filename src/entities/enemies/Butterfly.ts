import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { ENEMIES, ENEMY_PROJECTILE } from '../../config/enemies';
import type { EnemySpawn } from '../../config/levels';

/**
 * Sky enemy. Drifts back and forth on a sine wave and drips sticky rain on
 * whatever is underneath. The rain barely scratches you — 1 HP — but it pins
 * you in place for a moment, which is the real threat.
 */
export class Butterfly extends Enemy {
  private baseY: number;
  private phase = Math.random() * Math.PI * 2;

  constructor(scene: Phaser.Scene, spawn: EnemySpawn, elite = false) {
    super(scene, spawn, ENEMIES.butterfly, elite);
    this.baseY = spawn.y;
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    scene.tweens.add({
      targets: this,
      scaleX: 0.7,
      duration: 260,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  protected behave(time: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.x <= this.leftBound) this.dir = 1;
    if (this.x >= this.rightBound) this.dir = -1;
    body.setVelocityX(this.def.speed * this.dir);
    this.setFlipX(this.dir === -1);

    // Bob on a sine wave rather than fly flat.
    this.phase += 0.0016 * this.scene.game.loop.delta;
    body.setVelocityY(Math.cos(this.phase) * 60);
    if (Math.abs(this.y - this.baseY) > 90) {
      body.setVelocityY(this.y > this.baseY ? -60 : 60);
    }

    // Only rains on you when you are actually underneath.
    const p = this.world.player;
    const overhead = Math.abs(p.x - this.x) < 150 && p.y > this.y;
    if (overhead && p.isAlive && this.ready(time)) {
      this.resetCooldown(time);
      this.rain();
    }
  }

  private rain(): void {
    const drop = ENEMY_PROJECTILE.rain;
    for (const offset of [-18, 18]) {
      this.world.shoot(this.x + offset, this.y + 6, {
        bossShot: this.owner !== undefined,
        texture: drop.texture,
        damage: drop.damage,
        vx: 0,
        vy: drop.speed,
        lifetimeMs: 2600,
        status: 'stuck',
      });
    }
  }
}
