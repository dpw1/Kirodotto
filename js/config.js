export const CONFIG = {
  version: "1.16",
  minBallSize: 15, // Absolute minimum size for any ball
  maxBallSize: 200, // Absolute maximum size for any ball. Will be divided by 2 when merging
  ballSizeRange: [20, 40], // Range for initial ball size randomization [min, max]
  initialBallCount: 10,
  ballsPerLevel: 2,
  lives: 3,
  showHitbox: false, // If true, outline balls with a purple 2px stroke
  debugCode: false, // If true, show ball scores above them
  debugSameColorsOnly: true, // If true, only spawn balls of one color for debugging
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
  textColor: "#ffffff",
  goalBarWidth: 0.5, // 50% of the screen width for horizontal bars
  goalBarHeight: 30, // Height of horizontal bars
  goalBarVerticalWidth: 30, // Width of vertical bars
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
};
