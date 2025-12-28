#!/bin/bash
# Version bump script for playwright-skill
# Usage: ./scripts/bump-version.sh [major|minor|patch] or ./scripts/bump-version.sh <version>
# Example: ./scripts/bump-version.sh patch    -> 5.0.0 becomes 5.0.1
# Example: ./scripts/bump-version.sh 6.0.0    -> sets version to 6.0.0

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Files containing version information
PLUGIN_JSON="$ROOT_DIR/.claude-plugin/plugin.json"
MARKETPLACE_JSON="$ROOT_DIR/.claude-plugin/marketplace.json"
PYPROJECT_TOML="$ROOT_DIR/skills/playwright-skill/pyproject.toml"

# Get current version from plugin.json (source of truth)
get_current_version() {
    grep '"version"' "$PLUGIN_JSON" | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/'
}

# Calculate new version based on bump type
calculate_new_version() {
    local current="$1"
    local bump_type="$2"

    IFS='.' read -r major minor patch <<< "$current"

    case "$bump_type" in
        major)
            echo "$((major + 1)).0.0"
            ;;
        minor)
            echo "$major.$((minor + 1)).0"
            ;;
        patch)
            echo "$major.$minor.$((patch + 1))"
            ;;
        *)
            # Assume it's a direct version string
            if [[ "$bump_type" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
                echo "$bump_type"
            else
                echo "Error: Invalid version format. Use major|minor|patch or X.Y.Z" >&2
                exit 1
            fi
            ;;
    esac
}

# Update version in all files
update_version() {
    local new_version="$1"

    echo "Updating versions to $new_version..."

    # Update plugin.json
    if [[ -f "$PLUGIN_JSON" ]]; then
        sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" "$PLUGIN_JSON"
        echo "  ✓ Updated $PLUGIN_JSON"
    fi

    # Update marketplace.json (plugin version, not metadata version)
    if [[ -f "$MARKETPLACE_JSON" ]]; then
        # Use a more specific pattern to only update the plugin version, not metadata version
        python3 -c "
import json
with open('$MARKETPLACE_JSON', 'r') as f:
    data = json.load(f)
for plugin in data.get('plugins', []):
    plugin['version'] = '$new_version'
with open('$MARKETPLACE_JSON', 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
"
        echo "  ✓ Updated $MARKETPLACE_JSON"
    fi

    # Update pyproject.toml
    if [[ -f "$PYPROJECT_TOML" ]]; then
        sed -i "s/^version = \"[^\"]*\"/version = \"$new_version\"/" "$PYPROJECT_TOML"
        echo "  ✓ Updated $PYPROJECT_TOML"
    fi
}

# Verify all versions match
verify_versions() {
    local expected="$1"
    local all_match=true

    echo "Verifying versions..."

    # Check plugin.json
    local plugin_version=$(grep '"version"' "$PLUGIN_JSON" | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
    if [[ "$plugin_version" == "$expected" ]]; then
        echo "  ✓ plugin.json: $plugin_version"
    else
        echo "  ✗ plugin.json: $plugin_version (expected $expected)"
        all_match=false
    fi

    # Check marketplace.json
    local marketplace_version=$(python3 -c "import json; print(json.load(open('$MARKETPLACE_JSON'))['plugins'][0]['version'])")
    if [[ "$marketplace_version" == "$expected" ]]; then
        echo "  ✓ marketplace.json: $marketplace_version"
    else
        echo "  ✗ marketplace.json: $marketplace_version (expected $expected)"
        all_match=false
    fi

    # Check pyproject.toml
    local pyproject_version=$(grep '^version = ' "$PYPROJECT_TOML" | sed 's/version = "\([^"]*\)"/\1/')
    if [[ "$pyproject_version" == "$expected" ]]; then
        echo "  ✓ pyproject.toml: $pyproject_version"
    else
        echo "  ✗ pyproject.toml: $pyproject_version (expected $expected)"
        all_match=false
    fi

    if [[ "$all_match" == "true" ]]; then
        echo ""
        echo "All versions synchronized to $expected"
        return 0
    else
        echo ""
        echo "Version mismatch detected!"
        return 1
    fi
}

# Main
main() {
    if [[ $# -eq 0 ]]; then
        echo "Usage: $0 [major|minor|patch|<version>]"
        echo ""
        echo "Current version: $(get_current_version)"
        echo ""
        echo "Examples:"
        echo "  $0 patch    # Bump patch version (5.0.0 -> 5.0.1)"
        echo "  $0 minor    # Bump minor version (5.0.0 -> 5.1.0)"
        echo "  $0 major    # Bump major version (5.0.0 -> 6.0.0)"
        echo "  $0 5.2.0    # Set specific version"
        exit 0
    fi

    local current_version=$(get_current_version)
    local new_version=$(calculate_new_version "$current_version" "$1")

    echo "Bumping version: $current_version -> $new_version"
    echo ""

    update_version "$new_version"
    echo ""
    verify_versions "$new_version"

    echo ""
    echo "Next steps:"
    echo "  1. Review changes: git diff"
    echo "  2. Commit: git commit -am 'chore: bump version to $new_version'"
    echo "  3. Tag: git tag -a v$new_version -m 'Release v$new_version'"
    echo "  4. Push: git push && git push --tags"
}

main "$@"
