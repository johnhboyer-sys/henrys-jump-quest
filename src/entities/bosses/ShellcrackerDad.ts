import Phaser from 'phaser';
import { BossBase, type TelegraphSpec } from './BossBase';
import { DAD_ATTACKS, SHELLCRACKER_ATTACKS, type BossDef } from '../../config/bosses';
import { ENEMY_PROJECTILE } from '../../config/enemies';

/**
 * Shellcracker's Dad, "Boo Boo Bot Head". Brown hair, very angry eyes. He puts
 * on glasses for his laser-eye attack and gets out a computer to call in
 * reinforcements — both shown as a prop that appears the moment the telegraph
 * starts, so the tell is readable before the attack lands.
 */
export class ShellcrackerDad extends BossBase {
  private order = ['laserEyes', 'spank', 'breath', 'compute'];
  private orderIndex = 0;
  private breathTickAt = 0;
  private glasses?: Phaser.GameObjects.Image;
  private computer?: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, def: BossDef, x: number, feetY: number) {
    super(scene, def, x, feetY);
  }

  protected pickAttack(): string {
    const name = this.order[this.orderIndex % this.order.length];
    this.orderIndex += 1;
    return name;
  }

  protected telegraphFor(name: string): TelegraphSpec {
    // A fresh telegraph always clears out the previous attack's prop.
    this.glasses?.destroy();
    this.glasses = undefined;
    this.computer?.destroy();
    this.computer = undefined;

    if (name === 'laserEyes') {
      this.glasses = this.scene.add
        .image(this.x, this.y - this.def.bodyHeight + 46, 'prop-glasses')
        .setDepth(15);
      return { label: 'GLASSES ON... LASER EYES!', tint: 0xbfe9ff };
    }
    if (name === 'compute') {
      this.computer = this.scene.add.image(this.x, this.y - 40, 'prop-computer').setDepth(15);
      return { label: 'TYPING...', tint: 0x9ff0c0 };
    }
    if (name === 'spank') return { label: 'SPANKING!', tint: 0xffc9e0 };
    return { label: 'FIRE!', tint: 0xffc9a0 };
  }

  protected launchAttack(name: string, time: number): number {
    if (name === 'laserEyes') return this.laserEyes();
    if (name === 'spank') return this.spank();
    if (name === 'compute') return this.compute();
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

  /** A straight, fast line of bolts toward the player. */
  private laserEyes(): number {
    const laser = ENEMY_PROJECTILE.laser;
    const dir = this.flipX ? -1 : 1;
    const player = this.world.player;
    const angle = Phaser.Math.Angle.Between(this.x, this.y - 90, player.x, player.y - 20);
    const count = DAD_ATTACKS.laserBoltCount;

    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * DAD_ATTACKS.laserBoltSpreadMs, () => {
        if (!this.active) return;
        this.world.shoot(this.x + dir * 60, this.y - 90, {
          texture: laser.texture,
          damage: laser.damage,
          vx: Math.cos(angle) * laser.speed,
          vy: Math.sin(angle) * laser.speed,
          lifetimeMs: 1200,
        });
      });
    }
    return count * DAD_ATTACKS.laserBoltSpreadMs + 300;
  }

  /** A short-range hit right in front of him. */
  private spank(): number {
    const dir = this.flipX ? -1 : 1;
    const x = this.x + dir * (DAD_ATTACKS.spankReach / 2);
    const y = this.y - 70;

    const arc = this.scene.add.image(x, y, 'hand-whip-arc').setDepth(16);
    arc.setFlipX(dir === -1);
    arc.setAlpha(0.9);
    this.scene.tweens.add({
      targets: arc,
      alpha: 0,
      scale: 1.1,
      duration: DAD_ATTACKS.spankMs,
      onComplete: () => arc.destroy(),
    });

    this.world.shoot(x, y, {
      texture: 'hand-whip-hit',
      damage: DAD_ATTACKS.spankDamage,
      vx: 0,
      vy: 0,
      lifetimeMs: DAD_ATTACKS.spankMs,
    });
    this.scene.cameras.main.shake(140, 0.005);
    return DAD_ATTACKS.spankMs + 200;
  }

  /** Backside fire, exactly like Shellcracker's — see BossBase.faceTarget. */
  private puffFire(): void {
    const fire = ENEMY_PROJECTILE.bossFire;
    const dir = this.flipX ? -1 : 1;
    this.world.shoot(this.x + dir * 78, this.y - 74, {
      texture: fire.texture,
      damage: fire.damage,
      vx: dir * fire.speed * Phaser.Math.FloatBetween(0.9, 1.25),
      vy: Phaser.Math.FloatBetween(-40, 40),
      lifetimeMs: 1500,
      scale: Phaser.Math.FloatBetween(0.7, 1.1),
    });
  }

  /** Spawns up to two of his ordinary minions, never past his own cap. */
  private compute(): number {
    const cap = DAD_ATTACKS.computeMinionCap;
    const already = this.world.countMinionsFor(this);
    const room = Math.max(0, cap - already);
    const count = Math.min(DAD_ATTACKS.computeSpawnCount, room);
    const kinds = DAD_ATTACKS.computeMinionKinds;

    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 220, () => {
        if (!this.active) return;
        const kind = kinds[Phaser.Math.Between(0, kinds.length - 1)];
        const side = i % 2 === 0 ? -1 : 1;
        this.world.spawnMinion(kind, this.x + side * Phaser.Math.Between(160, 320), {
          galactic: false,
          owner: this,
        });
      });
    }
    return count * 220 + 400;
  }
}
