import Phaser from 'phaser';
import { BossBase, type TelegraphSpec } from './BossBase';
import type { BossDef } from '../../config/bosses';

export class GardenerShellcracker extends BossBase {
  private turn = 0;
  constructor(scene: Phaser.Scene, def: BossDef, x: number, y: number) { super(scene, def, x, y); }
  protected override advance(): void { (this.body as Phaser.Physics.Arcade.Body).setVelocityX(0); }
  protected pickAttack(): string { return ['summon', 'rain', 'walls'][this.turn++ % 3]; } // placeholder: not Henry's number
  protected telegraphFor(name: string): TelegraphSpec {
    return name === 'summon' ? { label: 'SEEDS!', tint: 0xb7fa78 } :
      name === 'rain' ? { label: 'WATER RAIN!', tint: 0x70c9ff } :
      { label: 'WALLS GROW!', tint: 0x7ab35b };
  }
  protected launchAttack(name: string): number {
    if (name === 'summon') {
      for (const [kind, offset] of [['butterfly', -420], ['waterGuy', 400], ['poisonFlower', -620]] as const) {
        this.world.spawnMinion(kind, this.x + offset, { galactic: false, owner: this });
      }
    } else if (name === 'rain') this.world.startBossRain(this, false);
    else this.world.growPlantWalls(this.x);
    return 700; // placeholder: not Henry's number
  }
}
