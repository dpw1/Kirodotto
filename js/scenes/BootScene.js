import { CONFIG } from '../config.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Create loading UI
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Loading text
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      font: '24px Arial',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Progress bar background
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 10, 320, 50);
    
    // Progress bar
    const progressBar = this.add.graphics();
    
    // Loading progress event
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2, 300 * value, 30);
    });
    
    // Loading complete event
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
    
    // Simulate loading delay
    this.simulateLoadingDelay();
  }

  simulateLoadingDelay() {
    // Add an artificial delay to show the loading bar
    let loadingProgress = 0;
    
    // Create a synthetic loading progress
    const progressInterval = setInterval(() => {
      loadingProgress += 0.1;
      this.load.emit('progress', loadingProgress);
      
      if (loadingProgress >= 1) {
        clearInterval(progressInterval);
        this.load.emit('complete');
      }
    }, 100);
  }

  create() {
    this.scene.start('MainMenuScene');
  }
} 