import Phaser from 'phaser';
import type { EnemySpawn } from '../../config/levels';
import { Enemy } from './Enemy';
import { Mushroom } from './Mushroom';
import { FireFoe } from './FireFoe';
import { SnappyTurtle } from './SnappyTurtle';
import { Butterfly } from './Butterfly';
import { Kitty } from './Kitty';
import { WaterGuy } from './WaterGuy';
import { PoisonFlower } from './PoisonFlower';

export { Enemy, Mushroom, FireFoe, SnappyTurtle, Butterfly, Kitty, WaterGuy, PoisonFlower };
export { ELITE } from './Enemy';
export type { EnemyWorld } from './Enemy';

/** One place that turns level data into a living enemy. */
export function createEnemy(scene: Phaser.Scene, spawn: EnemySpawn, elite = false): Enemy {
  switch (spawn.kind) {
    case 'mushroom':
      return new Mushroom(scene, spawn, elite);
    case 'fireFoe':
      return new FireFoe(scene, spawn, elite);
    case 'snappyTurtle':
      return new SnappyTurtle(scene, spawn, elite);
    case 'butterfly':
      return new Butterfly(scene, spawn, elite);
    case 'kitty':
      return new Kitty(scene, spawn, elite);
    case 'waterGuy':
      return new WaterGuy(scene, spawn, elite);
    case 'poisonFlower':
      return new PoisonFlower(scene, spawn, elite);
  }
}
