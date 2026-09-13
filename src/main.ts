import Phaser from 'phaser';
import { VIEW, PHYSICS } from './config/game';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { ShopScene } from './scenes/ShopScene';
import { HoleScene } from './scenes/HoleScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#10121c',
  // Fixed size, scaled to fit. RESIZE misbehaves inside embedded panes.
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: VIEW.width,
    height: VIEW.height,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: PHYSICS.gravity },
      debug: false,
    },
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
  scene: [BootScene, MenuScene, GameScene, UIScene, ShopScene, HoleScene],
};

const game = new Phaser.Game(config);

// Handy for poking at the game from the browser console.
(window as unknown as { __game: Phaser.Game }).__game = game;
