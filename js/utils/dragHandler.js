import { CONFIG } from '../config.js';

export class DragHandler {
  constructor(scene, updateCallback) {
    this.scene = scene;
    this.isDragging = false;
    this.draggedBall = null;
    this.startPosition = { x: 0, y: 0 };
    this.originalScale = 1;
    this.updateCallback = updateCallback;
    this.mergedThisFrame = false; // Flag to prevent multiple merges in one frame
    this.dragOffset = { x: 0, y: 0 }; // Offset to maintain click position
    this.originalRadius = null; // Store the original radius when drag starts
    
    // Set up the input handlers
    this.scene.input.on('pointerdown', this.onPointerDown, this);
    this.scene.input.on('pointermove', this.onPointerMove, this);
    this.scene.input.on('pointerup', this.onPointerUp, this);
  }
  
  onPointerDown(pointer) {
    if (this.isDragging) return;

    console.log('current ball width', this);
    
    // Find the ball that was clicked on
    const balls = this.scene.balls.getChildren();
    for (let i = 0; i < balls.length; i++) {
      const ball = balls[i];
      
      // Skip gray balls (they're dead)
      if (ball.isDead) continue;
      
      const distance = Phaser.Math.Distance.Between(
        pointer.x, pointer.y,
        ball.x, ball.y
      );

 
      
      if (distance <= ball.width / 2) { // Using width/2 for radius
        // Calculate click offset from center
        this.dragOffset = {
          x: pointer.x - ball.x, 
          y: pointer.y - ball.y
        };
        this.startDrag(ball, pointer);
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
    
    // Capture the EXACT current size of the ball at drag start
    // This is the size we'll restore to when released
    this.dragStartRadius = ball.displayWidth / 2;
    
    // Stop pulsating animation
    ball.stopPulsating();
    
    // Ensure the ball keeps the exact size it had when grabbed
    const fixedSize = this.dragStartRadius * 2;
    ball.setDisplaySize(fixedSize, fixedSize);
    
    // Update the physics body to match the current display size
    ball.body.enable = true;
    ball.body.setCircle(this.dragStartRadius);
    
    // Bring to top
    this.scene.children.bringToTop(ball);
    if (ball.scoreText) {
      this.scene.children.bringToTop(ball.scoreText);
    }
    
    // Set ball properties
    ball.isDragging = true;
  }
  
  onPointerMove(pointer) {
    if (!this.isDragging || !this.draggedBall) return;
    
    this.mergedThisFrame = false; // Reset merge flag at the beginning of frame
    
    // Update ball position to match pointer (considering offset)
    this.draggedBall.x = pointer.x - this.dragOffset.x;
    this.draggedBall.y = pointer.y - this.dragOffset.y;
    
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
      const ballShape = new Phaser.Geom.Circle(ball.x, ball.y, ball.width / 2);
      
      // Create a rectangle shape for the goal bar
      const barBounds = bar.getBounds();
      const barShape = new Phaser.Geom.Rectangle(
        barBounds.x, barBounds.y, barBounds.width, barBounds.height
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
    const radius = ball.width / 2;
    const score = Math.floor(radius);
    this.scene.score += score;
    this.scene.uiManager.updateScore(this.scene.score);
    
    // Show score text
    this.showScoreText(ball.x, ball.y, `+${score}`);
    
    // Create confetti effect at the ball's position with the ball's color
    this.scene.createConfetti(ball.x, ball.y, CONFIG.ballColors[ball.colorIndex]);
    
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
    this.showEmoji(ball.x, ball.y, '💀');
    
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
      CONFIG.splitBallsRange[1]
    );
    
    const totalScore = Math.floor(ball.displayWidth * CONFIG.splitBallsTotalScore);
    const scorePerBall = Math.max(
      CONFIG.minShatteredBallSize,
      Math.floor(totalScore / count)
    );
    
    // Create smaller balls
    for (let i = 0; i < count; i++) {
      // Random position near the original ball
      const angle = Phaser.Math.Between(0, 360);
      const distance = Phaser.Math.Between(20, 40);
      const x = ball.x + Math.cos(angle * Math.PI / 180) * distance;
      const y = ball.y + Math.sin(angle * Math.PI / 180) * distance;
      
      // Random velocity
      const speed = Phaser.Math.FloatBetween(
        CONFIG.velocityRange[0],
        CONFIG.velocityRange[1]
      );
      const velocity = {
        x: Math.cos(angle * Math.PI / 180) * speed,
        y: Math.sin(angle * Math.PI / 180) * speed
      };
      
      // Create the new ball
      this.scene.createBall({
        x: x,
        y: y,
        size: scorePerBall,
        colorIndex: ball.colorIndex,
        velocity: velocity
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
        ball.x, ball.y,
        otherBall.x, otherBall.y
      );
      
      // Use the hitbox size (visual size including purple stroke) for collision detection
      const ballRadius = ball.width / 2;
      const otherBallRadius = otherBall.width / 2;
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
    this.showEmoji(ball.x, ball.y, '💀');
    
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
    
    // Get the radii of both balls
    const ballRadius = ball.displayWidth / 2;
    const otherRadius = otherBall.displayWidth / 2;
    
    // Calculate new radius (not size/width) - combine radii
    const newRadius = ballRadius + otherRadius;
    
    // Apply 1.1x bonus and round up
    const bonusRadius = Math.ceil(newRadius * 1.1);
    
    // Cap to max size
    const finalRadius = Math.min(CONFIG.maxBallSize / 2, bonusRadius);
    
    // This is now our new drag radius - the size the ball should stay at
    this.dragStartRadius = finalRadius;
    
    // Apply the new size (diameter = 2 * radius)
    const diameter = finalRadius * 2;
    ball.setDisplaySize(diameter, diameter);
    
    // Update physics body to match new size
    ball.body.setCircle(finalRadius);
    
    // Store this safe score value for later use
    const scoreValue = Math.floor(finalRadius);
    
    // Create a particle effect at the other ball's position
    if (this.scene.createConfetti) {
      try {
        // Create particles at the otherBall position
        this.scene.createConfetti(
          otherBall.x, otherBall.y,
          CONFIG.ballColors[ball.colorIndex]
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
    }
    
    // Play jiggle animation
    this.playJiggleAnimation(ball);
  }
  
  playJiggleAnimation(ball) {
    // Play a jiggle animation on the ball
    const originalScale = ball.scale;
    
    this.scene.tweens.add({
      targets: ball,
      scale: originalScale * CONFIG.jiggleAnimationScale,
      duration: CONFIG.jiggleAnimationDuration / 2,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        ball.scale = originalScale;
      }
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
    this.showEmoji(ball.x, ball.y, '💀');
    
    // Reset drag state
    this.resetDragState();
    
    // Check if game over
    this.scene.checkGameOver();
  }
  
  showEmoji(x, y, emoji) {
    const text = this.scene.add.text(x, y, emoji, {
      fontSize: '32px'
    }).setOrigin(0.5);
    
    this.scene.tweens.add({
      targets: text,
      y: y - 100,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        text.destroy();
      }
    });
  }
  
  showScoreText(x, y, scoreText) {
    const text = this.scene.add.text(x, y, scoreText, {
      fontSize: '24px',
      fontFamily: CONFIG.fontFamily,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    this.scene.tweens.add({
      targets: text,
      y: y - 80,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        text.destroy();
      }
    });
  }
  
  onPointerUp() {
    if (!this.isDragging || !this.draggedBall) return;
    
    const ball = this.draggedBall;
    
    // If ball is not dead, resume its movement
    if (!ball.isDead) {
      // The current exact size we're at (post any merges or initial drag)
      const finalRadius = this.dragStartRadius;
      
      // Set the ball's official size - this should be persistent
      ball.originalRadius = finalRadius;
      
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
      
      // Now resume pulsation with the new base size
      // This needs to pulsate AROUND our current exact size
      ball.resumePulsating();
    }
    
    // Reset drag state
    this.resetDragState();
  }
  
  resetDragState() {
    this.isDragging = false;
    this.mergedThisFrame = false;
    this.dragOffset = { x: 0, y: 0 };
    this.dragStartRadius = null;
    this.originalRadius = null;
    
    if (this.draggedBall) {
      this.draggedBall.isDragging = false;
      this.draggedBall = null;
    }
  }
  
  destroy() {
    // Clean up event listeners
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
  }
} 