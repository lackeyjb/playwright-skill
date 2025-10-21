# Using playwright-skill-tester in Other Claude Code Instances

This guide explains how to use the playwright-skill-tester to validate playwright-skill in any Claude Code instance.

## Installation Methods

### Method 1: Use from Workspace (Recommended for Development)

When developing/testing changes to playwright-skill:

1. **Keep both skills in the same workspace:**
   ```
   your-repo/
   └── skills/
       ├── playwright-skill/          # The skill you're testing
       └── playwright-skill-tester/   # The testing skill
   ```

2. **Run tests with automatic dependency setup:**
   ```bash
   cd skills/playwright-skill-tester
   node scripts/generate_test_report.js --setup
   ```

   This command automatically installs npm dependencies in playwright-skill before running tests, ensuring all 18 tests pass (100% success rate).

3. **The tester will automatically detect:**
   - Mode: `development`
   - Target: Local workspace version only
   - Result: Tests your changes, not installed versions

**Note:** The `--setup` flag is recommended for complete validation. Without it, some optional tests may fail if dependencies are missing.

### Method 2: Install as a Skill (For Testing Installed Versions)

When validating a deployed installation:

1. **Install the testing skill:**
   ```bash
   # Install globally (recommended)
   cp -r playwright-skill-tester ~/.claude/skills/

   # OR install in specific project
   mkdir -p .claude/skills
   cp -r playwright-skill-tester .claude/skills/
   ```

2. **Run tests:**
   ```bash
   cd ~/.claude/skills/playwright-skill-tester  # or .claude/skills/playwright-skill-tester
   node scripts/generate_test_report.js
   ```

3. **The tester will automatically detect:**
   - Mode: `production`
   - Target: All installed versions (plugin, global, project)
   - Result: Tests all deployments

### Method 3: Use via Claude Code Skill System

1. **Package the testing skill:**
   ```bash
   # From the skill-creator skill
   python3 scripts/package_skill.py /path/to/playwright-skill-tester
   ```

2. **Install the packaged skill:**
   - Place `playwright-skill-tester.zip` in your skills directory
   - Or distribute it to other developers

3. **Invoke via Claude:**
   ```
   Please use the playwright-skill-tester to validate the playwright-skill
   ```

## Dependency Management

The playwright-skill requires npm dependencies (Playwright, etc.) to function properly. The testing skill can automatically install these for you.

### Automatic Setup

Use the `--setup` flag to automatically install dependencies before testing:

```bash
node scripts/generate_test_report.js --setup
```

This will:
1. Detect the playwright-skill location
2. Check if `node_modules/` exists
3. Run `npm install` if dependencies are missing
4. Proceed with testing

### Manual Setup

Install dependencies separately:

```bash
# Setup dependencies
node scripts/setup_dependencies.js

# Then run tests
node scripts/generate_test_report.js
```

### When to Use --setup

**Use `--setup` when:**
- First time testing a fresh clone
- Testing after pulling latest changes that update dependencies
- You see "Dev server detection" test failures
- You want all tests (including optional ones) to pass

**Skip `--setup` when:**
- Dependencies are already installed
- Quick iteration on SKILL.md changes (no code changes)
- Running in CI/CD where dependencies are cached

## Security Features

The testing skill includes built-in security validation to prevent command injection:

**Command Allowlisting:**
- All commands are validated against a safe pattern allowlist before execution
- Only expected test commands are permitted to run
- Suspicious patterns (rm -rf, eval, curl | bash, etc.) are blocked

**Automatic Validation:**
- Commands extracted from SKILL.md are sanitized before execution
- Path substitution ($SKILL_DIR) is validated
- Security warnings displayed for any blocked commands

**What This Means:**
- Safe to test skills from untrusted sources
- Prevents malicious commands in SKILL.md from executing
- Transparent - validation failures are clearly reported

The security utilities are in `scripts/shared/utils.js` and can be used independently:

```bash
# Validate a command
node scripts/shared/utils.js "cd \$SKILL_DIR && npm install" /path/to/skill
```

## How It Works

### Smart Context Detection

The tester automatically detects its environment:

**Development Mode** (testing local changes):
- Detected when: Tester is in `repo/skills/playwright-skill-tester` with sibling `playwright-skill/`
- Tests: Only the local workspace version
- Use case: Iterating on changes before publishing

**Production Mode** (validating installations):
- Detected when: Tester is installed separately from playwright-skill
- Tests: All standard installation locations
- Use case: Verifying deployments work correctly

### Test Suites

1. **Path Resolution Tests** (`scripts/test_path_resolution.js`)
   - Verifies SKILL.md contains path resolution instructions
   - Checks all installation methods are documented
   - Validates no hardcoded paths remain
   - Confirms $SKILL_DIR is used throughout

2. **Installation Methods Tests** (`scripts/test_installation_methods.sh`)
   - Tests file structure (SKILL.md, run.js, package.json)
   - Validates path resolution implementation
   - Checks critical vs optional tests

3. **Command Validation Tests** (`scripts/test_commands.js`)
   - Extracts all commands from SKILL.md
   - Verifies commands use $SKILL_DIR
   - Validates syntax and structure

## Typical Workflows

### Workflow 1: Testing Changes During Development

You're working on playwright-skill and want to validate your changes:

```bash
# 1. Make changes to playwright-skill/SKILL.md
vim skills/playwright-skill/SKILL.md

# 2. Run tests with dependency setup (first time or after dependency changes)
cd skills/playwright-skill-tester
node scripts/generate_test_report.js --setup

# 3. Review results
cat TEST_REPORT.md

# 4. For subsequent iterations (if only changing SKILL.md):
node scripts/generate_test_report.js

# 5. Fix any issues and re-test
```

**Expected Output:**
```
🔧 Running dependency setup...
✅ Dependencies already installed

🔍 Test Mode: development
   Testing LOCAL workspace version only

✅ All critical tests passed! Installation is working correctly.
✅ All test suites passed!
```

### Workflow 2: Validating Before Publishing

Before publishing a new version of playwright-skill:

```bash
# 1. Run comprehensive tests with full dependency setup
cd skills/playwright-skill-tester
node scripts/generate_test_report.js --setup

# 2. Check the report
cat TEST_REPORT.md

# 3. Verify all tests pass
#    ✅ Overall Status: PASSED
#    ✅ Success Rate: 100% (18/18 tests)

# 4. Package and publish if tests pass
```

**Note:** With `--setup`, you should see 100% success rate (18/18 tests) instead of 94.4% (17/18), as the dev server detection test will now pass.

### Workflow 3: Debugging Installation Issues

A user reports playwright-skill doesn't work on their machine:

```bash
# 1. Install the testing skill on their machine
cp -r playwright-skill-tester ~/.claude/skills/

# 2. Run tests to diagnose
cd ~/.claude/skills/playwright-skill-tester
node scripts/generate_test_report.js

# 3. Review which tests fail
#    - If "Skill not found" → Installation issue
#    - If "Hardcoded paths" → Old version installed
#    - If "Missing path resolution" → Corrupted installation
```

## Reading Test Results

### Test Report Structure

```markdown
# Playwright Skill - Test Report

**Overall Status:** ✅ PASSED

## Summary
| Metric | Value |
|--------|-------|
| Total Test Suites | 3 |
| Passed Suites | 3 |
| Total Tests | 18 |
| Success Rate | 94.4% |

## Test Suites
### Path Resolution Tests - ✅ PASSED
- Total Tests: 5
- Passed: 5
- Failed: 0
```

### Understanding Exit Codes

- **Exit 0**: All critical tests passed (skill is working correctly)
- **Exit 1**: Critical tests failed (skill has issues)

Critical vs Optional:
- **Critical**: Path resolution, file structure, $SKILL_DIR usage
- **Optional**: Command execution (may require `npm install`)

### Common Test Results

**All tests pass (94.4% success rate):**
- 1 optional test fails: Dev server detection (needs npm install)
- This is normal and doesn't indicate problems

**Critical tests fail:**
- Indicates actual issues with playwright-skill
- Review specific failures and fix

## Sharing the Testing Skill

### For Other Developers

1. **Package the skill:**
   ```bash
   python3 /path/to/skill-creator/scripts/package_skill.py playwright-skill-tester
   ```

2. **Share `playwright-skill-tester.zip`** with other developers

3. **They can install and run:**
   ```bash
   unzip playwright-skill-tester.zip -d ~/.claude/skills/
   cd ~/.claude/skills/playwright-skill-tester
   node scripts/generate_test_report.js
   ```

### For CI/CD

The testing skill can be integrated into CI/CD:

```yaml
# .github/workflows/test-skill.yml
name: Test Playwright Skill

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Run skill tests
        run: |
          cd skills/playwright-skill-tester
          node scripts/generate_test_report.js

      - name: Upload test report
        uses: actions/upload-artifact@v2
        with:
          name: test-report
          path: skills/playwright-skill-tester/TEST_REPORT.md
```

## Customizing for Other Skills

The playwright-skill-tester can be adapted to test other skills:

1. **Update detection logic** in `scripts/detect_test_target.js`
2. **Modify test criteria** in individual test scripts
3. **Adjust success criteria** in SKILL.md

This makes it a reusable testing framework for any skill that needs path resolution validation.

## Troubleshooting

**"Cannot find module"**
- Ensure you're running from the tester skill root directory
- Check that scripts/ directory contains all test files

**"Test Mode: production" when expecting development**
- Verify directory structure: `repo/skills/{playwright-skill, playwright-skill-tester}`
- Check that playwright-skill/SKILL.md exists

**Tests pass but skill doesn't work in Claude**
- Run individual test suites for detailed output:
  ```bash
  node scripts/test_path_resolution.js
  bash scripts/test_installation_methods.sh
  node scripts/test_commands.js
  ```

**Want more verbose output**
- Each test script can be run individually
- Review TEST_REPORT.md for detailed breakdown
- Check references/test_matrix.md for manual test procedures

---

*For more information, see SKILL.md or references/test_matrix.md*
