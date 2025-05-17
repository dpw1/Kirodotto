import { CONFIG } from '../config.js';
import { UIManager } from '../utils/uiManager.js';
import { DragHandler } from '../utils/dragHandler.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }
  
  init(data) {
    this.level = data.level || 1;
    this.score = data.score || 0;
    this.lives = CONFIG.lives;
    this.gameActive = true;
    
    // Calculate ball count, ensuring at least 4 balls (one of each color)
    const extraBalls = (this.level - 1) * CONFIG.ballsPerLevel;
    this.ballCount = Math.max(4, CONFIG.initialBallCount + extraBalls);
    
    this.difficultyMultiplier = Math.min(CONFIG.maxDifficulty, 1 + ((this.level - 1) * 0.1));
  }
  
  create() {
    // Create the UI manager
    this.uiManager = new UIManager(this);
    this.uiManager.create();
    this.uiManager.updateScore(this.score);
    this.uiManager.updateLives(this.lives);
    
    // Create goal bars
    this.createGoalBars();
    
    // Create particle emitters
    this.createParticleEmitters();
    
    // Create a group for all balls
    this.balls = this.add.group();
    
    // Create initial balls
    this.createInitialBalls();
    
    // Initialize the drag handler
    this.dragHandler = new DragHandler(this, () => {
      // This will be called on each drag update
      this.uiManager.updateScore(this.score);
    });
    
    // Add ESC key handler for pause menu
    this.input.keyboard.on('keydown-ESC', this.togglePauseMenu, this);
    
    // Initialize pause state
    this.isPaused = false;
    this.pauseMenu = null;
  }
  
  createGoalBars() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Create the 4 goal bars - one on each side
    this.goalBars = [];
    
    // Use the configured bar positions instead of random
    const barPositions = CONFIG.barPositions;
    
    // Top bar
    const topBar = this.add.rectangle(
      width / 2,
      CONFIG.goalBarHeight / 2,
      width * CONFIG.goalBarWidth,
      CONFIG.goalBarHeight,
      Phaser.Display.Color.HexStringToColor(CONFIG.ballColors[barPositions.top]).color
    );
    topBar.barColor = barPositions.top;
    this.goalBars.push(topBar);
    
    // Bottom bar
    const bottomBar = this.add.rectangle(
      width / 2,
      height - CONFIG.goalBarHeight / 2,
      width * CONFIG.goalBarWidth,
      CONFIG.goalBarHeight,
      Phaser.Display.Color.HexStringToColor(CONFIG.ballColors[barPositions.bottom]).color
    );
    bottomBar.barColor = barPositions.bottom;
    this.goalBars.push(bottomBar);
    
    // Left bar
    const leftBar = this.add.rectangle(
      CONFIG.goalBarVerticalWidth / 2,
      height / 2,
      CONFIG.goalBarVerticalWidth,
      height * 0.6,
      Phaser.Display.Color.HexStringToColor(CONFIG.ballColors[barPositions.left]).color
    );
    leftBar.barColor = barPositions.left;
    this.goalBars.push(leftBar);
    
    // Right bar
    const rightBar = this.add.rectangle(
      width - CONFIG.goalBarVerticalWidth / 2,
      height / 2,
      CONFIG.goalBarVerticalWidth,
      height * 0.6,
      Phaser.Display.Color.HexStringToColor(CONFIG.ballColors[barPositions.right]).color
    );
    rightBar.barColor = barPositions.right;
    this.goalBars.push(rightBar);
  }
  
  createParticleEmitters() {
    // We no longer need particle emitters
  }
  
  createInitialBalls() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const safeMargin = 100; // Safe margin from edges
    
    const existingPositions = [];
    
    // First, ensure we create at least one ball of each color
    for (let colorIndex = 0; colorIndex < 4; colorIndex++) {
      let x, y, valid;
      let attempts = 0;
      
      // Try to find a valid non-overlapping position
      do {
        valid = true;
        x = Phaser.Math.Between(safeMargin, width - safeMargin);
        y = Phaser.Math.Between(safeMargin, height - safeMargin);
        
        // Check if too close to any existing ball positions
        for (const position of existingPositions) {
          const distance = Phaser.Math.Distance.Between(x, y, position.x, position.y);
          if (distance < 80) {
            valid = false;
            break;
          }
        }
        
        attempts++;
      } while (!valid && attempts < 20);
      
      // Store the position
      existingPositions.push({ x, y });
      
      // Random size
      const minSize = CONFIG.minBallSize;
      const maxSize = CONFIG.maxBallSize;
      const size = Phaser.Math.Between(minSize, maxSize);
      
      // Random velocity
      const minSpeed = CONFIG.velocityRange[0] * this.difficultyMultiplier;
      const maxSpeed = CONFIG.velocityRange[1] * this.difficultyMultiplier;
      const speed = Phaser.Math.FloatBetween(minSpeed, maxSpeed);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      
      const velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      };
      
      this.createBall({
        x: x,
        y: y,
        size: size,
        colorIndex: colorIndex,
        velocity: velocity
      });
    }
    
    // Then add remaining random balls
    for (let i = 4; i < this.ballCount; i++) {
      let x, y, valid;
      let attempts = 0;
      
      // Try to find a valid non-overlapping position
      do {
        valid = true;
        x = Phaser.Math.Between(safeMargin, width - safeMargin);
        y = Phaser.Math.Between(safeMargin, height - safeMargin);
        
        // Check if too close to any existing ball positions
        for (const position of existingPositions) {
          const distance = Phaser.Math.Distance.Between(x, y, position.x, position.y);
          if (distance < 80) {
            valid = false;
            break;
          }
        }
        
        attempts++;
      } while (!valid && attempts < 20);
      
      // Store the position
      existingPositions.push({ x, y });
      
      // Random size
      const minSize = CONFIG.minBallSize;
      const maxSize = CONFIG.maxBallSize;
      const size = Phaser.Math.Between(minSize, maxSize);
      
      // Random color
      const colorIndex = Phaser.Math.Between(0, CONFIG.ballColors.length - 1);
      
      // Random velocity
      const minSpeed = CONFIG.velocityRange[0] * this.difficultyMultiplier;
      const maxSpeed = CONFIG.velocityRange[1] * this.difficultyMultiplier;
      const speed = Phaser.Math.FloatBetween(minSpeed, maxSpeed);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      
      const velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      };
      
      this.createBall({
        x: x,
        y: y,
        size: size,
        colorIndex: colorIndex,
        velocity: velocity
      });
    }
  }
  
  createBall(options) {
    const {
      x,
      y,
      size = CONFIG.minBallSize,
      colorIndex = 0,
      velocity = { x: 0, y: 0 },
      isDead = false
    } = options;
    
    // Half the size for radius
    const radius = size / 2;
    
    // Create the ball as a circle with radius
    const color = isDead 
      ? 0x777777 
      : Phaser.Display.Color.HexStringToColor(CONFIG.ballColors[colorIndex]).color;
    
    const ball = this.add.circle(x, y, radius, color);
    
    // Add physics to the ball
    this.physics.add.existing(ball);
    
    // Disable body by default (will be enabled during drag)
    ball.body.enable = false;
    ball.body.setCircle(radius);
    
    // Custom properties
    ball.colorIndex = colorIndex;
    ball.isDragging = false;
    ball.isDead = isDead;
    ball.velocity = velocity;
    ball.originalRadius = ball.displayWidth / 2; // Store original radius
    
    // If dead ball, make it static
    if (isDead) {
      ball.velocity = { x: 0, y: 0 };
    }
    
    // If debug mode is enabled, show the score on the ball
    if (CONFIG.debugCode) {
      // Use the radius (which is half the width) as the score
      const scoreValue = Math.floor(radius);
      const scoreText = this.add.text(x, y, scoreValue.toString(), {
        fontSize: '14px',
        color: '#ffffff'
      }).setOrigin(0.5);
      ball.scoreText = scoreText;
      
      // Make sure the score is attached to the ball
      this.children.bringToTop(scoreText);
    }
    
    // If configured to show hitbox, add a stroke
    if (CONFIG.showHitbox && !isDead) {
      ball.setStrokeStyle(2, 0xaa00aa);
    }
    
    // Add pulsating animation if not dead
    if (!isDead) {
      this.addPulsatingAnimation(ball);
    }
    
    // Add methods
    ball.stopPulsating = function() {
      this.scene.tweens.killTweensOf(this);
    };
    
    ball.resumePulsating = function(originalScale) {
      if (!this.isDead) {
        // Use current size as the base for pulsation
        this.scene.addPulsatingAnimation(this);
      }
    };
    
    ball.setDead = function() {
      this.isDead = true;
      this.fillColor = 0x777777;
      this.velocity = { x: 0, y: 0 }; // Make it static
      this.stopPulsating(); // Stop any pulsation
      
      if (this.scoreText) {
        try {
          this.scoreText.destroy();
        } catch (error) {
          console.warn('Error destroying score text:', error);
        }
        this.scoreText = null;
      }
      
      if (this.stroke) {
        this.setStrokeStyle(0); // Remove the stroke
      }
    };
    
    // Add to the group
    this.balls.add(ball);
    
    return ball;
  }
  
  addPulsatingAnimation(ball, forceScale) {
    if (ball.isDead) return;
    
    // Get pulsation speed from config
    const pulseSpeed = Phaser.Math.FloatBetween(
      CONFIG.pulseSpeedRange[0], 
      CONFIG.pulseSpeedRange[1]
    ) * 1000 / this.difficultyMultiplier;
    
    // Make sure the ball's originalRadius is set
    if (!ball.originalRadius) {
      ball.originalRadius = ball.displayWidth / 2;
    }
    
    // This is the size we need to maintain through pulsation
    const baseRadius = ball.originalRadius;
    const baseSize = baseRadius * 2;
    
    // Set the starting size to be exactly what we want
    ball.setDisplaySize(baseSize, baseSize);
    
    // Kill any existing tweens on this ball
    this.tweens.killTweensOf(ball);
    
    // Calculate min and max scales for pulsation
    const minScale = 0.85;
    const maxScale = 1.15;
    
    // Create the pulsation tween
    this.tweens.add({
      targets: ball,
      scale: { from: minScale, to: maxScale },
      duration: pulseSpeed / 2,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        // Make sure the ball maintains its circular shape
        if (ball.width !== ball.height) {
          // Get the current width and ensure height matches
          ball.height = ball.width;
        }
        
        // Update the score text to reflect current size if in debug mode
        if (ball.scoreText && CONFIG.debugCode) {
          // Calculate the current actual radius of the ball based on its display size
          const currentRadius = Math.floor(ball.displayWidth / 2);
          ball.scoreText.setText(currentRadius.toString());
        }
      }
    });
  }
  
  update(time, delta) {
    if (!this.gameActive) return;
    
    // Move all balls according to their velocity
    const balls = this.balls.getChildren();
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    for (let i = 0; i < balls.length; i++) {
      const ball = balls[i];
      
      // Skip if the ball is being dragged or is dead
      if (ball.isDragging || ball.isDead) continue;
      
      // Move the ball
      ball.x += ball.velocity.x * delta / 1000;
      ball.y += ball.velocity.y * delta / 1000;
      
      // Update debug text position if exists
      if (ball.scoreText) {
        ball.scoreText.x = ball.x;
        ball.scoreText.y = ball.y;
      }
      
      // Check for edge bouncing
      if ((ball.x < ball.radius && ball.velocity.x < 0) || 
          (ball.x > width - ball.radius && ball.velocity.x > 0)) {
        ball.velocity.x *= -1;
      }
      
      if ((ball.y < ball.radius && ball.velocity.y < 0) || 
          (ball.y > height - ball.radius && ball.velocity.y > 0)) {
        ball.velocity.y *= -1;
      }
    }
  }
  
  removeBall(ball) {
    // Remove the score text if it exists
    if (ball.scoreText) {
      try {
        ball.scoreText.destroy();
      } catch (error) {
        console.warn('Error destroying score text:', error);
      }
      ball.scoreText = null;
    }
    
    // Remove the ball from the group and destroy it
    this.balls.remove(ball, true, true);
  }
  
  createConfetti(x, y, color) {
    try {
      // Convert hex color to integer
      const colorInt = Phaser.Display.Color.HexStringToColor(color).color;
      
      // Create particles manually with circles instead of sprites
      for (let i = 0; i < CONFIG.particleCount; i++) {
        // Create a particle as a circle graphics object
        const particle = this.add.circle(x, y, 4, colorInt);
        
        // Random angle and speed
        const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
        const speed = Phaser.Math.Between(100, 200);
        
        // Calculate velocity
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        // Random scale
        particle.setScale(Phaser.Math.FloatBetween(0.3, 0.8));
        
        // Animate and remove
        this.tweens.add({
          targets: particle,
          alpha: { from: 1, to: 0 },
          scale: { from: particle.scale, to: 0 },
          x: particle.x + vx * 0.4,
          y: particle.y + vy * 0.4,
          duration: 800,
          onComplete: () => {
            particle.destroy();
          }
        });
      }
    } catch (error) {
      console.warn('Error creating confetti effect:', error);
    }
  }
  
  loseLife() {
    if (this.lives <= 0) return;
    
    this.lives--;
    this.uiManager.updateLives(this.lives);
    
    // Check if game over
    if (this.lives <= 0) {
      this.gameOver();
    }
  }
  
  gameOver() {
    this.gameActive = false;
    
    // Show game over UI
    this.uiManager.showGameOver(this.score);
    
    // Save best score if needed
    const bestScore = localStorage.getItem('bestScore') || 0;
    if (this.score > bestScore) {
      localStorage.setItem('bestScore', this.score);
    }
  }
  
  checkLevelComplete() {
    // Count non-dead balls
    let activeBallCount = 0;
    const balls = this.balls.getChildren();
    
    for (let i = 0; i < balls.length; i++) {
      if (!balls[i].isDead) {
        activeBallCount++;
      }
    }
    
    // If no more active balls, level complete
    if (activeBallCount === 0) {
      this.levelComplete();
    }
  }
  
  checkGameOver() {
    // Check if all balls are dead
    let allBallsDead = true;
    const balls = this.balls.getChildren();
    
    for (let i = 0; i < balls.length; i++) {
      if (!balls[i].isDead) {
        allBallsDead = false;
        break;
      }
    }
    
    if (allBallsDead) {
      this.gameOver();
    }
  }
  
  levelComplete() {
    this.gameActive = false;
    
    // Show level complete UI
    this.uiManager.showLevelComplete(this.level, this.score, () => {
      this.nextLevel();
    });
  }
  
  nextLevel() {
    this.level++;
    
    // Calculate ball count, ensuring at least 4 balls (one of each color)
    const extraBalls = (this.level - 1) * CONFIG.ballsPerLevel;
    this.ballCount = Math.max(4, CONFIG.initialBallCount + extraBalls);
    
    this.difficultyMultiplier = Math.min(CONFIG.maxDifficulty, 1 + ((this.level - 1) * 0.1));
    
    // Clean up old balls
    this.balls.clear(true, true);
    
    // Create new balls for the next level
    this.createInitialBalls();
    
    // Refresh the goal bars with new random colors
    this.goalBars.forEach(bar => {
      bar.destroy();
    });
    this.createGoalBars();
    
    // Reset game state
    this.gameActive = true;
  }
  
  shutdown() {
    // Clean up
    if (this.dragHandler) {
      this.dragHandler.destroy();
    }
  }
  
  togglePauseMenu() {
    this.uiManager.togglePause();
  }
  
  pauseGame() {
    this.isPaused = true;
    this.gameActive = false;
    
    // Stop pulsation animation on all balls when paused
    const balls = this.balls.getChildren();
    for (let i = 0; i < balls.length; i++) {
      balls[i].stopPulsating();
    }
  }
  
  resumeGame() {
    this.isPaused = false;
    this.gameActive = true;
    
    // Resume pulsation animation on all balls when game is resumed
    const balls = this.balls.getChildren();
    for (let i = 0; i < balls.length; i++) {
      if (!balls[i].isDead && !balls[i].isDragging) {
        balls[i].resumePulsating();
      }
    }
  }
} 