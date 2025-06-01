import { CONFIG } from "../config.js";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainMenuScene" });
  }

  create() {
    // Load saved settings when scene starts
    this.loadSavedSettings();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Title
    const title = this.add
      .text(width / 2, height * 0.25, "KIRODOTTO", {
        fontFamily: CONFIG.fontFamily,
        fontSize: "48px",
        color: CONFIG.textColor,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Add title animation
    this.tweens.add({
      targets: title,
      scale: { from: 0.8, to: 1 },
      duration: 1000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    // Create floating background balls
    this.createBackgroundBalls();

    // Best scores for both modes
    const bestScoreArcade = localStorage.getItem("bestScoreArcade") || 0;
    const bestScoreTimeAttack =
      localStorage.getItem("bestScoreTimeAttack") || 0;
    this.add
      .text(
        width / 2,
        height * 0.4,
        `Best Arcade: ${bestScoreArcade}   |   Best Time Attack: ${bestScoreTimeAttack}`,
        {
          fontFamily: CONFIG.fontFamily,
          fontSize: "24px",
          color: CONFIG.textColor,
        },
      )
      .setOrigin(0.5);

    // Arcade button
    const arcadeButton = this.createButton(
      width / 2,
      height * 0.55,
      "Arcade",
      () => {
        CONFIG.includeTimer = false;
        this.scene.start("GameScene", { mode: "arcade" });
      },
    );

    // Time Attack button
    const timeAttackButton = this.createButton(
      width / 2,
      height * 0.65,
      "Time Attack",
      () => {
        CONFIG.includeTimer = true;
        this.scene.start("GameScene", { mode: "timeAttack" });
      },
    );

    // Options button
    const optionsButton = this.createButton(
      width / 2,
      height * 0.75,
      "Options",
      () => {
        this.showOptions();
      },
    );

    // Credits
    this.add
      .text(width / 2, height * 0.9, `Kirodotto v${CONFIG.version}`, {
        fontFamily: CONFIG.fontFamily,
        fontSize: "16px",
        color: CONFIG.textColor,
      })
      .setOrigin(0.5);
  }

  loadSavedSettings() {
    // Load saved settings from localStorage
    CONFIG.showHitbox = localStorage.getItem("showHitbox") === "true";
    CONFIG.debugCode = localStorage.getItem("debugCode") === "true";
  }

  createButton(x, y, text, callback) {
    const button = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x4444aa, 1);
    bg.fillRoundedRect(-120, -25, 240, 50, 10);

    const buttonText = this.add
      .text(0, 0, text, {
        fontFamily: CONFIG.fontFamily,
        fontSize: "24px",
        color: CONFIG.textColor,
      })
      .setOrigin(0.5);

    button.add([bg, buttonText]);
    button.setSize(240, 50);
    button.setInteractive({ useHandCursor: true });

    // Add hover effect
    button.on("pointerover", () => {
      bg.clear();
      bg.fillStyle(0x6666cc, 1);
      bg.fillRoundedRect(-120, -25, 240, 50, 10);
    });

    button.on("pointerout", () => {
      bg.clear();
      bg.fillStyle(0x4444aa, 1);
      bg.fillRoundedRect(-120, -25, 240, 50, 10);
    });

    button.on("pointerdown", callback);

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
      const color = Phaser.Display.Color.HexStringToColor(
        CONFIG.ballColors[colorIndex],
      ).color;

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
    this.sys.events.on("update", this.updateBalls, this);
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

    const titleText = this.add
      .text(0, -100, "Options", {
        fontFamily: CONFIG.fontFamily,
        fontSize: "32px",
        color: CONFIG.textColor,
      })
      .setOrigin(0.5);

    // Show hitbox option
    const hitboxText = this.add
      .text(-150, -40, "Show Hitbox:", {
        fontFamily: CONFIG.fontFamily,
        fontSize: "18px",
        color: CONFIG.textColor,
      })
      .setOrigin(0, 0.5);

    const hitboxSwitch = this.createSwitch(
      50,
      -40,
      CONFIG.showHitbox,
      (value) => {
        CONFIG.showHitbox = value;
        localStorage.setItem("showHitbox", value);
      },
    );

    // Debug option
    const debugText = this.add
      .text(-150, 10, "Debug Mode:", {
        fontFamily: CONFIG.fontFamily,
        fontSize: "18px",
        color: CONFIG.textColor,
      })
      .setOrigin(0, 0.5);

    const debugSwitch = this.createSwitch(50, 10, CONFIG.debugCode, (value) => {
      CONFIG.debugCode = value;
      localStorage.setItem("debugCode", value);
    });

    // Reset scores option
    const resetButton = this.createButton(0, 70, "Reset Scores", () => {
      localStorage.removeItem("bestScore");
      this.scene.restart();
    });
    resetButton.setScale(0.7);

    // Debug Options button
    const debugOptionsButton = this.createButton(
      0,
      120,
      "Debug Options",
      () => {
        this.showDebugOptions(panel);
      },
    );
    debugOptionsButton.setScale(0.7);

    // Close button
    const closeButton = this.createButton(0, 170, "Close", () => {
      panel.destroy();
    });
    closeButton.setScale(0.7);

    panel.add([
      panelBg,
      titleText,
      hitboxText,
      hitboxSwitch,
      debugText,
      debugSwitch,
      resetButton,
      debugOptionsButton,
      closeButton,
    ]);

    // Add animation
    panel.setScale(0.5);
    this.tweens.add({
      targets: panel,
      scale: 1,
      duration: 300,
      ease: "Back.easeOut",
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

    container.on("pointerdown", () => {
      // Toggle the value
      container.value = !container.value;

      // Move the knob
      this.tweens.add({
        targets: knob,
        x: container.value ? 15 : -15,
        duration: 100,
        ease: "Power1",
        onComplete: () => {
          // Update the background color
          if (container.value) {
            bg.fillColor = 0x4444aa; // On - purple
          } else {
            bg.fillColor = 0x333333; // Off - dark gray
          }

          // Call the callback
          if (callback) callback(container.value);
        },
      });
    });

    return container;
  }
  showDebugOptions(parentPanel) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create a panel for debug options
    const debugPanel = this.add.container(width / 2, height / 2);

    // IMPORTANT: Ensure the debug panel is on top
    debugPanel.setDepth(1000); // High depth value to ensure it's above everything

    // Create a mask for scrolling
    const mask = this.add.graphics().setScrollFactor(0);
    mask.fillStyle(0xffffff);
    mask.fillRect(width / 2 - 250, height / 2 - 200, 500, 400);

    const contentContainer = this.add.container(0, 0);
    debugPanel.add(contentContainer);

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x222244, 0.95);
    panelBg.fillRoundedRect(-250, -200, 500, 400, 20);
    contentContainer.add(panelBg);

    const titleText = this.add
      .text(0, -170, "Debug Options", {
        fontFamily: CONFIG.fontFamily,
        fontSize: "32px",
        color: CONFIG.textColor,
      })
      .setOrigin(0.5);

    // Add title to the content container instead of debugPanel
    contentContainer.add(titleText);

    let y = -120;
    const controls = [];

    for (const key in CONFIG) {
      if (!Object.prototype.hasOwnProperty.call(CONFIG, key)) continue;
      const value = CONFIG[key];

      if (typeof value === "boolean") {
        const label = this.add
          .text(-200, y, key + ":", {
            fontFamily: CONFIG.fontFamily,
            fontSize: "18px",
            color: CONFIG.textColor,
          })
          .setOrigin(0, 0.5);

        const switch_ = this.createSwitch(100, y, value, (v) => {
          CONFIG[key] = v;
          localStorage.setItem(`debug_${key}`, v);
        });

        // Add to contentContainer instead of debugPanel
        contentContainer.add([label, switch_]);
        controls.push(label, switch_);
        y += 40;
      } else if (typeof value === "number") {
        const label = this.add
          .text(-200, y, key + ":", {
            fontFamily: CONFIG.fontFamily,
            fontSize: "18px",
            color: CONFIG.textColor,
          })
          .setOrigin(0, 0.5);

        const valueText = this.add
          .text(50, y, value.toString(), {
            fontFamily: CONFIG.fontFamily,
            fontSize: "18px",
            color: CONFIG.textColor,
          })
          .setOrigin(0, 0.5);

        // Add +/- buttons
        const minusBtn = this.add
          .text(120, y, "-", {
            fontFamily: CONFIG.fontFamily,
            fontSize: "24px",
            color: CONFIG.textColor,
          })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true });

        const plusBtn = this.add
          .text(150, y, "+", {
            fontFamily: CONFIG.fontFamily,
            fontSize: "24px",
            color: CONFIG.textColor,
          })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true });

        minusBtn.on("pointerdown", () => {
          CONFIG[key] = Math.max(0, CONFIG[key] - 1);
          valueText.setText(CONFIG[key].toString());
          localStorage.setItem(`debug_${key}`, CONFIG[key]);
        });

        plusBtn.on("pointerdown", () => {
          CONFIG[key] += 1;
          valueText.setText(CONFIG[key].toString());
          localStorage.setItem(`debug_${key}`, CONFIG[key]);
        });

        // Add to contentContainer instead of debugPanel
        contentContainer.add([label, valueText, minusBtn, plusBtn]);
        controls.push(label, valueText, minusBtn, plusBtn);
        y += 40;
      }
      // Skip arrays/objects
    }

    // Close button
    const closeButton = this.createButton(0, 180, "Close", () => {
      debugPanel.destroy();
      if (parentPanel) parentPanel.setVisible(true);
    });
    closeButton.setScale(0.7);

    // Add close button to contentContainer
    contentContainer.add(closeButton);

    // Make the container interactive for scrolling
    debugPanel.setInteractive(
      new Phaser.Geom.Rectangle(-250, -200, 500, 400),
      Phaser.Geom.Rectangle.Contains,
    );

    let isDragging = false;
    let startY = 0;

    debugPanel.on("pointerdown", (pointer) => {
      isDragging = true;
      startY = pointer.y - contentContainer.y;
    });

    debugPanel.on("pointermove", (pointer) => {
      if (!isDragging) return;

      let newY = pointer.y - startY;

      // Calculate the content height
      const contentHeight = Math.abs(closeButton.y - titleText.y) + 100;
      const visibleHeight = 400; // Panel height

      // Only allow scrolling if content is taller than panel
      if (contentHeight > visibleHeight) {
        // Limit scrolling
        newY = Math.min(0, Math.max(visibleHeight - contentHeight, newY));
        contentContainer.y = newY;
      }
    });

    debugPanel.on("pointerup", () => {
      isDragging = false;
    });

    debugPanel.on("pointerout", () => {
      isDragging = false;
    });

    // Hide parent panel while debug is open
    if (parentPanel) parentPanel.setVisible(false);

    // Animate
    debugPanel.setScale(0.5);
    this.tweens.add({
      targets: debugPanel,
      scale: 1,
      duration: 300,
      ease: "Back.easeOut",
    });
  }
  shutdown() {
    // Clean up event
    this.sys.events.off("update", this.updateBalls, this);
  }
}
