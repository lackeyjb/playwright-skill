# Playwright Skill

**General-purpose Playwright automation for coding agents**

An [Agent Skill](https://agentskills.io) that enables coding agents to write and execute Playwright automation on the fly, from simple page tests to complex multi-step flows. It is also packaged as a [Claude Code Plugin](https://code.claude.com/docs/en/plugins) for convenient installation.

Claude autonomously decides when to use this skill based on your browser automation needs, loading only the minimal information required for your specific task.

Made using Claude Code.

## Features

- **Any Automation Task** - Claude writes custom code for your specific request, not limited to pre-built scripts
- **Visible Browser by Default** - See automation in real-time with `headless: false`
- **Portable executor** - Runs file and inline scripts with stable module resolution
- **Progressive Disclosure** - Concise SKILL.md with full API reference loaded only when needed
- **Safe Cleanup** - Smart temp file management without race conditions
- **Comprehensive Helpers** - Optional utility functions for common tasks

## Installation

This repository contains a standard Agent Skill and a Claude Code plugin wrapper. The recommended installation method is Vercel's [`skills`](https://github.com/vercel-labs/skills) CLI, which installs skills into the native locations for supported agents.

## Why this skill?

Use this skill when the agent needs to write a real Playwright program: loops,
assertions, multiple contexts, network interception, screenshots, video, or a
script you want to keep and rerun. It also provides dev-server detection and a
small set of focused helpers.

For straightforward interactive browsing, start with Microsoft's official
[`@playwright/cli`](https://github.com/microsoft/playwright-cli) and install its
agent skills with `playwright-cli install --skills`. For tool-based browser
control with accessibility snapshots, use
[`playwright-mcp`](https://github.com/microsoft/playwright-mcp). This project is
the code-first option when the automation itself is the useful artifact.

### Understanding the Structure

This repository uses the plugin format with a nested structure:

```
playwright-skill/              # Plugin root
├── .claude-plugin/           # Plugin metadata
└── skills/
    └── playwright-skill/     # The actual skill
        └── SKILL.md
```

The repository keeps the skill inside the plugin's `skills/` directory. Installers handle that layout automatically; manual copying is only a fallback for clients without an installer.

---

### Option 1: Install with `skills` (Recommended)

Install globally for your user:

```bash
npx skills add lackeyjb/playwright-skill --skill playwright-skill --global --yes
```

Install only for the current project by omitting `--global`:

```bash
npx skills add lackeyjb/playwright-skill --skill playwright-skill --yes
```

To target specific agents, add `--agent` followed by one or more agent IDs:

```bash
npx skills add lackeyjb/playwright-skill --skill playwright-skill --agent claude-code cursor --global --yes
```

After installation, run setup from the installed skill directory:

```bash
npm run setup
```

See the [`skills` CLI documentation](https://github.com/vercel-labs/skills) for supported agents and options.

### Option 2: Claude Code Plugin

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

### Option 3: Other Agent Installations

Agent Skills are supported by Claude Code, Cursor, GitHub Copilot, Codex,
Gemini CLI, OpenCode, and other clients. Install the directory containing
`SKILL.md` using the client’s documented skill path. If a client has no
installer, copy `skills/playwright-skill/` into its documented skill directory
and run `npm run setup` there.

### Option 4: Download Release

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

After installation, ask your agent to test or automate a browser task. It will write custom Playwright code, execute it, and return results with screenshots and console output.

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
2. Your agent writes custom Playwright code for the task
3. The universal executor (run.js) runs it with proper module resolution
4. Browser opens (visible by default) and automation executes
5. Results are displayed with console output and screenshots

## Configuration

Default settings:

- **Headless:** `false` (browser visible unless explicitly requested otherwise)
- **Slow Motion:** `0ms` by default; set `SLOW_MO` when useful
- **Screenshots:** Helper screenshots use the OS temp directory; set `PW_ARTIFACT_DIR` to choose another location

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
