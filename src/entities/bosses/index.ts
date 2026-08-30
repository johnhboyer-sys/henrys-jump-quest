import Phaser from 'phaser';
import { BOSSES } from '../../config/bosses';
import { BossBase } from './BossBase';
import { Shellcracker } from './Shellcracker';
import { GalacticRaider } from './GalacticRaider';

export { BossBase, Shellcracker, GalacticRaider };
export type { HitSource, TelegraphSpec } from './BossBase';

/** Turns a boss id from level data into the right boss. */
export function createBoss(
  scene: Phaser.Scene,
  id: string,
  x: number,
  feetY: number,
): BossBase {
  const def = BOSSES[id];
  switch (def.kind) {
    case 'galacticRaider':
      return new GalacticRaider(scene, def, x, feetY);
    case 'shellcracker':
    default:
      return new Shellcracker(scene, def, x, feetY);
  }
}
