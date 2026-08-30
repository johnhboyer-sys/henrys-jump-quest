import Phaser from 'phaser';
import type { BossDef } from '../../config/bosses';
import { MUSHROOM, STAR } from '../../config/game';
import type { EnemyWorld } from '../enemies';

export type BossMode = 'idle' | 'walk' | 'telegraph' | 'attack' | 'recover' | 'dead';

/** Where a hit on a boss came from. Decides whether it counts at all. */
export type HitSource = 'fire' | 'stomp' | 'mushroom' | 'star';

export interface TelegraphSpec {
  label: string;
  tint: number;
}

/**
 * Shared boss plumbing: health in "hits", telegraphs, enrage, death. A boss
 * subclass supplies its list of attacks and what each one does.
 */
export abstract class BossBase extends Phaser.Physics.Arcade.Sprite {
  readonly def: BossDef;
  hp: number;
  protected mode: BossMode = 'idle';
  protected modeUntil = 0;
  protected nextAttackAt = 0;
  protected current = '';
  protected enraged = false;
  protected starUsed = false;
  protected world!: EnemyWorld;
  private mark?: Phaser.GameObjects.Text;
  private lastImmuneNoteAt = 0;

  constructor(scene: Phaser.Scene, def: BossDef, x: number, feetY: number) {
    super(scene, x, feetY, def.texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.def = def;
    this.hp = def.hp;

    this.setOrigin(0.5, 1);
    this.setDepth(14);
    this.setFlipX(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(def.bodyWidth, def.bodyHeight);
    body.setOffset((this.width - def.bodyWidth) / 2, this.height - def.bodyHeight);
    body.setAllowGravity(true);
    // Never immovable: an immovable body is not separated from the ground and
    // sinks straight through it. Unpushable stops the player shoving it around.
    body.pushable = false;

    this.nextAttackAt = scene.time.now + 1500;
  }

  attach(world: EnemyWorld): this {
    this.world = world;
    return this;
  }

  get maxHp(): number {
    return this.def.hp;
  }

  /** One landed power-up hit removes this much. */
  protected get damageUnit(): number {
    return this.def.hp / this.def.hitsToKill;
  }

  get isDead(): boolean {
    return this.mode === 'dead';
  }

  // -- Damage ---------------------------------------------------------------

  /** Returns true if this hit finished it off. */
  hit(source: HitSource): boolean {
    if (this.mode === 'dead') return false;

    // Stomps and other ordinary attacks never hurt a boss. On a power-up-only
    // boss we say so out loud, because that is a rule the player must learn.
    if (source === 'stomp') {
      if (this.def.powerUpOnly) this.noteImmune();
      return false;
    }

    if (source === 'star') {
      if (this.starUsed) {
        this.applyDamage(this.damageUnit);
      } else {
        // A star cannot end a boss, but it takes a huge bite out of one.
        this.starUsed = true;
        this.applyDamage(Math.max(0, this.hp - this.def.hp * STAR.bossHalveTo));
        this.scene.cameras.main.flash(260, 255, 255, 180);
      }
    } else if (source === 'mushroom') {
      this.applyDamage(this.damageUnit * MUSHROOM.damageScale);
    } else {
      this.applyDamage(this.damageUnit);
    }

    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => this.active && this.clearTint());
    this.scene.cameras.main.shake(90, 0.004);

    if (!this.enraged && this.hp <= this.def.hp * this.def.enrageAt) {
      this.enraged = true;
      this.onEnrage();
    }
    return this.hp <= 0;
  }

  private applyDamage(amount: number): void {
    this.hp = Math.max(0, Math.round(this.hp - amount));
  }

  private noteImmune(): void {
    const now = this.scene.time.now;
    if (now - this.lastImmuneNoteAt < 1200) return;
    this.lastImmuneNoteAt = now;
    this.floatText('POWER-UPS ONLY!', '#9fd8f0');
  }

  protected onEnrage(): void {
    this.setTint(0xffb3a0);
    this.scene.time.delayedCall(400, () => this.active && this.clearTint());
    this.scene.cameras.main.flash(200, 120, 0, 0);
    this.floatText('ENRAGED!', '#ff7a4d');
  }

  protected floatText(text: string, colour: string): void {
    const t = this.scene.add
      .text(this.x, this.y - this.def.bodyHeight - 40, text, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: colour,
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(40);
    this.scene.tweens.add({
      targets: t,
      y: t.y - 40,
      alpha: 0,
      duration: 900,
      onComplete: () => t.destroy(),
    });
  }

  // -- Movement helpers -----------------------------------------------------

  /**
   * Returns the direction the player is in, and flips the sprite.
   *
   * Note the flip is inverted relative to the artwork, so a boss visually
   * turns its back on the player and its attacks leave from behind it. That
   * was a mistake originally; it is funny, the boys want it, and it is now
   * intentional. Leave it alone.
   */
  protected faceTarget(): number {
    const dir = this.world.player.x < this.x ? -1 : 1;
    this.setFlipX(dir === -1);
    return dir;
  }

  protected get attackInterval(): number {
    return this.def.attackIntervalMs * (this.enraged ? 0.6 : 1);
  }

  /** Marches at the player and never backs off. */
  protected advance(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dir = this.faceTarget();
    const gap = Math.abs(this.world.player.x - this.x);
    const speed = this.def.walkSpeed * (this.enraged ? 1.35 : 1);
    // Stop just short of standing on top of the player.
    body.setVelocityX(gap > 130 ? speed * dir : 0);
  }

  // -- State machine --------------------------------------------------------

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.active || !this.world || this.mode === 'dead') return;
    const body = this.body as Phaser.Physics.Arcade.Body;

    switch (this.mode) {
      case 'idle':
      case 'walk':
        this.advance();
        if (time >= this.nextAttackAt) this.beginTelegraph(time);
        break;

      case 'telegraph':
        body.setVelocityX(0);
        if (time >= this.modeUntil) this.fire(time);
        break;

      case 'attack':
        this.duringAttack(this.current, time);
        if (time >= this.modeUntil) this.endAttack(time);
        break;

      case 'recover':
        body.setVelocityX(0);
        if (time >= this.modeUntil) this.endAttack(time);
        break;
    }
  }

  private beginTelegraph(time: number): void {
    this.current = this.pickAttack();
    const spec = this.telegraphFor(this.current);
    this.mode = 'telegraph';
    this.modeUntil = time + this.def.telegraphMs;
    this.faceTarget();

    this.setTint(spec.tint);
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.92,
      scaleY: 1.08,
      duration: this.def.telegraphMs,
      ease: 'Sine.InOut',
    });

    this.mark?.destroy();
    this.mark = this.scene.add
      .text(this.x, this.y - this.def.bodyHeight - 50, spec.label, {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(40);
    this.scene.tweens.add({
      targets: this.mark,
      scale: { from: 0.7, to: 1.15 },
      duration: this.def.telegraphMs,
    });
  }

  private fire(time: number): void {
    this.clearTint();
    this.setScale(1);
    this.mark?.destroy();
    this.mark = undefined;
    const holdMs = this.launchAttack(this.current, time);
    this.mode = 'attack';
    this.modeUntil = time + holdMs;
  }

  private endAttack(time: number): void {
    this.mode = 'walk';
    this.nextAttackAt = time + this.attackInterval;
  }

  // -- Subclass contract ----------------------------------------------------

  /** Which attack comes next. */
  protected abstract pickAttack(): string;
  /** The warning shown during the wind-up. */
  protected abstract telegraphFor(name: string): TelegraphSpec;
  /** Do the attack. Return how long the boss stays committed to it, in ms. */
  protected abstract launchAttack(name: string, time: number): number;
  /** Optional per-frame work while an attack runs. */
  protected duringAttack(_name: string, _time: number): void {}

  // -- Death ----------------------------------------------------------------

  defeat(onDone: () => void): void {
    this.mode = 'dead';
    this.mark?.destroy();
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.enable = false;
    this.setActive(false);

    this.scene.cameras.main.shake(700, 0.012);
    this.scene.tweens.add({
      targets: this,
      angle: { from: -6, to: 6 },
      duration: 90,
      yoyo: true,
      repeat: 6,
    });
    this.scene.tweens.add({
      targets: this,
      y: this.y + 60,
      alpha: 0,
      scaleY: 0.4,
      delay: 1300,
      duration: 700,
      ease: 'Quad.In',
    });

    // Driven by the clock, not by a tween finishing — a dropped animation
    // callback must never leave a won fight hanging.
    this.scene.time.delayedCall(2100, () => {
      this.destroy();
      onDone();
    });
  }
}
