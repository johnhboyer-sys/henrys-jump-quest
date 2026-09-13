# Jump Quest

A 2D side-scrolling platformer built from Henry and Tom's brainstorm.
Five levels, four enemies, five power-ups, two bosses and seven playable skins.

## Run it

```
npm install
npm run dev
```

Then open the URL Vite prints. `npm run build` type-checks and bundles to `dist/`.

## Controls

| Key | Does |
| --- | --- |
| ← → | Run (A / D also work) |
| ↑ | Jump — hold for a higher one (W / Space also work) |
| ↑ again | Double jump, if you are holding the Cloud |
| ↓ | Use the power-up you are holding (S also works) |
| E | Your skin's attack, if it has one (see Skins below) |
| H | Nurse only: spend 20 coins to heal to full |
| ESC | Pause (Q from the pause card leaves the level; number keys switch skin, if the mid-level switch is turned on) |
| Shift+R | Restart the level |
| S | Cycle skins (menu screen) |
| M | Mute (menu screen) |

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
- **1-UP** — an extra life. Only ever found in boss arenas.

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

Big Bob only sells Shellcracker and Galactic Raider, and only once you have
beaten the boss in question — 100 coins each, forever.

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

**Enemies**

- **Mushroom** — plants itself, then lobs a spore. Slows you badly for a couple
  of seconds and takes 5 HP. Stompable.
- **Fire Foe** — a living flame that hops and spits fireballs (8 HP). You cannot
  stomp it; burn it instead.
- **Snappy Turtle** — plods until you come close, then charges and bites for
  10 HP. Stompable.
- **Butterfly** — flies overhead and drips sticky rain. 1 HP, but it pins you
  in place for a moment.

**Hazards** — rings of icicles spinning on a fixed point. Touching one takes
5 HP and freezes you briefly.

**Bosses**

**Shellcracker**, 1,000 HP. Alternates two loudly telegraphed attacks:
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

## Layout

```
src/
  config/     levels, enemies, bosses, power-ups, tuning
  entities/   Player, Projectile, blocks, pickups, flags, hazards
    enemies/  Enemy base + Mushroom, FireFoe, SnappyTurtle, Butterfly
    bosses/   BossBase + Shellcracker, GalacticRaider
  scenes/     Boot (all the art), Menu, Game, UI
  systems/    Backdrop, SaveSystem, SoundSystem
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
