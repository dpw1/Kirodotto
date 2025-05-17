# Kirodotto Game

Kirodotto is a physics-lite, color-matching, touch-and-drag puzzle action game built with Phaser 3.

## Game Concept

In Kirodotto, players drag colored balls to matching colored goal bars to score points. Each ball's score is based on its size, and the game gets progressively more challenging as you complete levels.

## Game Rules

1. **Core Mechanics**:
   - Drag colored pulsating balls into goal bars of matching colors to score
   - Each level starts with more balls than the previous one
   - The player has 3 lives

2. **Goal Bars**:
   - 4 goal bars (top, bottom, left, right)
   - Each bar has one of the 4 colors: blue, yellow, red, green

3. **Balls (Dots)**:
   - Each ball has a color, pulsating size, and velocity
   - The score for each ball equals its radius in pixels
   - Balls bounce off screen edges

4. **Dragging Behavior**:
   - Ball stops pulsating while being dragged
   - If a ball touches the same color ball: they merge, combining size + score
   - If a ball touches a different color ball: player loses 1 life, ball becomes gray, frozen, and deadly
   - If a ball touches a gray ball: player loses 1 life
   - If a ball touches wrong color bar: ball becomes gray and shatters into 2-5 smaller balls
   - When a ball is dragged to the correct bar: player gets points equal to the ball's radius

5. **Level Progression**:
   - Each level adds 2 more balls
   - When all balls are scored or turned gray, the level ends
   - If all balls go gray or the player loses all lives: Game Over

## Controls

- **Mouse/Touch**: Click and drag balls to goal bars

## Configuration

The game can be configured via the `config.js` file, which allows you to change parameters like:
- Ball sizes
- Number of balls per level
- Colors
- Physics settings
- Debug options

## Installation & Running

### Prerequisites
- Node.js and npm (Node Package Manager)

### Installation
1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the game:
   ```
   npm start
   ```

Alternatively, you can use one of these methods:

**On Windows:**
- Run `start-game.bat`

**Cross-platform:**
- Run `npm run setup`

The game should open automatically in your default browser. If not, navigate to http://localhost:8080 in your browser.

## Development

### Project Structure
- `index.html` - Main HTML file
- `js/` - Main JavaScript directory
  - `main.js` - Game bootstrap
  - `config.js` - Game configuration
  - `scenes/` - Game scenes
    - `BootScene.js` - Asset loading scene
    - `MainMenuScene.js` - Main menu
    - `GameScene.js` - Main gameplay
    - `GameOverScene.js` - Game over scene
    - `LevelCompleteScene.js` - Level complete scene
  - `utils/` - Utility classes
    - `dragHandler.js` - Drag interaction logic
    - `uiManager.js` - UI management
  - `assets/` - Game assets

### Development Server
Run the development server with:
```
npm run dev
```

### Technologies Used
- Phaser 3.55.2
- JavaScript (ES6)
- HTML5 Canvas
- Node.js

## License

This project is available for personal and educational use.

## Credits

Kirodotto v1.0 - Created with Phaser 3 