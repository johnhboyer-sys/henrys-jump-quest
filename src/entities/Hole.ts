import Phaser from 'phaser';

/**
 * The Moo Moo Cow Mom Hole. Sits on the floor near the start of every normal
 * level (not a gap — art drawn on top of the ground). Standing on it and
 * pressing Down drops the player into a rematch against a boss they have
 * already beaten. See `GameScene` for the overlap flag and `HoleScene` for
 * the boss picker.
 */
export class MooMooHole extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, feetY: number) {
    super(scene, x, feetY, 'hole-moomoo');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setOrigin(0.5, 1);
    this.setDepth(4);

    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(90, 28);
    body.setOffset((this.width - 90) / 2, this.height - 28);

    scene.add
      .text(x, feetY - 66, 'MOO MOO COW MOM HOLE ↓', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#ffe27a',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(5);
  }
}
