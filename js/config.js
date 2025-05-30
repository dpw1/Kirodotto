export const CONFIG = {
  version: "1.17",
  minBallSize: 15, // Absolute minimum size for any ball
  maxBallSize: 220, // Absolute maximum size for any ball. Will be divided by 2 when merging
  ballSizeRange: [20, 40], // Range for initial ball size randomization [min, max]
  initialBallCount: 10,
  ballsPerLevel: 2,
  lives: 3,
  showHitbox: false, // If true, outline balls with a purple 2px stroke
  debugCode: false, // If true, show ball scores above them
  debugSameColorsOnly: false, // If true, only spawn balls of one color for debugging
  phoneAspectRatio: 16 / 9, // 16:9 aspect ratio
  ballColors: ["#4ea8de", "#f9d342", "#ff5d5d", "#4dd599"], // Blue, Yellow, Red, Green
  colorNames: ["blue", "yellow", "red", "green"], // For easier reference
  backgroundColor: "#101010", // Dark but not pure black
  velocityRange: [20, 30], // Pixels per second
  pulseSpeedRange: [2, 2.5], // Seconds per cycle

  // Bar positions configuration (0=blue, 1=yellow, 2=red, 3=green)
  barPositions: {
    top: 3, // Green
    bottom: 0, // Blue
    left: 2, // Red
    right: 1, // Yellow
  },

  // Additional settings for visual polish
  fontFamily: "Arial, sans-serif",
  textColor: "#ffffff", // Goal bar dimensions
  goalBarWidthPercent: 0.5, // 50% of the screen width for horizontal bars (top/bottom)
  goalBarHeightPixels: 17, // Height of horizontal bars in pixels (top/bottom)
  goalBarVerticalWidthPixels: 17, // Width of vertical bars in pixels (left/right)
  goalBarVerticalHeightPercent: 0.2, // 60% of the screen height for vertical bars (left/right)
  transitionSpeed: 500, // Milliseconds for transitions
  particleCount: 30, // Number of particles for effects

  // Game difficulty progression
  difficultyMultiplier: 1.2, // Increases every level
  maxDifficulty: 2.5,

  // Split ball configuration
  splitBallsRange: [2, 5], // Min and max number of smaller balls created
  splitBallsTotalScore: 0.8, // 80% of original ball's score
  minShatteredBallSize: 20, // Minimum size for shattered ball pieces

  // Collision animation
  jiggleAnimationDuration: 500, // Duration of jiggle animation in ms
  jiggleAnimationScale: 1.15, // Scale factor for the jiggle animation
  mobileHitboxPadding: 12, // Extra pixels for ball hitbox on mobile

  // Combo messages for goal completion
  comboGoalMessages: {
    2: ["Nice!", "Woah!", "Amazing!"],
    3: ["Incredible!", "Awesome!", "Outstanding!"],
    4: ["Insane!", "Unbelievable!", "Legendary!"],
    5: ["Godlike!", "Unstoppable!", "Divine!"],
  },
};
