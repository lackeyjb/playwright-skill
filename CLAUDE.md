# Playwright Skill for Claude Code

This repository contains a Claude Code skill for browser automation using Patchright (an undetected Playwright fork).

## What This Repository Does

This is a **Claude Code Plugin** that provides browser automation capabilities through:
- **Patchright** - Undetected browser automation that bypasses bot detection
- **Chrome Browser** - Preferred for stealth and bot detection avoidance
- **Auto-configuration** - Automatically sets up for both local and web environments

## Automatic Setup (Claude Code on the Web)

This repository is configured with a **SessionStart hook** that automatically runs when you start a Claude Code session.

### What Gets Installed Automatically

When you start a session in Claude Code on the web, the setup hook:

1. ✅ **Detects the environment** - Identifies if running locally or in the web
2. ✅ **Installs patchright** - Uses `uv pip install patchright` for fast installation
3. ✅ **Installs Chrome browser** - Runs `uv run patchright install chrome` for browser binaries
4. ✅ **Configures Python path** - Adds skill directory to `PYTHONPATH`
5. ✅ **Persists environment** - Sets `CHROME_EXECUTABLE` and other variables for the session

**Hook location:** `scripts/setup-session.sh`
**Configuration:** `.claude/settings.json`

### Installation Time

- First session: ~30-60 seconds (downloads Chrome browser)
- Subsequent sessions: ~5-10 seconds (verifies existing installation)

The hook is **idempotent** - it checks if packages are already installed and skips reinstallation.

## Manual Setup (Local Development)

If you're working locally and want to set up manually:

```bash
# Navigate to the skill directory
cd skills/playwright-skill

# Install patchright
uv pip install patchright

# Install Chrome browser
uv run patchright install chrome
```

## Repository Structure

```
playwright-skill/                    # Plugin root
├── .claude/
│   └── settings.json               # SessionStart hook configuration
├── .claude-plugin/
│   ├── plugin.json                 # Plugin metadata
│   └── marketplace.json            # Marketplace configuration
├── scripts/
│   ├── setup-session.sh            # SessionStart hook script (auto-runs in web)
│   ├── bump-version.sh             # Version management
│   └── pre-commit-version-check.sh # Git hook for version validation
├── skills/
│   └── playwright-skill/           # The actual skill
│       ├── SKILL.md                # Skill instructions (Claude reads this)
│       ├── API_REFERENCE.md        # Full Playwright/Patchright API docs
│       ├── run.py                  # Universal executor
│       ├── pyproject.toml          # Python dependencies
│       └── lib/
│           ├── __init__.py
│           └── helpers.py          # Utility functions
├── .github/
│   └── workflows/
│       ├── release.yml             # Automated releases on tags
│       └── version-check.yml       # Version consistency validation
├── CLAUDE.md                       # This file - repo documentation for Claude
├── README.md                       # User-facing documentation
├── CONTRIBUTING.md                 # Contribution guidelines
└── LICENSE                         # MIT License
```

## Session Environment Variables

After the SessionStart hook completes, these variables are available:

- `PYTHONPATH` - Includes the skill directory for imports
- `CHROME_EXECUTABLE` - Path to Chrome browser binary
- `PLAYWRIGHT_SKILL_SETUP_COMPLETE` - Flag indicating successful setup

## How Claude Uses This Skill

When you ask Claude to perform browser automation tasks, Claude:

1. **Discovers the skill** - Finds `skills/playwright-skill/SKILL.md`
2. **Reads instructions** - Loads the skill documentation
3. **Writes custom code** - Creates automation scripts in `/tmp/`
4. **Executes via run.py** - Runs scripts with proper module resolution
5. **Returns results** - Shows console output and screenshots

Example tasks:
- "Test if the homepage loads correctly"
- "Take screenshots in different viewports"
- "Fill out the contact form and submit"
- "Check for broken links on the site"

## Development Workflow

### Making Changes

1. Edit skill files in `skills/playwright-skill/`
2. Test with Claude Code locally or in web
3. Commit changes with descriptive messages
4. Create pull request

### Version Management

All version numbers are kept in sync across:
- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`
- `skills/playwright-skill/pyproject.toml`

Use the provided script to bump versions:

```bash
./scripts/bump-version.sh 5.1.0
```

This updates all three files at once and prevents version drift.

### Release Process

Releases are automated via GitHub Actions:

1. Update version with `./scripts/bump-version.sh X.Y.Z`
2. Commit and push changes
3. Create and push a git tag: `git tag vX.Y.Z && git push origin vX.Y.Z`
4. GitHub Actions automatically creates a release with changelog

## Claude Code Web vs Terminal

### Web Environment Features
- Automatic dependency installation via SessionStart hook
- Headless browser mode (no GUI in containers)
- Proxy authentication for external site access
- Environment variables persisted across commands

### Terminal Environment Features
- Manual setup required (one-time)
- Visible browser by default (`headless=False`)
- Direct access to local dev servers
- Full control over browser configuration

## Dependencies

### Python Packages
- **patchright** - Undetected Playwright fork
- **trafilatura** - Content extraction (included in helpers)

### System Requirements
- Python 3.10+
- Chrome browser (installed via patchright)
- Bash shell (for SessionStart hook)

## Troubleshooting

### Hook Fails to Run
- Check `.claude/settings.json` is valid JSON
- Verify `scripts/setup-session.sh` is executable: `chmod +x scripts/setup-session.sh`
- Run Claude Code with `--debug` to see hook output

### Patchright Installation Fails
- Ensure `uv` is available: `pip install uv`
- Try manual installation: `uv pip install patchright`
- Check network connectivity (requires downloading browser binaries)

### Chrome Installation Fails
- Manually install: `uv run patchright install chrome`
- Check disk space (Chrome requires ~200MB)
- Try Chromium as fallback: `uv run patchright install chromium`

### Import Errors
- Verify `PYTHONPATH` includes skill directory
- Check hook completed successfully (look for success message)
- Try manual Python path: `export PYTHONPATH=/path/to/skills/playwright-skill:$PYTHONPATH`

## Support

- **Issues**: https://github.com/a5m0/playwright-skill/issues
- **Documentation**: See README.md for user guide
- **API Reference**: See `skills/playwright-skill/API_REFERENCE.md`
- **Contributing**: See CONTRIBUTING.md

## License

MIT License - see LICENSE file for details.
