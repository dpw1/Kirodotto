import { CONFIG } from '../config.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }
  
  init(data) {
    this.score = data.score || 0;
  }
  
  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Game Over text
    const gameOverText = this.add.text(width / 2, height * 0.3, 'GAME OVER', {
      fontFamily: CONFIG.fontFamily,
      fontSize: '48px',
      color: CONFIG.textColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Add animation to the text
    this.tweens.add({
      targets: gameOverText,
      scale: { from: 0.8, to: 1.1 },
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    
    // Score text
    this.add.text(width / 2, height * 0.45, `Score: ${this.score}`, {
      fontFamily: CONFIG.fontFamily,
      fontSize: '32px',
      color: CONFIG.textColor
    }).setOrigin(0.5);
    
    // Best score
    const bestScore = localStorage.getItem('bestScore') || 0;
    const bestScoreText = this.add.text(width / 2, height * 0.55, `Best: ${bestScore}`, {
      fontFamily: CONFIG.fontFamily,
      fontSize: '24px',
      color: CONFIG.textColor
    }).setOrigin(0.5);
    
    // Create buttons
    this.createButton(
      width / 2,
      height * 0.7,
      'Play Again',
      () => {
        this.scene.start('GameScene');
      }
    );
    
    this.createButton(
      width / 2,
      height * 0.8,
      'Main Menu',
      () => {
        this.scene.start('MainMenuScene');
      }
    );
    
    // Create confetti particles at random positions
    this.createParticleEffects();
  }
  
  createButton(x, y, text, callback) {
    const button = this.add.container(x, y);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x4444aa, 1);
    bg.fillRoundedRect(-120, -25, 240, 50, 10);
    
    const buttonText = this.add.text(0, 0, text, {
      fontFamily: CONFIG.fontFamily,
      fontSize: '24px',
      color: CONFIG.textColor
    }).setOrigin(0.5);
    
    button.add([bg, buttonText]);
    button.setSize(240, 50);
    button.setInteractive({ useHandCursor: true });
    
    // Add hover effect
    button.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x6666cc, 1);
      bg.fillRoundedRect(-120, -25, 240, 50, 10);
    });
    
    button.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x4444aa, 1);
      bg.fillRoundedRect(-120, -25, 240, 50, 10);
    });
    
    button.on('pointerdown', callback);
    
    return button;
  }
  
  createParticleEffects() {
    // Create a particle emitter for the confetti
    const confettiEmitter = this.add.particles(0, 0, 'particle', {
      speed: { min: 50, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.2, end: 0 },
      lifespan: 2000,
      blendMode: 'ADD',
      frequency: 100,
      quantity: 1
    });
    
    // Place the emitter at random positions
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height / 2);
      
      // Random color from the config palette
      const colorIndex = Phaser.Math.Between(0, CONFIG.ballColors.length - 1);
      const color = Phaser.Display.Color.HexStringToColor(CONFIG.ballColors[colorIndex]).color;
      
      // Create an emitter
      const emitter = confettiEmitter.createEmitter({
        x: x,
        y: y,
        tint: color
      });
      
      // Stop after a few seconds
      this.time.delayedCall(5000, () => {
        emitter.stop();
      });
    }
  }
} 