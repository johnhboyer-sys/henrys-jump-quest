import Phaser from 'phaser';
import { BossBase, type TelegraphSpec } from './BossBase';
import { RAIDER_ATTACKS, type BossDef } from '../../config/bosses';

/**
 * The cosmic pillager. Ordinary attacks bounce off its star-plate armour —
 * only power-ups hurt it, which is the puzzle of the fight.
 *
 * Two of its three attacks kill outright, so both get a long, loud wind-up and
 * a clearly marked danger zone. The rule is: if you read the warning, you live.
 */
export class GalacticRaider extends BossBase {
  private order = ['bullets', 'sword', 'minions'];
  private orderIndex = 0;
  private swordArc?: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, def: BossDef, x: number, feetY: number) {
    super(scene, def, x, feetY);
  }

  protected pickAttack(): string {
    const gap = Math.abs(this.world.player.x - this.x);
    // Close range is the sword's business; distance is what bullets are for.
    if (gap < RAIDER_ATTACKS.swordReach) return 'sword';
    const name = this.order[this.orderIndex % this.order.length];
    this.orderIndex += 1;
    return name === 'sword' ? 'bullets' : name;
  }

  protected telegraphFor(name: string): TelegraphSpec {
    if (name === 'sword') return { label: '! STAR SWORD — GET BACK !', tint: 0xc9b6ff };
    if (name === 'minions') return { label: 'SUMMONING...', tint: 0x9ff0c0 };
    return { label: '! GALACTIC VOLLEY — MOVE !', tint: 0xffd0f0 };
  }

  protected launchAttack(name: string, time: number): number {
    void time;
    if (name === 'sword') return this.swordSwipe();
    if (name === 'minions') return this.summon();
    return this.volley();
  }

  /**
   * A fan of bullets that kill on contact. They are slow and widely spaced on
   * purpose — the dodge is to move, not to out-react them.
   */
  private volley(): number {
    const dir = this.flipX ? -1 : 1;
    const count = RAIDER_ATTACKS.bulletCount + (this.enraged ? 2 : 0);
    const player = this.world.player;
    const base = Phaser.Math.Angle.Between(this.x, this.y - 120, player.x, player.y - 20);

    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * RAIDER_ATTACKS.bulletSpreadMs, () => {
        if (!this.active) return;
        const spread = (i - (count - 1) / 2) * 0.16;
        const angle = base + spread;
        this.world.shoot(this.x + dir * 50, this.y - 120, {
          bossShot: true,
          texture: 'proj-galactic',
          // Far beyond any health total: this is an instant kill by design.
          damage: 999,
          vx: Math.cos(angle) * 330,
          vy: Math.sin(angle) * 330,
          lifetimeMs: 2600,
          spin: 300,
        });
      });
    }
    return count * RAIDER_ATTACKS.bulletSpreadMs + 260;
  }

  /**
   * A wide arc in front of the boss. Lethal, but it only covers the ground
   * directly ahead — jumping over it or backing off both work.
   */
  private swordSwipe(): number {
    const dir = this.flipX ? -1 : 1;
    const x = this.x + dir * (RAIDER_ATTACKS.swordReach / 2);
    const y = this.y - 70;

    this.swordArc = this.scene.add.image(x, y, 'sword-arc').setDepth(16);
    this.swordArc.setFlipX(dir === -1);
    this.swordArc.setAlpha(0.9);
    this.scene.tweens.add({
      targets: this.swordArc,
      alpha: 0,
      scale: 1.15,
      duration: RAIDER_ATTACKS.swordMs,
      onComplete: () => {
        this.swordArc?.destroy();
        this.swordArc = undefined;
      },
    });

    // The arc itself is decoration; this stationary hitbox is what bites.
    this.world.shoot(x, y, {
          bossShot: true,
      texture: 'sword-hit',
      damage: 999,
      vx: 0,
      vy: 0,
      lifetimeMs: RAIDER_ATTACKS.swordMs,
    });
    this.scene.cameras.main.shake(200, 0.008);
    return RAIDER_ATTACKS.swordMs + 260;
  }

  /** Calls in galactic versions of the ordinary enemies. */
  private summon(): number {
    const kinds = ['snappyTurtle', 'fireFoe', 'mushroom'] as const;
    const count = RAIDER_ATTACKS.minionCount + (this.enraged ? 1 : 0);

    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 240, () => {
        if (!this.active) return;
        const kind = kinds[(this.orderIndex + i) % kinds.length];
        const side = i % 2 === 0 ? -1 : 1;
        // The owner marks the minions' shots as boss shots, so they still hurt God Tom.
        this.world.spawnMinion(kind, this.x + side * Phaser.Math.Between(180, 340), { owner: this });
      });
    }
    this.floatText('MINIONS!', '#9ff0c0');
    return count * 240 + 300;
  }
}
