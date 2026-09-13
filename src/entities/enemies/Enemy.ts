import Phaser from 'phaser';
import type { EnemyDef, EnemyKind } from '../../config/enemies';
import type { EnemySpawn } from '../../config/levels';
import type { Player } from '../Player';
import type { ProjectileOptions } from '../Projectile';

/**
 * What an enemy is allowed to ask of the world. Keeps enemies from importing
 * the scene, which would be a circular import.
 */
export interface EnemyWorld {
  shoot(x: number, y: number, opts: ProjectileOptions): void;
  /**
   * Drop a minion into the fight at this x, on the floor. `galactic` defaults
   * to true, so the Galactic Raider's summons are unchanged; a boss that wants
   * an ordinary-strength minion passes `galactic: false`. `owner` tags the
   * minion so a boss can later count or clear its own summons.
   */
  spawnMinion(kind: EnemyKind, x: number, opts?: { galactic?: boolean; owner?: object }): void;
  /** How many live minions were spawned with this owner. */
  countMinionsFor(owner: object): number;
  player: Player;
}

/** How much tougher a boss-summoned galactic minion is than the ordinary one. */
export const ELITE = {
  hpScale: 3,
  /** Flat contact damage: two of these finish a full-health player. */
  touchDamage: 50,
  speedScale: 1.35,
  scale: 1.15,
  tint: 0xb69cff,
} as const;

/**
 * Base for everything that walks or flies and wants to hurt you.
 * Subclasses implement `behave` and nothing else.
 */
export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly def: EnemyDef;
  hp: number;
  dir: 1 | -1 = 1;
  protected leftBound: number;
  protected rightBound: number;
  protected nextAttackAt = 0;
  protected world!: EnemyWorld;

  /** Galactic minions are ordinary enemies wearing the boss's colours. */
  readonly elite: boolean;

  /** Which boss spawned this minion, if any. Lets a boss track its own summons. */
  owner?: object;

  constructor(scene: Phaser.Scene, spawn: EnemySpawn, def: EnemyDef, elite = false) {
    super(scene, spawn.x, spawn.y, def.texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.elite = elite;
    this.def = elite
      ? {
          ...def,
          hp: def.hp * ELITE.hpScale,
          touchDamage: ELITE.touchDamage,
          speed: def.speed * ELITE.speedScale,
        }
      : def;
    def = this.def;
    this.hp = def.hp;
    this.leftBound = spawn.left ?? spawn.x - 120;
    this.rightBound = spawn.right ?? spawn.x + 120;
    this.dir = Math.random() < 0.5 ? -1 : 1;

    this.setOrigin(0.5, 1);
    this.setDepth(12);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(def.bodyWidth, def.bodyHeight);
    body.setOffset((this.width - def.bodyWidth) / 2, this.height - def.bodyHeight);
    body.setAllowGravity(!def.flies);
    if (def.flies) body.setImmovable(false);

    if (elite) {
      this.setTint(ELITE.tint);
      this.setScale(ELITE.scale);
    }

    // Stagger first attacks so a cluster of enemies doesn't fire in lockstep.
    this.nextAttackAt = scene.time.now + Math.random() * def.attackCooldownMs;
  }

  attach(world: EnemyWorld): this {
    this.world = world;
    return this;
  }

  /** Distance to the player, ignoring height. */
  protected horizontalDistance(): number {
    return Math.abs(this.world.player.x - this.x);
  }

  /** Roughly on the same level — stops ground enemies sniping across storeys. */
  protected roughlyLevel(tolerance = 140): boolean {
    return Math.abs(this.world.player.y - this.y) < tolerance;
  }

  protected canSeePlayer(): boolean {
    return (
      this.world.player.isAlive &&
      this.horizontalDistance() < this.def.aggroRange &&
      this.roughlyLevel()
    );
  }

  protected patrol(speed = this.def.speed): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.x <= this.leftBound) this.dir = 1;
    if (this.x >= this.rightBound) this.dir = -1;
    // Walked into a wall? Turn round.
    if (body.blocked.left) this.dir = 1;
    if (body.blocked.right) this.dir = -1;
    body.setVelocityX(speed * this.dir);
    this.setFlipX(this.dir === -1);
  }

  protected ready(time: number): boolean {
    return time >= this.nextAttackAt;
  }

  protected resetCooldown(time: number, jitter = 400): void {
    this.nextAttackAt = time + this.def.attackCooldownMs + Math.random() * jitter;
  }

  /** Returns true if this hit killed it. */
  hit(amount: number): boolean {
    this.hp -= amount;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => {
      if (!this.active) return;
      this.clearTint();
      if (this.elite) this.setTint(ELITE.tint);
    });
    return this.hp <= 0;
  }

  /** Squash-and-vanish death. */
  die(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    this.setActive(false);
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.15,
      scaleX: 1.3,
      alpha: 0,
      duration: 220,
      onComplete: () => this.destroy(),
    });
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.active || !this.world) return;
    this.behave(time);
  }

  protected abstract behave(time: number): void;
}
