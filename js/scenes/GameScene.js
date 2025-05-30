import { CONFIG } from "../config.js";
import { UIManager } from "../utils/uiManager.js";
import { DragHandler } from "../utils/dragHandler.js";
import { Logger, log } from "../utils/logger.js";

window.LAST_STOPPED_PULSATING_RADIUS = null;
window.LAST_STOPPED_PULSATING_BALL_ID = null;

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  init(data) {
    this.level = data.level || 1;
    this.score = data.score || 0;
    this.lives = CONFIG.lives;
    this.gameActive = true;

    // Calculate ball count, ensuring at least 4 balls (one of each color)
    const extraBalls = (this.level - 1) * CONFIG.ballsPerLevel;
    this.ballCount = Math.max(4, CONFIG.initialBallCount + extraBalls);

    this.difficultyMultiplier = Math.min(
      CONFIG.maxDifficulty,
      1 + (this.level - 1) * 0.1,
    );

    Logger.info(
      `Game initialized - Level: ${this.level}, Balls: ${this.ballCount}, Difficulty: ${this.difficultyMultiplier}`,
    );
  }

  create() {
    Logger.info("Creating game scene");

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
    this.input.keyboard.on("keydown-ESC", this.togglePauseMenu, this);

    // Initialize pause state
    this.isPaused = false;
    this.pauseMenu = null;

    if (CONFIG.includeTimer) {
      this.createTimerBar();
    }

    Logger.info("Game scene created successfully");
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
      Phaser.Display.Color.HexStringToColor(CONFIG.ballColors[barPositions.top])
        .color,
    );
    topBar.barColor = barPositions.top;
    topBar.setDepth(-1000);
    this.goalBars.push(topBar);

    // Bottom bar
    const bottomBar = this.add.rectangle(
      width / 2,
      height - CONFIG.goalBarHeight / 2,
      width * CONFIG.goalBarWidth,
      CONFIG.goalBarHeight,
      Phaser.Display.Color.HexStringToColor(
        CONFIG.ballColors[barPositions.bottom],
      ).color,
    );
    bottomBar.barColor = barPositions.bottom;
    bottomBar.setDepth(-1000);
    this.goalBars.push(bottomBar);

    // Left bar
    const leftBar = this.add.rectangle(
      CONFIG.goalBarVerticalWidth / 2,
      height / 2,
      CONFIG.goalBarVerticalWidth,
      height * 0.6,
      Phaser.Display.Color.HexStringToColor(
        CONFIG.ballColors[barPositions.left],
      ).color,
    );
    leftBar.barColor = barPositions.left;
    leftBar.setDepth(-1000);
    this.goalBars.push(leftBar);

    // Right bar
    const rightBar = this.add.rectangle(
      width - CONFIG.goalBarVerticalWidth / 2,
      height / 2,
      CONFIG.goalBarVerticalWidth,
      height * 0.6,
      Phaser.Display.Color.HexStringToColor(
        CONFIG.ballColors[barPositions.right],
      ).color,
    );
    rightBar.barColor = barPositions.right;
    rightBar.setDepth(-1000);
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

    // If in debug mode with same colors only, use only one color for all balls
    const debugColor = CONFIG.debugSameColorsOnly
      ? Phaser.Math.Between(0, CONFIG.ballColors.length - 1)
      : null;

    // First, ensure we create at least one ball of each color (unless in debug mode)
    const initialColorCount = CONFIG.debugSameColorsOnly ? 0 : 4;
    for (let i = 0; i < initialColorCount; i++) {
      let x, y, valid;
      let attempts = 0;

      // Try to find a valid non-overlapping position
      do {
        valid = true;
        x = Phaser.Math.Between(safeMargin, width - safeMargin);
        y = Phaser.Math.Between(safeMargin, height - safeMargin);

        // Check if too close to any existing ball positions
        for (const position of existingPositions) {
          const distance = Phaser.Math.Distance.Between(
            x,
            y,
            position.x,
            position.y,
          );
          if (distance < 80) {
            valid = false;
            break;
          }
        }

        attempts++;
      } while (!valid && attempts < 20);

      // Store the position
      existingPositions.push({ x, y });

      // Random size from ballSizeRange
      const minSize = CONFIG.ballSizeRange[0];
      const maxSize = CONFIG.ballSizeRange[1];
      const size = Phaser.Math.Between(minSize, maxSize);

      // Random velocity
      const minSpeed = CONFIG.velocityRange[0] * this.difficultyMultiplier;
      const maxSpeed = CONFIG.velocityRange[1] * this.difficultyMultiplier;
      const speed = Phaser.Math.FloatBetween(minSpeed, maxSpeed);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);

      const velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      };

      this.createBall({
        x: x,
        y: y,
        size: size,
        colorIndex: i,
        velocity: velocity,
      });
    }

    // Then add remaining random balls
    for (let i = initialColorCount; i < this.ballCount; i++) {
      let x, y, valid;
      let attempts = 0;

      // Try to find a valid non-overlapping position
      do {
        valid = true;
        x = Phaser.Math.Between(safeMargin, width - safeMargin);
        y = Phaser.Math.Between(safeMargin, height - safeMargin);

        // Check if too close to any existing ball positions
        for (const position of existingPositions) {
          const distance = Phaser.Math.Distance.Between(
            x,
            y,
            position.x,
            position.y,
          );
          if (distance < 80) {
            valid = false;
            break;
          }
        }

        attempts++;
      } while (!valid && attempts < 20);

      // Store the position
      existingPositions.push({ x, y });

      // Random size from ballSizeRange
      const minSize = CONFIG.ballSizeRange[0];
      const maxSize = CONFIG.ballSizeRange[1];
      const size = Phaser.Math.Between(minSize, maxSize);

      // Use debug color if enabled, otherwise random color
      const colorIndex = CONFIG.debugSameColorsOnly
        ? debugColor
        : Phaser.Math.Between(0, CONFIG.ballColors.length - 1);

      // Random velocity
      const minSpeed = CONFIG.velocityRange[0] * this.difficultyMultiplier;
      const maxSpeed = CONFIG.velocityRange[1] * this.difficultyMultiplier;
      const speed = Phaser.Math.FloatBetween(minSpeed, maxSpeed);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);

      const velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      };

      this.createBall({
        x: x,
        y: y,
        size: size,
        colorIndex: colorIndex,
        velocity: velocity,
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
      isDead = false,
    } = options;

    // Half the size for radius
    const radius = size / 2;

    Logger.debug(
      `Creating ball: x=${x.toFixed(1)}, y=${y.toFixed(
        1,
      )}, size=${size}, color=${
        CONFIG.colorNames[colorIndex]
      }, isDead=${isDead}`,
    );

    // Create the ball as a circle with radius
    const color = isDead
      ? 0x777777
      : Phaser.Display.Color.HexStringToColor(CONFIG.ballColors[colorIndex])
          .color;

    const ball = this.add.circle(x, y, radius, color);

    // Add physics to the ball
    this.physics.add.existing(ball, false); // false means not static

    // Set up physics body with proper settings
    ball.body.enable = true;
    ball.body.setCircle(radius);
    ball.body.setOffset(-radius, -radius);
    ball.body.setBounce(1, 1);
    ball.body.setCollideWorldBounds(false); // We handle world bounds manually

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

    // If debug mode is enabled, show the score and combo on the ball
    if (CONFIG.debugCode) {
      const textGroup = this.add.container(x, y);
      ball.comboCount = 1; // Initialize combo counter

      // Base radius text
      const scoreValue = Math.floor(radius);
      const scoreText = this.add
        .text(0, -10, scoreValue.toString(), {
          fontSize: "14px",
          color: "#ffffff",
        })
        .setOrigin(0.5);

      // Initialize with base radius shown in purple parentheses
      const comboText = this.add
        .text(0, 5, `(${scoreValue})`, {
          fontSize: "12px",
          color: "#ff00ff", // Purple color
        })
        .setOrigin(0.5);

      textGroup.add([scoreText, comboText]);
      ball.scoreText = scoreText;
      ball.comboText = comboText;
      ball.textGroup = textGroup;
      ball.comboCount = 1; // Initialize combo counter

      // Make sure text stays on top
      this.children.bringToTop(textGroup);
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
    ball.stopPulsating = function () {
      Logger.debug(
        `Ball stopped pulsating: x=${this.x.toFixed(1)}, y=${this.y.toFixed(
          1,
        )}`,
      );
      this.scene.tweens.killTweensOf(this);
      // Store radius and identifier globally
      window.LAST_STOPPED_PULSATING_RADIUS = this.displayWidth / 2;
      window.LAST_STOPPED_PULSATING_BALL_ID =
        this.name || `${this.x.toFixed(1)},${this.y.toFixed(1)}`;
    };

    ball.resumePulsating = function (startFrom) {
      if (!this.isDead) {
        Logger.debug(
          `Ball resuming pulsation: x=${this.x.toFixed(1)}, y=${this.y.toFixed(
            1,
          )}, startFrom=${startFrom || "default"}`,
        );
        // Pass the startFrom parameter to control where pulsation begins
        this.scene.addPulsatingAnimation(this, null, startFrom);
      }
    };

    ball.setDead = function () {
      Logger.debug(
        `Ball set to dead: x=${this.x.toFixed(1)}, y=${this.y.toFixed(1)}`,
      );
      this.isDead = true;
      this.fillColor = 0x777777;
      this.velocity = { x: 0, y: 0 }; // Make it static
      this.stopPulsating(); // Stop any pulsation

      if (this.scoreText) {
        try {
          this.scoreText.destroy();
        } catch (error) {
          console.warn("Error destroying score text:", error);
        }
        this.scoreText = null;
      }

      if (this.stroke) {
        this.setStrokeStyle(0); // Remove the stroke
      }
    };

    ball.returnPulsation = function (radius) {
      if (!this.isDead) {
        this.scene.addPulsatingAnimation(this, null, radius);
      }
    };

    // Add to the group
    this.balls.add(ball);

    return ball;
  }

  addPulsatingAnimation(ball, forceScale, startFrom) {
    if (ball.isDead) return;

    // Get pulsation speed from config
    const pulseSpeed =
      (Phaser.Math.FloatBetween(
        CONFIG.pulseSpeedRange[0],
        CONFIG.pulseSpeedRange[1],
      ) *
        1000) /
      this.difficultyMultiplier;

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

    // Default starting point and direction
    let currentScale = minScale;
    let goingUp = true;

    // If startFrom is provided, use it as the starting point in the pulsation
    if (startFrom !== undefined && startFrom !== null) {
      // Calculate the scale relative to baseRadius
      currentScale = startFrom / baseRadius;
      // Determine direction based on where we are in the cycle
      const midPoint = (minScale + maxScale) / 2;
      goingUp = currentScale < midPoint;
      Logger.debug(
        `Ball pulsation starting from ${currentScale} (radius: ${startFrom}), direction: ${
          goingUp ? "up" : "down"
        }`,
      );
    } else {
      Logger.debug(
        `Ball pulsation starting with default values, baseRadius: ${baseRadius.toFixed(
          1,
        )}`,
      );
    }

    // Set the initial scale
    ball.setScale(currentScale);

    // Create a function for the repeating pulsation
    const createRepeatingPulsation = () => {
      // Calculate the target scale
      const targetScale = goingUp ? maxScale : minScale;

      // Calculate duration based on the distance to travel for consistent speed
      const scaleDifference = Math.abs(targetScale - currentScale);
      const totalScaleRange = maxScale - minScale;
      const adjustedDuration = (scaleDifference / totalScaleRange) * pulseSpeed;

      this.tweens.add({
        targets: ball,
        scale: targetScale,
        duration: adjustedDuration,
        ease: "Sine.easeInOut",
        onComplete: () => {
          // Update current scale
          currentScale = targetScale;

          // Flip direction and continue pulsation
          goingUp = !goingUp;

          // Calculate the new target scale
          const newTargetScale = goingUp ? maxScale : minScale;

          // Calculate new duration based on full range for consistent speed
          const newDuration = pulseSpeed;

          this.tweens.add({
            targets: ball,
            scale: newTargetScale,
            duration: newDuration,
            ease: "Sine.easeInOut",
            onComplete: createRepeatingPulsation,
            onUpdate: () => this.updateBallDuringPulsation(ball),
          });
        },
        onUpdate: () => this.updateBallDuringPulsation(ball),
      });
    };

    // Start the repeating pulsation
    createRepeatingPulsation();
  }

  // Helper method to update ball during pulsation
  updateBallDuringPulsation(ball) {
    // Make sure the ball maintains its circular shape
    if (ball.width !== ball.height) {
      // Get the current width and ensure height matches
      ball.height = ball.width;
    }

    // Update the debug displays if enabled
    if (CONFIG.debugCode && ball.scoreText && ball.comboText) {
      // Get the current actual radius from the display size
      const currentRadius = Math.floor(ball.displayWidth / 2);

      if (ball.comboCount > 1) {
        // For merged balls, show the base radius × combo
        const baseRadius = Math.floor(currentRadius / ball.comboCount);
        ball.scoreText.setText(currentRadius.toString());
        ball.comboText.setText(`(${baseRadius} × ${ball.comboCount})`);
      } else {
        // For non-merged balls, show the current radius and formula as-is
        ball.scoreText.setText(currentRadius.toString());
        ball.comboText.setText(`(${currentRadius})`);
      }

      // Ensure combo text stays purple
      ball.comboText.setColor("#ff00ff");
    }
  }

  createTimerBar() {
    const width = this.cameras.main.width;
    const barHeight = 2;
    this.timerBar = this.add
      .rectangle(width, 0, width, barHeight, 0xffffff)
      .setOrigin(1, 0);
    this.timerBarStartWidth = width;
    this.timerBarElapsed = 0;
    this.timerBarActive = true;
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

      // Get actual ball radius from physics body
      const radius = ball.body.radius;

      // Move the ball using physics velocity
      ball.x += (ball.velocity.x * delta) / 1000;
      ball.y += (ball.velocity.y * delta) / 1000;

      // Update debug text position if exists
      if (CONFIG.debugCode && ball.textGroup) {
        ball.textGroup.x = ball.x;
        ball.textGroup.y = ball.y;
      }

      // Check for edge bouncing using physics body
      const bounceThreshold = 1; // Small threshold to prevent sticking
      if (ball.x - radius <= bounceThreshold && ball.velocity.x < 0) {
        ball.x = radius + bounceThreshold;
        ball.velocity.x *= -1;
      } else if (
        ball.x + radius >= width - bounceThreshold &&
        ball.velocity.x > 0
      ) {
        ball.x = width - radius - bounceThreshold;
        ball.velocity.x *= -1;
      }

      if (ball.y - radius <= bounceThreshold && ball.velocity.y < 0) {
        ball.y = radius + bounceThreshold;
        ball.velocity.y *= -1;
      } else if (
        ball.y + radius >= height - bounceThreshold &&
        ball.velocity.y > 0
      ) {
        ball.y = height - radius - bounceThreshold;
        ball.velocity.y *= -1;
      }
    }

    // Timer logic
    if (CONFIG.includeTimer && this.timerBarActive) {
      this.timerBarElapsed += delta / 1000;
      const percent = Math.max(0, 1 - this.timerBarElapsed / CONFIG.timeLimit);
      this.timerBar.width = width * percent;
      this.timerBar.x = width;
      if (this.timerBarElapsed >= CONFIG.timeLimit) {
        this.timerBarActive = false;
        this.gameOver();
      }
    }

    // Check for collisions if a ball is being dragged
    if (
      this.dragHandler &&
      this.dragHandler.isDragging &&
      this.dragHandler.draggedBall
    ) {
      this.dragHandler.checkBallCollision();
    }
  }

  removeBall(ball) {
    Logger.debug(
      `Removing ball: x=${ball.x.toFixed(1)}, y=${ball.y.toFixed(1)}, color=${
        CONFIG.colorNames[ball.colorIndex]
      }`,
    );

    // Remove the score text if it exists
    if (ball.scoreText) {
      try {
        ball.scoreText.destroy();
      } catch (error) {
        console.warn("Error destroying score text:", error);
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
          },
        });
      }
    } catch (error) {
      console.warn("Error creating confetti effect:", error);
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

    Logger.info(`Game over - Final score: ${this.score}`);

    // Show game over UI
    this.uiManager.showGameOver(this.score);

    // Save best score if needed
    const bestScore = localStorage.getItem("bestScore") || 0;
    if (this.score > bestScore) {
      localStorage.setItem("bestScore", this.score);
      Logger.info(`New best score: ${this.score}`);
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

    Logger.info(`Level ${this.level} completed - Score: ${this.score}`);

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

    this.difficultyMultiplier = Math.min(
      CONFIG.maxDifficulty,
      1 + (this.level - 1) * 0.1,
    );

    Logger.info(
      `Starting level ${this.level} - Balls: ${
        this.ballCount
      }, Difficulty: ${this.difficultyMultiplier.toFixed(2)}`,
    );

    // Clean up old balls
    this.balls.clear(true, true);

    // Create new balls for the next level
    this.createInitialBalls();

    // Refresh the goal bars with new random colors
    this.goalBars.forEach((bar) => {
      bar.destroy();
    });
    this.createGoalBars();

    // Reset game state
    this.gameActive = true;

    if (CONFIG.includeTimer) {
      this.createTimerBar();
    }
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

    Logger.info("Game paused");

    // Stop pulsation animation on all balls when paused
    const balls = this.balls.getChildren();
    for (let i = 0; i < balls.length; i++) {
      balls[i].stopPulsating();
    }
  }

  resumeGame() {
    this.isPaused = false;
    this.gameActive = true;

    Logger.info("Game resumed");

    // Resume pulsation animation on all balls when game is resumed
    const balls = this.balls.getChildren();
    for (let i = 0; i < balls.length; i++) {
      if (!balls[i].isDead && !balls[i].isDragging) {
        balls[i].resumePulsating();
      }
    }
  }
} // Close the GameScene class
