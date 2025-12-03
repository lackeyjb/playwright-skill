# Patchright Skill for Claude Code

**Undetected browser automation as a Claude Skill**

A [Claude Skill](https://www.anthropic.com/news/skills) that enables Claude to write and execute any Patchright automation on-the-fly - from simple page tests to complex multi-step flows. Uses **Patchright**, an undetected fork of Playwright that bypasses bot detection (Cloudflare, Akamai, DataDome, etc.).

Packaged as a [Claude Code Plugin](https://docs.claude.com/en/docs/claude-code/plugins) for easy installation and distribution.

Claude autonomously decides when to use this skill based on your browser automation needs, loading only the minimal information required for your specific task.

Made using Claude Code.

## Features

- **Anti-Bot Detection** - Uses Patchright to bypass Cloudflare, Akamai, DataDome, Kasada and more
- **Any Automation Task** - Claude writes custom code for your specific request, not limited to pre-built scripts
- **Python 3.10+** - Native Python implementation, shares browser installations with your Python projects
- **Visible Browser by Default** - See automation in real-time with `headless=False`
- **Zero Module Resolution Errors** - Universal executor ensures proper module access
- **Progressive Disclosure** - Concise SKILL.md with full API reference loaded only when needed
- **Safe Cleanup** - Smart temp file management without race conditions
- **Comprehensive Helpers** - Optional utility functions for common tasks

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
/plugin marketplace add a5m0/playwright-skill

# Install the plugin
/plugin install playwright-skill@playwright-skill

# Navigate to the skill directory and run setup
cd ~/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill
uv pip install patchright
patchright install chrome
```

Verify installation by running `/help` to confirm the skill is available.

---

### Option 2: Standalone Skill Installation

To install as a standalone skill (without the plugin system), extract only the skill folder:

**Global Installation (Available Everywhere):**
```bash
# Clone to a temporary location
git clone https://github.com/a5m0/playwright-skill.git /tmp/playwright-skill-temp

# Copy only the skill folder to your global skills directory
mkdir -p ~/.claude/skills
cp -r /tmp/playwright-skill-temp/skills/playwright-skill ~/.claude/skills/

# Navigate to the skill and run setup
cd ~/.claude/skills/playwright-skill
uv pip install patchright
patchright install chrome

# Clean up temporary files
rm -rf /tmp/playwright-skill-temp
```

**Project-Specific Installation:**
```bash
# Clone to a temporary location
git clone https://github.com/a5m0/playwright-skill.git /tmp/playwright-skill-temp

# Copy only the skill folder to your project
mkdir -p .claude/skills
cp -r /tmp/playwright-skill-temp/skills/playwright-skill .claude/skills/

# Navigate to the skill and run setup
cd .claude/skills/playwright-skill
uv pip install patchright
patchright install chrome

# Clean up temporary files
rm -rf /tmp/playwright-skill-temp
```

**Why this structure?** The plugin format requires the `skills/` directory for organizing multiple skills within a plugin. When installing as a standalone skill, you only need the inner `skills/playwright-skill/` folder contents.

---

### Option 3: Download Release

1. Download and extract the latest release from [GitHub Releases](https://github.com/a5m0/playwright-skill/releases)
2. Copy only the `skills/playwright-skill/` folder to:
   - Global: `~/.claude/skills/playwright-skill`
   - Project: `/path/to/your/project/.claude/skills/playwright-skill`
3. Navigate to the skill directory and run setup:
   ```bash
   cd ~/.claude/skills/playwright-skill  # or your project path
   uv pip install patchright
   patchright install chrome
   ```

---

### Verify Installation

Run `/help` to confirm the skill is loaded, then ask Claude to perform a simple browser task like "Test if google.com loads".

## Quick Start

After installation, simply ask Claude to test or automate any browser task. Claude will write custom Patchright code, execute it, and return results with screenshots and console output.

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

### Sites with Bot Detection
```
"Test the checkout flow on our e-commerce site"
"Verify the login works on the protected portal"
```

## How It Works

1. Describe what you want to test or automate
2. Claude writes custom Patchright code for the task
3. The universal executor (run.py) runs it with proper module resolution
4. Browser opens (visible by default) and automation executes
5. Results are displayed with console output and screenshots

## Configuration

Default settings:
- **Headless:** `False` (browser visible unless explicitly requested otherwise)
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
│       ├── run.py           # Universal executor (proper module resolution)
│       ├── pyproject.toml   # Dependencies & setup
│       └── lib/
│           ├── __init__.py
│           └── helpers.py   # Optional utility functions
├── API_REFERENCE.md         # Full Patchright/Playwright API reference
├── README.md                # This file - user documentation
├── CONTRIBUTING.md          # Contribution guidelines
└── LICENSE                  # MIT License
```

## Advanced Usage

Claude will automatically load `API_REFERENCE.md` when needed for comprehensive documentation on selectors, network interception, authentication, visual regression testing, mobile emulation, performance testing, and debugging.

## Why Patchright?

[Patchright](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright-python) is an undetected fork of Playwright that includes patches to bypass common bot detection services:

- **Cloudflare** - Passes browser integrity checks
- **Akamai** - Bypasses Akamai Bot Manager
- **DataDome** - Evades DataDome detection
- **Kasada** - Passes Kasada challenges
- **Fingerprint.com** - Avoids fingerprinting detection

It's a drop-in replacement for Playwright - just change imports from `playwright` to `patchright`.

**Note:** Patchright only supports Chromium-based browsers. Firefox and WebKit are not patched.

## Dependencies

- Python >= 3.10
- Patchright >= 1.0.0 (installed via `uv pip install patchright`)
- Chrome (installed via `patchright install chrome`)

## Troubleshooting

**Patchright not installed?**
Navigate to the skill directory and run:
```bash
uv pip install patchright
patchright install chrome
```

**Module not found errors?**
Ensure automation runs via `run.py`, which handles module resolution.

**Browser doesn't open?**
Verify `headless=False` is set. The skill defaults to visible browser unless headless mode is requested.

**Bot detection still triggered?**
- Use `headless=False` (visible browser)
- Avoid custom user agents
- Use `channel="chrome"` to use system Chrome if available

## What is a Claude Skill?

[Skills](https://www.anthropic.com/news/skills) are modular capabilities that extend Claude's functionality. Unlike slash commands that you invoke manually, skills are model-invoked—Claude autonomously decides when to use them based on your request.

When you ask Claude to test a webpage or automate browser interactions, Claude discovers this skill, loads the necessary instructions, executes custom Patchright code, and returns results with screenshots and console output.

## Contributing

Contributions are welcome. Fork the repository, create a feature branch, make your changes, and submit a pull request. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Learn More

- [Claude Skills](https://www.anthropic.com/news/skills) - Official announcement from Anthropic
- [Claude Code Skills Documentation](https://docs.claude.com/en/docs/claude-code/skills)
- [Claude Code Plugins Documentation](https://docs.claude.com/en/docs/claude-code/plugins)
- [Plugin Marketplaces](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces)
- [Patchright Python](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright-python) - The undetected Playwright fork
- [API_REFERENCE.md](API_REFERENCE.md) - Full Patchright/Playwright documentation
- [GitHub Issues](https://github.com/a5m0/playwright-skill/issues)

## License

MIT License - see [LICENSE](LICENSE) file for details.
