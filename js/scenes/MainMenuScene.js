import { CONFIG } from '../config.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }
  
  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Title
    const title = this.add.text(width / 2, height * 0.25, 'KIRODOTTO', {
      fontFamily: CONFIG.fontFamily,
      fontSize: '48px',
      color: CONFIG.textColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Add title animation
    this.tweens.add({
      targets: title,
      scale: { from: 0.8, to: 1 },
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    
    // Create floating background balls
    this.createBackgroundBalls();
    
    // Best score
    const bestScore = localStorage.getItem('bestScore') || 0;
    this.add.text(width / 2, height * 0.4, `Best Score: ${bestScore}`, {
      fontFamily: CONFIG.fontFamily,
      fontSize: '24px',
      color: CONFIG.textColor
    }).setOrigin(0.5);
    
    // Start button
    const startButton = this.createButton(
      width / 2,
      height * 0.55,
      'Start Game',
      () => {
        this.scene.start('GameScene');
      }
    );
    
    // Options button
    const optionsButton = this.createButton(
      width / 2,
      height * 0.65,
      'Options',
      () => {
        this.showOptions();
      }
    );
    
    // Credits
    this.add.text(width / 2, height * 0.9, `Kirodotto v${CONFIG.version}`, {
      fontFamily: CONFIG.fontFamily,
      fontSize: '16px',
      color: CONFIG.textColor
    }).setOrigin(0.5);
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
  
  createBackgroundBalls() {
    // Create a group for the background balls
    this.balls = this.add.group();
    
    // Create 10 decorative balls
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(0, this.cameras.main.width);
      const y = Phaser.Math.Between(0, this.cameras.main.height);
      const size = Phaser.Math.Between(20, 40);
      
      // Random color from the config palette
      const colorIndex = Phaser.Math.Between(0, CONFIG.ballColors.length - 1);
      const color = Phaser.Display.Color.HexStringToColor(CONFIG.ballColors[colorIndex]).color;
      
      const ball = this.add.circle(x, y, size / 2, color);
      
      // Random velocity
      const speedX = Phaser.Math.FloatBetween(-0.5, 0.5);
      const speedY = Phaser.Math.FloatBetween(-0.5, 0.5);
      
      ball.speedX = speedX;
      ball.speedY = speedY;
      
      // Add to the group
      this.balls.add(ball);
    }
    
    // Update the balls in the update loop
    this.sys.events.on('update', this.updateBalls, this);
  }
  
  updateBalls() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    this.balls.getChildren().forEach((ball) => {
      // Move the ball
      ball.x += ball.speedX;
      ball.y += ball.speedY;
      
      // Bounce off the edges
      if (ball.x < 0 || ball.x > width) {
        ball.speedX *= -1;
      }
      
      if (ball.y < 0 || ball.y > height) {
        ball.speedY *= -1;
      }
    });
  }
  
  showOptions() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Create a panel for the options
    const panel = this.add.container(width / 2, height / 2);
    
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x000000, 0.8);
    panelBg.fillRoundedRect(-200, -150, 400, 300, 20);
    
    const titleText = this.add.text(0, -100, 'Options', {
      fontFamily: CONFIG.fontFamily,
      fontSize: '32px',
      color: CONFIG.textColor
    }).setOrigin(0.5);
    
    // Show hitbox option
    const hitboxText = this.add.text(-150, -40, 'Show Hitbox:', {
      fontFamily: CONFIG.fontFamily,
      fontSize: '18px',
      color: CONFIG.textColor
    }).setOrigin(0, 0.5);
    
    const hitboxSwitch = this.createSwitch(50, -40, CONFIG.showHitbox, (value) => {
      CONFIG.showHitbox = value;
    });
    
    // Debug option
    const debugText = this.add.text(-150, 10, 'Debug Mode:', {
      fontFamily: CONFIG.fontFamily,
      fontSize: '18px',
      color: CONFIG.textColor
    }).setOrigin(0, 0.5);
    
    const debugSwitch = this.createSwitch(50, 10, CONFIG.debugCode, (value) => {
      CONFIG.debugCode = value;
    });
    
    // Reset scores option
    const resetButton = this.createButton(0, 70, 'Reset Scores', () => {
      localStorage.removeItem('bestScore');
      this.scene.restart();
    });
    resetButton.setScale(0.7);
    
    // Debug Options button
    const debugOptionsButton = this.createButton(0, 120, 'Debug Options', () => {
      this.showDebugOptions(panel);
    });
    debugOptionsButton.setScale(0.7);
    
    // Close button
    const closeButton = this.createButton(0, 170, 'Close', () => {
      panel.destroy();
    });
    closeButton.setScale(0.7);
    
    panel.add([panelBg, titleText, hitboxText, hitboxSwitch, debugText, debugSwitch, resetButton, debugOptionsButton, closeButton]);
    
    // Add animation
    panel.setScale(0.5);
    this.tweens.add({
      targets: panel,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }
  
  createSwitch(x, y, initialValue, callback) {
    const container = this.add.container(x, y);
    
    // Background
    const bg = this.add.rectangle(0, 0, 60, 30, 0x333333);
    bg.setStrokeStyle(1, 0xffffff);
    
    // Knob - position it based on the initial value
    const knob = this.add.circle(initialValue ? 15 : -15, 0, 12, 0xffffff);
    
    // Change background color based on state
    if (initialValue) {
      bg.fillColor = 0x4444aa; // On - purple
    } else {
      bg.fillColor = 0x333333; // Off - dark gray
    }
    
    container.add([bg, knob]);
    container.setSize(60, 30);
    container.setInteractive({ useHandCursor: true });
    
    // Track the state
    container.value = initialValue;
    
    container.on('pointerdown', () => {
      // Toggle the value
      container.value = !container.value;
      
      // Move the knob
      this.tweens.add({
        targets: knob,
        x: container.value ? 15 : -15,
        duration: 100,
        ease: 'Power1',
        onComplete: () => {
          // Update the background color
          if (container.value) {
            bg.fillColor = 0x4444aa; // On - purple
          } else {
            bg.fillColor = 0x333333; // Off - dark gray
          }
          
          // Call the callback
          if (callback) callback(container.value);
        }
      });
    });
    
    return container;
  }
  
  showDebugOptions(parentPanel) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Create a panel for debug options
    const debugPanel = this.add.container(width / 2, height / 2);
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x222244, 0.95);
    panelBg.fillRoundedRect(-250, -200, 500, 400, 20);
    
    const titleText = this.add.text(0, -170, 'Debug Options', {
      fontFamily: CONFIG.fontFamily,
      fontSize: '32px',
      color: CONFIG.textColor
    }).setOrigin(0.5);
    
    let y = -120;
    const controls = [];
    for (const key in CONFIG) {
      if (!Object.prototype.hasOwnProperty.call(CONFIG, key)) continue;
      const value = CONFIG[key];
      if (typeof value === 'boolean') {
        const label = this.add.text(-200, y, key + ':', {
          fontFamily: CONFIG.fontFamily,
          fontSize: '18px',
          color: CONFIG.textColor
        }).setOrigin(0, 0.5);
        const checkbox = this.createSwitch(100, y, value, (v) => {
          CONFIG[key] = v;
        });
        debugPanel.add([label, checkbox]);
        controls.push(label, checkbox);
        y += 40;
      } else if (typeof value === 'number') {
        const label = this.add.text(-200, y, key + ':', {
          fontFamily: CONFIG.fontFamily,
          fontSize: '18px',
          color: CONFIG.textColor
        }).setOrigin(0, 0.5);
        const input = this.add.dom(100, y).createFromHTML(`<input type='number' value='${value}' style='width:80px'>`);
        input.addListener('change');
        input.on('change', (event) => {
          CONFIG[key] = parseFloat(event.target.value);
        });
        debugPanel.add([label, input]);
        controls.push(label, input);
        y += 40;
      } else if (typeof value === 'string') {
        const label = this.add.text(-200, y, key + ':', {
          fontFamily: CONFIG.fontFamily,
          fontSize: '18px',
          color: CONFIG.textColor
        }).setOrigin(0, 0.5);
        const input = this.add.dom(100, y).createFromHTML(`<input type='text' value='${value}' style='width:120px'>`);
        input.addListener('change');
        input.on('change', (event) => {
          CONFIG[key] = event.target.value;
        });
        debugPanel.add([label, input]);
        controls.push(label, input);
        y += 40;
      }
      // Skip arrays/objects for now
    }
    
    // Close button
    const closeButton = this.createButton(0, 180, 'Close', () => {
      debugPanel.destroy();
      if (parentPanel) parentPanel.setVisible(true);
    });
    closeButton.setScale(0.7);
    debugPanel.add([panelBg, titleText, closeButton]);
    
    // Hide parent panel while debug is open
    if (parentPanel) parentPanel.setVisible(false);
    
    // Animate
    debugPanel.setScale(0.5);
    this.tweens.add({
      targets: debugPanel,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }
  
  shutdown() {
    // Clean up event
    this.sys.events.off('update', this.updateBalls, this);
  }
} 