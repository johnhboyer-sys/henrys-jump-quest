import Phaser from 'phaser';
import { PLAYER, PHYSICS, STATUS, CLOUD, FIREBALL, STAR, MUSHROOM, KITTY_SUIT } from '../config/game';
import type { PowerUpKind } from '../config/powerups';
import { BOUGHT_FORM_MS } from '../config/shop';
import { SKINS, SHELLCRACKER_BACKWARDS_SPEED, isGodSkin, type SkinAttack, type SkinDef } from '../config/skins';
import type { SkinId } from '../config/skins';

export type StatusKind = 'slow' | 'freeze' | 'stuck';

/** Which sprite set the player wears. Now carries stats, not just a look. */
export type { SkinId };

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
  /** A Star or Mushroom bought in the shop. It lasts the whole level. */
  boughtForm: Exclude<Form, 'none'> | null = null;
  private formUntil = 0;
  private formTotal = 0;
  private formAura?: Phaser.GameObjects.Image;
  private godAura?: Phaser.GameObjects.Image;

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
  /** Last frame's footing and fall speed, so a hard landing can kick up dust. */
  private wasGrounded = true;
  private lastFallSpeed = 0;
  private lastAttackAt = -Infinity;
  private lastScratchAt = -Infinity;

  /** God Tom: one entry per kill while it is stacked, each expiring on its own. */
  private godTomStacksList: { expiresAt: number; hp: number; speed: number }[] = [];
  private bonusMaxHp = 0;
  private bonusRunSpeed = 0;

  /** Set by the scene when the player is standing on ice. */
  onIce = false;

  constructor(scene: Phaser.Scene, x: number, feetY: number, skin: SkinId = 'tom') {
    super(scene, x, feetY, `${skin}-idle`);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.skin = skin;
    this.hp = this.maxHp;
    this.setOrigin(0.5, 1);
    this.setDepth(20);

    const def = this.skinDef;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(def.bodyW, def.bodyH);
    body.setOffset((def.texW - def.bodyW) / 2, def.texH - def.bodyH);
    body.setMaxVelocityY(PHYSICS.maxFallSpeed);
    body.setCollideWorldBounds(false);
    if (this.hasGodStar) this.setSkin(skin);
  }

  // -- Queries --------------------------------------------------------------

  private get skinDef(): SkinDef {
    return SKINS[this.skin];
  }

  /** The current skin's max HP, plus God Tom's stacked kill bonus, if any. */
  get maxHp(): number {
    return this.skinDef.maxHp + this.bonusMaxHp;
  }

  /** How many God Tom stacks are currently live. */
  get godTomStackCount(): number {
    return this.godTomStacksList.length;
  }

  /** The current skin's E attack, if it has one. */
  get attackDef(): SkinAttack | undefined {
    return this.skinDef.attack;
  }

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

  get hasGodStar(): boolean {
    return isGodSkin(this.skin);
  }

  /** How many air jumps a transformation is worth on top of the cloud. */
  private get bonusAirJumps(): number {
    return this.form === 'mushroom' ? MUSHROOM.airJumps : 0;
  }

  private get airJumpAllowance(): number {
    return (this.held === 'cloud' ? CLOUD.airJumps : 0) + this.bonusAirJumps;
  }

  private get currentRunSpeed(): number {
    return (this.form === 'mushroom' ? MUSHROOM.runSpeed : this.skinDef.runSpeed) + this.bonusRunSpeed;
  }

  private get currentJumpVelocity(): number {
    return this.form === 'mushroom' ? MUSHROOM.jumpVelocity : this.skinDef.jumpVelocity;
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
    const onGround = body.blocked.down || body.touching.down;
    if (onGround && !this.wasGrounded && this.lastFallSpeed > 380) this.kickDust();
    this.wasGrounded = onGround;
    this.lastFallSpeed = body.velocity.y;

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

    // Shellcracker's costume walks backwards when both directions are held —
    // today that combination means no movement for everyone else.
    const shellBackwards = this.skin === 'shellcracker' && left && right;

    if (shellBackwards) {
      body.setAccelerationX(0);
      body.setDragX(0);
      body.setMaxVelocity(SHELLCRACKER_BACKWARDS_SPEED, PHYSICS.maxFallSpeed);
      body.setVelocityX(-this.facing * SHELLCRACKER_BACKWARDS_SPEED);
    } else if (left && !right) {
      this.facing = -1;
      body.setAccelerationX(-PLAYER.accel * control * grip);
    } else if (right && !left) {
      this.facing = 1;
      body.setAccelerationX(PLAYER.accel * control * grip);
    } else {
      body.setAccelerationX(0);
    }
    if (!shellBackwards) {
      // Only brake when no direction is held — ice barely brakes at all.
      body.setDragX(left !== right ? 0 : PLAYER.drag * (this.onIce && grounded ? 0.12 : 1));
      body.setMaxVelocity(speedCap, PHYSICS.maxFallSpeed);
    }

    // Jump: coyote time off a ledge, plus a buffered press before landing.
    const wantsJump = now - this.jumpPressedAt <= PLAYER.jumpBufferMs;
    const coyoteOk = now - this.lastGroundedAt <= PLAYER.coyoteTimeMs;

    if (wantsJump) {
      if (grounded || coyoteOk) {
        if (grounded) this.kickDust();
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

  /** True if the current skin has an E attack, off cooldown, and it can act. */
  canAttack(now: number): boolean {
    if (this.isFrozen || !this.isAlive) return false;
    const atk = this.attackDef;
    if (!atk) return false;
    return now - this.lastAttackAt >= atk.cooldownMs;
  }

  /** Call once an E attack has actually been carried out. */
  recordAttack(now: number): void {
    this.lastAttackAt = now;
  }

  /** True while the Kitty suit is held, off cooldown, and the player can act. */
  canScratch(now: number): boolean {
    if (this.isFrozen || !this.isAlive) return false;
    return this.held === 'kittySuit' && now - this.lastScratchAt >= KITTY_SUIT.cooldownMs;
  }

  /** Call once a scratch has actually landed. */
  recordScratch(now: number): void {
    this.lastScratchAt = now;
  }

  /**
   * God Tom: a kill grants a stack worth the enemy's own max HP (added to both
   * max and current HP) and a fraction of its speed (added to run speed).
   * Stacks, no cap, and each expires on its own clock.
   */
  addGodTomStack(hp: number, speed: number, expiresAt: number): void {
    this.godTomStacksList.push({ expiresAt, hp, speed });
    this.bonusMaxHp += hp;
    this.bonusRunSpeed += speed;
    this.hp += hp;
  }

  private updateGodTomStacks(now: number): void {
    if (this.godTomStacksList.length === 0) return;
    const remaining: typeof this.godTomStacksList = [];
    for (const s of this.godTomStacksList) {
      if (now < s.expiresAt) {
        remaining.push(s);
        continue;
      }
      this.bonusMaxHp -= s.hp;
      this.bonusRunSpeed -= s.speed;
    }
    this.godTomStacksList = remaining;
    this.hp = Math.min(this.hp, this.maxHp);
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
    } else if (kind === 'kittySuit') {
      this.held = 'kittySuit';
      this.fireCharges = 0;
    }
  }

  /**
   * Start a transformation. It replaces any transformation already running
   * rather than stacking, and leaves the held power-up untouched.
   */
  transform(form: Exclude<Form, 'none'>, durationMs?: number): void {
    this.form = form;
    this.formTotal = durationMs ?? (form === 'star' ? STAR.durationMs : MUSHROOM.durationMs);
    this.formUntil = this.scene.time.now + this.formTotal;
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
    this.formTotal = 0;
    this.formAura?.destroy();
    this.formAura = undefined;
    this.clearTint();
    this.setScale(1);
  }

  /** How much longer the current transformation runs, in ms. */
  get formRemainingMs(): number {
    return Math.max(0, this.formUntil - this.scene.time.now);
  }

  /** How long the current transformation was set to run, in ms. */
  get formTotalMs(): number {
    return this.formTotal;
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  /** Returns true if the hit actually landed (i.e. not blocked by i-frames). */
  takeDamage(amount: number, fromX?: number, bossDamage = false): boolean {
    // A real Star or Mushroom blocks everything; a god skin's own star blocks
    // everything except bosses.
    if (this.isInvincible || (this.hasGodStar && !bossDamage) || this.isInvulnerable || !this.isAlive) return false;
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

  /** `ms` overrides the default duration for `kind` — e.g. the Kitty Raider's
   * screech, which stuns for a fixed 3s rather than the icicle default. */
  applyStatus(kind: StatusKind, ms?: number): void {
    if (this.isInvincible) return;
    const now = this.scene.time.now;
    if (kind === 'slow') this.slowUntil = now + (ms ?? STATUS.slowMs);
    if (kind === 'freeze') this.frozenUntil = now + (ms ?? STATUS.freezeMs);
    if (kind === 'stuck') this.stuckUntil = now + (ms ?? STATUS.stickMs);
  }

  bounce(): void {
    (this.body as Phaser.Physics.Arcade.Body).setVelocityY(PLAYER.stompBounce);
  }

  resetForRespawn(x: number, feetY: number): void {
    this.clearForm();
    this.hp = this.maxHp;
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
    if (this.boughtForm) this.transform(this.boughtForm, BOUGHT_FORM_MS);
  }

  /**
   * Switches skin in place — texture, body size and stats. The caller (the
   * scene) is responsible for checking the new body will not overlap a solid
   * first; this just applies the change.
   */
  setSkin(skin: SkinId): void {
    this.skin = skin;
    this.godAura?.destroy();
    this.godAura = undefined;
    if (this.hasGodStar) {
      this.godAura = this.scene.add.image(this.x, this.y - PLAYER.height / 2, 'aura-star').setDepth(18).setAlpha(0.6); // placeholder: not Henry's number
      this.scene.tweens.add({ targets: this.godAura, alpha: { from: 0.25, to: 0.8 }, scale: { from: 0.85, to: 1.15 }, duration: 550, yoyo: true, repeat: -1 }); // placeholder: not Henry's number
    }
    const def = this.skinDef;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(def.bodyW, def.bodyH);
    body.setOffset((def.texW - def.bodyW) / 2, def.texH - def.bodyH);
    this.hp = Math.min(this.hp, def.maxHp);
    this.setTexture(this.frame0(body.blocked.down || body.touching.down ? 'idle' : 'jump'));
  }

  // -- Presentation ---------------------------------------------------------

  /** Two puffs of dust from the feet, one each way. Purely for looks. */
  private kickDust(): void {
    const feetY = (this.body as Phaser.Physics.Arcade.Body).bottom;
    for (const dir of [-1, 1]) {
      const puff = this.scene.add.image(this.x + dir * 6, feetY - 5, 'dust').setDepth(19).setScale(0.45).setAlpha(0.85);
      this.scene.tweens.add({
        targets: puff,
        x: puff.x + dir * 20,
        y: puff.y - 6,
        scale: 1,
        alpha: 0,
        duration: 360,
        ease: 'Quad.Out',
        onComplete: () => puff.destroy(),
      });
    }
  }

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

  /**
   * Called by the scene when it un-pauses, with how long the pause lasted.
   * Every absolute timestamp below is compared against `scene.time.now`,
   * which keeps ticking through a pause even though preUpdate does not run —
   * so each one is pushed forward by the same amount, and whatever was
   * counting down keeps exactly the time it had left.
   */
  shiftTimers(ms: number): void {
    this.invulnUntil += ms;
    this.slowUntil += ms;
    this.frozenUntil += ms;
    this.stuckUntil += ms;
    this.formUntil += ms;
    this.lastFireAt += ms;
    this.lastAttackAt += ms;
    this.jumpPressedAt += ms;
    this.lastGroundedAt += ms;
    this.lastScratchAt += ms;
    // God Tom's stacks each last 9 seconds of play, not of pause.
    for (const s of this.godTomStacksList) s.expiresAt += ms;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    // Frozen while the scene is paused: form/status timers are all absolute
    // timestamps against the scene clock, and that clock keeps advancing
    // through a pause even though this method stops being meaningful to run.
    if (this.scene.time.paused) return;

    this.updateGodTomStacks(time);
    this.godAura?.setPosition(this.x, this.y - PLAYER.height / 2);
    if (this.hasGodStar && this.form !== 'star') this.setTint(0xffe58a);
    if (!this.hasGodStar && this.form === 'none') this.clearTint();

    if (this.form !== 'none') {
      if (time >= this.formUntil) {
        this.clearForm();
        // A bought form takes over the moment a picked-up one runs out. This
        // runs before physics, so no hit can land in between.
        if (this.boughtForm) this.transform(this.boughtForm, BOUGHT_FORM_MS);
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
