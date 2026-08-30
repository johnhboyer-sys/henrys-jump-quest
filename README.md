# Jump Quest

A 2D side-scrolling platformer built from Henry and Tom's brainstorm.
Five levels, four enemies, five power-ups, two bosses and two playable skins.

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
| ESC | Pause (Q from the pause card leaves the level) |
| Shift+R | Restart the level |
| S | Swap skin (menu screen) |
| M | Mute (menu screen) |

## What is in it

**Player** — 100 HP, and two skins: **Tom** in a red cap, **Henry** with brown
hair, blue eyes and a starry shirt. Press S on the menu to swap. Stomp enemies
from above, or burn them.

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
next level** — every level starts you plain.

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

## Adding to it

- **A level** is data: add a `LevelDef` to `src/config/levels.ts`. Platform x/y is
  the top-left corner; anything standing on the floor is placed by its feet.
- **An enemy** is a stat block in `src/config/enemies.ts`, a texture in
  `BootScene`, and a subclass of `Enemy` implementing `behave()`.
- **A power-up** is an entry in `src/config/powerups.ts` plus a case in
  `GameScene.onPickup`.
- **A boss** is a def in `src/config/bosses.ts` plus a subclass of `BossBase`
  supplying `pickAttack`, `telegraphFor` and `launchAttack`.
- **A skin** is a branch in `BootScene.drawKid` and an id in `SkinId`.
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

Progress (unlocked levels, levels cleared, best scores, banked 1-UPs and your
chosen skin) is saved to `localStorage`.

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
