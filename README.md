# Platformer Game Testing Skill for Claude Code

**Automated testing for 2D browser-based platformer games**

A [Claude Skill](https://www.anthropic.com/news/skills) that enables Claude to test platformer games with automated gameplay, performance monitoring, and game state validation. Packaged as a [Claude Code Plugin](https://docs.claude.com/en/docs/claude-code/plugins) for easy installation and distribution.

Claude autonomously decides when to use this skill for game testing tasks, loading only the minimal information required for your specific platformer game testing needs.

## Features

- **Game-Specific Testing** - Test player controls, jumping mechanics, collision detection, and level progression
- **Performance Monitoring** - Track FPS during gameplay to identify performance bottlenecks
- **Game State Validation** - Extract and verify score, health, lives, and other game stats
- **Action Sequences** - Execute complex movement patterns and combo moves
- **Visible Browser by Default** - Watch your game tests in real-time with `headless: false`
- **Auto-Detection** - Automatically find running dev servers on common ports
- **Zero Module Resolution Errors** - Universal executor ensures proper module access
- **Comprehensive Helpers** - Platformer-specific utility functions for common testing tasks

## What Can This Skill Test?

- Player movement (left, right, jump, double jump, combos)
- Collision detection (platforms, enemies, obstacles, collectibles)
- Level completion and progression
- Scoring and stats tracking
- Game over conditions
- Performance and FPS monitoring
- Responsive design across different viewports
- Game initialization and loading

## Installation

This skill can be installed via the Claude Code plugin system or manually.

### Option 1: Via Plugin System (Recommended)

```bash
# Add this repository as a marketplace
/plugin marketplace add <your-repo-url>

# Install the plugin
/plugin install playwright-skill-gamedev@playwright-skill

# Navigate to the skill directory and run setup
cd ~/.claude/plugins/marketplaces/playwright-skill-gamedev/skills/playwright-skill
npm run setup
```

Verify installation by running `/help` to confirm the skill is available.

### Option 2: Manual Git Clone

Install directly from GitHub to your skills directory:

**Global Installation (Available Everywhere):**
```bash
# Navigate to your Claude skills directory
cd ~/.claude/skills

# Clone the skill
git clone <your-repo-url> playwright-skill-gamedev

# Navigate into the skill directory (note the nested structure)
cd playwright-skill-gamedev/skills/playwright-skill

# Install dependencies and Chromium browser
npm run setup
```

**Project-Specific Installation:**
```bash
# Install in a specific project
cd /path/to/your/game/project
mkdir -p .claude/skills
cd .claude/skills
git clone <your-repo-url> playwright-skill-gamedev
cd playwright-skill-gamedev/skills/playwright-skill
npm run setup
```

### Verify Installation

Run `/help` to confirm the skill is loaded, then ask Claude to perform a simple game test like "Test the player movement controls".

## Quick Start

After installation, simply ask Claude to test your platformer game. Claude will write custom Playwright code, execute it, and return results with screenshots and performance metrics.

## Usage Examples

### Basic Game Testing
```
"Test the player controls"
"Check if jumping works correctly"
"Test the double jump mechanic"
"Verify collision with platforms"
```

### Performance Testing
```
"Monitor FPS during gameplay"
"Check game performance under load"
"Test if the game runs smoothly at 60 FPS"
```

### Game Mechanics
```
"Test if the player can complete the first level"
"Check if collecting coins increases the score"
"Verify game over when player falls off screen"
"Test the scoring system"
```

### Advanced Testing
```
"Test responsive design across mobile and desktop"
"Execute a running jump combo"
"Monitor performance during complex action sequences"
"Verify level complete detection"
```

## How It Works

1. Describe what you want to test (e.g., "test jumping mechanics")
2. Claude auto-detects your running dev server
3. Claude writes custom Playwright code for your specific test
4. Browser opens (visible by default) and automation executes
5. Results are displayed with console output, screenshots, and performance metrics
6. Test files are automatically cleaned up from `/tmp`

## Configuration

Default settings:
- **Headless:** `false` (browser visible for debugging)
- **Slow Motion:** `50ms` for visibility during game testing
- **Timeout:** `10s` for game initialization
- **Screenshots:** Saved to `/tmp/`

## Project Structure

```
playwright-skill-gamedev/
├── .claude-plugin/
│   ├── plugin.json          # Plugin metadata
│   └── marketplace.json     # Marketplace configuration
├── skills/
│   └── playwright-skill/    # The actual skill
│       ├── SKILL.md         # Claude reads this (game testing instructions)
│       ├── run.js           # Universal executor
│       ├── package.json     # Dependencies & setup scripts
│       └── lib/
│           └── helpers.js   # Platformer testing utilities
├── API_REFERENCE.md         # Full Playwright API reference
├── README.md                # This file
├── CONTRIBUTING.md          # Contribution guidelines
└── LICENSE                  # MIT License
```

## Game Testing Helpers

The skill includes specialized helpers for platformer game testing:

```javascript
// Game initialization
await helpers.waitForGameReady(page);

// Player controls
await helpers.movePlayer(page, 'left', 300);
await helpers.movePlayer(page, 'right', 500);
await helpers.movePlayer(page, 'jump', 200);
await helpers.doubleJump(page);

// Action sequences
await helpers.executeActionSequence(page, [
  { direction: 'right', duration: 500 },
  { direction: 'jump', duration: 150, wait: 200 }
]);

// Game state
const stats = await helpers.extractGameStats(page);
const gameOver = await helpers.isGameOver(page);
const levelComplete = await helpers.isLevelComplete(page);

// Performance
const metrics = await helpers.monitorPerformance(page, 5000);

// Screenshots
await helpers.captureGameScreen(page, 'test-result');
```

See `skills/playwright-skill/lib/helpers.js` for complete documentation.

## Advanced Usage

Claude will automatically load `API_REFERENCE.md` when needed for comprehensive Playwright documentation including selectors, network interception, authentication, visual regression testing, mobile emulation, and debugging.

## Dependencies

- Node.js >= 14.0.0
- Playwright ^1.48.0 (installed via `npm run setup`)
- Chromium (installed via `npm run setup`)

## Troubleshooting

**Playwright not installed?**
Navigate to the skill directory and run `npm run setup`.

**Module not found errors?**
Ensure automation runs via `run.js`, which handles module resolution.

**Browser doesn't open?**
Verify `headless: false` is set. The skill defaults to visible browser.

**Game doesn't load?**
Check the canvas selector and increase timeout in `waitForGameReady()`.

**Controls don't respond?**
Ensure the game canvas has focus and accepts keyboard input.

**Performance monitoring shows 0 FPS?**
Verify the game is actively rendering with requestAnimationFrame.

## Supported Game Frameworks

This skill works with any 2D browser-based platformer game, including:

- **Phaser** (2.x and 3.x)
- **PixiJS**
- **Native HTML5 Canvas**
- **WebGL games**
- **Kaboom.js**
- **Babylon.js** (2D games)
- **Three.js** (2D games)
- **Custom game engines**

## What is a Claude Skill?

[Skills](https://www.anthropic.com/news/skills) are modular capabilities that extend Claude's functionality. Unlike slash commands that you invoke manually, skills are model-invoked—Claude autonomously decides when to use them based on your request.

When you ask Claude to test a platformer game or validate game mechanics, Claude discovers this skill, loads the necessary instructions, executes custom Playwright code, and returns results with performance metrics and screenshots.

## Contributing

Contributions are welcome. Fork the repository, create a feature branch, make your changes, and submit a pull request. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Example Session

```
User: "Test if my platformer game's jump mechanic works"

Claude: I'll test the jump mechanic in your platformer game. Let me first detect running servers...

[Detects server on http://localhost:3000]

I found your dev server on port 3000. I'll write a test to verify the jump mechanic.

[Writes test script to /tmp/platformer-test-jump.js]
[Executes: cd ~/.claude/skills/playwright-skill-gamedev/skills/playwright-skill && node run.js /tmp/platformer-test-jump.js]

Results:
- Game loaded successfully
- Basic jump: Working
- Double jump: Working
- Jump height: Consistent
- Screenshot saved: /tmp/jump-test-2025-10-26.png

All jump mechanics are functioning correctly!
```

## Learn More

- [Claude Skills](https://www.anthropic.com/news/skills) - Official announcement from Anthropic
- [Claude Code Skills Documentation](https://docs.claude.com/en/docs/claude-code/skills)
- [Claude Code Plugins Documentation](https://docs.claude.com/en/docs/claude-code/plugins)
- [Plugin Marketplaces](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces)
- [API_REFERENCE.md](API_REFERENCE.md) - Full Playwright documentation
- [GitHub Issues](https://github.com/your-repo/issues)

## License

MIT License - see [LICENSE](LICENSE) file for details.
