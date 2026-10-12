import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { ENEMIES, ENEMY_PROJECTILE } from '../../config/enemies';
import type { EnemySpawn } from '../../config/levels';

/**
 * A living flame. Hops along its patrol and spits fireballs straight at you.
 * You cannot stomp it — landing on a fire creature burns. Fireballs kill it.
 */
export class FireFoe extends Enemy {
  private nextHopAt = 0;

  constructor(scene: Phaser.Scene, spawn: EnemySpawn, elite = false) {
    super(scene, spawn, ENEMIES.fireFoe, elite);
    // Flames flicker in size the whole time.
    scene.tweens.add({
      targets: this,
      scaleY: 1.1,
      scaleX: 0.94,
      duration: 380,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  override shiftTimers(ms: number): void {
    super.shiftTimers(ms);
    this.nextHopAt += ms;
  }

  protected behave(time: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.patrol();

    // Little hops, so it reads as alive rather than sliding.
    if (body.blocked.down && time > this.nextHopAt) {
      body.setVelocityY(-320);
      this.nextHopAt = time + 900 + Math.random() * 700;
    }

    if (this.canSeePlayer() && this.ready(time)) {
      this.resetCooldown(time);
      this.dir = this.world.player.x < this.x ? -1 : 1;
      this.setFlipX(this.dir === -1);

      // Tell: it flares white-hot just before spitting.
      this.setTint(0xffe9a8);
      this.scene.time.delayedCall(240, () => {
        if (!this.active) return;
        this.clearTint();
        this.spit();
      });
    }
  }

  protected spit(): void {
    const p = this.world.player;
    const fire = ENEMY_PROJECTILE.fire;
    const angle = Phaser.Math.Angle.Between(this.x, this.y - 30, p.x, p.y - 20);
    this.world.shoot(this.x + this.dir * 20, this.y - 30, {
        bossShot: this.owner !== undefined,
      texture: fire.texture,
      damage: fire.damage,
      vx: Math.cos(angle) * fire.speed,
      vy: Math.sin(angle) * fire.speed,
      lifetimeMs: 2400,
    });
  }
}
