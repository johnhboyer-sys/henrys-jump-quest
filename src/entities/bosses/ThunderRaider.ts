import Phaser from 'phaser';
import { BossBase, type TelegraphSpec } from './BossBase';
import type { BossDef } from '../../config/bosses';

export class ThunderRaider extends BossBase {
  private turn = 0;
  private anchorY: number;
  constructor(scene: Phaser.Scene, def: BossDef, x: number, y: number) {
    super(scene, def, x, y);
    // Low enough that floor shots land most of the time, ledge shots always.
    this.anchorY = y - 25; // placeholder: not Henry's number
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.setY(this.anchorY);
    (this.body as Phaser.Physics.Arcade.Body).reset(x, this.anchorY);
  }
  protected override advance(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.faceTarget();
    body.setVelocityX(Math.abs(this.world.player.x - this.x) > 180 ? Math.sign(this.world.player.x - this.x) * this.def.walkSpeed : 0); // placeholder: not Henry's number
  }
  override preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.active || this.isDead || this.scene.time.paused) return;
    (this.body as Phaser.Physics.Arcade.Body).setVelocityY((this.anchorY + Math.sin(time / 750) * 25 - this.y) * 3); // placeholder: not Henry's number
  }
  protected pickAttack(): string { return ['summon', 'cloud', 'lightning'][this.turn++ % 3]; } // placeholder: not Henry's number
  protected telegraphFor(name: string): TelegraphSpec {
    return name === 'summon' ? { label: 'WATER GUYS!', tint: 0x93d9ff } :
      name === 'cloud' ? { label: 'FOLLOWING RAIN!', tint: 0x6f98ba } :
      { label: 'LIGHTNING!', tint: 0xffed80 };
  }
  protected launchAttack(name: string): number {
    if (name === 'summon') {
      this.world.spawnMinion('waterGuy', this.x - 350, { galactic: false, owner: this }); // placeholder: not Henry's number
      this.world.spawnMinion('waterGuy', this.x + 350, { galactic: false, owner: this }); // placeholder: not Henry's number
    } else if (name === 'cloud') this.world.startBossRain(this, true);
    else this.world.startLightningStrikes(this);
    return 700; // placeholder: not Henry's number
  }
}
