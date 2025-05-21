import { CONFIG } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { LevelCompleteScene } from './scenes/LevelCompleteScene.js';

// Calculate game dimensions based on the aspect ratio
const calculateGameDimensions = () => {
  const width = window.innerWidth;
  const height = window.visualViewport
    ? window.visualViewport.height
    : window.innerHeight;

  const aspectRatio = CONFIG.phoneAspectRatio;

  let gameWidth = height * aspectRatio;
  let gameHeight = height;

  if (gameWidth > width) {
    gameWidth = width;
    gameHeight = width / aspectRatio;
  }

  return {
    width: Math.floor(gameWidth),
    height: Math.floor(gameHeight)
  };
};
let dimensions = calculateGameDimensions();

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: dimensions.width,
  height: dimensions.height,
  backgroundColor: CONFIG.backgroundColor,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: dimensions.width,
    height: dimensions.height
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: [
    BootScene,
    MainMenuScene,
    GameScene,
    GameOverScene,
    LevelCompleteScene
  ]
};

// Create the game instance
const game = new Phaser.Game(config);

function resizeGame() {
  dimensions = calculateGameDimensions();
  game.scale.resize(dimensions.width, dimensions.height);
}

window.addEventListener('resize', resizeGame);
window.addEventListener('orientationchange', resizeGame);
resizeGame(); 