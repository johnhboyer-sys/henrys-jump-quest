import Phaser from 'phaser';
import { FireFoe } from './FireFoe';
import { ENEMIES, ENEMY_PROJECTILE } from '../../config/enemies';
import type { EnemySpawn } from '../../config/levels';

/** The Fire Foe's hop and tell, with a water shot. */
export class WaterGuy extends FireFoe {
  constructor(scene: Phaser.Scene, spawn: EnemySpawn, elite = false) {
    super(scene, spawn, elite);
    this.setTexture(ENEMIES.waterGuy.texture);
    this.def = elite ? { ...ENEMIES.waterGuy, hp: ENEMIES.waterGuy.hp * 3, touchDamage: 50, speed: ENEMIES.waterGuy.speed * 1.35 } : ENEMIES.waterGuy; // placeholder: not Henry's number (elite copy)
    this.hp = this.def.hp;
  }

  protected override spit(): void {
    const p = this.world.player;
    const water = ENEMY_PROJECTILE.water;
    const angle = Phaser.Math.Angle.Between(this.x, this.y - 30, p.x, p.y - 20); // placeholder: not Henry's number (copied Fire Foe aim)
    this.world.shoot(this.x + this.dir * 20, this.y - 30, { // placeholder: not Henry's number (copied Fire Foe muzzle)
      bossShot: this.owner !== undefined, texture: water.texture, damage: water.damage,
      vx: Math.cos(angle) * water.speed, vy: Math.sin(angle) * water.speed,
      lifetimeMs: 2400, // placeholder: not Henry's number
    });
  }
}
