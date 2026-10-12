import Phaser from 'phaser';
import { BossBase, type TelegraphSpec } from './BossBase';
import { MOM_ATTACKS, SHELLCRACKER_ATTACKS, type BossDef } from '../../config/bosses';
import { ENEMY_PROJECTILE } from '../../config/enemies';

/**
 * Shellcracker's Mom. Same turtle body, big blonde hair, three attacks in
 * rotation (hand whip, spanking hands, backside fire), and she keeps three
 * minions alive — mushrooms, snappy turtles and kitties, Henry's Green Hills
 * cast plus the newcomer — spawning replacements whenever she is short.
 */
export class ShellcrackerMom extends BossBase {
  private order = ['handWhip', 'spankHands', 'breath'];
  private orderIndex = 0;
  private breathTickAt = 0;
  private nextMinionCheckAt = 0;

  constructor(scene: Phaser.Scene, def: BossDef, x: number, feetY: number) {
    super(scene, def, x, feetY);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.active || this.isDead || !this.world) return;
    // Frozen while the scene is paused — see BossBase.shiftTimers.
    if (this.scene.time.paused) return;

    if (time >= this.nextMinionCheckAt) {
      this.nextMinionCheckAt = time + MOM_ATTACKS.minionRespawnMs;
      if (this.world.countMinionsFor(this) < MOM_ATTACKS.minionKeepAlive) this.callOneMinion();
    }
  }

  override shiftTimers(ms: number): void {
    super.shiftTimers(ms);
    this.breathTickAt += ms;
    this.nextMinionCheckAt += ms;
  }

  private callOneMinion(): void {
    const kinds = MOM_ATTACKS.minionKinds;
    const kind = kinds[Phaser.Math.Between(0, kinds.length - 1)];
    const side = Math.random() < 0.5 ? -1 : 1;
    this.world.spawnMinion(kind, this.x + side * Phaser.Math.Between(180, 340), {
      galactic: false,
      owner: this,
    });
  }

  protected pickAttack(): string {
    const name = this.order[this.orderIndex % this.order.length];
    this.orderIndex += 1;
    return name;
  }

  protected telegraphFor(name: string): TelegraphSpec {
    if (name === 'handWhip') return { label: 'HAND WHIP!', tint: 0xffc9e0 };
    if (name === 'spankHands') return { label: 'SPANK HANDS!', tint: 0xffd0f0 };
    return { label: 'FIRE!', tint: 0xffc9a0 };
  }

  protected launchAttack(name: string, time: number): number {
    if (name === 'handWhip') return this.handWhip();
    if (name === 'spankHands') return this.spankHands();
    this.breathTickAt = time;
    return SHELLCRACKER_ATTACKS.breathMs * (this.enraged ? 1.3 : 1);
  }

  protected duringAttack(name: string, time: number): void {
    if (name !== 'breath') return;
    if (time < this.breathTickAt) return;
    this.breathTickAt = time + 85;
    this.puffFire();
  }

  /** A short-range sweep right in front of her. */
  private handWhip(): number {
    const dir = this.flipX ? -1 : 1;
    const x = this.x + dir * (MOM_ATTACKS.handWhipReach / 2);
    const y = this.y - 70;

    const arc = this.scene.add.image(x, y, 'hand-whip-arc').setDepth(16);
    arc.setFlipX(dir === -1);
    arc.setAlpha(0.9);
    this.scene.tweens.add({
      targets: arc,
      alpha: 0,
      scale: 1.1,
      duration: MOM_ATTACKS.handWhipMs,
      onComplete: () => arc.destroy(),
    });

    this.world.shoot(x, y, {
          bossShot: true,
      texture: 'hand-whip-hit',
      damage: MOM_ATTACKS.handWhipDamage,
      vx: 0,
      vy: 0,
      lifetimeMs: MOM_ATTACKS.handWhipMs,
    });
    this.scene.cameras.main.shake(140, 0.005);
    return MOM_ATTACKS.handWhipMs + 200;
  }

  /** Three flying hands in an arc. */
  private spankHands(): number {
    const hand = ENEMY_PROJECTILE.hand;
    const dir = this.flipX ? -1 : 1;
    const count = MOM_ATTACKS.spankCount;

    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 160, () => {
        if (!this.active) return;
        const spread = 0.75 + i * 0.18;
        this.world.shoot(this.x + dir * 60, this.y - this.def.bodyHeight, {
          bossShot: true,
          texture: hand.texture,
          damage: hand.damage,
          vx: dir * hand.speed * spread,
          vy: -420,
          gravity: 900,
          bounce: 0.4,
          lifetimeMs: 4000,
          spin: dir * 240,
        });
      });
    }
    return count * 160 + 400;
  }

  /** Backside fire, exactly like Shellcracker's — see BossBase.faceTarget. */
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
