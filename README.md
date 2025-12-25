# Playwright Skill for Claude Code

**General-purpose browser automation as a Claude Skill**

A [Claude Skill](https://www.anthropic.com/blog/skills) that enables Claude to write and execute any Playwright automation on-the-fly - from simple page tests to complex multi-step flows. Packaged as a [Claude Code Plugin](https://docs.claude.com/en/docs/claude-code/plugins) for easy installation and distribution.

Claude autonomously decides when to use this skill based on your browser automation needs, loading only the minimal information required for your specific task.

Made using Claude Code.

## Features

- **Any Automation Task** - Claude writes custom code for your specific request, not limited to pre-built scripts
- **Visible Browser by Default** - See automation in real-time with `headless=False`
- **Zero Module Resolution Errors** - Universal executor ensures proper module access
- **Progressive Disclosure** - Concise SKILL.md with full API reference loaded only when needed
- **Safe Cleanup** - Smart temp file management without race conditions
- **Comprehensive Helpers** - Optional utility functions for common tasks
- **PEP 723 Metadata** - All scripts include inline dependency specifications
- **Always Uses Playwright 1.56.0** - Exact version pinned for consistency

## Installation

This repository is structured as a [Claude Code Plugin](https://docs.claude.com/en/docs/claude-code/plugins) containing a skill. You can install it as either a **plugin** (recommended) or extract it as a **standalone skill**.

### Understanding the Structure

This repository uses the plugin format with a nested structure:

```
playwright-py-skill/              # Plugin root
├── .claude-plugin/           # Plugin metadata
└── skills/
    └── playwright-py-skill/     # The actual skill
        └── SKILL.md
```

Claude Code expects skills to be directly in folders under `.claude/skills/`, so manual installation requires extracting the nested skill folder.

### Prerequisites

- Python 3.10 or later (required for PEP 723 support)
- Chromium browser (correct version for Playwright 1.56.0) - must be installed separately
- `uv` package manager (for running scripts with PEP 723 metadata)

**Note:** This skill does NOT install browsers. Chromium must be installed separately at the correct version for Playwright 1.56.0.

---

### Option 1: Plugin Installation (Recommended)

Install via Claude Code's plugin system for automatic updates and team distribution:

```bash
# Add this repository as a marketplace
/plugin marketplace add akaihola/playwright-py-skill

# Install the plugin
/plugin install playwright-py-skill@playwright-py-skill

# Verify installation (auto-installs playwright==1.56.0)
cd ~/.claude/plugins/marketplaces/playwright-py-skill/skills/playwright-py-skill
uv run run.py --help
```

Verify installation by running `/help` to confirm the skill is available.

---

### Option 2: Standalone Skill Installation

To install as a standalone skill (without the plugin system), extract only the skill folder:

**Global Installation (Available Everywhere):**

```bash
# Clone to a temporary location
git clone https://github.com/akaihola/playwright-py-skill.git /tmp/playwright-py-skill-temp

# Copy only the skill folder to your global skills directory
mkdir -p ~/.claude/skills
cp -r /tmp/playwright-py-skill-temp/skills/playwright-py-skill ~/.claude/skills/

# Navigate to the skill and run setup (auto-installs playwright==1.56.0)
cd ~/.claude/skills/playwright-py-skill
uv run run.py --help

# Clean up temporary files
rm -rf /tmp/playwright-py-skill-temp
```

**Project-Specific Installation:**

```bash
# Clone to a temporary location
git clone https://github.com/akaihola/playwright-py-skill.git /tmp/playwright-py-skill-temp

# Copy only the skill folder to your project
mkdir -p .claude/skills
cp -r /tmp/playwright-py-skill-temp/skills/playwright-py-skill .claude/skills/

# Navigate to the skill and run setup (auto-installs playwright==1.56.0)
cd .claude/skills/playwright-py-skill
uv run run.py --help

# Clean up temporary files
rm -rf /tmp/playwright-py-skill-temp
```

**Why this structure?** The plugin format requires the `skills/` directory for organizing multiple skills within a plugin. When installing as a standalone skill, you only need the inner `skills/playwright-py-skill/` folder contents.

---

### Option 3: Download Release

1. Download and extract the latest release from [GitHub Releases](https://github.com/akaihola/playwright-py-skill/releases)
2. Copy only the `skills/playwright-py-skill/` folder to:
   - Global: `~/.claude/skills/playwright-py-skill`
   - Project: `/path/to/your/project/.claude/skills/playwright-py-skill`
3. Navigate to the skill directory and run setup:
   ```bash
   cd ~/.claude/skills/playwright-py-skill  # or your project path
   uv run run.py --help
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
3. The universal executor (run.py) runs it with proper module resolution
4. Browser opens (visible by default) and automation executes
5. Results are displayed with console output and screenshots

## Configuration

Default settings:

- **Headless:** `False` (browser visible unless explicitly requested otherwise)
- **Slow Motion:** `100ms` for visibility
- **Timeout:** `30s`
- **Screenshots:** Saved to `/tmp/`
- **Playwright Version:** Always `1.56.0` (exact version)

## Project Structure

```
playwright-py-skill/
├── .claude-plugin/
│   ├── plugin.json          # Plugin metadata for distribution
│   └── marketplace.json     # Marketplace configuration
├── skills/
│   └── playwright-py-skill/    # The actual skill (Claude discovers this)
│       ├── SKILL.md         # What Claude reads
│       ├── run.py           # Universal executor (proper module resolution)
│       ├── lib/
│       │   └── helpers.py   # Optional utility functions
│       └── API_REFERENCE.md # Full Playwright API reference
├── README.md                # This file - user documentation
├── CONTRIBUTING.md          # Contribution guidelines
└── LICENSE                  # MIT License
```

## Advanced Usage

Claude will automatically load `API_REFERENCE.md` when needed for comprehensive documentation on selectors, network interception, authentication, visual regression testing, mobile emulation, performance testing, and debugging.

## Dependencies

- Python 3.10+ (required for PEP 723 support)
- `uv` package manager (for running scripts with PEP 723 metadata)
- Playwright 1.56.0 (auto-installed via PEP 723 when running scripts)
- Chromium browser (must be installed separately at correct version)

## Execution Pattern

All scripts include PEP 723 metadata blocks:

```python
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "playwright==1.56.0",
#     "aiohttp>=3.9.0",
# ]
# ///

# Your Playwright code here...
```

When you run `uv run script.py`, it automatically installs the exact dependencies specified in the PEP 723 block.

## Troubleshooting

**Playwright not installed?**
Navigate to the skill directory and run `uv run run.py --help` (auto-installs via PEP 723).

**Module not found errors?**
Ensure automation runs via `run.py`, which handles module resolution.

**Browser doesn't open?**
Verify `headless=False` is set. The skill defaults to visible browser unless headless mode is requested.

**Wrong Chromium version?**
Install the correct Chromium version for Playwright 1.56.0 separately. The skill does not install browsers.

**Install all browsers?**
Install additional browsers (firefox, webkit) separately if needed. The skill assumes Chromium is already installed.

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
- [API_REFERENCE.md](skills/playwright-py-skill/API_REFERENCE.md) - Full Playwright documentation
- [GitHub Issues](https://github.com/akaihola/playwright-py-skill/issues)

## License

MIT License - see [LICENSE](LICENSE) file for details.
