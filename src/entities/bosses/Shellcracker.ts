import Phaser from 'phaser';
import { BossBase, type TelegraphSpec } from './BossBase';
import { SHELLCRACKER_ATTACKS, type BossDef } from '../../config/bosses';
import { ENEMY_PROJECTILE } from '../../config/enemies';

/**
 * The giant snapping turtle. Marches forward at you and never retreats.
 *
 * Three attacks in rotation, each covering a different piece of the arena:
 *  - shells arc high and reach the side ledges;
 *  - fire streams along the ground and does not.
 * So the ledges are safe from fire and exposed to shells, and the floor is the
 * other way round.
 *
 * The fire comes out of its backside. That started as a sprite-flip mistake,
 * it made the boys laugh, and it is now deliberate — see faceTarget() in
 * BossBase. Do not "fix" the flip.
 */
export class Shellcracker extends BossBase {
  private order = ['shells', 'breath'];
  private orderIndex = 0;
  private breathTickAt = 0;

  constructor(scene: Phaser.Scene, def: BossDef, x: number, feetY: number) {
    super(scene, def, x, feetY);
  }

  protected pickAttack(): string {
    const name = this.order[this.orderIndex % this.order.length];
    this.orderIndex += 1;
    return name;
  }

  protected telegraphFor(name: string): TelegraphSpec {
    if (name === 'breath') return { label: 'FIRE!', tint: 0xffc9a0 };
    return { label: 'SHELLS!', tint: 0xfff0c0 };
  }

  protected launchAttack(name: string, time: number): number {
    if (name === 'shells') {
      this.throwShells();
      return 450;
    }
    this.breathTickAt = time;
    return SHELLCRACKER_ATTACKS.breathMs * (this.enraged ? 1.3 : 1);
  }

  protected duringAttack(name: string, time: number): void {
    if (name !== 'breath') return;
    if (time < this.breathTickAt) return;
    this.breathTickAt = time + 85;
    this.puffFire();
  }

  override shiftTimers(ms: number): void {
    super.shiftTimers(ms);
    this.breathTickAt += ms;
  }

  private throwShells(): void {
    const shell = ENEMY_PROJECTILE.shell;
    const dir = this.flipX ? -1 : 1;
    const count = SHELLCRACKER_ATTACKS.shellCount + (this.enraged ? 1 : 0);

    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 170, () => {
        if (!this.active) return;
        // Fan the volley so one arc always lands near the ledges.
        const spread = 0.78 + i * 0.16;
        this.world.shoot(this.x + dir * 60, this.y - this.def.bodyHeight, {
          bossShot: true,
          texture: shell.texture,
          damage: shell.damage,
          vx: dir * shell.speed * spread,
          vy: -430,
          gravity: 900,
          bounce: 0.45,
          lifetimeMs: 4200,
          spin: dir * 260,
        });
      });
    }
  }

  /**
   * The fire breath. It leaves from the boss's rear, because the sprite reads
   * back-to-front (see BossBase.faceTarget). Kept on purpose.
   */
  private puffFire(): void {
    const fire = ENEMY_PROJECTILE.bossFire;
    const dir = this.flipX ? -1 : 1;
    this.world.shoot(this.x + dir * 78, this.y - 74, {
          bossShot: true,
      texture: fire.texture,
      damage: fire.damage,
      vx: dir * fire.speed * Phaser.Math.FloatBetween(0.9, 1.25),
      vy: Phaser.Math.FloatBetween(-40, 40),
      lifetimeMs: 1500,
      scale: Phaser.Math.FloatBetween(0.7, 1.1),
    });
  }
}
