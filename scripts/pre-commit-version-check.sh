#!/bin/bash
# Pre-commit hook to validate version consistency
# Install: cp scripts/pre-commit-version-check.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Handle both direct execution and hook execution
if [[ -d "$SCRIPT_DIR/../.claude-plugin" ]]; then
    ROOT_DIR="$(dirname "$SCRIPT_DIR")"
elif [[ -d "$SCRIPT_DIR/../../.claude-plugin" ]]; then
    ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
else
    echo "Error: Could not find repository root"
    exit 1
fi

PLUGIN_JSON="$ROOT_DIR/.claude-plugin/plugin.json"
MARKETPLACE_JSON="$ROOT_DIR/.claude-plugin/marketplace.json"
PYPROJECT_TOML="$ROOT_DIR/skills/playwright-skill/pyproject.toml"

# Check if any version files are being committed
VERSION_FILES_CHANGED=false
if git diff --cached --name-only | grep -qE "(plugin\.json|marketplace\.json|pyproject\.toml)"; then
    VERSION_FILES_CHANGED=true
fi

# Extract versions
PLUGIN_VERSION=$(grep '"version"' "$PLUGIN_JSON" | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
MARKETPLACE_VERSION=$(python3 -c "import json; print(json.load(open('$MARKETPLACE_JSON'))['plugins'][0]['version'])")
PYPROJECT_VERSION=$(grep '^version = ' "$PYPROJECT_TOML" | sed 's/version = "\([^"]*\)"/\1/')

# Check version consistency
if [[ "$PLUGIN_VERSION" != "$MARKETPLACE_VERSION" ]] || [[ "$PLUGIN_VERSION" != "$PYPROJECT_VERSION" ]]; then
    echo "❌ Version mismatch detected!"
    echo ""
    echo "   plugin.json:      $PLUGIN_VERSION"
    echo "   marketplace.json: $MARKETPLACE_VERSION"
    echo "   pyproject.toml:   $PYPROJECT_VERSION"
    echo ""
    echo "Please run: ./scripts/bump-version.sh $PLUGIN_VERSION"
    echo "Or specify the version you want: ./scripts/bump-version.sh <major|minor|patch|X.Y.Z>"
    exit 1
fi

# Validate version format
if [[ ! "$PLUGIN_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "❌ Invalid version format: $PLUGIN_VERSION"
    echo "   Expected semantic versioning: X.Y.Z"
    exit 1
fi

echo "✅ Version check passed: $PLUGIN_VERSION"
