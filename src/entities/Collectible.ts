import Phaser from 'phaser';
import { POWERUPS, type PowerUpKind } from '../config/powerups';

/** A coin. Spins, bobs, worth points. */
export class Coin extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'pw-coin');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(8);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(26, 26);

    scene.tweens.add({
      targets: this,
      scaleX: 0.25,
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    scene.tweens.add({
      targets: this,
      y: y - 7,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  collect(): void {
    const scene = this.scene;
    const { x, y } = this;
    this.destroy();
    const pop = scene.add.image(x, y, 'pw-coin').setDepth(30);
    scene.tweens.add({
      targets: pop,
      y: y - 46,
      alpha: 0,
      scale: 1.4,
      duration: 320,
      onComplete: () => pop.destroy(),
    });
  }
}

/**
 * A power-up sitting in the world, either placed directly or popped out of a
 * question block.
 */
export class PowerUpPickup extends Phaser.Physics.Arcade.Sprite {
  readonly kind: PowerUpKind;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: PowerUpKind) {
    super(scene, x, y, POWERUPS[kind].texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.kind = kind;
    this.setDepth(9);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);

    // Emerge from the block, then hover.
    this.setScale(0.4);
    scene.tweens.add({
      targets: this,
      y: y - 52,
      scale: 1,
      duration: 320,
      ease: 'Back.Out',
      onComplete: () => {
        scene.tweens.add({
          targets: this,
          y: this.y - 8,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        });
      },
    });
  }

  collect(): void {
    const scene = this.scene;
    const { x, y } = this;
    const label = POWERUPS[this.kind].label;
    this.destroy();

    const text = scene.add
      .text(x, y - 20, label.toUpperCase() + '!', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(30);
    scene.tweens.add({
      targets: text,
      y: y - 70,
      alpha: 0,
      duration: 700,
      onComplete: () => text.destroy(),
    });
  }
}
