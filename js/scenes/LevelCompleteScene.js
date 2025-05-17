import { CONFIG } from '../config.js';

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelCompleteScene' });
  }
  
  init(data) {
    this.level = data.level || 1;
    this.score = data.score || 0;
  }
  
  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Level complete text
    const completeText = this.add.text(width / 2, height * 0.25, '🎉 Level Complete! 🎉', {
      fontFamily: CONFIG.fontFamily,
      fontSize: '36px',
      color: CONFIG.textColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Add animation to the text
    this.tweens.add({
      targets: completeText,
      scale: { from: 0.8, to: 1.1 },
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    
    // Level text
    this.add.text(width / 2, height * 0.4, `Level ${this.level} Completed`, {
      fontFamily: CONFIG.fontFamily,
      fontSize: '28px',
      color: CONFIG.textColor
    }).setOrigin(0.5);
    
    // Score text
    this.add.text(width / 2, height * 0.5, `Score: ${this.score}`, {
      fontFamily: CONFIG.fontFamily,
      fontSize: '24px',
      color: CONFIG.textColor
    }).setOrigin(0.5);
    
    // Next level info
    this.add.text(width / 2, height * 0.6, `Next Level: ${this.level + 1}`, {
      fontFamily: CONFIG.fontFamily,
      fontSize: '22px',
      color: CONFIG.textColor
    }).setOrigin(0.5);
    
    // Balls in next level
    const nextLevelBalls = CONFIG.initialBallCount + (this.level) * CONFIG.ballsPerLevel;
    this.add.text(width / 2, height * 0.65, `Balls: ${nextLevelBalls}`, {
      fontFamily: CONFIG.fontFamily,
      fontSize: '20px',
      color: CONFIG.textColor
    }).setOrigin(0.5);
    
    // Create buttons
    this.createButton(
      width / 2,
      height * 0.75,
      'Next Level',
      () => {
        this.scene.start('GameScene', { level: this.level + 1, score: this.score });
      }
    );
    
    this.createButton(
      width / 2,
      height * 0.85,
      'Main Menu',
      () => {
        this.scene.start('MainMenuScene');
      }
    );
    
    // Create particle effects
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
      speed: { min: 50, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      lifespan: 3000,
      blendMode: 'ADD',
      frequency: 50,
      quantity: 2
    });
    
    // Place the emitter at various positions
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Create multiple emitters with different colors
    CONFIG.ballColors.forEach((colorHex, index) => {
      const color = Phaser.Display.Color.HexStringToColor(colorHex).color;
      
      // Position each emitter at a different spot
      const x = width * (index + 1) / (CONFIG.ballColors.length + 1);
      const y = height * 0.2;
      
      // Create an emitter
      const emitter = confettiEmitter.createEmitter({
        x: x,
        y: y,
        tint: color
      });
      
      // Stop after several seconds
      this.time.delayedCall(7000, () => {
        emitter.stop();
      });
    });
  }
} 