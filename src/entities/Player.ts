import Phaser from 'phaser';
import { PLAYER, PHYSICS, STATUS, CLOUD, FIREBALL, STAR, MUSHROOM } from '../config/game';
import type { PowerUpKind } from '../config/powerups';

export type StatusKind = 'slow' | 'freeze' | 'stuck';

/** Which sprite set the player wears. Purely cosmetic. */
export type SkinId = 'tom' | 'henry';

/** Transformations. 'none' is the ordinary kid. */
export type Form = 'none' | 'star' | 'mushroom';

/**
 * The hero. Owns movement feel, health and the single held power-up.
 * The scene owns the world; the player only ever reports what happened.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  hp: number = PLAYER.maxHp;
  facing: 1 | -1 = 1;

  /** The power-up Down Arrow will use. Null means nothing held. */
  held: PowerUpKind | null = null;
  fireCharges = 0;

  skin: SkinId = 'tom';
  /** Active transformation, if any. Always cleared when a level starts. */
  form: Form = 'none';
  private formUntil = 0;
  private formAura?: Phaser.GameObjects.Image;

  private airJumpsLeft = 0;
  private lastGroundedAt = -Infinity;
  private jumpPressedAt = -Infinity;
  private lastFireAt = -Infinity;
  private invulnUntil = 0;
  private slowUntil = 0;
  private frozenUntil = 0;
  private stuckUntil = 0;
  private jumpCutUsed = true;
  private runFrameTimer = 0;
  private runFrame = 0;

  /** Set by the scene when the player is standing on ice. */
  onIce = false;

  constructor(scene: Phaser.Scene, x: number, feetY: number, skin: SkinId = 'tom') {
    super(scene, x, feetY, `${skin}-idle`);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.skin = skin;
    this.setOrigin(0.5, 1);
    this.setDepth(20);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(PLAYER.width, PLAYER.height);
    body.setOffset((48 - PLAYER.width) / 2, 62 - PLAYER.height);
    body.setMaxVelocityY(PHYSICS.maxFallSpeed);
    body.setCollideWorldBounds(false);
  }

  // -- Queries --------------------------------------------------------------

  get isAlive(): boolean {
    return this.hp > 0 && this.active;
  }

  get isFrozen(): boolean {
    return this.scene.time.now < this.frozenUntil || this.scene.time.now < this.stuckUntil;
  }

  get isSlowed(): boolean {
    return this.scene.time.now < this.slowUntil;
  }

  get isInvulnerable(): boolean {
    return this.scene.time.now < this.invulnUntil;
  }

  get canDoubleJump(): boolean {
    return this.held === 'cloud' || this.form === 'mushroom';
  }

  /** True while a star or the god mushroom is running. */
  get isTransformed(): boolean {
    return this.form !== 'none';
  }

  /** Nothing can hurt the player while a transformation is up. */
  get isInvincible(): boolean {
    return this.form === 'star' || this.form === 'mushroom';
  }

  /** How many air jumps a transformation is worth on top of the cloud. */
  private get bonusAirJumps(): number {
    return this.form === 'mushroom' ? MUSHROOM.airJumps : 0;
  }

  private get airJumpAllowance(): number {
    return (this.held === 'cloud' ? CLOUD.airJumps : 0) + this.bonusAirJumps;
  }

  private get currentRunSpeed(): number {
    return this.form === 'mushroom' ? MUSHROOM.runSpeed : PLAYER.runSpeed;
  }

  private get currentJumpVelocity(): number {
    return this.form === 'mushroom' ? MUSHROOM.jumpVelocity : PLAYER.jumpVelocity;
  }

  // -- Input ----------------------------------------------------------------

  /** Called every frame by the scene with the current input state. */
  handleInput(
    left: boolean,
    right: boolean,
    jumpJustPressed: boolean,
    jumpHeld: boolean,
    now: number,
  ): { didDoubleJump: boolean; didJump: boolean } {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const result = { didDoubleJump: false, didJump: false };

    if (jumpJustPressed) this.jumpPressedAt = now;

    if (body.blocked.down || body.touching.down) {
      this.lastGroundedAt = now;
      this.airJumpsLeft = this.airJumpAllowance;
    }

    // Frozen: no input at all, but gravity still applies.
    if (this.isFrozen) {
      body.setAccelerationX(0);
      body.setVelocityX(body.velocity.x * 0.85);
      this.setTexture(this.frame0('idle'));
      return result;
    }

    const grounded = body.blocked.down || body.touching.down;
    // Spore slow bites on the ground only. Carrying it into the air made wide
    // gaps physically uncrossable while slowed — you would jump, fall short,
    // respawn, and get slowed again. On the ground it still reads as "very
    // slow", which is the point of it.
    const speedCap =
      this.currentRunSpeed * (this.isSlowed && grounded ? STATUS.slowMultiplier : 1);
    const control = grounded ? 1 : PLAYER.airControl;
    // Ice keeps your momentum: much less grip, much less braking.
    const grip = this.onIce && grounded ? 0.25 : 1;

    if (left && !right) {
      this.facing = -1;
      body.setAccelerationX(-PLAYER.accel * control * grip);
    } else if (right && !left) {
      this.facing = 1;
      body.setAccelerationX(PLAYER.accel * control * grip);
    } else {
      body.setAccelerationX(0);
    }
    // Only brake when no direction is held — ice barely brakes at all.
    body.setDragX(left !== right ? 0 : PLAYER.drag * (this.onIce && grounded ? 0.12 : 1));
    body.setMaxVelocity(speedCap, PHYSICS.maxFallSpeed);

    // Jump: coyote time off a ledge, plus a buffered press before landing.
    const wantsJump = now - this.jumpPressedAt <= PLAYER.jumpBufferMs;
    const coyoteOk = now - this.lastGroundedAt <= PLAYER.coyoteTimeMs;

    if (wantsJump) {
      if (grounded || coyoteOk) {
        body.setVelocityY(this.currentJumpVelocity);
        this.jumpPressedAt = -Infinity;
        this.lastGroundedAt = -Infinity;
        this.jumpCutUsed = false;
        result.didJump = true;
      } else if (this.airJumpsLeft > 0) {
        body.setVelocityY(this.form === 'mushroom' ? MUSHROOM.jumpVelocity : PLAYER.doubleJumpVelocity);
        this.airJumpsLeft -= 1;
        this.jumpPressedAt = -Infinity;
        this.jumpCutUsed = false;
        result.didDoubleJump = true;
      }
    }

    // Variable jump height: let go early and you rise less. Applied once per
    // jump — repeating it every frame would cancel the jump almost entirely.
    if (!jumpHeld && !this.jumpCutUsed && body.velocity.y < -220) {
      this.jumpCutUsed = true;
      body.setVelocityY(body.velocity.y * 0.55);
    }

    this.updateFrame(grounded);
    return result;
  }

  /**
   * Down Arrow. Returns what the scene should spawn, if anything.
   * Cloud gives an extra hop; fireball throws one.
   */
  usePowerUp(now: number): 'fire' | 'hop' | null {
    if (this.isFrozen || !this.isAlive) return null;
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.held === 'fireball' && this.fireCharges > 0) {
      if (now - this.lastFireAt < FIREBALL.cooldownMs) return null;
      this.lastFireAt = now;
      this.fireCharges -= 1;
      if (this.fireCharges <= 0) this.held = null;
      return 'fire';
    }

    if (this.held === 'cloud' && this.airJumpsLeft > 0 && !body.blocked.down) {
      body.setVelocityY(PLAYER.doubleJumpVelocity);
      this.airJumpsLeft -= 1;
      return 'hop';
    }

    return null;
  }

  // -- State changes --------------------------------------------------------

  give(kind: PowerUpKind): void {
    if (kind === 'fireball') {
      this.held = 'fireball';
      this.fireCharges = FIREBALL.charges;
    } else if (kind === 'cloud') {
      this.held = 'cloud';
      this.fireCharges = 0;
      // Grant the air jump straight away if picked up mid-air.
      this.airJumpsLeft = Math.max(this.airJumpsLeft, CLOUD.airJumps);
    }
  }

  /**
   * Start a transformation. It replaces any transformation already running
   * rather than stacking, and leaves the held power-up untouched.
   */
  transform(form: Exclude<Form, 'none'>): void {
    this.form = form;
    this.formUntil = this.scene.time.now + (form === 'star' ? STAR.durationMs : MUSHROOM.durationMs);
    this.airJumpsLeft = Math.max(this.airJumpsLeft, this.airJumpAllowance);
    // A transformation clears whatever was slowing or holding you.
    this.slowUntil = 0;
    this.frozenUntil = 0;
    this.stuckUntil = 0;

    this.formAura?.destroy();
    this.formAura = this.scene.add
      .image(this.x, this.y - PLAYER.height / 2, form === 'star' ? 'aura-star' : 'aura-mushroom')
      .setDepth(19)
      .setAlpha(0.75);
    this.scene.tweens.add({
      targets: this.formAura,
      scale: { from: 0.9, to: 1.2 },
      alpha: { from: 0.75, to: 0.35 },
      duration: 420,
      yoyo: true,
      repeat: -1,
    });
  }

  /** Ends any transformation immediately. Called on level start and on death. */
  clearForm(): void {
    this.form = 'none';
    this.formUntil = 0;
    this.formAura?.destroy();
    this.formAura = undefined;
    this.clearTint();
    this.setScale(1);
  }

  /** How much longer the current transformation runs, in ms. */
  get formRemainingMs(): number {
    return Math.max(0, this.formUntil - this.scene.time.now);
  }

  heal(amount: number): void {
    this.hp = Math.min(PLAYER.maxHp, this.hp + amount);
  }

  /** Returns true if the hit actually landed (i.e. not blocked by i-frames). */
  takeDamage(amount: number, fromX?: number): boolean {
    if (this.isInvincible || this.isInvulnerable || !this.isAlive) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnUntil = this.scene.time.now + PLAYER.invulnMs;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const away = fromX === undefined ? -this.facing : Math.sign(this.x - fromX) || 1;
    body.setVelocity(away * 260, -320);

    this.scene.tweens.add({
      targets: this,
      alpha: 0.25,
      duration: 110,
      yoyo: true,
      repeat: 4,
      onComplete: () => this.setAlpha(1),
    });
    return true;
  }

  applyStatus(kind: StatusKind): void {
    if (this.isInvincible) return;
    const now = this.scene.time.now;
    if (kind === 'slow') this.slowUntil = now + STATUS.slowMs;
    if (kind === 'freeze') this.frozenUntil = now + STATUS.freezeMs;
    if (kind === 'stuck') this.stuckUntil = now + STATUS.stickMs;
  }

  bounce(): void {
    (this.body as Phaser.Physics.Arcade.Body).setVelocityY(PLAYER.stompBounce);
  }

  resetForRespawn(x: number, feetY: number): void {
    this.clearForm();
    this.hp = PLAYER.maxHp;
    this.setPosition(x, feetY);
    this.setAlpha(1);
    this.setActive(true);
    this.setVisible(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setAcceleration(0, 0);
    body.enable = true;
    this.slowUntil = 0;
    this.frozenUntil = 0;
    this.stuckUntil = 0;
    this.invulnUntil = this.scene.time.now + PLAYER.respawnInvulnMs;
    this.airJumpsLeft = this.airJumpAllowance;
    this.jumpCutUsed = true;
  }

  // -- Presentation ---------------------------------------------------------

  /** Texture key for a pose in the current skin, or the mushroom form. */
  private frame0(pose: 'idle' | 'run1' | 'run2' | 'jump'): string {
    if (this.form === 'mushroom') return `godshroom-${pose}`;
    return `${this.skin}-${pose}`;
  }

  private updateFrame(grounded: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.setFlipX(this.facing === -1);

    if (!grounded) {
      this.setTexture(this.frame0('jump'));
      return;
    }
    if (Math.abs(body.velocity.x) > 30) {
      this.runFrameTimer += this.scene.game.loop.delta;
      const step = this.isSlowed ? 220 : this.form === 'mushroom' ? 80 : 110;
      if (this.runFrameTimer > step) {
        this.runFrameTimer = 0;
        this.runFrame ^= 1;
      }
      this.setTexture(this.frame0(this.runFrame ? 'run1' : 'run2'));
    } else {
      this.setTexture(this.frame0('idle'));
    }
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (this.form !== 'none') {
      if (time >= this.formUntil) {
        this.clearForm();
      } else {
        // Stars flash through the rainbow; the mushroom just glows.
        if (this.form === 'star') {
          const hue = (time / 60) % 360;
          this.setTint(Phaser.Display.Color.HSVToRGB(hue / 360, 0.7, 1).color);
        }
        this.formAura?.setPosition(this.x, this.y - PLAYER.height / 2);
      }
    }
  }
}
