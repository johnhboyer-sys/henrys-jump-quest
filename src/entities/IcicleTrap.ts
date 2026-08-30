import Phaser from 'phaser';
import type { IcicleDef } from '../config/levels';

/**
 * Icicles swinging round a fixed point. Touching one freezes you solid for a
 * moment — short on purpose, because being unable to move is the least fun
 * thing you can do to a player.
 */
export class IcicleTrap {
  readonly spikes: Phaser.Physics.Arcade.Sprite[] = [];
  private angle = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly def: IcicleDef,
    group: Phaser.Physics.Arcade.Group,
  ) {
    // A faint ring showing the path, so the danger zone is readable.
    const ring = scene.add.circle(def.x, def.y, def.radius, 0x000000, 0);
    ring.setStrokeStyle(2, 0x9fd8f0, 0.35);
    ring.setDepth(4);

    const hub = scene.add.circle(def.x, def.y, 9, 0x9fd8f0, 0.8);
    hub.setDepth(5);

    for (let i = 0; i < def.arms; i++) {
      const spike = group.create(def.x, def.y, 'icicle') as Phaser.Physics.Arcade.Sprite;
      spike.setDepth(11);
      spike.setOrigin(0.5, 0);
      const body = spike.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setImmovable(true);
      body.setSize(20, 56);
      body.setOffset(3, 4);
      this.spikes.push(spike);
    }
  }

  update(deltaMs: number): void {
    this.angle += this.def.speed * (deltaMs / 1000);
    const step = (Math.PI * 2) / this.spikes.length;

    this.spikes.forEach((spike, i) => {
      const a = this.angle + i * step;
      spike.x = this.def.x + Math.cos(a) * this.def.radius;
      spike.y = this.def.y + Math.sin(a) * this.def.radius;
      // Point outwards from the hub.
      spike.setRotation(a - Math.PI / 2);
      (spike.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
    });
  }
}
