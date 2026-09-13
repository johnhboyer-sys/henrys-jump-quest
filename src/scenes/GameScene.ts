import Phaser from 'phaser';
import {
  PHYSICS,
  PLAYER,
  FIREBALL,
  SCORE,
  VIEW,
  LIVES,
  SAFE_GROUND_SAMPLE_MS,
  COIN_REWARD,
  KITTY_SUIT,
  GOD_TOM,
  MOO_MOO,
} from '../config/game';
import { DEATH_Y, FLOOR_Y, getLevel, LEVELS, type LevelDef, type PlatformDef } from '../config/levels';
import { HEART_HEAL, POWERUPS, type PowerUpKind } from '../config/powerups';
import { BOUGHT_FORM_MS } from '../config/shop';
import { BOSSES, type BossDef } from '../config/bosses';
import { nearlyImpossible, nearlyImpossibleBoss } from '../config/hardMode';
import { mooMooArena, weakenHoleBoss } from '../config/mooMoo';
import { getMode } from '../systems/ModeSystem';

import { Player, type SkinId } from '../entities/Player';
import { Projectile, type ProjectileOptions } from '../entities/Projectile';
import { Coin, PowerUpPickup } from '../entities/Collectible';
import { QuestionBlock } from '../entities/QuestionBlock';
import { IcicleTrap } from '../entities/IcicleTrap';
import { Checkpoint, GoalFlag } from '../entities/Flag';
import { MooMooHole } from '../entities/Hole';
import { createBoss, type BossBase, type HitSource } from '../entities/bosses';
import { createEnemy, Enemy, type EnemyWorld } from '../entities/enemies';
import type { EnemyKind } from '../config/enemies';
import { buildBackdrop } from '../systems/Backdrop';
import { SKINS, RAIDER_SWORD_FRACTION, type AttackKind } from '../config/skins';
import {
  recordLevelClear,
  loadSave,
  bankOneUp,
  penaliseRunOut,
  spendOneUp,
  availableSkins,
  spendCoins,
  setSkin,
} from '../systems/SaveSystem';
import { play } from '../systems/SoundSystem';

interface GameSceneData {
  levelId?: number;
  /** Set for a Moo Moo Hole rematch: which boss, weaker than usual. `levelId`
   * doubles as the normal level to return to when the fight ends. */
  holeBossId?: string;
  /** Set when returning from a WON hole fight: spawn 200px before the goal
   * instead of at the level's own start, so touching it clears the level. */
  spawnNearGoal?: boolean;
}

/** No more than this many ordinary enemies (minions included) alive at once. */
const MINION_CAP = 8;

export class GameScene extends Phaser.Scene implements EnemyWorld {
  player!: Player;
  private level!: LevelDef;

  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private playerShots!: Phaser.Physics.Arcade.Group;
  private enemyShots!: Phaser.Physics.Arcade.Group;
  /** Shellcracker's backside fire. Its own group so it can never hit a boss. */
  private backfireShots!: Phaser.Physics.Arcade.Group;
  private coins!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private blocks!: Phaser.Physics.Arcade.StaticGroup;
  private spikes!: Phaser.Physics.Arcade.Group;
  private traps: IcicleTrap[] = [];
  private checkpoints: Checkpoint[] = [];
  private goal?: GoalFlag;
  private boss?: BossBase;
  private bossAwake = false;

  private iceSurfaces = new Set<Phaser.GameObjects.GameObject>();
  private touchingIce = false;

  /** Set when this run is a Moo Moo Hole rematch rather than a real level. */
  private isHoleFight = false;
  /** The normal level to return to once a hole fight ends, win or lose. */
  private originLevelId = 1;
  /** True while the hole's boss picker is open, so ESC does not also toggle pause. */
  private holeOpen = false;
  private hole?: MooMooHole;
  private standingOnHole = false;

  /** God Tom: the ordinary enemy currently held overhead, if any. */
  private carriedEnemy?: Enemy;
  /** God Tom: enemies in flight, each with the time it despawns by itself. */
  private thrownEnemies = new Map<Enemy, number>();

  private keys!: {
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    e: Phaser.Input.Keyboard.Key;
    h: Phaser.Input.Keyboard.Key;
  };

  private score = 0;
  private coinsTaken = 0;
  private deaths = 0;
  private livesLeft: number = LIVES.perAttempt;
  private bankedOneUps = 0;
  private respawnPoint = { x: 0, y: 0 };
  /** Where the player last stood safely. Never rewinds further than here. */
  private safeGround = { x: 0, y: 0 };
  private safeGroundSampledAt = 0;
  private finished = false;
  private paused = false;
  private pausedAt = 0;
  private bossContactAt = 0;

  constructor() {
    super('Game');
  }

  init(data: GameSceneData): void {
    this.originLevelId = data.levelId ?? 1;
    this.isHoleFight = !!data.holeBossId;

    let level = this.isHoleFight ? mooMooArena(data.holeBossId!) : getLevel(this.originLevelId);
    // Nearly Impossible's level changes never touch the hole's own arena —
    // section C spells out its own (weaker) boss-HP rule instead.
    if (!this.isHoleFight && getMode() === 'nearlyImpossible') level = nearlyImpossible(level);
    // Always work from a copy — LEVELS' entries are shared, mutable-in-place
    // config, and spawnNearGoal below needs to move the start point.
    level = { ...level, playerStart: { ...level.playerStart } };
    if (!this.isHoleFight && data.spawnNearGoal && level.goal) {
      level.playerStart = { x: level.goal.x - MOO_MOO.returnBeforeGoalPx, y: level.goal.y };
    }
    this.level = level;

    this.score = 0;
    this.coinsTaken = 0;
    this.deaths = 0;
    this.finished = false;
    this.bossAwake = false;
    this.traps = [];
    this.checkpoints = [];
    this.goal = undefined;
    this.boss = undefined;
    this.paused = false;
    // A restart from the pause card (Shift+R) must not carry a frozen clock
    // into the fresh level.
    this.time.paused = false;
    this.holeOpen = false;
    this.hole = undefined;
    this.standingOnHole = false;
    this.carriedEnemy = undefined;
    this.thrownEnemies = new Map();
    this.bossContactAt = 0;
    this.iceSurfaces = new Set();

    const save = loadSave();
    // A fresh stock of lives per attempt, plus anything banked from a boss.
    this.livesLeft = LIVES.perAttempt + save.oneUps;
    this.bankedOneUps = save.oneUps;
  }

  create(): void {
    const level = this.level;

    this.physics.world.gravity.y = PHYSICS.gravity;
    this.physics.world.setBounds(0, -400, level.worldWidth, 2000);

    buildBackdrop(this, level);
    this.buildTerrain(level);

    this.coins = this.physics.add.group({ allowGravity: false });
    this.pickups = this.physics.add.group({ allowGravity: false });
    this.enemies = this.physics.add.group();
    this.spikes = this.physics.add.group({ allowGravity: false, immovable: true });
    this.playerShots = this.physics.add.group({ classType: Projectile, runChildUpdate: false });
    this.enemyShots = this.physics.add.group({ classType: Projectile, runChildUpdate: false });
    this.backfireShots = this.physics.add.group({ classType: Projectile, runChildUpdate: false });

    for (const c of level.coins) this.coins.add(new Coin(this, c.x, c.y));
    for (const t of level.icicles) this.traps.push(new IcicleTrap(this, t, this.spikes));

    for (const spawn of level.enemies) {
      const enemy = createEnemy(this, spawn).attach(this);
      this.enemies.add(enemy);
    }

    // Player, and where they come back after a fall.
    this.respawnPoint = { ...level.playerStart };
    this.safeGround = { ...level.playerStart };
    const save = loadSave();
    const avail = availableSkins(save, level.id);
    const startSkin: SkinId = avail.includes(save.skin) ? save.skin : 'tom';
    this.player = new Player(this, level.playerStart.x, level.playerStart.y, startSkin);
    // Transformations never survive a level change on their own. What carries
    // in is the level's starting power-up (or one bought in the shop, which
    // takes its place) and any Star or Mushroom bought to last whole levels.
    this.player.clearForm();
    const held = save.nextHeld ?? level.startingPowerUp;
    if (held) this.player.give(held);
    this.player.boughtForm =
      save.mushroomLevels > 0 ? 'mushroom' : save.starLevels > 0 ? 'star' : null;
    if (this.player.boughtForm) this.player.transform(this.player.boughtForm, BOUGHT_FORM_MS);

    for (const cp of level.checkpoints) this.checkpoints.push(new Checkpoint(this, cp.x, cp.y));
    if (level.goal) this.goal = new GoalFlag(this, level.goal.x, level.goal.y);

    // Moo Moo Hole: at the start of every normal level, never in a boss one.
    if (!this.isHoleFight && !level.boss) {
      this.hole = new MooMooHole(this, level.playerStart.x + MOO_MOO.holeOffsetX, FLOOR_Y);
    }

    if (level.boss) {
      const base: BossDef = BOSSES[level.boss.id];
      const bossDef = this.isHoleFight
        ? weakenHoleBoss(base, getMode())
        : getMode() === 'nearlyImpossible'
          ? nearlyImpossibleBoss(base)
          : undefined;
      this.boss = createBoss(this, level.boss.id, level.boss.x, level.boss.y, bossDef).attach(this);
      this.boss.setActive(false);
    }

    this.wireCollisions();
    this.setupInput();
    this.setupCamera(level);

    // The UI scene boots a frame later, so it asks for the HUD once it is
    // listening rather than relying on an emit that would arrive too early.
    this.events.on('ui-ready', () => this.emitHud());
    this.scene.launch('UI', { levelName: `${level.id}. ${level.name}`, levelId: level.id });
    this.emitHud();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scene.stop('UI'));
  }

  // -- Building -------------------------------------------------------------

  private buildTerrain(level: LevelDef): void {
    this.solids = this.physics.add.staticGroup();
    this.blocks = this.physics.add.staticGroup();

    for (const def of level.platforms) this.addPlatform(def);

    for (const b of level.blocks) {
      // Boss-arena blocks refill, so the fight can never become unwinnable.
      const refill = level.boss && b.x > level.boss.x - 900 ? 9000 : undefined;
      const block = new QuestionBlock(this, b.x, b.y, b.contains, refill);
      this.blocks.add(block);
    }

    // Tiny tunnels: a solid wall from the world's ceiling down to a 44px slot
    // above the floor. Tom (58 tall) cannot fit through; Tiny Guy (36 tall)
    // can. The wall uses the same addPlatform path as everything else.
    const tunnelSlotHeight = 44; // placeholder: not Henry's number
    for (const t of level.tunnels ?? []) {
      this.addPlatform({
        x: t.x,
        y: -400,
        w: t.w,
        h: FLOOR_Y - tunnelSlotHeight + 400,
        kind: 'platform',
      });

      // A sign just before the entrance, at roughly the player's eye height.
      this.add
        .text(t.x - 60, FLOOR_Y - 90, 'TINY GUY\nONLY\n   ↓', {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 4,
          align: 'center',
        })
        .setOrigin(0.5, 1)
        .setDepth(15);
    }
  }

  /** Ground and platforms take the look of the level's theme; ice is always ice. */
  private surfaceTexture(kind: PlatformDef['kind']): string {
    if (kind === 'ice') return 'tile-ice';
    const suffix =
      this.level.theme === 'ice'
        ? '-snow'
        : this.level.theme === 'shore'
          ? '-sand'
          : this.level.theme === 'galactic'
            ? '-star'
            : '';
    return (kind === 'ground' ? 'tile-ground' : 'tile-platform') + suffix;
  }

  private addPlatform(def: PlatformDef): void {
    const texture = this.surfaceTexture(def.kind);

    const slab = this.add.tileSprite(def.x, def.y, def.w, def.h, texture).setOrigin(0, 0);
    slab.setDepth(def.kind === 'ground' ? 2 : 3);
    this.solids.add(slab);
    (slab.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

    if (def.kind === 'ice') this.iceSurfaces.add(slab);
  }

  private wireCollisions(): void {
    this.physics.add.collider(this.player, this.solids, (_p, surface) => {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      if (body.blocked.down && this.iceSurfaces.has(surface as Phaser.GameObjects.GameObject)) {
        this.touchingIce = true;
      }
    });
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.collider(this.enemies, this.blocks);

    this.physics.add.collider(this.player, this.blocks, (_p, b) =>
      this.onBlockHit(b as QuestionBlock),
    );

    this.physics.add.overlap(this.player, this.coins, (_p, c) => this.onCoin(c as Coin));
    this.physics.add.overlap(this.player, this.pickups, (_p, u) =>
      this.onPickup(u as PowerUpPickup),
    );
    this.physics.add.overlap(this.player, this.enemies, (_p, e) =>
      this.onPlayerTouchEnemy(e as Enemy),
    );
    this.physics.add.overlap(this.player, this.spikes, () => this.onIcicle());
    this.physics.add.overlap(this.player, this.enemyShots, (_p, s) =>
      this.onPlayerShot(s as Projectile),
    );

    this.physics.add.overlap(this.playerShots, this.enemies, (s, e) =>
      this.onShotHitsEnemy(s as Projectile, e as Enemy),
    );
    this.physics.add.collider(this.playerShots, this.solids, (s) => {
      const shot = s as Projectile;
      // Player fireballs skip along the ground, then fizzle.
      if (shot.bouncesLeft > 0) shot.bouncesLeft -= 1;
      else shot.pop();
    });
    this.physics.add.collider(this.enemyShots, this.solids, (s) => {
      const shot = s as Projectile;
      if (shot.bouncesLeft > 0) shot.bouncesLeft -= 1;
      else shot.pop();
    });

    // Shellcracker's backside fire. Its own group, deliberately never given an
    // overlap against the boss — the brief is explicit that no E attack ever
    // damages one.
    this.physics.add.overlap(this.backfireShots, this.enemies, (s, e) =>
      this.onShotHitsEnemy(s as Projectile, e as Enemy),
    );
    this.physics.add.collider(this.backfireShots, this.solids, (s) => (s as Projectile).pop());

    for (const cp of this.checkpoints) {
      this.physics.add.overlap(this.player, cp, () => this.onCheckpoint(cp));
    }
    if (this.goal) {
      this.physics.add.overlap(this.player, this.goal, () => this.completeLevel());
    }
    if (this.hole) {
      this.physics.add.overlap(this.player, this.hole, () => {
        this.standingOnHole = true;
      });
    }
    if (this.boss) {
      this.physics.add.collider(this.boss, this.solids);
      this.physics.add.overlap(this.player, this.boss, () => this.onBossTouch());
      // Boss first: Phaser hands a sprite-vs-group callback the sprite as the
      // first argument regardless of the order they were passed in.
      this.physics.add.overlap(this.boss, this.playerShots, (_b, s) =>
        this.onShotHitsBoss(s as Projectile),
      );
      // God Tom's thrown enemies never hurt a boss — they just fall and die.
      this.physics.add.overlap(this.boss, this.enemies, (_b, e) => this.onThrownHitsBoss(e as Enemy));
    }

    // God Tom's thrown enemies kill any ordinary enemy they hit. A no-op for
    // every other pair, since neither side is ever in `thrownEnemies`.
    this.physics.add.overlap(this.enemies, this.enemies, (a, b) =>
      this.onEnemyEnemyOverlap(a as Enemy, b as Enemy),
    );
  }

  private setupInput(): void {
    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      left: kb.addKey(K.LEFT),
      right: kb.addKey(K.RIGHT),
      up: kb.addKey(K.UP),
      down: kb.addKey(K.DOWN),
      space: kb.addKey(K.SPACE),
      a: kb.addKey(K.A),
      d: kb.addKey(K.D),
      w: kb.addKey(K.W),
      s: kb.addKey(K.S),
      e: kb.addKey(K.E),
      h: kb.addKey(K.H),
    };
    // Stop the arrow keys scrolling the page behind the canvas.
    kb.addCapture([K.LEFT, K.RIGHT, K.UP, K.DOWN, K.SPACE]);

    // ESC opens a pause menu rather than dumping you straight out, and restart
    // needs Shift. Both used to be one stray keypress away from wiping a run —
    // R sits right next to the WASD keys.
    kb.on('keydown-ESC', () => this.togglePause());
    kb.on('keydown-R', (ev: KeyboardEvent) => {
      if (!ev.shiftKey || ev.ctrlKey || ev.metaKey) return;
      this.scene.restart({ levelId: this.level.id });
    });
  }

  /**
   * Freeze the world and show the pause card; press again to carry on.
   *
   * Pausing the physics world stops anything moving, but sprites' own
   * `preUpdate` (bosses' attack state machines, enemies' AI, the player's
   * form/status expiry) is driven by the scene's update list, not physics —
   * it keeps running unless told to stop. So every one of them checks
   * `scene.time.paused` and bails out early, and pausing `this.time` here
   * also freezes every `delayedCall` (minion warnings, boss telegraphs,
   * refills) for free, since Phaser's Clock only advances its timers while
   * unpaused.
   *
   * What `this.time` does NOT freeze is `scene.time.now` itself — Phaser
   * keeps that ticking against the real clock even while paused, since it is
   * also the game's frame timestamp. That is exactly why every hand-rolled
   * `...Until`/`...At` field (compared against `time.now`) needs shifting
   * forward by the paused duration on resume — otherwise a telegraph or
   * cooldown that still had time left would find itself already expired.
   */
  private togglePause(): void {
    if (this.finished || this.holeOpen) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.pausedAt = this.time.now;
      this.physics.world.pause();
      this.time.paused = true;
      this.events.emit('pause', { levelName: this.level.name, levelId: this.level.id });
    } else {
      const pausedMs = Math.max(0, this.time.now - this.pausedAt);
      this.time.paused = false;
      this.physics.world.resume();
      this.shiftAllTimers(pausedMs);
      this.events.emit('resume');
    }
  }

  // -- Moo Moo Cow Mom Hole ---------------------------------------------------

  /**
   * Down Arrow while standing on the hole: freeze the world and open the
   * picker. Frozen the same way as the pause card (see togglePause), so no
   * enemy or boss acts while the kid is choosing.
   */
  private openHole(): void {
    if (this.finished || this.paused) return;
    this.holeOpen = true;
    this.paused = true;
    this.pausedAt = this.time.now;
    this.physics.world.pause();
    this.time.paused = true;
    this.scene.launch('Hole', { originLevelId: this.level.id });
    this.scene.bringToTop('Hole');
  }

  /** Called by HoleScene when the player climbs back out (ESC, or nothing beaten yet). */
  resumeFromHole(): void {
    const pausedMs = Math.max(0, this.time.now - this.pausedAt);
    this.holeOpen = false;
    this.paused = false;
    this.time.paused = false;
    this.physics.world.resume();
    this.shiftAllTimers(pausedMs);
  }

  /** Called by HoleScene once a boss is picked. Rebuilds the scene as the arena fight. */
  startHoleFight(bossId: string): void {
    this.time.paused = false;
    this.scene.stop('Hole');
    this.scene.start('Game', { levelId: this.originLevelId, holeBossId: bossId });
  }

  /** Pushes every absolute timestamp still ticking against the scene clock
   * forward by however long the pause lasted. See togglePause. */
  private shiftAllTimers(ms: number): void {
    if (ms <= 0) return;
    this.player.shiftTimers(ms);
    this.boss?.shiftTimers(ms);
    for (const obj of this.enemies.getChildren()) (obj as Enemy).shiftTimers(ms);
    for (const obj of this.playerShots.getChildren()) (obj as Projectile).shiftTimers(ms);
    for (const obj of this.enemyShots.getChildren()) (obj as Projectile).shiftTimers(ms);
    for (const obj of this.backfireShots.getChildren()) (obj as Projectile).shiftTimers(ms);
    // God Tom's thrown enemies vanish at an absolute time too.
    for (const [enemy, dieAt] of this.thrownEnemies) this.thrownEnemies.set(enemy, dieAt + ms);
  }

  /** Called by the pause card when the player chooses to leave. */
  quitToMenu(): void {
    this.time.paused = false;
    this.physics.world.resume();
    this.scene.stop('UI');
    this.scene.start('Menu');
  }

  /**
   * Called by the pause card (behind SKINS_CONFIG.switchMidLevel) when the
   * player picks a numbered skin. Refuses if the new body would not fit where
   * the player is currently standing.
   */
  trySwitchSkin(skinId: SkinId): { ok: boolean; reason?: string } {
    const save = loadSave();
    if (!availableSkins(save, this.level.id).includes(skinId)) {
      return { ok: false, reason: "You don't have that skin." };
    }
    if (!this.bodyFits(skinId, this.player.x, this.player.y)) {
      return { ok: false, reason: "That skin won't fit here!" };
    }
    this.player.setSkin(skinId);
    setSkin(skinId);
    this.emitHud();
    return { ok: true };
  }

  /**
   * Would `skin`'s body overlap a solid standing at (x, feetY)? Shared by the
   * pause-card skin switch and by `respawn`, so a respawn spot is judged the
   * same way a mid-level switch is.
   *
   * overlapRect treats a body merely touching a surface as overlapping it —
   * and standing still, your feet always touch the ground you're on. Inset
   * the probe by a couple of px so resting on the floor doesn't self-refuse;
   * a real low ceiling or wall still overlaps well inside that margin.
   */
  private bodyFits(skin: SkinId, x: number, feetY: number): boolean {
    const def = SKINS[skin];
    const pad = 3;
    const blocked = this.physics.overlapRect(
      x - def.bodyW / 2 + pad,
      feetY - def.bodyH + pad,
      Math.max(1, def.bodyW - pad * 2),
      Math.max(1, def.bodyH - pad * 2),
      false,
      true,
    );
    return blocked.length === 0;
  }

  private setupCamera(level: LevelDef): void {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, level.worldWidth, VIEW.height);
    cam.startFollow(this.player, true, 0.12, 0.16);
    cam.setDeadzone(180, 140);
    cam.setFollowOffset(0, 40);
  }

  // -- EnemyWorld -----------------------------------------------------------

  /** Enemies and the boss shoot through here. */
  shoot(x: number, y: number, opts: ProjectileOptions): void {
    const shot = this.enemyShots.get(x, y) as Projectile | null;
    if (!shot) return;
    shot.fire(x, y, opts);
  }

  /**
   * Drops a minion into the fight. It arrives from above with a warning
   * flash, so it can never land on the player unannounced. `galactic`
   * defaults to true, so the Galactic Raider's summons are unchanged; a boss
   * that wants an ordinary-strength minion passes `galactic: false`. `owner`
   * tags the minion so a boss can later count or clear its own summons.
   */
  spawnMinion(kind: EnemyKind, x: number, opts?: { galactic?: boolean; owner?: object }): void {
    const galactic = opts?.galactic ?? true;
    const clampedX = Phaser.Math.Clamp(x, 80, this.level.worldWidth - 80);
    if (this.aliveEnemyCount() >= MINION_CAP) return;

    const warn = this.add.image(clampedX, 200, 'spark').setTint(0xb69cff).setDepth(30);
    this.tweens.add({
      targets: warn,
      scaleX: 6,
      scaleY: 30,
      alpha: 0,
      duration: 420,
      onComplete: () => warn.destroy(),
    });

    this.time.delayedCall(420, () => {
      // The owner (a boss) may have died while this one was still in the air.
      // Every boss is a Phaser game object, so `active` going false on death
      // is enough to catch it — and it keeps "all its minions vanish" true.
      if (opts?.owner && (opts.owner as { active?: boolean }).active === false) return;
      // Re-check the cap right here, not just when this call was queued: a
      // boss that queues several minions at once (the Kitty Raider brings
      // three per kitty killed) can have every one of them pass the check
      // above before any of them actually exists yet.
      if (this.aliveEnemyCount() >= MINION_CAP) return;
      const minion = createEnemy(
        this,
        { kind, x: clampedX, y: 200, left: clampedX - 260, right: clampedX + 260 },
        galactic,
      ).attach(this);
      minion.owner = opts?.owner;
      this.enemies.add(minion);
      play('block');
    });
  }

  private aliveEnemyCount(): number {
    return this.enemies.getChildren().filter((e) => e.active).length;
  }

  /** How many live minions were spawned with this owner. */
  countMinionsFor(owner: object): number {
    return this.enemies
      .getChildren()
      .filter((e) => e.active && (e as Enemy).owner === owner).length;
  }

  // -- Collision handlers ---------------------------------------------------

  private onCoin(coin: Coin): void {
    if (!coin.active) return;
    coin.collect();
    this.coinsTaken += 1;
    this.score += SCORE.coin;
    play('coin');
    this.emitHud();
  }

  private onPickup(pickup: PowerUpPickup): void {
    if (!pickup.active) return;
    const kind = pickup.kind;
    pickup.collect();

    switch (kind) {
      case 'heart':
        this.player.heal(HEART_HEAL);
        break;
      case 'coin':
        this.coinsTaken += 1;
        this.score += SCORE.coin;
        break;
      case 'star':
        this.player.transform('star');
        this.score += SCORE.starPickup;
        this.flashBanner('SUPER STAR!');
        this.cameras.main.flash(220, 255, 240, 160);
        break;
      case 'mushroom':
        this.player.transform('mushroom');
        this.score += SCORE.mushroomPickup;
        this.flashBanner('GOD MUSHROOM!');
        this.cameras.main.flash(220, 200, 255, 200);
        break;
      case 'oneup':
        this.livesLeft += LIVES.oneUpValue;
        this.bankedOneUps = bankOneUp().oneUps;
        this.score += SCORE.oneUp;
        this.flashBanner('1-UP!');
        break;
      default:
        this.player.give(kind);
        break;
    }
    play('power');
    this.emitHud();
  }

  private onBlockHit(block: QuestionBlock): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    // Only a hit from underneath counts.
    if (!body.blocked.up && !body.touching.up) return;
    if (block.isSpent) return;

    const contents = block.bump();
    if (!contents) return;
    play('block');

    if (contents === 'coin') {
      this.coinsTaken += 1;
      this.score += SCORE.coin;
      this.popCoins(block.x, block.y, 1);
      this.emitHud();
      return;
    }

    const pickup = new PowerUpPickup(this, block.x, block.y - 10, contents);
    this.pickups.add(pickup);

    // Henry's rule: a power-up block has an even chance of coins as well.
    // First bump only. Arena blocks refill, and a roll on every refill would
    // turn a boss fight into a coin farm.
    if (block.bumpCount === 1 && Math.random() < COIN_REWARD.blockBonusChance) {
      this.coinsTaken += COIN_REWARD.blockBonus;
      this.score += SCORE.coin * COIN_REWARD.blockBonus;
      this.popCoins(block.x, block.y, COIN_REWARD.blockBonus);
      this.emitHud();
    }
  }

  /** Coins that jump out of a block and vanish, fanned out so each one reads. */
  private popCoins(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const pop = this.add.image(x + (i - (count - 1) / 2) * 26, y - 20, 'pw-coin').setDepth(30);
      this.tweens.add({
        targets: pop,
        y: y - 90,
        alpha: 0,
        delay: i * 60,
        duration: 420,
        onComplete: () => pop.destroy(),
      });
    }
    play('coin');
  }

  private onPlayerTouchEnemy(enemy: Enemy): void {
    if (!enemy.active || !this.player.isAlive) return;

    // A star or the god mushroom clears anything it touches, instantly.
    if (this.player.isInvincible) {
      play('stomp');
      this.killEnemy(enemy, SCORE.enemyStomp);
      return;
    }

    const pb = this.player.body as Phaser.Physics.Arcade.Body;
    const eb = enemy.body as Phaser.Physics.Arcade.Body;

    // A stomp: falling, and your feet are above the enemy's middle.
    const stomping = pb.velocity.y > 60 && pb.bottom < eb.top + eb.height * 0.6;

    if (stomping && enemy.def.stompable) {
      this.player.bounce();
      play('stomp');
      if (enemy.hit(999)) this.killEnemy(enemy, SCORE.enemyStomp);
      return;
    }

    if (this.player.takeDamage(enemy.def.touchDamage, enemy.x)) {
      play('hurt');
      this.cameras.main.shake(120, 0.006);
      this.emitHud();
      this.checkDeath();
    }
  }

  private onIcicle(): void {
    if (!this.player.isAlive || this.player.isInvincible) return;
    if (!this.player.takeDamage(5)) return;

    // Only freeze a player who is standing on something. Freezing someone in
    // mid-air drops them straight down — over a pit that is an unavoidable
    // death, and next to a trap it loops: fall, respawn, get frozen again.
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down) {
      this.player.applyStatus('freeze');
      this.showFrostShell();
    }
    play('hurt');
    this.emitHud();
    this.checkDeath();
  }

  private onPlayerShot(shot: Projectile): void {
    if (!shot.active || !this.player.isAlive) return;
    if (this.player.isInvincible) {
      shot.pop();
      return;
    }
    const damage = shot.damage;
    const status = shot.status;
    shot.pop();

    if (this.player.takeDamage(damage, shot.x)) {
      if (status === 'slow') this.player.applyStatus('slow');
      if (status === 'stuck') this.player.applyStatus('stuck');
      if (status === 'freeze') this.player.applyStatus('freeze');
      play('hurt');
      this.emitHud();
      this.checkDeath();
    }
  }

  private onShotHitsEnemy(shot: Projectile, enemy: Enemy): void {
    if (!shot.active || !enemy.active) return;
    shot.pop();
    if (enemy.hit(shot.damage)) this.killEnemy(enemy, SCORE.enemyBurned);
  }

  private onShotHitsBoss(shot: Projectile): void {
    if (!shot.active || !this.boss || !this.boss.active) return;
    shot.pop();
    play('stomp');
    // A fireball thrown while transformed hits far harder.
    const source: HitSource = this.player.form === 'mushroom' ? 'mushroom' : 'fire';
    if (this.boss.hit(source)) this.defeatBoss();
    this.emitHud();
  }

  private onBossTouch(): void {
    if (!this.boss || !this.boss.active || !this.player.isAlive) return;

    // Running into a boss while transformed hurts the boss, not the player.
    if (this.player.isInvincible) {
      const now = this.time.now;
      if (now - this.bossContactAt > 600) {
        this.bossContactAt = now;
        const source: HitSource = this.player.form === 'star' ? 'star' : 'mushroom';
        play('stomp');
        if (this.boss.hit(source)) this.defeatBoss();
        this.emitHud();
      }
      return;
    }

    if (this.player.takeDamage(this.boss.def.touchDamage, this.boss.x)) {
      play('hurt');
      this.cameras.main.shake(140, 0.008);
      this.emitHud();
      this.checkDeath();
    }
  }

  private killEnemy(enemy: Enemy, points: number): void {
    this.addGodTomStack(enemy);
    enemy.die();
    this.score += points;
    this.coinsTaken += COIN_REWARD.enemyKill;
    this.emitHud();
  }

  /** God Tom only: a kill grants a stack of that enemy's own stats for 9s. */
  private addGodTomStack(enemy: Enemy): void {
    if (this.player.skin !== 'godTom') return;
    const speedGain = enemy.def.speed * GOD_TOM.speedFraction;
    this.player.addGodTomStack(enemy.def.hp, speedGain, this.time.now + GOD_TOM.stackDurationMs);
  }

  // -- Player fireballs -----------------------------------------------------

  private throwFireball(): void {
    const shot = this.playerShots.get(this.player.x, this.player.y) as Projectile | null;
    if (!shot) return;
    const dir = this.player.facing;
    shot.fire(this.player.x + dir * 26, this.player.y - 34, {
      texture: 'proj-playerfire',
      damage: FIREBALL.damage,
      vx: dir * FIREBALL.speed,
      vy: -120,
      gravity: FIREBALL.gravity,
      bounce: FIREBALL.bounce,
      lifetimeMs: FIREBALL.lifetimeMs,
      spin: dir * 420,
    });
    play('fire');
    this.emitHud();
  }

  private cloudPuff(): void {
    const puff = this.add.image(this.player.x, this.player.y + 4, 'puff').setDepth(19);
    puff.setScale(0.6);
    this.tweens.add({
      targets: puff,
      scale: 1.3,
      alpha: 0,
      y: puff.y + 26,
      duration: 420,
      onComplete: () => puff.destroy(),
    });
    play('hop');
  }

  private showFrostShell(): void {
    const shell = this.add.image(this.player.x, this.player.y - 30, 'ice-shell').setDepth(21);
    this.tweens.add({
      targets: shell,
      alpha: 0,
      duration: 900,
      onComplete: () => shell.destroy(),
    });
  }

  // -- Skin E attacks ---------------------------------------------------------

  /** E. Melee skins swing a rect in front of the player; Shellcracker shoots. */
  private tryPlayerAttack(now: number): void {
    if (!this.player.canAttack(now)) return;
    const atk = this.player.attackDef;
    if (!atk) return;
    this.player.recordAttack(now);

    if (atk.kind === 'backfire') {
      this.fireBackside(atk.damage);
      play('fire');
      return;
    }

    const bounds = this.player.getBounds();
    const swingW = 64;
    const swingH = 50;
    const rectX = this.player.facing === 1 ? bounds.right : bounds.left - swingW;
    const rectY = bounds.centerY - swingH / 2;
    const rect = new Phaser.Geom.Rectangle(rectX, rectY, swingW, swingH);
    this.showSwing(atk.kind, rectX, rectY, swingW, swingH);

    for (const obj of this.enemies.getChildren()) {
      const enemy = obj as Enemy;
      if (!enemy.active) continue;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(rect, enemy.getBounds())) continue;
      // The sword ignores the flat damage and takes a quarter of the target's
      // own max HP — that is what makes it a 4-hit kill on anything, minions
      // included, whatever their raw HP happens to be.
      const damage = atk.kind === 'sword' ? enemy.def.hp * RAIDER_SWORD_FRACTION : atk.damage;
      if (enemy.hit(damage)) this.killEnemy(enemy, SCORE.enemyBurned);
    }
    play('stomp');
  }

  /**
   * Down Arrow, Kitty suit held: the same kind of melee swing as a skin's E
   * attack, taking an eighth of the target's max HP. Never touches a boss —
   * this only ever loops over `this.enemies`.
   */
  private tryScratch(now: number): void {
    if (!this.player.canScratch(now)) return;
    this.player.recordScratch(now);

    const bounds = this.player.getBounds();
    const swingW = 64;
    const swingH = 50;
    const rectX = this.player.facing === 1 ? bounds.right : bounds.left - swingW;
    const rectY = bounds.centerY - swingH / 2;
    const rect = new Phaser.Geom.Rectangle(rectX, rectY, swingW, swingH);
    this.showSwing('purse', rectX, rectY, swingW, swingH);

    for (const obj of this.enemies.getChildren()) {
      const enemy = obj as Enemy;
      if (!enemy.active || this.thrownEnemies.has(enemy) || enemy === this.carriedEnemy) continue;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(rect, enemy.getBounds())) continue;
      const damage = enemy.def.hp * KITTY_SUIT.fraction;
      if (enemy.hit(damage)) this.killEnemy(enemy, SCORE.enemyBurned);
    }
    play('stomp');
  }

  // -- God Tom: pick up and throw --------------------------------------------

  /** E, God Tom: pick up the nearest ordinary enemy in front, or throw one already held. */
  private tryGodTomAction(): void {
    if (this.carriedEnemy) {
      this.throwCarriedEnemy();
      return;
    }

    const dir = this.player.facing;
    const originX = this.player.x + dir * 20;
    let best: Enemy | undefined;
    let bestDist: number = GOD_TOM.pickupRangePx;
    for (const obj of this.enemies.getChildren()) {
      const enemy = obj as Enemy;
      // Ordinary enemies only — not a galactic minion, and not a boss (bosses
      // are never members of this group in the first place).
      if (!enemy.active || enemy.elite || this.thrownEnemies.has(enemy)) continue;
      const ahead = (enemy.x - originX) * dir;
      if (ahead < -20 || ahead > GOD_TOM.pickupRangePx) continue;
      const dist = Math.abs(enemy.x - this.player.x);
      if (dist < bestDist) {
        bestDist = dist;
        best = enemy;
      }
    }
    if (!best) return;

    this.carriedEnemy = best;
    best.held = true;
    (best.body as Phaser.Physics.Arcade.Body).enable = false;
    play('power');
  }

  /** Every frame while an enemy is carried: keep it above God Tom's head. */
  private updateCarriedEnemy(): void {
    if (!this.carriedEnemy) return;
    this.carriedEnemy.setPosition(this.player.x, this.player.y - PLAYER.height - 26);
  }

  /** Dropped mid-carry (death, or a fresh level): hand the enemy its AI back. */
  private dropCarriedEnemy(): void {
    const enemy = this.carriedEnemy;
    if (!enemy) return;
    this.carriedEnemy = undefined;
    if (!enemy.active) return;
    enemy.held = false;
    (enemy.body as Phaser.Physics.Arcade.Body).enable = true;
  }

  private throwCarriedEnemy(): void {
    const enemy = this.carriedEnemy;
    if (!enemy) return;
    this.carriedEnemy = undefined;

    const body = enemy.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setAllowGravity(true);
    const dir = this.player.facing;
    body.setVelocity(dir * GOD_TOM.throwSpeed, -80);
    this.thrownEnemies.set(enemy, this.time.now + GOD_TOM.throwLifetimeMs);
    play('fire');
  }

  /** Removes a thrown enemy from flight-tracking and makes it vanish. Never a kill. */
  private despawnThrown(enemy: Enemy): void {
    this.thrownEnemies.delete(enemy);
    if (enemy.active) enemy.die();
  }

  /** Checks lifetime and wall/ground impact for every enemy currently in flight. */
  private updateThrownEnemies(time: number): void {
    if (this.thrownEnemies.size === 0) return;
    for (const [enemy, dieAt] of this.thrownEnemies) {
      if (!enemy.active) {
        this.thrownEnemies.delete(enemy);
        continue;
      }
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      if (time >= dieAt || body.blocked.left || body.blocked.right || body.blocked.down) {
        this.despawnThrown(enemy);
      }
    }
  }

  /** Two members of `this.enemies` overlapping: only a thrown-vs-ordinary pair does anything. */
  private onEnemyEnemyOverlap(a: Enemy, b: Enemy): void {
    const aThrown = this.thrownEnemies.has(a);
    const bThrown = this.thrownEnemies.has(b);
    if (aThrown === bThrown) return;
    const thrown = aThrown ? a : b;
    const victim = aThrown ? b : a;
    if (!thrown.active || !victim.active || victim === this.carriedEnemy) return;
    this.despawnThrown(thrown);
    this.killEnemy(victim, SCORE.enemyBurned);
  }

  /** A thrown enemy touching the boss just falls and dies — never a hit on it. */
  private onThrownHitsBoss(enemy: Enemy): void {
    if (!this.thrownEnemies.has(enemy)) return;
    this.despawnThrown(enemy);
  }

  /** Shellcracker's E: a shot fired opposite the way it is facing. */
  private fireBackside(damage: number): void {
    const shot = this.backfireShots.get(this.player.x, this.player.y) as Projectile | null;
    if (!shot) return;
    const dir = -this.player.facing;
    shot.fire(this.player.x + dir * 26, this.player.y - 34, {
      texture: 'proj-backfire',
      damage,
      vx: dir * 480,
      vy: 0,
      lifetimeMs: 1400,
    });
  }

  /** A short, visible swing for the melee attacks. */
  private showSwing(kind: AttackKind, x: number, y: number, w: number, h: number): void {
    const texture = kind === 'purse' ? 'swing-purse' : kind === 'hammer' ? 'swing-hammer' : 'swing-sword';
    const fx = this.add.image(x + w / 2, y + h / 2, texture).setDepth(21).setAlpha(0.9);
    this.tweens.add({
      targets: fx,
      alpha: 0,
      scale: 1.3,
      duration: 180,
      onComplete: () => fx.destroy(),
    });
  }

  /** H. The Nurse's own heal: 20 coins from the bank for a full top-up. */
  private tryNurseHeal(): void {
    if (!this.player.isAlive || this.player.skin !== 'nurse') return;
    if (this.player.hp >= this.player.maxHp) {
      this.flashBanner('Already full!');
      return;
    }
    if (!spendCoins(20)) {
      this.flashBanner('Not enough coins!');
      return;
    }
    this.player.heal(this.player.maxHp);
    play('power');
    this.emitHud();
  }

  // -- Life cycle -----------------------------------------------------------

  private checkDeath(): void {
    // Guard on `active`, not `isAlive`. isAlive is false the instant HP hits
    // zero, so testing it here swallowed every death by damage — the player
    // sat at 0 HP and only actually died by falling out of the world.
    if (this.player.hp > 0 || !this.player.active) return;
    this.killPlayer();
  }

  private killPlayer(): void {
    if (this.finished) return;
    this.dropCarriedEnemy();
    this.player.hp = 0;
    this.player.clearForm();
    this.player.setActive(false);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, -420);
    body.enable = false;
    play('die');
    this.deaths += 1;
    this.livesLeft -= 1;
    this.emitHud();

    this.tweens.add({
      targets: this.player,
      y: this.player.y - 60,
      angle: 180,
      alpha: 0,
      duration: 620,
      ease: 'Quad.Out',
    });

    if (this.livesLeft <= 0) {
      this.time.delayedCall(900, () => this.runOutOfLives());
      return;
    }
    this.time.delayedCall(PLAYER.respawnDelayMs, () => this.respawn());
  }

  /**
   * Out of lives. A banked 1-UP is spent automatically to save the run;
   * otherwise the level you had not yet finished re-locks. Levels you have
   * actually completed are never taken away.
   */
  private runOutOfLives(): void {
    if (this.finished) return;
    this.finished = true;

    // The hole fight never re-locks anything — win or lose, it is just a
    // rematch. Losing sends the player back to the origin level's start.
    if (this.isHoleFight) {
      play('die');
      this.events.emit('holeLose', { originLevelId: this.originLevelId });
      return;
    }

    if (this.bankedOneUps > 0 && spendOneUp()) {
      this.bankedOneUps -= 1;
      this.livesLeft = Math.max(1, LIVES.perAttempt - 2);
      this.finished = false;
      this.flashBanner('1-UP SAVED YOU!');
      play('power');
      this.time.delayedCall(600, () => this.respawn());
      this.emitHud();
      return;
    }

    const { lockedLevel } = penaliseRunOut();
    play('die');
    this.events.emit('gameover', {
      levelName: this.level.name,
      score: this.score,
      lockedLevel,
    });
  }

  private respawn(): void {
    if (this.finished) return;
    const spot = this.safeRespawnSpot(this.bestRespawn());
    this.player.setAngle(0);
    this.player.resetForRespawn(spot.x, spot.y);
    // Clear anything still in the air, so you don't respawn into a fireball.
    this.enemyShots.getChildren().forEach((s) => (s as Projectile).disable());
    this.cameras.main.flash(200, 255, 255, 255);
    this.emitHud();
  }

  /**
   * A safe-ground sample taken while wearing a small skin can still land
   * inside a tunnel slot too narrow for whatever skin the player is wearing
   * now (sampleSafeGround excludes tunnels going forward, but an old sample
   * predating that skin switch can still be on the books). If the current
   * skin's body would not fit at the chosen spot, fall back to the last
   * checkpoint, and if even that fails, the level's own start.
   */
  private safeRespawnSpot(spot: { x: number; y: number }): { x: number; y: number } {
    if (this.bodyFits(this.player.skin, spot.x, spot.y)) return spot;
    if (this.bodyFits(this.player.skin, this.respawnPoint.x, this.respawnPoint.y)) {
      return this.respawnPoint;
    }
    return this.level.playerStart;
  }

  /**
   * Quietly remembers the last patch of ground the player stood on.
   *
   * This is the real fix for "I got halfway and got sent back to the start":
   * checkpoint flags alone meant a death before the first flag rewound the
   * whole level. Now a death costs you the last few steps, never the level.
   */
  private sampleSafeGround(time: number): void {
    if (time - this.safeGroundSampledAt < SAFE_GROUND_SAMPLE_MS) return;
    this.safeGroundSampledAt = time;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (!body.blocked.down) return;
    if (this.player.isFrozen) return;
    // Do not memorise a spot we are being hurt on.
    if (this.physics.overlap(this.player, this.spikes)) return;
    if (this.physics.overlap(this.player, this.enemies)) return;
    // Nor one inside a tunnel's slot: it may fit the skin worn right now, but
    // a bigger skin worn later could get its respawn body embedded in the
    // wall. See safeRespawnSpot for the belt-and-braces check at respawn time.
    if (this.isInsideAnyTunnel(this.player.x)) return;

    this.safeGround = { x: this.player.x, y: this.player.y };
  }

  /** True if x falls within any of this level's tunnels, plus a margin either
   * side — a spot only a smaller skin can stand in must never count as safe. */
  private isInsideAnyTunnel(x: number): boolean {
    const pad = 30; // placeholder: not Henry's number
    return (this.level.tunnels ?? []).some((t) => x >= t.x - pad && x <= t.x + t.w + pad);
  }

  /** The furthest-along place it is fair to put the player back. */
  private bestRespawn(): { x: number; y: number } {
    return this.safeGround.x > this.respawnPoint.x ? this.safeGround : this.respawnPoint;
  }

  private onCheckpoint(cp: Checkpoint): void {
    if (cp.activated) return;
    cp.activate();
    this.respawnPoint = { x: cp.x, y: cp.y };
    this.safeGround = { x: cp.x, y: cp.y };
    play('power');
    this.flashBanner('CHECKPOINT');
  }

  private wakeBoss(): void {
    if (!this.boss || this.bossAwake) return;
    this.bossAwake = true;
    this.boss.setActive(true);
    play('roar');
    this.cameras.main.shake(500, 0.01);
    this.flashBanner(this.boss.def.name.toUpperCase() + '!');
    this.events.emit('boss', { hp: this.boss.hp, maxHp: this.boss.maxHp, name: this.boss.def.name });
  }

  private defeatBoss(): void {
    if (!this.boss) return;
    this.finished = true;
    if (this.boss.def.clearMinionsOnDeath) this.clearBossMinions(this.boss);
    this.events.emit('boss', { hp: 0, maxHp: this.boss.maxHp, name: this.boss.def.name });
    // A hole fight never runs completeLevel: no coins, no best score, no
    // recordLevelClear — see completeHoleFight().
    this.boss.defeat(() => (this.isHoleFight ? this.completeHoleFight() : this.completeLevel(true)));
  }

  /** Winning the hole fight: no rewards, just a small card, then back to the level. */
  private completeHoleFight(): void {
    this.player.setVelocity(0, 0);
    (this.player.body as Phaser.Physics.Arcade.Body).enable = false;
    play('win');
    this.events.emit('holeWin', { originLevelId: this.originLevelId });
  }

  /** Pops every live minion this boss spawned, each with a small puff. */
  private clearBossMinions(boss: BossBase): void {
    for (const obj of this.enemies.getChildren()) {
      const enemy = obj as Enemy;
      if (!enemy.active || enemy.owner !== boss) continue;
      const puff = this.add
        .image(enemy.x, enemy.y - enemy.def.bodyHeight / 2, 'puff')
        .setDepth(19)
        .setScale(0.5);
      this.tweens.add({
        targets: puff,
        scale: 1.1,
        alpha: 0,
        duration: 320,
        onComplete: () => puff.destroy(),
      });
      enemy.die();
    }
  }

  private completeLevel(wasBoss = false): void {
    if (this.finished && !wasBoss) return;
    this.finished = true;

    const bonus = this.player.hp * SCORE.hpBonusPerPoint;
    this.score += (wasBoss ? SCORE.bossClear : SCORE.levelClear) + bonus;
    if (wasBoss) this.coinsTaken += COIN_REWARD.boss;
    play('win');

    const clearedBefore = loadSave().clearedLevel;
    const save = recordLevelClear(this.level.id, this.score, this.coinsTaken);
    const lastLevelId = LEVELS[LEVELS.length - 1].id;
    const hasNext = this.level.id < lastLevelId && save.unlockedLevel > this.level.id;
    // Beating the Galactic Raider (level 5) is what unlocks Tiny Guy forever.
    const tinyGuyUnlocked = clearedBefore < 5 && save.clearedLevel >= 5;

    this.player.setVelocity(0, 0);
    (this.player.body as Phaser.Physics.Arcade.Body).enable = false;

    this.events.emit('complete', {
      score: this.score,
      coins: this.coinsTaken,
      deaths: this.deaths,
      bonus,
      levelName: this.level.name,
      nextLevelId: hasNext ? this.level.id + 1 : null,
      isBoss: wasBoss,
      totalCoins: save.totalCoins,
      merchant: wasBoss ? 'bob' : 'boo',
      tinyGuyUnlocked,
    });
  }

  /** Big text across the middle of the screen for a moment. */
  private flashBanner(text: string): void {
    const banner = this.add
      .text(VIEW.width / 2, 200, text, {
        fontFamily: 'monospace',
        fontSize: '46px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(60);
    this.tweens.add({
      targets: banner,
      alpha: 0,
      y: 160,
      duration: 1400,
      ease: 'Quad.In',
      onComplete: () => banner.destroy(),
    });
  }

  private emitHud(): void {
    const attack = this.player.attackDef;
    const isNurse = this.player.skin === 'nurse';
    this.events.emit('hud', {
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      score: this.score,
      coins: this.coinsTaken,
      held: this.player.held as PowerUpKind | null,
      charges: this.player.fireCharges,
      deaths: this.deaths,
      lives: this.livesLeft,
      form: this.player.form,
      formLabel:
        (this.player.form === 'star' ? POWERUPS.star.label : POWERUPS.mushroom.label) +
        (this.player.formTotalMs === BOUGHT_FORM_MS ? ' — whole level' : ''),
      formMs: this.player.formRemainingMs,
      formTotalMs: this.player.formTotalMs,
      skinLabel: SKINS[this.player.skin].label,
      attackHint: attack ? attack.hint : null,
      canNurseHeal:
        isNurse && this.player.hp < this.player.maxHp && loadSave().totalCoins >= 20,
      nearlyImpossible: getMode() === 'nearlyImpossible',
      godTomStacks: this.player.godTomStackCount,
    });
    if (this.boss && this.bossAwake) {
      this.events.emit('boss', {
        hp: this.boss.hp,
        maxHp: this.boss.maxHp,
        name: this.boss.def.name,
      });
    }
  }

  // -- Frame ----------------------------------------------------------------

  update(time: number, delta: number): void {
    if (this.paused) return;
    for (const trap of this.traps) trap.update(delta);

    if (this.finished || !this.player.isAlive) {
      this.touchingIce = false;
      this.standingOnHole = false;
      return;
    }

    this.sampleSafeGround(time);
    // Keep the transformation timer on screen ticking down.
    if (this.player.isTransformed) this.emitHud();

    const k = this.keys;
    const left = k.left.isDown || k.a.isDown;
    const right = k.right.isDown || k.d.isDown;
    const jumpDown =
      Phaser.Input.Keyboard.JustDown(k.up) ||
      Phaser.Input.Keyboard.JustDown(k.w) ||
      Phaser.Input.Keyboard.JustDown(k.space);
    const jumpHeld = k.up.isDown || k.w.isDown || k.space.isDown;

    this.player.onIce = this.touchingIce;
    const jumped = this.player.handleInput(left, right, jumpDown, jumpHeld, time);
    if (jumped.didJump) play('jump');
    if (jumped.didDoubleJump) this.cloudPuff();

    if (Phaser.Input.Keyboard.JustDown(k.down) || Phaser.Input.Keyboard.JustDown(k.s)) {
      // While standing on the hole, Down enters it instead of using a held power-up.
      if (this.hole && this.standingOnHole && !this.isHoleFight) {
        this.openHole();
      } else {
        const used = this.player.usePowerUp(time);
        if (used === 'fire') this.throwFireball();
        if (used === 'hop') this.cloudPuff();
        if (!used) this.tryScratch(time);
      }
    }

    if (Phaser.Input.Keyboard.JustDown(k.e)) {
      if (this.player.skin === 'godTom') this.tryGodTomAction();
      else this.tryPlayerAttack(time);
    }
    if (Phaser.Input.Keyboard.JustDown(k.h)) this.tryNurseHeal();

    this.updateCarriedEnemy();
    this.updateThrownEnemies(time);

    if (this.boss && !this.bossAwake && this.player.x > this.boss.x - 780) this.wakeBoss();

    // Fell off the world.
    if (this.player.y > DEATH_Y) this.killPlayer();

    this.touchingIce = false;
    this.standingOnHole = false;
  }
}
