# Patchright Skill for Claude Code

**Undetected browser automation as a Claude Skill**

A [Claude Skill](https://www.anthropic.com/blog/skills) that enables Claude to write and execute any Patchright automation on-the-fly - from simple page tests to complex multi-step flows. Uses **Patchright**, an undetected fork of Playwright that bypasses bot detection (Cloudflare, Akamai, DataDome, etc.).

Packaged as a [Claude Code Plugin](https://docs.claude.com/en/docs/claude-code/plugins) for easy installation and distribution.

Claude autonomously decides when to use this skill based on your browser automation needs, loading only the minimal information required for your specific task.

Made using Claude Code.

## Features

- **Anti-Bot Detection** - Uses Patchright to bypass Cloudflare, Akamai, DataDome, Kasada and more
- **Claude Code Web Auto-Configuration** - Automatically detects and configures proxy authentication for browser-based Claude Code sessions
- **Chrome Preference** - Uses Chrome over Chromium by default for better stealth and bot detection avoidance
- **Any Automation Task** - Claude writes custom code for your specific request, not limited to pre-built scripts
- **Python 3.10+** - Native Python implementation, shares browser installations with your Python projects
- **Visible Browser by Default** - See automation in real-time with `headless=False` (auto-headless in web environments)
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

## Claude Code Web Environments

When running in **Claude Code for Web** (browser-based sessions), the skill automatically:

✅ **Detects the environment** - Uses official `CLAUDE_CODE_REMOTE` environment variable
✅ **Configures proxy authentication** - Automatically starts a local proxy wrapper to handle JWT authentication
✅ **Enables headless mode** - Runs Chrome in headless mode (no GUI in web containers)
✅ **Accesses external sites** - Full internet access through authenticated proxy

**No configuration needed** - the skill handles everything automatically. Simply use it normally:

```python
from lib.helpers import get_browser_config

# Automatically configures for current environment (web or local)
config = get_browser_config()
browser = await p.chromium.launch(**config['launch_options'])
```

**Technical Details:**
- Detects web environments via `CLAUDE_CODE_REMOTE=true`
- Starts local proxy wrapper on `127.0.0.1:18080` for authentication
- Adds `Proxy-Authorization` headers for HTTPS tunnel establishment
- Uses Chrome by default for better stealth (falls back to Chromium)

See [SKILL.md](skills/playwright-skill/SKILL.md) for full auto-configuration documentation.

## Configuration

Default settings:

- **Browser:** Chrome (preferred for stealth), falls back to Chromium if unavailable
- **Headless:** `False` in local environments (browser visible), automatically `True` in Claude Code Web
- **Slow Motion:** `100ms` for visibility
- **Timeout:** `30s`
- **Screenshots:** Saved to `/tmp/`

Override defaults via `get_browser_config()`:
```python
# Force headless mode locally
config = get_browser_config(headless=True)

# Use Chromium instead of Chrome (not recommended)
config = get_browser_config(use_chrome=False)
```

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
│       └── API_REFERENCE.md # Full Patchright/Playwright API reference
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

**Browser Support:**
- **Chrome (Recommended)** - Full Chrome browser with better stealth capabilities
- **Chromium** - Open-source base, fallback if Chrome unavailable
- Firefox and WebKit are not supported (no patches available)

## Dependencies

- Python >= 3.10
- Patchright (installed via `uv pip install patchright`)
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
- Ensure Chrome is installed (`patchright install chrome`) - it's more stealthy than Chromium
- Use `headless=False` (visible browser) when possible
- Avoid custom user agents and fingerprint modifications

## What is a Skill?

[Agent Skills](https://agentskills.io) are folders of instructions, scripts, and resources that agents can discover and use to do things more accurately and efficiently. When you ask Claude to test a webpage or automate browser interactions, Claude discovers this skill, loads the necessary instructions, executes custom Patchright code, and returns results with screenshots and console output.

This Patchright skill implements the [open Agent Skills specification](https://agentskills.io), making it compatible across agent platforms.

## Contributing

Contributions are welcome. Fork the repository, create a feature branch, make your changes, and submit a pull request. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Learn More

- [Agent Skills Specification](https://agentskills.io) - Open specification for agent skills
- [Claude Code Skills Documentation](https://docs.claude.com/en/docs/claude-code/skills)
- [Claude Code Plugins Documentation](https://docs.claude.com/en/docs/claude-code/plugins)
- [Plugin Marketplaces](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces)
- [Patchright Python](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright-python) - The undetected Playwright fork
- [API_REFERENCE.md](skills/playwright-skill/API_REFERENCE.md) - Full Patchright/Playwright documentation
- [GitHub Issues](https://github.com/a5m0/playwright-skill/issues)

## License

MIT License - see [LICENSE](LICENSE) file for details.
