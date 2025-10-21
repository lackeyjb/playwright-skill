# Playwright Skill Testing Matrix

This document provides a comprehensive checklist for testing the playwright-skill across all installation methods and scenarios.

## Core Path Resolution Requirements

Dynamic path resolution ensures the skill works across all installation methods.

#### Required Features

- [ ] SKILL.md contains "**IMPORTANT - Path Resolution:**" section
- [ ] Documents all 3 installation paths:
  - [ ] Plugin system: `~/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill`
  - [ ] Manual global: `~/.claude/skills/playwright-skill`
  - [ ] Project-specific: `<project>/.claude/skills/playwright-skill`
- [ ] All command examples use `$SKILL_DIR` instead of hardcoded paths
- [ ] No hardcoded `~/.claude/skills/playwright-skill` paths remain in commands
- [ ] Path resolution instructions are clear for Claude to follow

## Installation Method Tests

### 1. Plugin System Installation (Recommended)

**Path:** `~/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill`

#### File Structure
- [ ] Directory exists
- [ ] SKILL.md is present
- [ ] run.js is present
- [ ] package.json is present
- [ ] lib/ directory exists with helpers
- [ ] node_modules/ installed (after setup)

#### Path Resolution
- [ ] Claude can detect installation path from loaded SKILL.md location
- [ ] $SKILL_DIR is correctly substituted with actual path
- [ ] Commands execute without "file not found" errors

#### Critical Commands
- [ ] `cd $SKILL_DIR && node -e "require('./lib/helpers').detectDevServers()..."`
- [ ] `cd $SKILL_DIR && node run.js /tmp/playwright-test-*.js`
- [ ] `cd $SKILL_DIR && npm run setup`

### 2. Manual Global Installation

**Path:** `~/.claude/skills/playwright-skill`

#### File Structure
- [ ] Directory exists (if installed)
- [ ] SKILL.md is present
- [ ] run.js is present
- [ ] package.json is present
- [ ] lib/ directory exists with helpers
- [ ] node_modules/ installed (after setup)

#### Path Resolution
- [ ] Claude can detect installation path from loaded SKILL.md location
- [ ] $SKILL_DIR is correctly substituted with actual path
- [ ] Commands execute without "file not found" errors

#### Critical Commands
- [ ] `cd $SKILL_DIR && node -e "require('./lib/helpers').detectDevServers()..."`
- [ ] `cd $SKILL_DIR && node run.js /tmp/playwright-test-*.js`
- [ ] `cd $SKILL_DIR && npm run setup`

### 3. Project-Specific Installation

**Path:** `<project>/.claude/skills/playwright-skill`

#### File Structure
- [ ] Directory exists (if installed)
- [ ] SKILL.md is present
- [ ] run.js is present
- [ ] package.json is present
- [ ] lib/ directory exists with helpers
- [ ] node_modules/ installed (after setup)

#### Path Resolution
- [ ] Claude can detect installation path from loaded SKILL.md location
- [ ] $SKILL_DIR is correctly substituted with actual path
- [ ] Commands execute without "file not found" errors

#### Critical Commands
- [ ] `cd $SKILL_DIR && node -e "require('./lib/helpers').detectDevServers()..."`
- [ ] `cd $SKILL_DIR && node run.js /tmp/playwright-test-*.js`
- [ ] `cd $SKILL_DIR && npm run setup`

## Command Validation Tests

### All Commands in SKILL.md

Count and verify all commands that reference the skill directory:

- [ ] Dev server detection command uses `$SKILL_DIR`
- [ ] Script execution command uses `$SKILL_DIR`
- [ ] Setup command uses `$SKILL_DIR`
- [ ] All example commands use `$SKILL_DIR`
- [ ] No commands contain hardcoded paths (except in path resolution preamble)

**Verification:**
- [ ] All skill directory references use `$SKILL_DIR` (typically 9+ occurrences)
- [ ] Critical commands (setup, dev server, script execution) use `$SKILL_DIR`
- [ ] No hardcoded absolute paths in command examples

## Edge Cases and Error Scenarios

### Path Discovery
- [ ] Claude can find skill when installed via plugin marketplace
- [ ] Claude can find skill when manually installed globally
- [ ] Claude can find skill when installed project-specifically
- [ ] Claude handles case where SKILL.md is loaded from symlink
- [ ] Claude provides clear error if skill directory cannot be determined

### Command Execution
- [ ] Commands work when executed from skill directory
- [ ] Commands work when executed from project root
- [ ] Commands work when executed from subdirectory
- [ ] Path substitution handles spaces in directory names
- [ ] Path substitution handles special characters

### Multi-Installation Scenarios
- [ ] Claude uses correct path when skill is installed in multiple locations
- [ ] Claude prioritizes correct installation based on context
- [ ] No confusion between different installation paths

## Integration Tests

### Real-World Usage with Claude

#### First-Time Setup
- [ ] Claude reads SKILL.md and understands path resolution instructions
- [ ] Claude detects installation location without trial-and-error
- [ ] Claude successfully runs setup command
- [ ] Claude confirms setup completed successfully

#### Typical Workflow
- [ ] Claude can detect dev servers using correct path
- [ ] Claude can write test script to /tmp
- [ ] Claude can execute test script using correct run.js path
- [ ] No "file not found" or "directory not found" errors
- [ ] No trial-and-error to find correct paths

#### Error Recovery
- [ ] Claude provides helpful error if npm dependencies not installed
- [ ] Claude suggests running setup if node_modules missing
- [ ] Claude can recover from incorrect path assumptions

## Automated Test Coverage

The playwright-skill-tester provides automated tests for:

### Test Suite 1: Path Resolution Tests (`test_path_resolution.js`)
- [x] Automated: Skill location detection
- [x] Automated: Path resolution instructions present
- [x] Automated: No hardcoded paths in commands
- [x] Automated: $SKILL_DIR placeholder usage
- [x] Automated: Critical commands use dynamic paths

### Test Suite 2: Installation Methods (`test_installation_methods.sh`)
- [x] Automated: Plugin system installation validation
- [x] Automated: Manual global installation validation
- [x] Automated: Project-specific installation validation
- [x] Automated: File structure verification
- [x] Automated: Critical command presence

### Test Suite 3: Command Validation (`test_commands.js`)
- [x] Automated: Extract all commands from SKILL.md
- [x] Automated: Verify commands use $SKILL_DIR
- [x] Automated: Verify critical commands present
- [x] Automated: Command syntax validation
- [x] Automated: No legacy patterns remain

## Manual Testing Required

Some aspects require manual verification with a real Claude instance:

- [ ] Load skill and verify Claude understands path resolution
- [ ] Ask Claude to run a command and verify correct path used
- [ ] Test with plugin installation
- [ ] Test with manual global installation
- [ ] Test with project-specific installation
- [ ] Verify no trial-and-error in Claude's execution
- [ ] Verify Claude's explanations reference correct paths

## Success Criteria

### Changes are validated when:

1. **All automated tests pass**
   - [ ] Path resolution tests: 100% pass
   - [ ] Installation methods tests: 100% pass
   - [ ] Command validation tests: 100% pass

2. **Manual verification complete**
   - [ ] Tested with at least one real installation method
   - [ ] Claude successfully resolves paths without errors
   - [ ] No trial-and-error observed

3. **Documentation is clear**
   - [ ] Path resolution instructions are easy to understand
   - [ ] Installation methods are clearly documented
   - [ ] Examples use $SKILL_DIR consistently

4. **Edge cases handled**
   - [ ] Works across all installation methods
   - [ ] No hardcoded paths remain (except in documentation)
   - [ ] Error messages are helpful

## Test Execution Log

Use this section to track test execution:

### Automated Tests

**Date:** _____________

- [ ] Path Resolution Tests: ______ passed / ______ total
- [ ] Installation Methods Tests: ______ passed / ______ total
- [ ] Command Validation Tests: ______ passed / ______ total

**Overall:** ⬜ PASSED / ⬜ FAILED

### Manual Tests

**Date:** _____________

**Installation Method:** _____________

- [ ] Path resolution works correctly
- [ ] Commands execute without errors
- [ ] No trial-and-error observed
- [ ] Claude's behavior matches expectations

**Notes:**
```
[Add any observations, issues, or notes here]
```

---

*This test matrix is maintained by the playwright-skill-tester skill*
