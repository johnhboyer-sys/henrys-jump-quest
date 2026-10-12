import Phaser from 'phaser';

export interface ProjectileOptions {
  texture: string;
  damage: number;
  vx: number;
  vy: number;
  /** Arc under gravity, or fly straight. */
  gravity?: number;
  /** Bounce off floors instead of dying on them. 0 = no bounce. */
  bounce?: number;
  lifetimeMs?: number;
  /** Status effect applied to whatever it hits. */
  status?: 'slow' | 'freeze' | 'stuck';
  spin?: number;
  scale?: number;
  /** Boss attacks and shots from boss-owned minions still hurt god skins. */
  bossShot?: boolean;
  /** Hit rules can tell both the element and whether Primrose fired it. */
  element?: 'fire' | 'lightning';
  primroseShot?: boolean;
}

/**
 * One class for everything that gets thrown, on both sides. Pooled through a
 * Phaser group, so `fire()` re-arms a recycled instance.
 */
export class Projectile extends Phaser.Physics.Arcade.Sprite {
  damage = 0;
  status: 'slow' | 'freeze' | 'stuck' | null = null;
  bouncesLeft = 0;
  bossShot = false;
  element: 'fire' | 'lightning' | null = null;
  primroseShot = false;
  private dieAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'proj-fire');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(15);
    this.disable();
  }

  fire(x: number, y: number, opts: ProjectileOptions): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.setTexture(opts.texture);
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);
    this.setScale(opts.scale ?? 1);
    this.setAngle(0);

    body.enable = true;
    body.reset(x, y);
    body.setAllowGravity((opts.gravity ?? 0) > 0);
    body.setGravityY(opts.gravity ?? 0);
    body.setVelocity(opts.vx, opts.vy);
    body.setCircle(Math.max(6, (this.width * (opts.scale ?? 1)) / 2 - 2));
    body.setOffset(0, 0);
    body.setBounce(opts.bounce ?? 0);

    this.damage = opts.damage;
    this.bossShot = opts.bossShot ?? false;
    this.element = opts.element ?? null;
    this.primroseShot = opts.primroseShot ?? false;
    this.status = opts.status ?? null;
    this.bouncesLeft = opts.bounce ? 3 : 0;
    this.dieAt = this.scene.time.now + (opts.lifetimeMs ?? 3000);
    this.setAngularVelocity(opts.spin ?? 0);
  }

  disable(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setAngularVelocity(0);
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.stop();
      body.enable = false;
    }
  }

  /** Small flash, then gone. */
  pop(): void {
    if (!this.active) return;
    const { x, y } = this;
    const scene = this.scene;
    this.disable();
    const flash = scene.add.image(x, y, 'spark').setTint(0xffe9a8).setDepth(16);
    scene.tweens.add({
      targets: flash,
      scale: 3,
      alpha: 0,
      duration: 180,
      onComplete: () => flash.destroy(),
    });
  }

  /** Called by the scene on resume, so a lifetime frozen mid-pause keeps the
   * time it had left rather than expiring the instant the clock unfreezes. */
  shiftTimers(ms: number): void {
    this.dieAt += ms;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.active) return;
    // Frozen while the scene is paused — see shiftTimers.
    if (this.scene.time.paused) return;
    if (time > this.dieAt) {
      this.pop();
      return;
    }
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down && this.bouncesLeft <= 0 && body.bounce.y === 0) {
      this.pop();
    }
  }
}
