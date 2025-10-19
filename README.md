# Playwright Skill for Claude Code

**General-purpose browser automation as a Claude Skill**

A [Claude Skill](https://www.anthropic.com/news/skills) that enables Claude to write and execute any Playwright automation on-the-fly - from simple page tests to complex multi-step flows. Packaged as a [Claude Code Plugin](https://docs.claude.com/en/docs/claude-code/plugins) for easy installation and distribution.

Claude autonomously decides when to use this skill based on your browser automation needs, loading only the minimal information required for your specific task.

## Features

- ✅ **Any Automation Task** - Not limited to pre-built scripts; Claude writes custom code for your specific request
- ✅ **Visible Browser by Default** - See what's happening in real-time (`headless: false`)
- ✅ **Zero Module Resolution Errors** - Universal executor ensures proper module access
- ✅ **Progressive Disclosure** - Concise SKILL.md (314 lines) with full API reference loaded only when needed
- ✅ **Safe Cleanup** - Smart temp file management without race conditions
- ✅ **Comprehensive Helpers** - Optional utility functions for common tasks

## What is a Claude Skill?

[Skills](https://www.anthropic.com/news/skills) are modular capabilities that extend Claude's functionality. Unlike slash commands that you invoke manually, Skills are **model-invoked**—Claude autonomously decides when to use them based on your request.

When you ask Claude to test a webpage or automate browser interactions, Claude:
1. **Discovers** this skill by scanning its description
2. **Loads** only the SKILL.md instructions needed for your specific task
3. **Executes** custom Playwright code tailored to your request
4. **Returns** results with screenshots and console output

Skills are composable and portable—build once, use across Claude apps, Claude Code, and the API.

## Installation

This skill can be installed via the Claude Code plugin system or manually. Learn more about [installing plugins](https://docs.claude.com/en/docs/claude-code/plugins).

### Option 1: Via Plugin System (Recommended)

Install directly from GitHub using Claude Code's plugin marketplace system:

```bash
# Add this repository as a marketplace
/plugin marketplace add lackeyjb/playwright-skill

# Install the plugin
/plugin install playwright-skill@playwright-skill
```

After installation:
- Navigate to the plugin directory: `cd ~/.claude/plugins/playwright-skill`
- Run setup: `npm run setup`
- Verify: Run `/help` to see the skill is available

**Alternative - Browse interactively:**
```bash
# Add the marketplace first
/plugin marketplace add lackeyjb/playwright-skill

# Then browse and install
/plugin
```

### Option 2: Manual Git Clone

Install directly from GitHub to your skills directory:

**Global Installation (Available Everywhere):**
```bash
# Navigate to your Claude skills directory
cd ~/.claude/skills

# Clone the skill
git clone https://github.com/lackeyjb/playwright-skill.git

# Navigate into the skill directory
cd playwright-skill

# Install dependencies and Chromium browser
npm run setup
```

**Project-Specific Installation:**
```bash
# Install in a specific project
cd /path/to/your/project
mkdir -p .claude/skills
cd .claude/skills
git clone https://github.com/lackeyjb/playwright-skill.git
cd playwright-skill
npm run setup
```

### Option 3: Download Release

1. Download the latest release from [GitHub Releases](https://github.com/lackeyjb/playwright-skill/releases)
2. Extract to:
   - Global: `~/.claude/skills/playwright-skill`
   - Project: `/path/to/your/project/.claude/skills/playwright-skill`
3. Navigate to the directory and run `npm run setup`

### Verify Installation

After installation, verify the skill is working:

1. **Check available commands:** Run `/help` to confirm the skill is loaded
2. **Test the skill:** Ask Claude to perform a simple browser task like "Test if google.com loads"
3. **Review plugin details:** Use `/plugin` → "Manage Plugins" to see plugin information

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
├── .claude-plugin/
│   └── plugin.json      # Plugin metadata for distribution
├── SKILL.md             # What Claude reads (314 lines)
├── API_REFERENCE.md     # Full Playwright API reference (630 lines)
├── README.md            # This file - user documentation
├── run.js               # Universal executor (proper module resolution)
├── package.json         # Dependencies & setup scripts
├── LICENSE              # MIT License
└── lib/
    └── helpers.js       # Optional utility functions
```

## Advanced Usage

For comprehensive Playwright API documentation, Claude will automatically load `API_REFERENCE.md` when needed:
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

## Learn More

- **Claude Skills**: [Official announcement from Anthropic](https://www.anthropic.com/news/skills)
- **Claude Code Skills Docs**: [Skills documentation](https://docs.claude.com/en/docs/claude-code/skills)
- **Claude Code Plugins Docs**: [Plugins documentation](https://docs.claude.com/en/docs/claude-code/plugins)
- **Plugin Marketplaces**: [How to create and use marketplaces](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces)
- **API Reference**: See [API_REFERENCE.md](API_REFERENCE.md) for full Playwright documentation
- **Issues**: [GitHub Issues](https://github.com/lackeyjb/playwright-skill/issues)

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
