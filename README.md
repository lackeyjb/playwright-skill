# Playwright Skill - Claude Code Plugin

**General-purpose browser automation for Claude Code**

This plugin enables Claude to write and execute any Playwright automation on-the-fly - from simple page tests to complex multi-step flows. Like playwright-mcp, but as a Claude Code Skill with progressive disclosure for optimal context usage.

## Features

- ✅ **Any Automation Task** - Not limited to pre-built scripts; Claude writes custom code for your specific request
- ✅ **Visible Browser by Default** - See what's happening in real-time (`headless: false`)
- ✅ **Zero Module Resolution Errors** - Universal executor ensures proper module access
- ✅ **Progressive Disclosure** - Concise SKILL.md (314 lines) with full API reference loaded only when needed
- ✅ **Safe Cleanup** - Smart temp file management without race conditions
- ✅ **Comprehensive Helpers** - Optional utility functions for common tasks

## Installation

### Option 1: Install from GitHub (Recommended)

```bash
# Navigate to your Claude skills directory
cd ~/.claude/skills

# Clone the plugin
git clone https://github.com/lackeyjb/playwright-skill.git

# Navigate into the skill directory
cd playwright-skill

# Install dependencies and Chromium browser
npm run setup
```

### Option 2: Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/lackeyjb/playwright-skill/releases)
2. Extract to `~/.claude/skills/playwright-skill`
3. Run `npm run setup` inside the directory

### Option 3: Project-Specific Installation

```bash
# Install in a specific project
cd /path/to/your/project
mkdir -p .claude/skills
cd .claude/skills
git clone https://github.com/lackeyjb/playwright-skill.git
cd playwright-skill
npm run setup
```

## Quick Start

After installation, simply ask Claude to test or automate any browser task:

```
You: "Test the marketing page and check if it's responsive"

Claude: I'll test the marketing page across multiple viewports
[Writes custom automation script]
[Runs: node run.js test-marketing.js]
[Browser opens, tests run, screenshots taken]
[Shows results]
```

```
You: "Check if the login flow works correctly"

Claude: I'll test the login flow and verify redirection
[Writes login automation]
[Runs: node run.js test-login.js]
[Reports: ✅ Login successful, redirected to /dashboard]
```

## Usage Examples

### Test Any Page
```
"Test the homepage"
"Check if the contact form works"
"Verify the signup flow"
```

### Visual Testing
```
"Take screenshots of the dashboard in mobile and desktop"
"Test responsive design across different viewports"
```

### Interaction Testing
```
"Fill out the registration form and submit it"
"Click through the main navigation"
"Test the search functionality"
```

### Validation
```
"Check for broken links"
"Verify all images load"
"Test form validation"
```

## How It Works

1. **You describe** what you want to test/automate
2. **Claude writes** custom Playwright code for that specific task
3. **run.js executes** it with proper module resolution
4. **Browser opens** (visible by default) and automation runs
5. **Results displayed** with console output and screenshots

## Configuration

The skill uses sensible defaults:
- **Headless:** `false` (browser visible) - only use headless when explicitly requested
- **Slow Motion:** `100ms` - actions slowed down for visibility
- **Timeout:** `30s` - sufficient for most pages
- **Screenshots:** Saved to `/tmp/` by default

## Project Structure

```
playwright-skill/
├── SKILL.md          # Concise execution patterns (314 lines)
├── README.md         # Full Playwright API reference (630 lines)
├── run.js            # Universal executor (proper module resolution)
├── package.json      # Dependencies & setup scripts
├── plugin.json       # Plugin metadata
├── LICENSE           # MIT License
└── lib/
    └── helpers.js    # Optional utility functions
```

## Advanced Usage

For comprehensive Playwright API documentation, Claude will automatically load `README.md` when needed:
- Selectors & Locators best practices
- Network interception & API mocking
- Authentication & session management
- Visual regression testing
- Mobile device emulation
- Performance testing
- Debugging techniques

## Dependencies

- **Node.js**: >= 14.0.0
- **Playwright**: ^1.48.0 (installed automatically via `npm run setup`)
- **Chromium**: Installed via `npx playwright install chromium`

## Troubleshooting

**Playwright not installed?**
```bash
cd ~/.claude/skills/playwright-skill
npm run setup
```

**Module not found errors?**
Ensure you're running via `run.js` which handles module resolution automatically.

**Browser doesn't open?**
Check that `headless: false` is set in the automation code. The skill defaults to visible browser unless you specifically request headless mode.

**Need to install all browsers?**
```bash
npm run install-all-browsers
```

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- **Issues**: [GitHub Issues](https://github.com/lackeyjb/playwright-skill/issues)
- **Documentation**: See [README.md](README.md) for full Playwright API reference
- **Claude Code Docs**: [https://docs.claude.com/en/docs/claude-code/skills](https://docs.claude.com/en/docs/claude-code/skills)

## Changelog

### v3.0.0 (Latest)
- Complete refactor to general-purpose automation
- Universal executor with safe cleanup strategy
- Progressive disclosure (314-line SKILL.md vs previous 1,356 lines)
- Visible browser by default
- Smart temp file management
- Comprehensive helper library

---

**Made for Claude Code** | **Powered by Playwright**
