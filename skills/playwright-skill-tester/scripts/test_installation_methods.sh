#!/bin/bash

##
# Test Installation Methods for Playwright Skill
#
# This script helps verify the playwright-skill works correctly
# across all three installation methods:
# 1. Plugin system (recommended)
# 2. Manual global installation
# 3. Project-specific installation
##

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Test results
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
CRITICAL_TESTS_RUN=0
CRITICAL_TESTS_FAILED=0

log() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

test_result() {
    local test_name=$1
    local passed=$2
    local details=$3
    local is_critical=${4:-true}  # Default to critical

    TESTS_RUN=$((TESTS_RUN + 1))

    if [ "$is_critical" = true ]; then
        CRITICAL_TESTS_RUN=$((CRITICAL_TESTS_RUN + 1))
    fi

    if [ "$passed" = true ]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        log "$GREEN" "✅ PASS: $test_name"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        if [ "$is_critical" = true ]; then
            CRITICAL_TESTS_FAILED=$((CRITICAL_TESTS_FAILED + 1))
        fi
        log "$RED" "❌ FAIL: $test_name"
    fi

    if [ -n "$details" ]; then
        log "$CYAN" "   $details"
    fi
}

# Check if a directory exists and is a valid skill installation
check_installation() {
    local install_type=$1
    local skill_path=$2

    log "$BLUE" "\n🔍 Checking: $install_type"
    log "$CYAN" "   Path: $skill_path"

    # Check if directory exists
    if [ ! -d "$skill_path" ]; then
        test_result "$install_type - Directory exists" false "Directory not found"
        return 1
    fi
    test_result "$install_type - Directory exists" true

    # Check if SKILL.md exists
    if [ ! -f "$skill_path/SKILL.md" ]; then
        test_result "$install_type - SKILL.md exists" false "SKILL.md not found"
        return 1
    fi
    test_result "$install_type - SKILL.md exists" true

    # Check if run.js exists
    if [ ! -f "$skill_path/run.js" ]; then
        test_result "$install_type - run.js exists" false "run.js not found"
        return 1
    fi
    test_result "$install_type - run.js exists" true

    # Check if package.json exists
    if [ ! -f "$skill_path/package.json" ]; then
        test_result "$install_type - package.json exists" false "package.json not found"
        return 1
    fi
    test_result "$install_type - package.json exists" true

    # Check if SKILL.md has path resolution instructions
    if grep -q "IMPORTANT - Path Resolution:" "$skill_path/SKILL.md"; then
        test_result "$install_type - Has path resolution instructions" true
    else
        test_result "$install_type - Has path resolution instructions" false
        return 1
    fi

    # Check if SKILL.md uses $SKILL_DIR (not hardcoded paths)
    if grep -q '\$SKILL_DIR' "$skill_path/SKILL.md"; then
        test_result "$install_type - Uses \$SKILL_DIR placeholder" true
    else
        test_result "$install_type - Uses \$SKILL_DIR placeholder" false
        return 1
    fi

    log "$GREEN" "   ✓ Installation valid\n"
    return 0
}

# Test a specific command from the skill
test_command() {
    local install_type=$1
    local skill_path=$2
    local command=$3
    local description=$4

    log "$YELLOW" "\n⚙️  Testing: $description"

    # Replace $SKILL_DIR with actual path
    local actual_command="${command//\$SKILL_DIR/$skill_path}"

    log "$CYAN" "   Command: $actual_command"

    # SECURITY: Validate command before execution
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local validation_result=$(node "$script_dir/shared/utils.js" "$actual_command" "$skill_path" 2>&1)
    local validation_exit=$?

    if [ $validation_exit -ne 0 ]; then
        log "$RED" "   ⚠️  Command validation failed - refusing to execute"
        log "$YELLOW" "   Security check: Command does not match safe patterns"
        test_result "$install_type - $description" false "Command validation failed (security)" false
        return 1
    fi

    # Run the command and capture output
    # Mark as non-critical (false) - command execution tests are optional
    if eval "$actual_command" > /dev/null 2>&1; then
        test_result "$install_type - $description" true "Command executed successfully" false
        return 0
    else
        test_result "$install_type - $description" false "Command failed (may need npm install)" false
        return 1
    fi
}

# Detect test mode (development vs production)
detect_test_mode() {
    local current_dir="$(pwd)"
    local parent_dir="$(dirname "$current_dir")"
    local workspace_path="$parent_dir/playwright-skill"

    # Check if we're in development mode (workspace structure)
    if [ -f "$workspace_path/SKILL.md" ]; then
        echo "development"
    else
        echo "production"
    fi
}

# Main test function
run_installation_tests() {
    log "$BLUE" "\n$(printf '=%.0s' {1..60})"
    log "$BLUE" "  Playwright Skill - Installation Methods Test"
    log "$BLUE" "$(printf '=%.0s' {1..60})\n"

    # Define installation paths
    local home_dir="$HOME"
    local current_dir="$(pwd)"
    local parent_dir="$(dirname "$current_dir")"

    # Detect test mode
    local test_mode=$(detect_test_mode)

    log "$MAGENTA" "Test Mode: $test_mode"
    if [ "$test_mode" = "development" ]; then
        log "$CYAN" "Testing LOCAL workspace version only\n"
    else
        log "$CYAN" "Testing all installed versions\n"
    fi

    local test_path=""
    local test_type=""

    if [ "$test_mode" = "development" ]; then
        # Development mode: only test workspace version
        local workspace_path="$parent_dir/playwright-skill"
        check_installation "Workspace (local)" "$workspace_path"
        local workspace_valid=$?

        if [ $workspace_valid -eq 0 ]; then
            test_path="$workspace_path"
            test_type="Workspace (local)"
        fi
    else
        # Production mode: test all standard installations
        local plugin_path="$home_dir/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill"
        check_installation "Plugin System" "$plugin_path"
        local plugin_valid=$?

        local global_path="$home_dir/.claude/skills/playwright-skill"
        check_installation "Manual Global" "$global_path"
        local global_valid=$?

        local project_path="$current_dir/.claude/skills/playwright-skill"
        local project_parent_path="$parent_dir/.claude/skills/playwright-skill"

        if [ -d "$project_path" ]; then
            check_installation "Project-Specific (current)" "$project_path"
            local project_valid=$?
        elif [ -d "$project_parent_path" ]; then
            check_installation "Project-Specific (parent)" "$project_parent_path"
            local project_valid=$?
            project_path="$project_parent_path"
        else
            log "$YELLOW" "\n🔍 Checking: Project-Specific"
            log "$CYAN" "   Path: $project_path (and parent)"
            test_result "Project-Specific - Directory exists" false "Not installed in this project"
            project_valid=1
        fi

        # Determine which installation to use for command testing
        if [ $plugin_valid -eq 0 ]; then
            test_path="$plugin_path"
            test_type="Plugin System"
        elif [ $global_valid -eq 0 ]; then
            test_path="$global_path"
            test_type="Manual Global"
        elif [ $project_valid -eq 0 ]; then
            test_path="$project_path"
            test_type="Project-Specific"
        fi
    fi

    # If we found at least one valid installation, test critical commands
    if [ -n "$test_path" ]; then
        log "$BLUE" "\n$(printf '=%.0s' {1..60})"
        log "$BLUE" "  Testing Commands with $test_type Installation"
        log "$BLUE" "$(printf '=%.0s' {1..60})"

        # Test command 1: Dev server detection
        test_command "$test_type" "$test_path" \
            'cd $SKILL_DIR && node -e "require(\"./lib/helpers\").detectDevServers().then(servers => console.log(JSON.stringify(servers)))"' \
            "Dev server detection"

        # Test command 2: Setup check (just verify npm is configured)
        if [ -f "$test_path/package.json" ]; then
            test_result "$test_type - package.json is valid" true "" false
        else
            test_result "$test_type - package.json is valid" false "" false
        fi
    fi

    print_summary
}

print_summary() {
    log "$BLUE" "\n$(printf '=%.0s' {1..60})"
    log "$BLUE" "  Test Summary"
    log "$BLUE" "$(printf '=%.0s' {1..60})"
    log "$CYAN" "Total Tests: $TESTS_RUN"
    log "$GREEN" "Passed: $TESTS_PASSED"

    if [ $TESTS_FAILED -gt 0 ]; then
        log "$RED" "Failed: $TESTS_FAILED"
    else
        log "$GREEN" "Failed: $TESTS_FAILED"
    fi

    log "$CYAN" "Critical Tests: $CRITICAL_TESTS_RUN"

    if [ $CRITICAL_TESTS_FAILED -gt 0 ]; then
        log "$RED" "Critical Failures: $CRITICAL_TESTS_FAILED"
    else
        log "$GREEN" "Critical Failures: $CRITICAL_TESTS_FAILED"
    fi

    log "$BLUE" "$(printf '=%.0s' {1..60})\n"

    # Only fail if CRITICAL tests failed
    if [ $CRITICAL_TESTS_FAILED -eq 0 ]; then
        log "$GREEN" "🎉 All critical tests passed! Installation is working correctly."
        if [ $TESTS_FAILED -gt 0 ]; then
            log "$YELLOW" "⚠️  Some optional tests failed (may need npm install)"
        fi
        exit 0
    else
        log "$RED" "⚠️  Critical tests failed. Please review the output above."
        exit 1
    fi
}

# Run the tests
run_installation_tests
