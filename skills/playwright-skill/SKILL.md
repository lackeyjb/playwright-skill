---
name: Platformer Game Testing with Playwright
description: Automated testing for 2D browser-based platformer games. Auto-detects dev servers, simulates player controls (movement, jumping, combos), validates game state, monitors performance (FPS), tests collision detection, level progression, and scoring. Use when user wants to test platformer games, validate game mechanics, check performance, or automate gameplay testing.
version: 4.0.0
author: Claude Assistant
tags: [testing, automation, game-testing, platformer, canvas, webgl, performance]
---

**IMPORTANT - Path Resolution:**
This skill can be installed in different locations (plugin system, manual installation, global, or project-specific). Before executing any commands, determine the skill directory based on where you loaded this SKILL.md file, and use that path in all commands below. Replace `$SKILL_DIR` with the actual discovered path.

Common installation paths:
- Plugin system: `~/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill`
- Manual global: `~/.claude/skills/playwright-skill`
- Project-specific: `<project>/.claude/skills/playwright-skill`

# Platformer Game Testing with Playwright

Automated testing skill for 2D browser-based platformer games. I'll write custom Playwright code to test game mechanics, player controls, collision detection, level progression, performance, and more.

**CRITICAL WORKFLOW - Follow these steps in order:**

1. **Auto-detect dev servers** - For localhost testing, ALWAYS run server detection FIRST:
   ```bash
   cd $SKILL_DIR && node -e "require('./lib/helpers').detectDevServers().then(servers => console.log(JSON.stringify(servers)))"
   ```
   - If **1 server found**: Use it automatically, inform user
   - If **multiple servers found**: Ask user which one to test
   - If **no servers found**: Ask for URL or offer to help start dev server

2. **Write scripts to /tmp** - NEVER write test files to skill directory; always use `/tmp/platformer-test-*.js`

3. **Use visible browser by default** - Always use `headless: false` unless user specifically requests headless mode

4. **Parameterize URLs** - Always make URLs configurable via environment variable or constant at top of script

## How It Works

1. You describe what you want to test (e.g., "test jumping mechanics", "verify collision detection")
2. I auto-detect running dev servers (or ask for URL if testing external game)
3. I write custom Playwright code in `/tmp/platformer-test-*.js` for game-specific testing
4. I execute it via: `cd $SKILL_DIR && node run.js /tmp/platformer-test-*.js`
5. Results displayed in real-time with screenshots, performance metrics, and game state validation
6. Test files auto-cleaned from /tmp by your OS

## Setup (First Time)

```bash
cd $SKILL_DIR
npm run setup
```

This installs Playwright and Chromium browser. Only needed once.

## Execution Pattern

**Step 1: Detect dev servers (for localhost testing)**

```bash
cd $SKILL_DIR && node -e "require('./lib/helpers').detectDevServers().then(s => console.log(JSON.stringify(s)))"
```

**Step 2: Write test script to /tmp with URL parameter**

```javascript
// /tmp/platformer-test-movement.js
const { chromium } = require('playwright');
const helpers = require('./lib/helpers');

// Parameterized URL (detected or user-provided)
const GAME_URL = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();

  await page.goto(GAME_URL);
  await helpers.waitForGameReady(page);

  // Test player movement
  await helpers.movePlayer(page, 'right', 500);
  await helpers.movePlayer(page, 'jump', 200);
  await helpers.movePlayer(page, 'left', 500);

  await helpers.captureGameScreen(page, 'movement-test');

  await browser.close();
})();
```

**Step 3: Execute from skill directory**

```bash
cd $SKILL_DIR && node run.js /tmp/platformer-test-movement.js
```

## Game Testing Patterns

### Test Player Controls

```javascript
// /tmp/platformer-test-controls.js
const { chromium } = require('playwright');
const helpers = require('./lib/helpers');

const GAME_URL = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(GAME_URL);
  await helpers.waitForGameReady(page);

  console.log('🧪 Testing player controls...');

  // Test basic movements
  await helpers.movePlayer(page, 'left', 300);
  console.log('✅ Left movement tested');

  await helpers.movePlayer(page, 'right', 300);
  console.log('✅ Right movement tested');

  await helpers.movePlayer(page, 'jump', 200);
  console.log('✅ Jump tested');

  // Test double jump if supported
  await helpers.doubleJump(page);
  console.log('✅ Double jump tested');

  await helpers.captureGameScreen(page, 'controls-test');

  await browser.close();
})();
```

### Test Level Completion

```javascript
// /tmp/platformer-test-level-complete.js
const { chromium } = require('playwright');
const helpers = require('./lib/helpers');

const GAME_URL = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 30 });
  const page = await browser.newPage();

  await page.goto(GAME_URL);
  await helpers.waitForGameReady(page);

  console.log('🎯 Testing level completion...');

  // Execute action sequence to complete level
  const actions = [
    { direction: 'right', duration: 1000 },
    { direction: 'jump', duration: 150, wait: 200 },
    { direction: 'right', duration: 500 },
    { direction: 'jump', duration: 150, wait: 200 },
    { direction: 'right', duration: 1500 }
  ];

  await helpers.executeActionSequence(page, actions);

  // Check if level is complete
  const isComplete = await helpers.isLevelComplete(page);

  if (isComplete) {
    console.log('✅ Level completed successfully!');
  } else {
    console.log('❌ Level not completed');
  }

  await helpers.captureGameScreen(page, 'level-complete');

  await browser.close();
})();
```

### Test Collision Detection

```javascript
// /tmp/platformer-test-collision.js
const { chromium } = require('playwright');
const helpers = require('./lib/helpers');

const GAME_URL = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();

  await page.goto(GAME_URL);
  await helpers.waitForGameReady(page);

  console.log('🧪 Testing collision detection...');

  // Get initial game state
  const initialState = await helpers.extractGameStats(page);
  console.log('Initial state:', initialState);

  // Move into obstacle/enemy
  await helpers.movePlayer(page, 'right', 2000);

  // Check if health/lives decreased
  const afterCollisionState = await helpers.extractGameStats(page);
  console.log('After collision:', afterCollisionState);

  if (afterCollisionState.health < initialState.health ||
      afterCollisionState.lives < initialState.lives) {
    console.log('✅ Collision detection working');
  } else {
    console.log('⚠️  No collision damage detected');
  }

  await helpers.captureGameScreen(page, 'collision-test');

  await browser.close();
})();
```

### Test Scoring System

```javascript
// /tmp/platformer-test-scoring.js
const { chromium } = require('playwright');
const helpers = require('./lib/helpers');

const GAME_URL = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();

  await page.goto(GAME_URL);
  await helpers.waitForGameReady(page);

  console.log('🎯 Testing scoring system...');

  // Get initial score
  const initialStats = await helpers.extractGameStats(page);
  console.log('Initial score:', initialStats.score);

  // Collect items/coins
  await helpers.movePlayer(page, 'right', 1000);
  await helpers.movePlayer(page, 'jump', 150);
  await page.waitForTimeout(500);

  // Check if score increased
  const afterStats = await helpers.extractGameStats(page);
  console.log('Score after collecting:', afterStats.score);

  if (afterStats.score > initialStats.score) {
    console.log(`✅ Score increased by ${afterStats.score - initialStats.score}`);
  } else {
    console.log('⚠️  No score change detected');
  }

  await helpers.captureGameScreen(page, 'scoring-test');

  await browser.close();
})();
```

### Monitor Game Performance

```javascript
// /tmp/platformer-test-performance.js
const { chromium } = require('playwright');
const helpers = require('./lib/helpers');

const GAME_URL = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(GAME_URL);
  await helpers.waitForGameReady(page);

  console.log('📊 Monitoring game performance...');

  // Monitor FPS during gameplay
  const performancePromise = helpers.monitorPerformance(page, 10000);

  // Simulate gameplay during monitoring
  await helpers.movePlayer(page, 'right', 2000);
  await helpers.movePlayer(page, 'jump', 200);
  await helpers.movePlayer(page, 'left', 2000);
  await helpers.movePlayer(page, 'jump', 200);

  const metrics = await performancePromise;

  console.log('Performance Results:');
  console.log(`  Average FPS: ${metrics.averageFPS}`);
  console.log(`  Min FPS: ${metrics.minFPS}`);
  console.log(`  Max FPS: ${metrics.maxFPS}`);

  if (metrics.averageFPS >= 55) {
    console.log('✅ Performance is good (target: 60 FPS)');
  } else if (metrics.averageFPS >= 30) {
    console.log('⚠️  Performance is acceptable but could be better');
  } else {
    console.log('❌ Performance issues detected');
  }

  await browser.close();
})();
```

### Test Game Over Condition

```javascript
// /tmp/platformer-test-gameover.js
const { chromium } = require('playwright');
const helpers = require('./lib/helpers');

const GAME_URL = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(GAME_URL);
  await helpers.waitForGameReady(page);

  console.log('🧪 Testing game over condition...');

  // Try to trigger game over (fall off platform, hit enemy, etc.)
  await helpers.movePlayer(page, 'left', 3000);

  // Wait a bit for game over screen
  await page.waitForTimeout(2000);

  const gameOver = await helpers.isGameOver(page);

  if (gameOver) {
    console.log('✅ Game over detected correctly');
    await helpers.captureGameScreen(page, 'gameover-screen');
  } else {
    console.log('⚠️  Game over not detected');
  }

  await browser.close();
})();
```

### Test Complex Combo Moves

```javascript
// /tmp/platformer-test-combos.js
const { chromium } = require('playwright');
const helpers = require('./lib/helpers');

const GAME_URL = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 30 });
  const page = await browser.newPage();

  await page.goto(GAME_URL);
  await helpers.waitForGameReady(page);

  console.log('🎮 Testing combo moves...');

  // Running jump (right + space)
  console.log('Testing running jump...');
  await helpers.executeCombo(page, ['ArrowRight', 'Space'], 400);
  await page.waitForTimeout(500);

  // Dash attack (shift + right)
  console.log('Testing dash attack...');
  await helpers.executeCombo(page, ['Shift', 'ArrowRight'], 300);
  await page.waitForTimeout(500);

  await helpers.captureGameScreen(page, 'combo-test');

  console.log('✅ Combo moves tested');

  await browser.close();
})();
```

### Test Responsive Controls

```javascript
// /tmp/platformer-test-responsive.js
const { chromium } = require('playwright');
const helpers = require('./lib/helpers');

const GAME_URL = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ headless: false });

  // Test on different viewport sizes
  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
  ];

  for (const viewport of viewports) {
    console.log(`\n🧪 Testing on ${viewport.name} (${viewport.width}x${viewport.height})`);

    const page = await browser.newPage();
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    await page.goto(GAME_URL);
    await helpers.waitForGameReady(page);

    // Test basic controls
    await helpers.movePlayer(page, 'right', 500);
    await helpers.movePlayer(page, 'jump', 200);

    await helpers.captureGameScreen(page, `${viewport.name.toLowerCase()}-test`);

    console.log(`✅ ${viewport.name} testing complete`);

    await page.close();
  }

  await browser.close();
})();
```

## Available Game Testing Helpers

All helpers are in `lib/helpers.js` and automatically available:

```javascript
const helpers = require('./lib/helpers');

// Game initialization
await helpers.waitForGameReady(page, { canvasSelector: 'canvas', timeout: 10000 });

// Player controls
await helpers.movePlayer(page, 'left', 300);  // left, right, jump, up, down
await helpers.pressKey(page, 'Space', 100);
await helpers.doubleJump(page);
await helpers.executeCombo(page, ['ArrowRight', 'Space'], 400);

// Action sequences
await helpers.executeActionSequence(page, [
  { direction: 'right', duration: 500 },
  { direction: 'jump', duration: 150, wait: 200 }
]);

// Game state checking
const state = await helpers.getGameState(page, { scoreSelector: '#score' });
const stats = await helpers.extractGameStats(page);
const gameOver = await helpers.isGameOver(page);
const levelComplete = await helpers.isLevelComplete(page);

// Performance monitoring
const metrics = await helpers.monitorPerformance(page, 5000);

// Screenshots
await helpers.captureGameScreen(page, 'test-result');

// Testing utilities
const controlTests = await helpers.testPlayerControls(page);
const hasElement = await helpers.checkGameElement(page, '.power-up');
```

See `lib/helpers.js` for complete list and documentation.

## Tips for Platformer Game Testing

- **Wait for game load**: Always use `waitForGameReady()` before interacting with the game
- **Visible browser**: Use `headless: false` to watch game tests in action
- **Slow motion**: Use `slowMo: 50` to make actions more visible and easier to debug
- **Canvas selector**: If your game uses a custom canvas ID, pass `canvasSelector: '#game-canvas'`
- **Action sequences**: Use `executeActionSequence()` for complex movement patterns
- **Performance**: Monitor FPS during gameplay to detect performance issues
- **Game state**: Extract score/stats from DOM or window object
- **Screenshots**: Capture game state at key moments for visual verification
- **Custom selectors**: Pass custom selectors for game-specific UI elements

## Example Usage

```
User: "Test if the player can jump over the first obstacle"

Claude: I'll test the jump mechanic over the first obstacle. Let me first detect running servers...
[Runs: detectDevServers()]
[Output: Found server on port 3000]
I found your dev server running on http://localhost:3000

[Writes custom test script to /tmp/platformer-test-jump.js]
[Runs: cd $SKILL_DIR && node run.js /tmp/platformer-test-jump.js]
[Shows results with screenshots and game state]
```

```
User: "Check the game's performance during intense action"

Claude: I'll monitor FPS during an action sequence...
[Writes performance test to /tmp/platformer-test-perf.js]
[Runs test with 10-second monitoring period]
[Reports: Average FPS: 58, Min: 52, Max: 60 - Performance is good]
```

## Troubleshooting

**Playwright not installed:**
```bash
cd $SKILL_DIR && npm run setup
```

**Game doesn't load:**
Check canvas selector and increase timeout in `waitForGameReady()`

**Controls don't work:**
Verify the game canvas has focus and accepts keyboard input

**Performance monitoring shows 0 FPS:**
Ensure the game is actively rendering and using requestAnimationFrame

**Can't detect game state:**
Check browser console for game global variables or use DOM selectors for UI elements

## Notes

- Each test is custom-written for your specific game and requirements
- Not limited to pre-built scripts - any game testing scenario possible
- Auto-detects running dev servers to eliminate hardcoded URLs
- Test scripts written to `/tmp` for automatic cleanup
- Supports canvas-based games (Phaser, PixiJS, native canvas, etc.)
- Can test WebGL games
- Mobile/responsive testing supported with viewport configuration
