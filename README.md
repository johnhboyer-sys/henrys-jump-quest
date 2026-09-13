# Jump Quest

A 2D side-scrolling platformer built from Henry and Tom's brainstorm.
Eleven levels, five enemies, seven power-ups, five bosses, eight playable
skins, two difficulty modes and a bonus rematch hole.

## Run it

```
npm install
npm run dev
```

Then open the URL Vite prints. `npm run build` type-checks and bundles to `dist/`.

To play on a phone or iPad over your home Wi-Fi, run `npm run dev -- --host`
and open the "Network" URL it prints on the device instead of `localhost`.

## Controls

| Key | Does |
| --- | --- |
| ← → | Run (A / D also work) |
| ↑ | Jump — hold for a higher one (W / Space also work) |
| ↑ again | Double jump, if you are holding the Cloud |
| ↓ | Use the power-up you are holding (S also works); on the Moo Moo Hole, enters it instead |
| E | Your skin's attack, if it has one (see Skins below) |
| H | Nurse only: spend 20 coins to heal to full |
| ESC | Pause (Q from the pause card leaves the level; number keys switch skin, if the mid-level switch is turned on) |
| Shift+R | Restart the level |
| ← → | Normal / Nearly Impossible (menu screen) |
| S | Cycle skins (menu screen) |
| M | Mute (menu screen) |

## Touch controls

The keyboard works exactly as above; a touch device (or a desktop browser
with `?touch=1` on the URL, for testing) also gets on-screen circular buttons
drawn over the game — Left/Right, Jump (hold for a higher jump, same as the
keyboard), Down (use the held power-up, or enter the Moo Moo Hole), Attack
(only shown for a skin with an E attack, or God Tom's pick-up/throw), Heal
(Nurse only) and Pause. Every card the game can show — the pause card, level
clear, game over, the hole's win/lose card, the shop and the hole's boss
picker — also gets big tappable buttons doing the same thing as their
keyboard shortcut, and the menu screen's rows, PLAY, mode switch, skin cycle
and mute are all tappable too. Holding a phone upright brings up a "turn your
phone sideways" overlay below 600px wide in portrait; an iPad plays
letterboxed upright with no overlay. See `src/systems/TouchInput.ts` for the
shared touch state and `UIScene.createTouchControls` for the on-screen
buttons — their exact positions, sizes and alphas are placeholders, easy to
nudge.

## Difficulty modes

Two modes, chosen on the menu with ← →: **Normal** and **Nearly Impossible**.
Each has its own, fully separate save — unlocks, best scores, coins, skins,
purchases, all of it. Normal keeps the original save
(`henrys-jump-quest-save`); Nearly Impossible gets its own
(`henrys-jump-quest-save-nearly-impossible`), starting fresh. The last mode
you picked is remembered in its own key, so the menu opens back into it.

Nearly Impossible changes every normal level and boss arena:

- **Enemies packed more densely** — a second copy of every enemy, offset
  90px inside its own patrol bounds.
- **Wider pits** — every gap between ground slabs grows from 180 to 220,
  still inside a full-speed jump. Everything past the gap (platforms,
  enemies, blocks, coins, icicles, checkpoints, the goal, the boss, the
  player's start) shifts right to make room; boss levels are one ground slab
  and are unaffected.
- **Fewer power-up blocks, but a wilder one** — a normal level keeps only its
  first power-up block (coin blocks are untouched); a boss arena keeps its
  first three, plus anything outside the arena. Every one left rolls a
  random power-up — Fireball, Star or Mushroom, or the dud rolls Heart,
  Cloud or 1-UP — fresh on every bump and every refill.
- **+1000 HP on every boss**, with `hitsToKill` scaled up to match, so the
  fight is genuinely longer rather than free extra HP that never gets used.

## What is in it

**Player** — a skin, from the table below. Press S on the menu to cycle through
whatever skins are available for the highlighted level. Stomp enemies from
above, or burn them.

**Skins** are no longer just a look: each carries its own max HP, run speed,
jump, and body size, and some carry an attack on **E**.

| Skin | How you get it | Max HP | Run speed | Jump | E attack |
| --- | --- | --- | --- | --- | --- |
| Tom | free | 100 | 320 | -760 | — |
| Henry | free | 100 | 320 | -760 | — |
| James | Boo: rent 20 coins / 3 levels, or 1000 forever | 90 | 1000 | -760 | — |
| Nurse | Boo: rent 100 coins / 20 levels, or 1000 forever | 100 | 320 | -760 | purse swing, 20 dmg, never hurts bosses |
| Tiny Guy | free forever once you beat the Galactic Raider (level 5) | 100 | 370 | -820 | hammer swing, 30 dmg |
| Shellcracker | Big Bob: 100 coins forever, once you have beaten him; also free to wear while replaying level 3 | 100 | 320 | -760 | backside fire, 50 dmg |
| Galactic Raider | Big Bob: 100 coins forever, once you have beaten him; also free to wear while replaying level 5 | 100 | 320 | -760 | star sword — a quarter of a target's own max HP per hit, so any ordinary enemy or minion dies in 4 hits |

James's run speed genuinely overshoots — Henry was warned and kept it anyway.
Shellcracker's costume also walks backwards, at 160, when you hold Left and
Right together (everyone else just stands still). No E attack ever damages a
boss, whatever it does to ordinary enemies.

**Dying** — you get 5 lives per attempt, plus any 1-UPs you have banked. A death
puts you back on the last ground you stood on safely, so it costs you a few
steps, never the level. Run out of lives and the level you had *not yet
finished* re-locks — a level you have actually completed is never taken away,
and a banked 1-UP is spent automatically to save the run first.

**Power-ups**, one held at a time, shown in the HUD:

- **Cloud** — a double jump, with a puff of cloud under your feet on the second
  jump. ↓ spends the same air-jump, so either key works.
- **Fireball** — a fireball with eyes. ↓ throws one. 12 charges per pickup.
- **Heart** — heals 30 HP on pickup.
- **Super Star** — 9 seconds of invincibility. Enemies die on contact. Against a
  boss it takes a huge bite instead of killing: the first star drops it to half
  health, and after that it hits like an ordinary attack.
- **God Mushroom** — 12 seconds as an enormous angry toadstool: invincible,
  faster, a much higher jump, a free double jump, and triple damage.
- **1-UP** — an extra life. Found in boss arenas, or rolled by a random block.
- **Kitty Suit** — held, not instant. ↓ scratches in front of you (the same
  kind of swing as a skin's E attack), taking an eighth of the target's max
  HP. Unlimited uses, a short cooldown between them, and **no good against
  bosses** — it never damages one. Not sold, and never rolled by a random
  block.

Star and Mushroom fire the moment you touch them, and **never carry into the
next level** — every level starts you plain, unless you bought one in the shop.

**Coins and the shop** — coins come from the level, from ? blocks (a power-up
block has a 50% chance of 4 coins as well as its power-up), 2 for every enemy
you kill and 300 for beating a boss. They go in the bank when you finish a
level. After every normal level **Boo Mommy Bag** turns up on the level-clear
card with her two llamas; after a **boss** level, **Big Bob** — a teddy bear
"bigger than everything on screen" — turns up instead, with five llamas of his
own (Henry claims he has "twelve hundred"; that part is a joke). Click either
to shop:

| Item | Price | What you get |
| --- | --- | --- |
| Fireball | 50 | start the next level holding 12 fireballs |
| Cloud | 50 | start the next level holding the cloud |
| Super Star | 100 | the star for the whole of your next 3 levels |
| God Mushroom | 1000 | the God Mushroom for the whole of your next level |
| James (rent) | 20 | wear James for the next 3 levels |
| James (forever) | 1000 | own James for good |
| Nurse (rent) | 100 | wear the Nurse for the next 20 levels |
| Nurse (forever) | 1000 | own the Nurse for good |
| God Tom | 10,000 | own God Tom for good — listed from the start as a goal |

Big Bob only sells Shellcracker and Galactic Raider, and only once you have
beaten the boss in question — 100 coins each, forever. God Tom is Boo's, not
Big Bob's, and is free the moment you have beaten the last level, whatever it
costs — see God Tom, below.

A bought Star or Mushroom comes back if you fall down a pit. A skin rental
counts down by one level every time you finish a level, whichever skin you
happened to be wearing, and buying any skin puts it on immediately. Renting a
skin you already own, or already have rented, is refused — nothing is sold
twice here either.

**Switching skins mid-level** — behind `SKINS_CONFIG.switchMidLevel` in
`src/config/skins.ts` (on by default). With it on, the pause card lists every
skin available to you, numbered; press a number to switch on the spot. It
refuses if the new body would not fit where you are standing (Tiny Guy ducking
somewhere Tom cannot fit, say). John asked for this over Henry's objection
that it is "cheating" — flip the flag off to remove it without ripping the
feature back out.

**The Moo Moo Cow Mom Hole** — a dark, cow-print-rimmed hole with a sign
above it ("MOO MOO COW MOM HOLE ↓"), sitting on the ground near the start of
every normal level you have already beaten in the current mode (John's rule:
it is a shortcut through a level you have done before, not a way past a new
one; never a boss level, and never a gap in the ground —
purely decoration and a trigger). Stand on it and press ↓ to drop in. Pick
any boss you have already beaten in the current mode with ↑ ↓ and ENTER (or a
click); ESC climbs back out. Beat one and you get a **weaker copy**: 1000 HP
in Normal mode, with `hitsToKill` scaled down to match (minimum 6 hits); in
Nearly Impossible the hole boss keeps its ordinary (not +1000) HP instead.
Winning drops you back into the level you came from, 200px before its goal
flag, so touching the flag clears the level the normal way — the hole can
never be used to skip a boss level, because it only ever exists on normal
ones. **Nothing about the hole touches the bank**: no coins, no best score,
no `recordLevelClear`, just a small "YOU BEAT IT!" card before you return.
Losing all your lives in the hole sends you back to the level's own start,
no re-lock penalty.

**God Tom** — Boo's, not Big Bob's: listed in the shop from the very start,
10,000 coins, so it is a visible goal from the first time you open the shop.
Once `clearedLevel` reaches the last level in `LEVELS` he unlocks by himself,
like Tiny Guy after level 5 — no trip to the shop needed. Buying him owns him
forever. Base stats are Tom's.

- **Kill stacking** — every kill while wearing God Tom adds a stack of that
  enemy's own stats for 9 seconds: its max HP (added to both your max and
  current HP) and half its speed (added to your run speed). Stacks, no cap;
  each expires on its own clock, and expiring only ever lowers your max HP,
  clamping current HP down if it now exceeds the new max. The HUD shows
  "POWER ×N" while any are live.
- **Pick up and throw** — E picks up the nearest ordinary enemy within about
  80px in front of you (never a galactic minion, never a boss) and carries it
  overhead; E again throws it in the direction you are facing. It kills any
  ordinary enemy it hits on the way (a kill like any other — coins, score,
  a God Tom stack) and is destroyed on impact or after 1.5 seconds. It is
  never a hit on a boss — a thrown enemy that reaches one just falls and dies.
- **No flying.** It was in the brainstorm; cut here.

**Enemies**

- **Mushroom** — plants itself, then lobs a spore. Slows you badly for a couple
  of seconds and takes 5 HP. Stompable.
- **Fire Foe** — a living flame that hops and spits fireballs (8 HP). You cannot
  stomp it; burn it instead.
- **Snappy Turtle** — plods until you come close, then charges and bites for
  10 HP. Stompable.
- **Butterfly** — flies overhead and drips sticky rain. 1 HP, but it pins you
  in place for a moment.
- **Kitty** — patrols, then dashes at you when you come close. Its scratch
  takes an eighth of your health (13 of Tom's 100). Stompable.

**Hazards** — rings of icicles spinning on a fixed point. Touching one takes
5 HP and freezes you briefly.

**Bosses**

**Shellcracker**, 1,010 HP (Henry raised it from 1,000; `hitsToKill` is still
16, so the fight is the same length). Alternates two loudly telegraphed attacks:
arcing shells that can reach the side ledges, and a stream of fire along the
ground that cannot. So the floor is safe from shells and exposed to fire, and
the ledges are the other way round — that trade is the fight. Halfway down it
enrages and speeds up. Only fireballs hurt it; the arena has ? blocks that
refill so you can never run dry. It marches forward at you and never backs off.

Its fire comes out of its backside. That began as a sprite-flip mistake, it made
the boys laugh, and it is now deliberate — see `faceTarget` in `BossBase.ts`.
Please do not fix it.

**Galactic Raider**, 10,000 HP, "Pillager of Stars". Ordinary attacks bounce off
its star-plate armour — **only power-ups hurt it**, which is the puzzle of the
fight. Two of its three attacks kill outright from full health, so both get a
long, loud wind-up: a fan of galactic bullets, and a star sword swipe that only
covers the ground directly in front of it. The third calls in galactic minions —
ordinary enemies in the boss's colours, three times the health, and two hits
will finish you.

Big HP numbers are for show. What actually sets fight length is `hitsToKill` in
`config/bosses.ts`: each landed power-up hit removes `maxHp / hitsToKill`, so a
10,000 HP boss and a 1,000 HP boss both die in a sensible number of hits.

## Decisions the brief left open

The brainstorm deliberately left a lot unspecified. What I chose, and why:

- **Five levels** — three platforming, two boss arenas.
- **Deaths cost steps, not levels.** The game quietly remembers the last ground
  you stood on safely and puts you back there. Checkpoint flags still exist as
  visible landmarks, but they are no longer the only thing standing between a
  kid and the start of the level.
- **Re-locking only takes the unearned level.** Henry and Tom asked for levels to
  re-lock on death. Losing a level you had already beaten would be miserable, so
  the penalty can only ever remove the *next* level — the one you had been given
  but never finished.
- **Instant-kill attacks are survivable by design.** Both of the Raider's lethal
  attacks have a long telegraph, a named on-screen warning, and a safe place to
  stand. A Star or Mushroom shrugs them off entirely.
- **Stomping kills.** Not in the brief, but a platformer that feels like the one
  they described needs it.
- **A single power-up slot.** Picking one up replaces the last. Keeps the HUD to
  one line and ↓ to one meaning.
- **The block coin roll pays only on a block's first bump.** Boss-arena blocks
  refill every nine seconds, and a roll on every refill made the arena a coin
  farm.
- **Bought Stars and Mushrooms count down when you finish a level**, not when
  you start one, so quitting never wastes one.
- **One bought transformation at a time.** A Star and a Mushroom cannot both
  run, so the shop will not sell the second while the first has levels left.
- **Nothing is sold twice.** Anything already waiting for you is greyed out,
  and so is a second Fireball or Cloud — there is one held slot, and the new
  one would quietly push out the one you paid for.
- **Boss damage is capped** at 10% of its max HP per hit, so no single trick ends
  the fight early.
- **Freezes are short** (0.9s) and never happen in mid-air. Being frozen over a
  gap is an unavoidable death, so icicles only freeze you when you are standing
  on something.
- **The spore slow applies on the ground only.** At the slowed speed a running
  jump could not clear a gap at all, which turned a slow into a soft-lock.
- **Icicle traps sit well back from pit edges.** A hit taken on the lip of a gap
  knocks you in, and no amount of skill saves you from that.
- **ESC pauses instead of quitting, and restart needs Shift.** A bare R sits
  right next to the WASD keys.
- **Original boss**, named Shellcracker rather than the Nintendo character the
  kids first reached for.
- **Art is drawn in code** (`src/scenes/BootScene.ts`), one function per texture.
  No asset pipeline to keep in sync.
- **Sound is synthesised** (`src/systems/SoundSystem.ts`) — short WebAudio blips,
  no audio files.
- **Fixed 1280x720, scaled to fit.** `Scale.RESIZE` misbehaves in embedded panes.

### Skin numbers that are placeholders, not Henry's

The skins brief gave exact numbers for some stats (marked (H) in the design
notes) and left the rest for this pass to fill in. Every one of these lives in
`src/config/skins.ts` with a `// placeholder: not Henry's number` comment, so
they are easy to find and easy to change:

- **Tiny Guy's max HP (100), run speed (370), jump (-820), and body size
  (26×36)** — nothing in the brief pinned these down beyond "much smaller".
- **Shellcracker and Galactic Raider's max HP (100), run speed (320) and jump
  (-760) as skins** — set equal to Tom's, since nothing suggested the boss
  costumes should move differently from an ordinary kid.
- **All four attack cooldowns** (purse 400ms, hammer 450ms, sword 400ms,
  backfire 500ms) — Henry specified damage, not pacing.
- **The melee swing hitbox** (roughly 64×50 in front of the player) and the
  backfire projectile's speed and lifetime.
- **Rentals count down whichever skin you actually wore**, not just the rented
  one, and every active rental counts down together — tracking per-skin
  play-time felt like more machinery than a kid's shop needs.
- **Buying a skin puts it on immediately.** Not asked for, but leaving a freshly
  bought skin unworn seemed like the more confusing default.
- **`SKINS_CONFIG.switchMidLevel` defaults to on.** John's call, over Henry's
  "that's cheating" — see Controls and the shop section above.

### Placeholders from the modes / Kitty suit / hole / God Tom slice

Every one of these lives with a `// placeholder: not Henry's number` comment
in `src/config/game.ts`, `src/config/hardMode.ts` or `src/config/mooMoo.ts`:

- **← → switches mode on the menu**, and its own localStorage key is named
  `henrys-jump-quest-mode` — nothing in the brief named a key or a control.
- **Fully separate saves per mode**, down to unlocks, scores, coins, skins
  and purchases — Henry only asked for separate saves and high scores; this
  pass took "fully separate" as the simplest, least surprising reading.
- **Enemy density: a second copy, offset 90px** inside the enemy's own patrol
  bounds — Henry asked for "packed more densely", not a number.
- **Gap widen: 40px** (180 → 220) — chosen to still sit inside a full-speed
  jump of about 270px, so the level stays winnable, just tighter.
- **Boss `hitsToKill` scaling formula** (`hitsToKill * (hp + 1000) / hp`,
  rounded) — otherwise the extra HP would change nothing, since fight length
  is set by `hitsToKill`, not HP; see the Bosses section above.
- **The `'random'` block pool's odds** — equal across all six kinds. Henry
  named which three are the live rolls and which three are the duds, not the
  weights.
- **Kitty suit scratch cooldown (250ms)** — Henry specified the damage (an
  eighth of the target's max HP), not the pacing between scratches.
- **God Tom's "stats" for the kill-stacking bonus** — full max HP plus half
  the killed enemy's speed. Henry said "that enemy's stats"; this pass chose
  what that means in code.
- **God Tom's pickup range (~80px), throw speed and throw lifetime (1.5s)** —
  Henry specified the shape of the move, not these numbers.
- **God Tom's art** — a golden glow and a crown on Tom's own sprite, base
  stats equal to Tom's.
- **The Moo Moo Hole's position (`playerStart.x + 260`), the hole boss's
  arena position (x ≈ 1800), its minimum `hitsToKill` (6, so it can never be
  a one-hit kill), and the return spawn point (200px before the goal)** —
  the brief said "a weaker copy" and "at the start of every level"; these
  pin down exactly where and how much weaker.
- **The Moo Moo arena itself** (a new `MOO_MOO_ARENA`-style template in
  `src/config/mooMoo.ts`: flat ~2400px ground, two dodge ledges and a high
  one like level 3, four refilling blocks) — built to match the brief's
  description, not copied from an existing level.
- **The menu's two-column level grid**, switching in once `LEVELS` holds more
  than six entries — the brief asked only that nothing overlap at 11 rows.

## Adding to it

- **A level** is data: add a `LevelDef` to `src/config/levels.ts`. Platform x/y is
  the top-left corner; anything standing on the floor is placed by its feet.
- **An enemy** is a stat block in `src/config/enemies.ts`, a texture in
  `BootScene`, and a subclass of `Enemy` implementing `behave()`.
- **A power-up** is an entry in `src/config/powerups.ts` plus a case in
  `GameScene.onPickup`.
- **A boss** is a def in `src/config/bosses.ts` plus a subclass of `BossBase`
  supplying `pickAttack`, `telegraphFor` and `launchAttack`.
- **A skin** is a `SkinDef` in `src/config/skins.ts` (stats, body size, optional
  E attack), poses drawn in `BootScene`, and its unlock/shop rule wired into
  `availableSkins` and `blockedReason` in `src/systems/SaveSystem.ts`.
- **Tuning** — jump height, speed, damage and cooldowns all live in
  `src/config/game.ts`.
- **Nearly Impossible's level changes** are one pure function,
  `nearlyImpossible()` in `src/config/hardMode.ts`, over a `LevelDef` — add a
  level to `LEVELS` and it is covered automatically, no extra wiring.
- **The Moo Moo Hole** is `mooMooArena()` and `weakenHoleBoss()` in
  `src/config/mooMoo.ts`, plus `HoleScene.ts` for the picker — generic over
  whichever bosses `BOSSES` holds.

## Layout

```
src/
  config/     levels, enemies, bosses, power-ups, tuning, hard mode, the hole
  entities/   Player, Projectile, blocks, pickups, flags, hazards, the hole
    enemies/  Enemy base + Mushroom, FireFoe, SnappyTurtle, Butterfly
    bosses/   BossBase + Shellcracker, GalacticRaider
  scenes/     Boot (all the art), Menu, Game, UI, Shop, Hole
  systems/    Backdrop, SaveSystem, SoundSystem, ModeSystem
```

Progress (unlocked levels, levels cleared, best scores, banked 1-UPs, your
chosen skin, your coins and anything bought in the shop) is saved to
`localStorage`.

## The mid-level reset bug

Reported as: *"you get about halfway through a level and it sends you back to
the beginning."* Two real causes, both fixed:

1. **Checkpoints sat behind the early hazards.** Level 1's first flag was at
   x=1800 but its first pit was at x=1400; level 2's first flag was at x=2200
   with pits at 900 and 1900. Dying at an early hazard genuinely rewound the
   whole level. Deaths now return you to the last ground you stood on safely.
2. **A bare `R` restarted the level instantly**, and R is one key away from
   WASD. Restart now needs Shift, and ESC opens a pause card rather than
   dumping you out.

Found while testing the same area: `checkDeath` guarded on `isAlive`, which is
false the moment HP reaches zero — so **death by damage never fired at all**.
The player sat at 0 HP until they happened to fall down a pit. Fixed.

## The levels 6-11 expansion

Six more levels, a new enemy, and three new bosses — all Shellcracker's
family, since that was too good a joke to leave alone.

- **Kitty** — a small cat that patrols, then dashes in fast for a scratch and
  pauses before going again. Stompable. Its scratch takes an eighth of Tom's
  max HP, per Henry.
- **Shellcracker's Mom**, "The Big-Haired Menace" — hand whip, spanking hands
  and her own backside fire breath. She keeps three minions alive at all
  times, drawn at random from mushrooms, snappy turtles and kitties, and every
  one of them vanishes the moment she does.
- **Kitty Raider**, "Queen of Scratches" — furballs, a scratch-mark swipe, and
  a screech that stuns for 3 seconds and cannot be dodged. Fairness rule: she
  does nothing else until the stun has ended plus a buffer. Starts the fight
  with three kitties, and every one that dies is replaced by three more, up to
  the game's usual 8-alive cap.
- **Shellcracker's Dad, "Boo Boo Bot Head"** — laser eyes (he puts his glasses
  on first), a spank, backside fire, and a computer he gets out to call in up
  to two reinforcements at a time.

All three fights work like Shellcracker's: only fireballs (and star/mushroom
touches) hurt them, long loud telegraphs, and an enrage at half health. Their
minions are never galactic and never bosses — that distinction stays the
Galactic Raider's alone.

**Minions got an owner.** `spawnMinion` now takes an optional `owner` so a
boss can find and clear exactly the enemies it summoned, and an optional
`galactic` flag (default true, so the Raider is unchanged) for a boss that
wants an ordinary-strength minion instead. A boss def can set
`clearMinionsOnDeath` to have every minion it owns pop when it dies.

**Tiny tunnels.** A `LevelDef` can carry `tunnels`: solid walls with a 44px
slot above the floor. Tom (58 tall) cannot fit through; Tiny Guy (36 tall)
can. A sign reading "TINY GUY ONLY" marks the entrance. All three new boss
levels put one between the approach and the arena.

Every new number not explicitly given by Henry is marked `// placeholder: not
Henry's number` at its definition in `config/bosses.ts` and
`config/enemies.ts` — level names among them, since none of the six were
specified.
