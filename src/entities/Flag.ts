import Phaser from 'phaser';

/** Mid-level checkpoint. Lights up the first time you touch it. */
export class Checkpoint extends Phaser.Physics.Arcade.Sprite {
  activated = false;

  constructor(scene: Phaser.Scene, x: number, feetY: number) {
    super(scene, x, feetY, 'flag-check-off');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setDepth(5);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(30, 120);
    body.setOffset(0, 0);
  }

  activate(): void {
    if (this.activated) return;
    this.activated = true;
    this.setTexture('flag-check-on');
    this.scene.tweens.add({
      targets: this,
      scaleY: { from: 1.2, to: 1 },
      duration: 260,
      ease: 'Back.Out',
    });
  }
}

/** The end of the level. */
export class GoalFlag extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, feetY: number) {
    super(scene, x, feetY, 'flag-goal');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setDepth(5);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(60, 120);
    body.setOffset(0, 0);

    scene.tweens.add({
      targets: this,
      scaleX: 0.94,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }
}
