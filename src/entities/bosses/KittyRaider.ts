import Phaser from 'phaser';
import { BossBase, type TelegraphSpec } from './BossBase';
import { KITTY_RAIDER_ATTACKS, type BossDef } from '../../config/bosses';
import { ENEMY_PROJECTILE } from '../../config/enemies';

/**
 * A big cat in purple raider armour. Furballs and scratch marks are near
 * lethal from full health, so both get a long telegraph. The screech cannot
 * be dodged — it stuns wherever the player is — so John's fairness rule
 * applies: no new attack starts until the stun has ended plus a buffer.
 *
 * Starts the fight by calling three kitties, and every kitty of hers that
 * dies is replaced by three more (subject to the game's 8-alive cap).
 */
export class KittyRaider extends BossBase {
  private order = ['furballs', 'scratch', 'screech'];
  private orderIndex = 0;
  private scratchArc?: Phaser.GameObjects.Image;
  private screechStunUntil = 0;

  private startedKitties = false;
  private lastKnownAliveKitties = 0;

  constructor(scene: Phaser.Scene, def: BossDef, x: number, feetY: number) {
    super(scene, def, x, feetY);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.active || this.isDead || !this.world) return;

    if (!this.startedKitties) {
      this.startedKitties = true;
      this.callKitties(KITTY_RAIDER_ATTACKS.startingKittyCount);
      return;
    }

    // Frame-to-frame drops in her own live-kitty count mean one died; each
    // drop of one calls in a fresh batch. New arrivals only ever look like an
    // increase, so they never get mistaken for a death.
    const alive = this.world.countMinionsFor(this);
    if (alive < this.lastKnownAliveKitties) {
      const deaths = this.lastKnownAliveKitties - alive;
      for (let i = 0; i < deaths; i++) this.callKitties(KITTY_RAIDER_ATTACKS.kittyDeathReplacementCount);
    }
    this.lastKnownAliveKitties = alive;
  }

  private callKitties(count: number): void {
    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 220, () => {
        if (!this.active) return;
        const side = i % 2 === 0 ? -1 : 1;
        this.world.spawnMinion('kitty', this.x + side * Phaser.Math.Between(160, 320), {
          galactic: false,
          owner: this,
        });
      });
    }
  }

  protected pickAttack(): string {
    const name = this.order[this.orderIndex % this.order.length];
    this.orderIndex += 1;
    return name;
  }

  protected telegraphFor(name: string): TelegraphSpec {
    if (name === 'furballs') return { label: '! FURBALLS — MOVE !', tint: 0xffd0f0 };
    if (name === 'scratch') return { label: '! SCRATCH — GET BACK !', tint: 0xc9b6ff };
    return { label: '! SCREECH — BRACE !', tint: 0xff9fd0 };
  }

  protected launchAttack(name: string, time: number): number {
    if (name === 'furballs') return this.furballs();
    if (name === 'scratch') return this.scratch();
    return this.screech(time);
  }

  protected duringAttack(name: string, time: number): void {
    if (name !== 'screech') return;
    if (time < this.screechStunUntil) this.world.player.applyStatus('freeze');
  }

  /** A fan of three furballs, 50 damage each. */
  private furballs(): number {
    const furball = ENEMY_PROJECTILE.furball;
    const dir = this.flipX ? -1 : 1;
    const count = KITTY_RAIDER_ATTACKS.furballCount;
    const player = this.world.player;
    const base = Phaser.Math.Angle.Between(this.x, this.y - 100, player.x, player.y - 20);

    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 150, () => {
        if (!this.active) return;
        const spread = (i - (count - 1) / 2) * 0.22;
        const angle = base + spread;
        this.world.shoot(this.x + dir * 50, this.y - 100, {
          texture: furball.texture,
          damage: furball.damage,
          vx: Math.cos(angle) * furball.speed,
          vy: Math.sin(angle) * furball.speed,
          lifetimeMs: 2600,
          spin: 300,
        });
      });
    }
    return count * 150 + 300;
  }

  /** A wide claw swipe in front, covering the ground — 100 damage. */
  private scratch(): number {
    const dir = this.flipX ? -1 : 1;
    const x = this.x + dir * (KITTY_RAIDER_ATTACKS.scratchReach / 2);
    const y = this.y - 80;

    this.scratchArc?.destroy();
    this.scratchArc = this.scene.add.image(x, y, 'scratch-arc').setDepth(16);
    this.scratchArc.setFlipX(dir === -1);
    this.scratchArc.setAlpha(0.9);
    this.scene.tweens.add({
      targets: this.scratchArc,
      alpha: 0,
      scale: 1.15,
      duration: KITTY_RAIDER_ATTACKS.scratchMs,
      onComplete: () => {
        this.scratchArc?.destroy();
        this.scratchArc = undefined;
      },
    });

    const scratch = ENEMY_PROJECTILE.scratch;
    this.world.shoot(x, y, {
      texture: scratch.texture,
      damage: scratch.damage,
      vx: 0,
      vy: 0,
      lifetimeMs: KITTY_RAIDER_ATTACKS.scratchMs,
    });
    this.scene.cameras.main.shake(200, 0.008);
    return KITTY_RAIDER_ATTACKS.scratchMs + 260;
  }

  /**
   * Stuns the player for 3s, wherever they are — it cannot be dodged. The
   * hold covers the stun plus John's fairness buffer, so nothing else she
   * does can start any sooner than that.
   */
  private screech(time: number): number {
    this.screechStunUntil = time + KITTY_RAIDER_ATTACKS.screechStunMs;
    this.world.player.applyStatus('freeze');
    this.floatText('SCREECH!', '#ff7a4d');
    this.scene.cameras.main.shake(300, 0.01);
    return KITTY_RAIDER_ATTACKS.screechStunMs + KITTY_RAIDER_ATTACKS.screechFairnessBufferMs;
  }
}
