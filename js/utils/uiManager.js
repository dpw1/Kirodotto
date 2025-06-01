import { CONFIG } from "../config.js";

export class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.scoreText = null;
    this.bestScoreText = null;
    this.lifeIcons = [];
    this.pauseButton = null;
    this.pausePanel = null;
    this.isPaused = false;
  }

  create() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // Score text
    this.scoreText = this.scene.add.text(20, 20, "Score: 0", {
      fontFamily: CONFIG.fontFamily,
      fontSize: "24px",
      color: CONFIG.textColor,
    });

    // Best score text
    const bestScore = localStorage.getItem("bestScore") || 0;
    this.bestScoreText = this.scene.add.text(20, 50, `Best: ${bestScore}`, {
      fontFamily: CONFIG.fontFamily,
      fontSize: "18px",
      color: CONFIG.textColor,
    });

    // Lives
    this.createLifeIcons();

    // Pause button
    this.createPauseButton();

    // Create the pause panel (initially hidden)
    this.createPausePanel();
  }

  createLifeIcons() {
    const startX = this.scene.cameras.main.width - 40;
    const startY = 30;
    const spacing = 40;

    for (let i = 0; i < CONFIG.lives; i++) {
      const x = startX - i * spacing;
      const lifeIcon = this.scene.add
        .text(x, startY, "❤️", {
          fontSize: "24px",
        })
        .setOrigin(0.5);

      this.lifeIcons.push(lifeIcon);
    }
  }

  createPauseButton() {
    const x = this.scene.cameras.main.width - 40;
    const y = 80;

    this.pauseButton = this.scene.add
      .text(x, y, "⏸️", {
        fontSize: "32px",
      })
      .setOrigin(0.5);

    this.pauseButton.setInteractive({ useHandCursor: true });
    this.pauseButton.on("pointerdown", () => {
      this.togglePause();
    });
  }

  createPausePanel() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // Create the panel background
    this.pausePanel = this.scene.add.container(width / 2, height / 2);

    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(0x000000, 0.8);
    panelBg.fillRoundedRect(-150, -120, 300, 240, 20);

    const title = this.scene.add
      .text(0, -80, "PAUSED", {
        fontFamily: CONFIG.fontFamily,
        fontSize: "32px",
        color: CONFIG.textColor,
      })
      .setOrigin(0.5);

    // Create buttons
    const resumeButton = this.createButton(0, -20, "Resume", () => {
      this.togglePause();
    });

    const restartButton = this.createButton(0, 40, "Restart", () => {
      this.togglePause();
      this.scene.scene.restart();
    });

    const menuButton = this.createButton(0, 100, "Main Menu", () => {
      this.togglePause();
      this.scene.scene.start("MainMenuScene");
    });

    // Add all elements to the pause panel
    this.pausePanel.add([
      panelBg,
      title,
      resumeButton,
      restartButton,
      menuButton,
    ]);
    this.pausePanel.setVisible(false);
  }

  createButton(x, y, text, callback) {
    const button = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x4444aa, 1);
    bg.fillRoundedRect(-100, -20, 200, 40, 10);

    const buttonText = this.scene.add
      .text(0, 0, text, {
        fontFamily: CONFIG.fontFamily,
        fontSize: "18px",
        color: CONFIG.textColor,
      })
      .setOrigin(0.5);

    button.add([bg, buttonText]);
    button.setSize(200, 40);
    button.setInteractive({ useHandCursor: true });
    button.on("pointerdown", callback);

    return button;
  }

  togglePause() {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      // Pause game logic
      this.scene.pauseGame();

      // Show pause panel
      this.pausePanel.setVisible(true);

      // Make sure it's on top of everything
      this.scene.children.bringToTop(this.pausePanel);
    } else {
      // Resume game logic
      this.scene.resumeGame();

      // Hide pause panel
      this.pausePanel.setVisible(false);
    }
  }

  updateScore(score) {
    this.scoreText.setText(`Score: ${score}`);

    // Update best score if needed
    const bestScore = localStorage.getItem("bestScore") || 0;
    if (score > bestScore) {
      localStorage.setItem("bestScore", score);
      this.bestScoreText.setText(`Best: ${score}`);
    }
  }

  updateLives(livesRemaining) {
    // Update life icons
    for (let i = 0; i < CONFIG.lives; i++) {
      this.lifeIcons[i].setVisible(i < livesRemaining);
    }
  }

  showLevelComplete(level, score, callback) {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // Create panel
    const panel = this.scene.add.container(width / 2, height / 2);

    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(0x000000, 0.8);
    panelBg.fillRoundedRect(-200, -150, 400, 300, 20);

    const titleText = this.scene.add
      .text(0, -100, "🎉 Good Job!", {
        fontFamily: CONFIG.fontFamily,
        fontSize: "32px",
        color: CONFIG.textColor,
      })
      .setOrigin(0.5);

    const levelText = this.scene.add
      .text(0, -40, `Level ${level} Completed`, {
        fontFamily: CONFIG.fontFamily,
        fontSize: "24px",
        color: CONFIG.textColor,
      })
      .setOrigin(0.5);

    const scoreText = this.scene.add
      .text(0, 10, `Score: ${score}`, {
        fontFamily: CONFIG.fontFamily,
        fontSize: "24px",
        color: CONFIG.textColor,
      })
      .setOrigin(0.5);

    const nextButton = this.createButton(0, 80, "Next Level", () => {
      panel.destroy();
      callback();
    });

    panel.add([panelBg, titleText, levelText, scoreText, nextButton]);

    // Add some animation
    panel.setScale(0.5);
    this.scene.tweens.add({
      targets: panel,
      scale: 1,
      duration: 300,
      ease: "Back.easeOut",
    });
  }

  showGameOver(score, mode = "arcade") {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // Create panel
    const panel = this.scene.add.container(width / 2, height / 2);

    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(0x000000, 0.8);
    panelBg.fillRoundedRect(-200, -150, 400, 300, 20);

    const titleText = this.scene.add
      .text(0, -100, "Game Over", {
        fontFamily: CONFIG.fontFamily,
        fontSize: "32px",
        color: CONFIG.textColor,
      })
      .setOrigin(0.5);

    const scoreText = this.scene.add
      .text(0, -40, `Score: ${score}`, {
        fontFamily: CONFIG.fontFamily,
        fontSize: "24px",
        color: CONFIG.textColor,
      })
      .setOrigin(0.5);

    // Show best score for the correct mode
    const bestScoreKey =
      mode === "timeAttack" ? "bestScoreTimeAttack" : "bestScoreArcade";
    const bestScore = localStorage.getItem(bestScoreKey) || 0;
    const bestScoreText = this.scene.add
      .text(0, 10, `Best: ${bestScore}`, {
        fontFamily: CONFIG.fontFamily,
        fontSize: "24px",
        color: CONFIG.textColor,
      })
      .setOrigin(0.5);

    const menuButton = this.createButton(0, 80, "Main Menu", () => {
      this.scene.scene.start("MainMenuScene");
    });

    panel.add([panelBg, titleText, scoreText, bestScoreText, menuButton]);

    // Add some animation
    panel.setScale(0.5);
    this.scene.tweens.add({
      targets: panel,
      scale: 1,
      duration: 300,
      ease: "Back.easeOut",
    });
  }
}
