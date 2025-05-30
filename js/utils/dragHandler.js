import { CONFIG } from "../config.js";
import { Logger, log } from "./logger.js";

export class DragHandler {
  constructor(scene, updateCallback) {
    this.scene = scene;
    this.isDragging = false;
    this.draggedBall = null;
    this.startPosition = { x: 0, y: 0 };
    this.originalScale = 1;
    this.updateCallback = updateCallback;
    this.mergedThisFrame = false; // Flag to prevent multiple merges in one frame
    this.mergeBallsOccurred = false; // Flag to indicate if a ball merge happened during drag
    this.clickCapturedRadius = null; // Stores the exact radius at the time of click
    this.dragOffset = { x: 0, y: 0 }; // Offset to maintain click position
    this.originalRadius = null; // Store the original radius when drag starts
    this.comboCount = 0; // Track combo count during a single drag
    this.comboScore = 0; // Accumulate combo score during drag
    this.score = 0; // Track score during ball interaction
    this.lastMergeTime = Date.now(); // Track last merge timestamp
    this.mergeAnimationDelay = 1000; // Delay in milliseconds between merge animations

    Logger.info("DragHandler initialized");

    // Set up the input handlers
    this.scene.input.on("pointerdown", this.onPointerDown, this);
    this.scene.input.on("pointermove", this.onPointerMove, this);
    this.scene.input.on("pointerup", this.onPointerUp, this);

    // At the top of the file, after imports:
    window.MERGED_BALLS_DATA = window.MERGED_BALLS_DATA || {};
    window.MERGED_BALL_ID_COUNTER = window.MERGED_BALL_ID_COUNTER || 1;
  }

  onPointerDown(pointer) {
    // Check if the game is paused
    if (this.scene.isPaused || this.isDragging) return;

    // Find the ball that was clicked on
    const balls = this.scene.balls.getChildren();
    for (let i = 0; i < balls.length; i++) {
      const ball = balls[i];

      // Skip gray balls (they're dead)
      if (ball.isDead) continue;

      // Calculate hitbox padding for mobile
      let hitboxPadding = 0;
      if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
        hitboxPadding = CONFIG.mobileHitboxPadding || 0;
      }
      const distance = Phaser.Math.Distance.Between(
        pointer.x,
        pointer.y,
        ball.x,
        ball.y,
      );

      if (distance <= ball.displayWidth / 2 + hitboxPadding) {
        // Using displayWidth/2 for more accurate radius
        // Capture the exact current radius of the ball when clicked
        this.clickCapturedRadius = ball.displayWidth / 2;
        Logger.debug(
          `Ball clicked - Stored radius: ${this.clickCapturedRadius.toFixed(
            1,
          )}`,
        );
        this.score = Math.floor(this.clickCapturedRadius);
        // Calculate click offset from center
        this.dragOffset = {
          x: pointer.x - ball.x,
          y: pointer.y - ball.y,
        };

        // Check if the ball is already on a goal bar before starting drag
        // This allows for immediate scoring if the ball is clicked while on a goal bar
        let onGoalBar = false;
        const goalBars = this.scene.goalBars;

        for (let j = 0; j < goalBars.length; j++) {
          const bar = goalBars[j];

          // Create shapes for collision detection
          const ballShape = new Phaser.Geom.Circle(
            ball.x,
            ball.y,
            ball.displayWidth / 2,
          );
          const barBounds = bar.getBounds();
          const barShape = new Phaser.Geom.Rectangle(
            barBounds.x,
            barBounds.y,
            barBounds.width,
            barBounds.height,
          );

          // Check for collision
          if (Phaser.Geom.Intersects.CircleToRectangle(ballShape, barShape)) {
            onGoalBar = true;
            Logger.info(
              `Ball clicked while on ${
                CONFIG.colorNames[bar.barColor]
              } goal bar`,
            );

            // Handle the collision based on color matching
            if (bar.barColor === ball.colorIndex) {
              // Correct goal bar - score!
              this.handleCorrectGoal(ball, bar);
            } else {
              // Wrong goal bar - penalty!
              this.handleWrongGoal(ball, bar);
            }
            break;
          }
        }

        // Only start drag if not on a goal bar
        if (!onGoalBar) {
          this.startDrag(ball, pointer);
        }

        break;
      }
    }
  }

  startDrag(ball, pointer) {
    // If already dragging, ignore
    if (this.isDragging) return;

    this.isDragging = true;
    this.draggedBall = ball;
    this.startPosition = { x: ball.x, y: ball.y };

    // Store the original radius of the ball before any changes
    this.originalRadius = ball.originalRadius;

    // Capture the EXACT current size of the ball at drag start
    // This is the size we'll restore to when released if no merges occur
    this.dragStartRadius = ball.displayWidth / 2;

    // Reset combo count when starting a new drag
    this.comboCount = 0;
    this.comboScore = 0;

    // Reset merge flag
    this.mergeBallsOccurred = false;

    Logger.debug(
      `Starting drag - Ball: color=${
        CONFIG.colorNames[ball.colorIndex]
      }, radius=${this.dragStartRadius.toFixed(
        1,
      )}, originalRadius=${this.originalRadius.toFixed(1)}`,
    );

    // Stop pulsating animation
    ball.stopPulsating();

    // Ensure the ball keeps the exact size it had when grabbed
    const fixedSize = this.dragStartRadius * 2;
    ball.setDisplaySize(fixedSize, fixedSize);

    // Update the physics body to match the current display size
    ball.body.enable = true;
    ball.body.setCircle(this.dragStartRadius); // Bring to top
    this.scene.children.bringToTop(ball);
    if (CONFIG.debugCode && ball.textGroup) {
      this.scene.children.bringToTop(ball.textGroup);
    }

    // Set ball properties
    ball.isDragging = true;
  }
  onPointerMove(pointer) {
    if (!this.isDragging || !this.draggedBall) return;

    // Check if the game is paused - if so, cleanup and return
    if (this.scene.isPaused) {
      // When game is paused, we need to:
      // 1. Reset the ball to its original position
      if (this.draggedBall && this.startPosition) {
        this.draggedBall.x = this.startPosition.x;
        this.draggedBall.y = this.startPosition.y;
      }
      // 2. Clean up the drag state
      this.resetDragState();
      return;
    }

    this.mergedThisFrame = false; // Reset merge flag at the beginning of frame

    // Calculate new position
    let newX = pointer.x - this.dragOffset.x;
    let newY = pointer.y - this.dragOffset.y;
    const ball = this.draggedBall;
    const radius = ball.displayWidth / 2;
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // Clamp position so the ball stays on screen
    newX = Math.max(radius, Math.min(width - radius, newX));
    newY = Math.max(radius, Math.min(height - radius, newY)); // Update ball position to match pointer (considering offset)
    ball.x = newX;
    ball.y = newY;

    // Update debug text group position if it exists
    if (CONFIG.debugCode && ball.textGroup) {
      ball.textGroup.x = newX;
      ball.textGroup.y = newY;
    }

    // Check collisions with goal bars
    this.checkGoalBarCollision();

    // Check collisions with other balls
    this.checkBallCollision();

    // Call the update callback if provided
    if (this.updateCallback) this.updateCallback();
  }

  checkGoalBarCollision() {
    const ball = this.draggedBall;
    if (!ball || ball.isDead) return;

    // Check collision with each goal bar
    const goalBars = this.scene.goalBars;

    for (let i = 0; i < goalBars.length; i++) {
      const bar = goalBars[i];

      // Create a circle shape for the ball
      const ballShape = new Phaser.Geom.Circle(
        ball.x,
        ball.y,
        ball.displayWidth / 2,
      );

      // Create a rectangle shape for the goal bar
      const barBounds = bar.getBounds();
      const barShape = new Phaser.Geom.Rectangle(
        barBounds.x,
        barBounds.y,
        barBounds.width,
        barBounds.height,
      );

      // Check if the ball circle intersects with the goal bar rectangle
      if (Phaser.Geom.Intersects.CircleToRectangle(ballShape, barShape)) {
        if (bar.barColor === ball.colorIndex) {
          // Correct goal bar - score!
          this.handleCorrectGoal(ball, bar);
        } else {
          // Wrong goal bar - penalty!
          this.handleWrongGoal(ball, bar);
        }
        return;
      }
    }
  }
  handleCorrectGoal(ball, bar) {
    // Add score based on radius
    const score = this.score;
    // Add the accumulated score plus the current ball score
    this.scene.score += this.score + score;
    this.score = 0; // Reset the accumulated score
    this.scene.uiManager.updateScore(this.scene.score);

    // Show score text
    this.showScoreText(ball.x, ball.y, `+${score}`);

    // Create confetti effect at the ball's position with the ball's color
    this.scene.createConfetti(
      ball.x,
      ball.y,
      CONFIG.ballColors[ball.colorIndex],
    );

    // If we have an active combo and didn't lose it, show a combo message
    if (this.comboCount > 0 && this.mergeBallsOccurred) {
      const comboLevel = Math.min(5, this.comboCount);
      const messages =
        CONFIG.comboGoalMessages[comboLevel] || CONFIG.comboGoalMessages["2"];
      const randomMessage =
        messages[Math.floor(Math.random() * messages.length)]; // Show the combo message in the center for goal completion
      this.showComboText(
        ball.x,
        ball.y - 30,
        `${this.comboCount + 1}x combo - ${randomMessage}`,
        true, // isGoalCompletion = true
      );
    }

    // Remove the ball
    this.scene.removeBall(ball);

    // Reset drag state
    this.resetDragState();

    // Check if level completed
    this.scene.checkLevelComplete();
  }

  handleWrongGoal(ball, bar) {
    // Lose a life
    this.scene.loseLife();

    // Turn the ball gray (dead)
    ball.setDead();

    // Show skull emoji
    this.showEmoji(ball.x, ball.y, "💀");

    // Split into smaller balls
    this.createSplitBalls(ball);

    // Reset drag state
    this.resetDragState();

    // Check if game over
    this.scene.checkGameOver();
  }

  createSplitBalls(ball) {
    // Determine how many smaller balls to create using the config range
    const count = Phaser.Math.Between(
      CONFIG.splitBallsRange[0],
      CONFIG.splitBallsRange[1],
    );

    const totalScore = Math.floor(
      ball.displayWidth * CONFIG.splitBallsTotalScore,
    );
    const scorePerBall = Math.max(
      CONFIG.minBallSize,
      Math.min(CONFIG.maxBallSize, Math.floor(totalScore / count)),
    );

    // Create smaller balls
    for (let i = 0; i < count; i++) {
      // Random position near the original ball
      const angle = Phaser.Math.Between(0, 360);
      const distance = Phaser.Math.Between(20, 40);
      const x = ball.x + Math.cos((angle * Math.PI) / 180) * distance;
      const y = ball.y + Math.sin((angle * Math.PI) / 180) * distance;

      // Random velocity
      const speed = Phaser.Math.FloatBetween(
        CONFIG.velocityRange[0],
        CONFIG.velocityRange[1],
      );
      const velocity = {
        x: Math.cos((angle * Math.PI) / 180) * speed,
        y: Math.sin((angle * Math.PI) / 180) * speed,
      };

      // Create the new ball
      this.scene.createBall({
        x: x,
        y: y,
        size: scorePerBall,
        colorIndex: ball.colorIndex,
        velocity: velocity,
      });
    }
  }

  checkBallCollision() {
    const ball = this.draggedBall;
    if (!ball || ball.isDead || this.mergedThisFrame) return;

    const balls = this.scene.balls.getChildren();

    for (let i = 0; i < balls.length; i++) {
      const otherBall = balls[i];

      // Skip if it's the same ball or if the other ball is being dragged
      if (otherBall === ball || otherBall.isDragging) continue;

      const distance = Phaser.Math.Distance.Between(
        ball.x,
        ball.y,
        otherBall.x,
        otherBall.y,
      );

      // Use the display size for collision detection (matches visual size)
      const ballRadius = ball.displayWidth / 2;
      const otherBallRadius = otherBall.displayWidth / 2;
      const combinedRadius = ballRadius + otherBallRadius;

      if (distance < combinedRadius) {
        if (otherBall.isDead) {
          // Collision with a dead (gray) ball - lose a life
          this.handleDeadBallCollision(ball);
        } else if (otherBall.colorIndex === ball.colorIndex) {
          // Collision with same color ball - merge
          this.handleSameColorCollision(ball, otherBall);
        } else {
          // Collision with different color ball - lose a life
          this.handleDifferentColorCollision(ball, otherBall);
        }
        return;
      }
    }
  }

  handleDeadBallCollision(ball) {
    // Lose a life
    this.scene.loseLife();

    // Show skull emoji
    this.showEmoji(ball.x, ball.y, "💀");

    // Turn the ball gray (dead) and stop it
    ball.setDead();
    ball.velocity = { x: 0, y: 0 };

    // Reset drag state
    this.resetDragState();
  }

  handleSameColorCollision(ball, otherBall) {
    // Prevent multiple merges in one frame
    if (this.mergedThisFrame) return;
    this.mergedThisFrame = true;
    // Set flag to indicate a merge occurred during this drag
    this.mergeBallsOccurred = true;
    // Increment combo count
    this.comboCount++;

    const ballRadius = ball.displayWidth / 2;
    const otherRadius = otherBall.displayWidth / 2;

    const newRadius = ballRadius + otherRadius;

    const finalRadius = Math.min(CONFIG.maxBallSize / 2, newRadius);

    this.dragStartRadius = finalRadius;

    ball.originalRadius = finalRadius;

    const newId = `merged_${window.MERGED_BALL_ID_COUNTER++}`;
    ball.mergedId = newId;
    window.MERGED_BALLS_DATA[newId] = finalRadius;
    Logger.info(
      `Balls merged - ${
        CONFIG.colorNames[ball.colorIndex]
      } balls, radii: ${ballRadius.toFixed(1)} + ${otherRadius.toFixed(
        1,
      )} = ${finalRadius.toFixed(
        1,
      )}, new originalRadius=${ball.originalRadius.toFixed(
        1,
      )}, mergedId=${newId}`,
    );

    const diameter = finalRadius * 2;

    ball.setDisplaySize(diameter, diameter);
    ball.body.setCircle(finalRadius);

    const scoreValue = Math.floor(finalRadius);

    if (this.scene.createConfetti) {
      try {
        // Create particles at the otherBall position
        this.scene.createConfetti(
          otherBall.x,
          otherBall.y,
          CONFIG.ballColors[ball.colorIndex],
        );
      } catch (error) {
        console.warn("Confetti effect error:", error);
      }
    }
    // Remove the other ball first
    this.scene.removeBall(otherBall);
    // Now update score text to match new radius if debug enabled
    if (ball.scoreText && CONFIG.debugCode) {
      ball.scoreText.setText(scoreValue.toString());
      // Make sure score text stays on top
      this.scene.children.bringToTop(ball.scoreText);
    } // Only show combo notification, do not update score here
    this.showComboText(ball.x, ball.y, `Combo ${this.comboCount + 1}x`, false); // Show above ball for merges
    const currentTime = Date.now();
    const timeSinceLastMerge = currentTime - this.lastMergeTime;

    if (timeSinceLastMerge >= this.mergeAnimationDelay) {
      // Logger.debug("Playing jiggle animation");
      // this.playJiggleAnimation(ball);
      this.lastMergeTime = currentTime;
    } else {
      // Logger.debug("Skipping jiggle animation - too soon");
    }

    const combo = this.comboCount + 1; // Increment combo count for display
    const totalScore = Math.round(finalRadius * combo);

    this.score = totalScore;

    Logger.info(`Ball score: ${totalScore} (${combo}) combo`);
  }

  playJiggleAnimation(ball) {
    // Improved: queue a jiggle if one is already running
    if (ball.isJiggling) {
      ball.jiggleQueued = true;
      return;
    }
    ball.isJiggling = true;
    ball.jiggleQueued = false;
    const originalScale = ball.scale;
    const gentleScale = originalScale * 1.05;
    const gentleDuration = CONFIG.jiggleAnimationDuration / 3;
    this.scene.tweens.add({
      targets: ball,
      scale: gentleScale,
      duration: gentleDuration,
      yoyo: true,
      ease: "Sine.easeInOut",
      onComplete: () => {
        ball.scale = originalScale;
        if (ball.jiggleQueued) {
          ball.jiggleQueued = false;
          // Immediately play another jiggle
          this.playJiggleAnimation(ball);
        } else {
          ball.isJiggling = false;
        }
      },
    });
  }

  handleDifferentColorCollision(ball, otherBall) {
    // Lose a life
    this.scene.loseLife();

    // Turn both balls gray (dead)
    ball.setDead();
    otherBall.setDead();

    // Stop both balls from moving
    ball.velocity = { x: 0, y: 0 };
    otherBall.velocity = { x: 0, y: 0 };

    // Stop otherBall pulsation
    otherBall.stopPulsating();

    // Show skull emoji
    this.showEmoji(ball.x, ball.y, "💀");

    // Reset drag state
    this.resetDragState();

    // Check if game over
    this.scene.checkGameOver();
  }

  showEmoji(x, y, emoji) {
    const text = this.scene.add
      .text(x, y, emoji, {
        fontSize: "32px",
      })
      .setOrigin(0.5);

    this.scene.tweens.add({
      targets: text,
      y: y - 100,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        text.destroy();
      },
    });
  }

  showScoreText(x, y, scoreText) {
    const text = this.scene.add
      .text(x, y, scoreText, {
        fontSize: "24px",
        fontFamily: CONFIG.fontFamily,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.scene.tweens.add({
      targets: text,
      y: y - 80,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        text.destroy();
      },
    });
  }
  showComboText(x, y, comboText, isGoalCompletion = false) {
    if (isGoalCompletion) {
      // Show in center for goal completion
      const screenHeight = this.scene.cameras.main.height;
      const screenWidth = this.scene.cameras.main.width;
      const centerX = screenWidth / 2;
      const centerY = screenHeight / 2;

      const text = this.scene.add
        .text(centerX, centerY, comboText, {
          fontSize: "32px", // Larger for goal completion
          fontFamily: CONFIG.fontFamily,
          color: "#ffff00",
          stroke: "#ff0000",
          strokeThickness: 4,
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      // Dramatic center animation for goal
      this.scene.tweens.add({
        targets: text,
        scale: { from: 0.5, to: 2 },
        alpha: { from: 1, to: 0 },
        duration: 1000,
        ease: "Power2",
        onComplete: () => {
          text.destroy();
        },
      });
    } else {
      // Show above ball for merges
      const text = this.scene.add
        .text(x, y, comboText, {
          fontSize: "28px",
          fontFamily: CONFIG.fontFamily,
          color: "#ffff00",
          stroke: "#ff0000",
          strokeThickness: 4,
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      // Upward fade animation for merges
      this.scene.tweens.add({
        targets: text,
        y: y - 80,
        alpha: { from: 1, to: 0 },
        duration: 800,
        ease: "Power2",
        onComplete: () => {
          text.destroy();
        },
      });
    }
  }

  showComboLostText(x, y) {
    const text = this.scene.add
      .text(x, y, "RIP Combo 😭", {
        fontSize: "28px",
        fontFamily: CONFIG.fontFamily,
        color: "#ff0000",
        stroke: "#ffffff",
        strokeThickness: 1,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Add a downward animation for combo loss
    this.scene.tweens.add({
      targets: text,
      y: y + 80,
      scale: { from: 1.2, to: 0.8 },
      alpha: { from: 1, to: 0 },
      duration: 700,
      ease: "Power2",
      onComplete: () => {
        text.destroy();
      },
    });
  }
  onPointerUp() {
    if (!this.isDragging || !this.draggedBall) return;

    // Check if the game is paused - if so, cleanup and return
    if (this.scene.isPaused) {
      // Reset ball to its original position
      if (this.draggedBall && this.startPosition) {
        this.draggedBall.x = this.startPosition.x;
        this.draggedBall.y = this.startPosition.y;
      }
      this.resetDragState();
      return;
    }

    const ball = this.draggedBall;

    // If ball is not dead, resume its movement
    if (!ball.isDead) {
      // Use the current radius of the ball (which includes any merges)
      const finalRadius = ball.originalRadius;

      // Check if we had started a combo but didn't complete it
      if (this.comboCount > 0 && this.mergeBallsOccurred) {
        this.showComboLostText(ball.x, ball.y);
      }

      Logger.debug(
        `Using final radius: ${finalRadius.toFixed(1)}, mergeBallsOccurred: ${
          this.mergeBallsOccurred
        }`,
      );

      // Update physics body to match
      ball.body.setCircle(finalRadius);

      // Ensure the display size matches exactly
      const diameter = finalRadius * 2;
      ball.setDisplaySize(diameter, diameter);

      // Update score text to match new radius if debug enabled
      if (ball.scoreText && CONFIG.debugCode) {
        ball.scoreText.setText(Math.floor(finalRadius).toString());

        // Make sure score text stays on top
        this.scene.children.bringToTop(ball.scoreText);
      }

      // Reset dragging state on the ball
      ball.isDragging = false;

      // --- Resume pulsation at the exact size where the user let go ---
      if (
        ball.mergedId &&
        window.MERGED_BALLS_DATA[ball.mergedId] !== undefined
      ) {
        window.LAST_MERGED_PULSATING_RADIUS =
          window.MERGED_BALLS_DATA[ball.mergedId] * 2;
        window.LAST_MERGED_PULSATING_BALL_ID = ball.mergedId;
        // ball.resumePulsating(window.MERGED_BALLS_DATA[ball.mergedId]);
        Logger.info(
          `Merged ball returned pulsating. The stored variable of its previous pulsation, Radius, is ${
            window.MERGED_BALLS_DATA[ball.mergedId]
          } (Ball ID: ${ball.mergedId})`,
        );
      } else if (typeof this.dragStartRadius === "number") {
        ball.resumePulsating(this.dragStartRadius);
        if (this.mergeBallsOccurred) {
          Logger.info(
            `Merged ball returned pulsating. The stored variable of its previous pulsation, Radius, is ${window.LAST_MERGED_PULSATING_RADIUS} (Ball ID: ${window.LAST_MERGED_PULSATING_BALL_ID})`,
          );
        } else {
          Logger.info(
            `ball returned pulsating. The stored variable of its previous pulsation, Radius, is ${window.LAST_STOPPED_PULSATING_RADIUS} (Ball ID: ${window.LAST_STOPPED_PULSATING_BALL_ID})`,
          );
        }
      }

      Logger.info(
        `??wBall released - Color: ${
          CONFIG.colorNames[ball.colorIndex]
        }, Radius: ${finalRadius.toFixed(1)}, (${this.comboCount})combo score`,
      );

      // --- Add accumulated combo score to the scene's score ---
      if (this.comboScore > 0) {
        this.scene.score += this.comboScore;
        this.scene.uiManager.updateScore(this.scene.score);
        this.comboScore = 0;
      }
    }

    // Reset drag state
    this.resetDragState();
  }

  onDragEnd(pointer) {
    if (!this.draggedBall) return;

    const ball = this.draggedBall;
    ball.isDragging = false;

    // Get the stored final values
    const finalSize = ball.getData("finalSize");
    const finalRadius = ball.getData("originalRadius");

    if (finalSize && finalRadius) {
      ball.setDisplaySize(finalSize, finalSize);
      ball.originalRadius = finalRadius;
      ball.resumePulsating(finalRadius);

      // Clear the stored data
      ball.removeData("finalSize");
      ball.removeData("originalRadius");
    }

    this.draggedBall = null;
  }
  resetDragState() {
    this.isDragging = false;
    this.mergedThisFrame = false;
    this.dragOffset = { x: 0, y: 0 };
    this.dragStartRadius = null;
    this.originalRadius = null;
    this.clickCapturedRadius = null;
    this.comboCount = 0; // Reset combo count
    this.score = 0; // Reset accumulated score

    if (this.draggedBall) {
      this.draggedBall.isDragging = false;
      this.draggedBall = null;
    }
  }

  destroy() {
    // Clean up event listeners
    this.scene.input.off("pointerdown", this.onPointerDown, this);
    this.scene.input.off("pointermove", this.onPointerMove, this);
    this.scene.input.off("pointerup", this.onPointerUp, this);
  }
}
