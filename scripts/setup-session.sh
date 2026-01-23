#!/bin/bash
# SessionStart hook for Claude Code on the web
# Automatically installs patchright and Chrome browser at session startup
set -e  # Exit on error

# Helper functions for logging
log_info() {
    echo "[playwright-skill] $1"
}

log_error() {
    echo "[playwright-skill ERROR] $1" >&2
}

log_success() {
    echo "[playwright-skill ✓] $1"
}

# Detect environment (local vs remote/web)
if [ "$CLAUDE_CODE_REMOTE" = "true" ]; then
    log_info "Running in Claude Code on the web environment"
    IS_WEB_ENV=true
else
    log_info "Running in local terminal environment"
    IS_WEB_ENV=false
fi

# Determine skill directory location
# Priority: 1) Repository standalone, 2) Plugin installation, 3) Global skills
SKILL_DIR=""

if [ -d "$CLAUDE_PROJECT_DIR/skills/playwright-skill" ]; then
    SKILL_DIR="$CLAUDE_PROJECT_DIR/skills/playwright-skill"
    log_info "Found skill in repository: $SKILL_DIR"
elif [ -n "$CLAUDE_PLUGIN_ROOT" ] && [ -d "$CLAUDE_PLUGIN_ROOT/skills/playwright-skill" ]; then
    SKILL_DIR="$CLAUDE_PLUGIN_ROOT/skills/playwright-skill"
    log_info "Found skill as plugin: $SKILL_DIR"
elif [ -d "$HOME/.claude/skills/playwright-skill" ]; then
    SKILL_DIR="$HOME/.claude/skills/playwright-skill"
    log_info "Found skill in global location: $SKILL_DIR"
elif [ -d "$CLAUDE_PROJECT_DIR/.claude/skills/playwright-skill" ]; then
    SKILL_DIR="$CLAUDE_PROJECT_DIR/.claude/skills/playwright-skill"
    log_info "Found skill in project .claude/skills: $SKILL_DIR"
fi

if [ -z "$SKILL_DIR" ]; then
    log_error "Skill directory not found. Checked:"
    log_error "  - $CLAUDE_PROJECT_DIR/skills/playwright-skill"
    log_error "  - \$CLAUDE_PLUGIN_ROOT/skills/playwright-skill"
    log_error "  - $HOME/.claude/skills/playwright-skill"
    log_error "  - $CLAUDE_PROJECT_DIR/.claude/skills/playwright-skill"
    exit 2
fi

# Check if patchright is already installed (to make hook idempotent)
if python3 -c "import patchright" 2>/dev/null; then
    log_info "patchright already installed, skipping installation"
    PATCHRIGHT_INSTALLED=true
else
    PATCHRIGHT_INSTALLED=false
fi

# Step 1: Install patchright using uv pip (if not already installed)
if [ "$PATCHRIGHT_INSTALLED" = false ]; then
    log_info "Installing patchright using uv pip..."

    # Check if uv is available
    if ! command -v uv &> /dev/null; then
        log_info "uv not found, installing..."
        pip install uv --quiet || {
            log_error "Failed to install uv"
            exit 2
        }
    fi

    # Install patchright with uv
    uv pip install patchright --quiet || {
        log_error "Failed to install patchright with uv"
        exit 2
    }

    log_success "patchright installed successfully"
else
    log_info "Using existing patchright installation"
fi

# Step 2: Install Chrome browser via patchright
log_info "Checking Chrome browser installation..."

# Check if Chrome is already installed
CHROME_INSTALLED=false
if python3 -c "from patchright.sync_api import sync_playwright; p = sync_playwright().start(); browser = p.chromium.launch(channel='chrome'); browser.close(); p.stop()" 2>/dev/null; then
    CHROME_INSTALLED=true
    log_info "Chrome browser already installed"
else
    log_info "Chrome browser not found or not working, installing..."
fi

if [ "$CHROME_INSTALLED" = false ]; then
    uv run patchright install chrome || {
        log_error "Failed to install Chrome via patchright"
        exit 2
    }
    log_success "Chrome browser installed successfully"
fi

# Step 3: Set up environment variables for the session
if [ -n "$CLAUDE_ENV_FILE" ]; then
    log_info "Persisting environment variables to session..."

    # Add skill directory to Python path
    echo "export PYTHONPATH=\"$SKILL_DIR:\${PYTHONPATH:-}\"" >> "$CLAUDE_ENV_FILE"
    log_success "Added skill directory to PYTHONPATH"

    # Find and persist Chrome executable path
    CHROME_PATH=$(python3 -c "
try:
    from patchright.sync_api import sync_playwright
    p = sync_playwright().start()
    print(p.chromium.executable_path)
    p.stop()
except Exception:
    pass
" 2>/dev/null || echo "")

    if [ -n "$CHROME_PATH" ] && [ -x "$CHROME_PATH" ]; then
        echo "export CHROME_EXECUTABLE=\"$CHROME_PATH\"" >> "$CLAUDE_ENV_FILE"
        log_success "Chrome path persisted: $CHROME_PATH"
    fi

    # Mark that setup has completed (for debugging)
    echo "export PLAYWRIGHT_SKILL_SETUP_COMPLETE=true" >> "$CLAUDE_ENV_FILE"
else
    log_info "CLAUDE_ENV_FILE not available (local environment)"
fi

# Step 4: Verify installation
log_info "Verifying installation..."

# Verify patchright can be imported
if ! python3 -c "import patchright; print(f'patchright {patchright.__version__}')" 2>/dev/null; then
    log_error "Failed to import patchright after installation"
    exit 2
fi

# Verify Chrome is accessible
if ! python3 -c "from patchright.sync_api import sync_playwright; p = sync_playwright().start(); p.chromium.executable_path; p.stop()" 2>/dev/null; then
    log_error "Chrome browser not accessible after installation"
    exit 2
fi

log_success "Session setup completed successfully"
log_info "Skill ready at: $SKILL_DIR"
log_info "Claude can now use the playwright-skill for browser automation"

exit 0
