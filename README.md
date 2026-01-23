# Playwright Skill for Claude Code

**General-purpose browser automation as a Claude Skill**

A [Claude Skill](https://www.anthropic.com/blog/skills) that enables Claude to write and execute any Playwright automation on-the-fly - from simple page tests to complex multi-step flows. Packaged as a [Claude Code Plugin](https://docs.claude.com/en/docs/claude-code/plugins) for easy installation and distribution.

Claude autonomously decides when to use this skill based on your browser automation needs, loading only the minimal information required for your specific task.

Made using Claude Code.

## Features

- **Any Automation Task** - Claude writes custom code for your specific request, not limited to pre-built scripts
- **Visible Browser by Default** - See automation in real-time with `headless: false`
- **Zero Module Resolution Errors** - Universal executor ensures proper module access
- **Progressive Disclosure** - Concise SKILL.md with full API reference loaded only when needed
- **Safe Cleanup** - Smart temp file management without race conditions
- **Comprehensive Helpers** - Optional utility functions for common tasks

## Why This Skill?

You might be wondering how this compares to MCP-based alternatives like [playwright-mcp](https://github.com/executeautomation/playwright-mcp) or [browser-tools](https://browsertools.ai/). Here's a balanced comparison:

### Skills vs MCPs: Different Approaches

| Aspect | Skills | MCPs |
|--------|--------|------|
| **Architecture** | Native Claude feature; instructions loaded directly | External server exposing tools via protocol |
| **Context usage** | Progressive disclosure - loads only what's needed | Tool definitions loaded when server connected |
| **Flexibility** | Claude writes custom code for each task | Pre-built tool functions with fixed parameters |
| **Setup** | Drop-in folder, no running processes | Requires server process management |

### Token Usage Comparison

Skills and MCPs load different types of content into context:

| Approach | What's Loaded | Approximate Size |
|----------|---------------|------------------|
| **This skill** | SKILL.md (instructions + examples) | ~3.5K tokens |
| **This skill** (advanced) | + API_REFERENCE.md | +~4K tokens |
| **playwright-mcp** | Tool schemas (~15 tools × ~200-300 tokens each) | ~3-5K tokens |

**Key differences:**

- **Skills load instructions** - Claude reads how to write Playwright code and generates custom scripts
- **MCPs load tool schemas** - Claude sees available functions and their parameters

**Note:** Claude Code now supports [dynamic tool loading](https://www.anthropic.com/engineering/advanced-tool-use) for MCPs, so tools are loaded on-demand rather than all upfront. Both approaches have comparable context efficiency for typical tasks.

**The real tradeoff isn't tokens** - it's whether you want Claude to call pre-built functions (MCP) or write custom code for your specific task (skill).

### When to Choose This Skill

- **Custom automation** - You want Claude to write tailored Playwright code rather than calling pre-built functions
- **Progressive disclosure** - SKILL.md loaded initially; API reference loaded on-demand only when needed
- **Visible browser by default** - See what's happening in real-time
- **Simpler setup** - No separate server process to manage
- **Learning/debugging** - Generated scripts in `/tmp` can be inspected, modified, and re-run

### When MCPs Might Be Better

- **Structured tool calls** - You prefer discrete, pre-defined operations over generated code
- **Existing MCP infrastructure** - You're already using MCPs extensively
- **Specific MCP features** - Some MCPs offer unique capabilities (e.g., specialized debugging tools)

### The Skills Philosophy

This skill follows the [Agent Skills](https://agentskills.io) approach: give Claude instructions and let it write custom code for your specific task. Instead of calling `takeScreenshot(url, options)`, Claude writes a complete Playwright script tailored to exactly what you asked for.

Both approaches are valid - choose based on your workflow preferences.

## Installation

This repository is structured as a [Claude Code Plugin](https://docs.claude.com/en/docs/claude-code/plugins) containing a skill. You can install it as either a **plugin** (recommended) or extract it as a **standalone skill**.

### Understanding the Structure

This repository uses the plugin format with a nested structure:

```
playwright-skill/              # Plugin root
├── .claude-plugin/           # Plugin metadata
└── skills/
    └── playwright-skill/     # The actual skill
        └── SKILL.md
```

Claude Code expects skills to be directly in folders under `.claude/skills/`, so manual installation requires extracting the nested skill folder.

---

### Option 1: Plugin Installation (Recommended)

Install via Claude Code's plugin system for automatic updates and team distribution:

```bash
# Add this repository as a marketplace
/plugin marketplace add lackeyjb/playwright-skill

# Install the plugin
/plugin install playwright-skill@playwright-skill

# Navigate to the skill directory and run setup
cd ~/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill
npm run setup
```

Verify installation by running `/help` to confirm the skill is available.

---

### Option 2: Standalone Skill Installation

To install as a standalone skill (without the plugin system), extract only the skill folder:

**Global Installation (Available Everywhere):**

```bash
# Clone to a temporary location
git clone https://github.com/lackeyjb/playwright-skill.git /tmp/playwright-skill-temp

# Copy only the skill folder to your global skills directory
mkdir -p ~/.claude/skills
cp -r /tmp/playwright-skill-temp/skills/playwright-skill ~/.claude/skills/

# Navigate to the skill and run setup
cd ~/.claude/skills/playwright-skill
npm run setup

# Clean up temporary files
rm -rf /tmp/playwright-skill-temp
```

**Project-Specific Installation:**

```bash
# Clone to a temporary location
git clone https://github.com/lackeyjb/playwright-skill.git /tmp/playwright-skill-temp

# Copy only the skill folder to your project
mkdir -p .claude/skills
cp -r /tmp/playwright-skill-temp/skills/playwright-skill .claude/skills/

# Navigate to the skill and run setup
cd .claude/skills/playwright-skill
npm run setup

# Clean up temporary files
rm -rf /tmp/playwright-skill-temp
```

**Why this structure?** The plugin format requires the `skills/` directory for organizing multiple skills within a plugin. When installing as a standalone skill, you only need the inner `skills/playwright-skill/` folder contents.

---

### Option 3: Download Release

1. Download and extract the latest release from [GitHub Releases](https://github.com/lackeyjb/playwright-skill/releases)
2. Copy only the `skills/playwright-skill/` folder to:
   - Global: `~/.claude/skills/playwright-skill`
   - Project: `/path/to/your/project/.claude/skills/playwright-skill`
3. Navigate to the skill directory and run setup:
   ```bash
   cd ~/.claude/skills/playwright-skill  # or your project path
   npm run setup
   ```

---

### Verify Installation

Run `/help` to confirm the skill is loaded, then ask Claude to perform a simple browser task like "Test if google.com loads".

## Quick Start

After installation, simply ask Claude to test or automate any browser task. Claude will write custom Playwright code, execute it, and return results with screenshots and console output.

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

1. Describe what you want to test or automate
2. Claude writes custom Playwright code for the task
3. The universal executor (run.js) runs it with proper module resolution
4. Browser opens (visible by default) and automation executes
5. Results are displayed with console output and screenshots

## Configuration

Default settings:

- **Headless:** `false` (browser visible unless explicitly requested otherwise)
- **Slow Motion:** `100ms` for visibility
- **Timeout:** `30s`
- **Screenshots:** Saved to `/tmp/`

## Project Structure

```
playwright-skill/
├── .claude-plugin/
│   ├── plugin.json          # Plugin metadata for distribution
│   └── marketplace.json     # Marketplace configuration
├── skills/
│   └── playwright-skill/    # The actual skill (Claude discovers this)
│       ├── SKILL.md         # What Claude reads
│       ├── run.js           # Universal executor (proper module resolution)
│       ├── package.json     # Dependencies & setup scripts
│       └── lib/
│           └── helpers.js   # Optional utility functions
│       └── API_REFERENCE.md # Full Playwright API reference
├── README.md                # This file - user documentation
├── CONTRIBUTING.md          # Contribution guidelines
└── LICENSE                  # MIT License
```

## Advanced Usage

Claude will automatically load `API_REFERENCE.md` when needed for comprehensive documentation on selectors, network interception, authentication, visual regression testing, mobile emulation, performance testing, and debugging.

## Dependencies

- Node.js
- Playwright (installed via `npm run setup`)
- Chromium (installed via `npm run setup`)

## Troubleshooting

**Playwright not installed?**
Navigate to the skill directory and run `npm run setup`.

**Module not found errors?**
Ensure automation runs via `run.js`, which handles module resolution.

**Browser doesn't open?**
Verify `headless: false` is set. The skill defaults to visible browser unless headless mode is requested.

**Install all browsers?**
Run `npm run install-all-browsers` from the skill directory.

## What is a Skill?

[Agent Skills](https://agentskills.io) are folders of instructions, scripts, and resources that agents can discover and use to do things more accurately and efficiently. When you ask Claude to test a webpage or automate browser interactions, Claude discovers this skill, loads the necessary instructions, executes custom Playwright code, and returns results with screenshots and console output.

This Playwright skill implements the [open Agent Skills specification](https://agentskills.io), making it compatible across agent platforms.

## Contributing

Contributions are welcome. Fork the repository, create a feature branch, make your changes, and submit a pull request. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Learn More

- [Agent Skills Specification](https://agentskills.io) - Open specification for agent skills
- [Claude Code Skills Documentation](https://docs.claude.com/en/docs/claude-code/skills)
- [Claude Code Plugins Documentation](https://docs.claude.com/en/docs/claude-code/plugins)
- [Plugin Marketplaces](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces)
- [API_REFERENCE.md](skills/playwright-skill/API_REFERENCE.md) - Full Playwright documentation
- [GitHub Issues](https://github.com/lackeyjb/playwright-skill/issues)

## License

MIT License - see [LICENSE](LICENSE) file for details.
