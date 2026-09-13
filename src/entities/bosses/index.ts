import Phaser from 'phaser';
import { BOSSES, type BossDef } from '../../config/bosses';
import { BossBase } from './BossBase';
import { Shellcracker } from './Shellcracker';
import { GalacticRaider } from './GalacticRaider';
import { ShellcrackerMom } from './ShellcrackerMom';
import { KittyRaider } from './KittyRaider';
import { ShellcrackerDad } from './ShellcrackerDad';

export { BossBase, Shellcracker, GalacticRaider, ShellcrackerMom, KittyRaider, ShellcrackerDad };
export type { HitSource, TelegraphSpec } from './BossBase';

/**
 * Turns a boss id from level data into the right boss. `defOverride` lets a
 * caller hand over a modified copy of the boss's stats (Nearly Impossible's
 * +1000 HP, or the Moo Moo Hole's weaker rematch copy) without touching the
 * shared `BOSSES` config, which every other fight still reads unmodified.
 */
export function createBoss(
  scene: Phaser.Scene,
  id: string,
  x: number,
  feetY: number,
  defOverride?: BossDef,
): BossBase {
  const def = defOverride ?? BOSSES[id];
  switch (def.kind) {
    case 'galacticRaider':
      return new GalacticRaider(scene, def, x, feetY);
    case 'shellcrackerMom':
      return new ShellcrackerMom(scene, def, x, feetY);
    case 'kittyRaider':
      return new KittyRaider(scene, def, x, feetY);
    case 'shellcrackerDad':
      return new ShellcrackerDad(scene, def, x, feetY);
    case 'shellcracker':
    default:
      return new Shellcracker(scene, def, x, feetY);
  }
}
