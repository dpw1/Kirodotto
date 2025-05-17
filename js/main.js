import { CONFIG } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { LevelCompleteScene } from './scenes/LevelCompleteScene.js';

// Calculate game dimensions based on the aspect ratio
const calculateGameDimensions = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspectRatio = CONFIG.phoneAspectRatio;
  
  let gameWidth, gameHeight;
  
  // Always use 100% of the height
  gameHeight = height;
  gameWidth = gameHeight * aspectRatio;
  
  // If the calculated width is greater than the window width,
  // adjust to fit the window width
  if (gameWidth > width) {
    gameWidth = width;
    gameHeight = gameWidth / aspectRatio;
  }
  
  return { width: Math.floor(gameWidth), height: Math.floor(gameHeight) };
};

const dimensions = calculateGameDimensions();

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: dimensions.width,
  height: dimensions.height,
  backgroundColor: CONFIG.backgroundColor,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.RESIZE,
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

// Handle resize
window.addEventListener('resize', () => {
  const dimensions = calculateGameDimensions();
  game.scale.resize(dimensions.width, dimensions.height);
}); 