# Test Suites Reference

Detailed documentation for each test suite in the playwright-skill-tester.

## 1. Path Resolution Tests

**Script:** `scripts/test_path_resolution.js`

**Purpose:** Validates that dynamic path resolution is implemented correctly.

**Tests:**
- Skill location detection across all installation methods
- Path resolution preamble exists in SKILL.md
- All installation paths documented
- No hardcoded paths in commands (outside preamble)
- $SKILL_DIR placeholder usage (should find 9+ occurrences)
- Critical commands use dynamic paths

**Usage:**

```bash
cd /Users/bryanlackey/workspace/github.com/lackeyjb/playwright-skill/skills/playwright-skill-tester
node scripts/test_path_resolution.js
```

**Expected Output:**
```
=================================================================
  Playwright Skill - Path Resolution Test Suite
=================================================================

🔍 Searching for playwright-skill installation...
   Found: Plugin System
   Path: /Users/username/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill

✅ PASS: Skill location detection
✅ PASS: Has path resolution section
✅ PASS: Documents plugin installation path
✅ PASS: Documents manual installation path
✅ PASS: Documents project-specific path
✅ PASS: No hardcoded paths in commands
✅ PASS: $SKILL_DIR placeholder usage
✅ PASS: Dev server detection uses $SKILL_DIR
✅ PASS: Script execution uses $SKILL_DIR
✅ PASS: Setup command uses $SKILL_DIR

=================================================================
  Test Summary
=================================================================
Total Tests: 5
Passed: 5
Failed: 0
=================================================================

🎉 All tests passed! Path resolution is working correctly.
```

---

## 2. Installation Methods Tests

**Script:** `scripts/test_installation_methods.sh`

**Purpose:** Validates playwright-skill installation across all three supported methods.

**Tests:**
- Plugin system installation validation
- Manual global installation validation
- Project-specific installation validation
- File structure verification (SKILL.md, run.js, package.json)
- Path resolution instructions present
- Commands use $SKILL_DIR

**Usage:**

```bash
cd /Users/bryanlackey/workspace/github.com/lackeyjb/playwright-skill/skills/playwright-skill-tester
bash scripts/test_installation_methods.sh
```

**Expected Output:**
```
============================================================
  Playwright Skill - Installation Methods Test
============================================================

🔍 Checking: Plugin System
   Path: /Users/username/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill
✅ PASS: Plugin System - Directory exists
✅ PASS: Plugin System - SKILL.md exists
✅ PASS: Plugin System - run.js exists
✅ PASS: Plugin System - package.json exists
✅ PASS: Plugin System - Has path resolution instructions
✅ PASS: Plugin System - Uses $SKILL_DIR placeholder
   ✓ Installation valid

============================================================
  Test Summary
============================================================
Total Tests: 15
Passed: 15
Failed: 0
============================================================

🎉 All tests passed! Installation methods are working correctly.
```

---

## 3. Command Validation Tests

**Script:** `scripts/test_commands.js`

**Purpose:** Extracts and validates all commands from SKILL.md.

**Tests:**
- Extract all code blocks from SKILL.md
- Identify commands that reference paths
- Verify commands use $SKILL_DIR (not hardcoded paths)
- Validate critical commands are present
- Check command syntax
- Detect legacy hardcoded path patterns

**Usage:**

```bash
cd /Users/bryanlackey/workspace/github.com/lackeyjb/playwright-skill/skills/playwright-skill-tester
node scripts/test_commands.js
```

**Expected Output:**
```
=================================================================
  Playwright Skill - Command Validation Test Suite
=================================================================

📍 Found skill at: /Users/username/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill

📝 Test 1: Command Extraction and Analysis
✅ PASS: Code blocks extracted
   Found 15 code blocks
✅ PASS: Path commands identified
   Found 12 commands with paths

🎯 Test 2: $SKILL_DIR Usage in Commands
   Commands using $SKILL_DIR: 9
   Commands with hardcoded paths: 0
✅ PASS: All commands use $SKILL_DIR

⚙️  Test 3: Critical Commands Presence
✅ PASS: Dev server detection command exists
✅ PASS: Script execution (run.js) command exists
✅ PASS: Setup command command exists

✓ Test 4: Command Syntax Validation
   ✓ Valid: cd /path/to/skill && node -e "require('./lib/helpers').detectDevServers()...
   ~ Skipped (unsafe): cd /path/to/skill && npm run setup
✅ PASS: Command syntax validation
   Checked 5 commands, 0 failures

🔍 Test 5: Legacy Pattern Detection
✅ PASS: Hardcoded ~/.claude/skills/playwright-skill in commands
✅ PASS: Absolute paths without $SKILL_DIR

=================================================================
  Test Summary
=================================================================
Total Tests: 5
Passed: 5
Failed: 0
=================================================================

🎉 All command tests passed!
```

---

## Test Execution Order

When `generate_test_report.js` runs all tests, they execute in this order:

1. **Path Resolution Tests** - Validates SKILL.md structure
2. **Installation Methods Tests** - Validates file structure
3. **Command Validation Tests** - Validates command syntax

This order ensures foundational checks (file existence, structure) pass before more complex validations (command execution).

---

## Success Criteria

All tests should pass when:

✅ **Path Resolution:**
- SKILL.md contains "**IMPORTANT - Path Resolution:**" section
- All three installation paths documented
- $SKILL_DIR used consistently (9+ occurrences)
- No hardcoded paths outside preamble

✅ **Installation Methods:**
- Required files exist (SKILL.md, run.js, package.json)
- Path resolution instructions present
- $SKILL_DIR placeholder used

✅ **Command Validation:**
- All commands use $SKILL_DIR
- Critical commands present
- No legacy hardcoded patterns
- Valid command syntax
