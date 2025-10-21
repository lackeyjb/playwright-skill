# Troubleshooting and Interpreting Results

## Exit Codes

All test scripts use standard exit codes:
- **0** = All tests passed (success)
- **1** = One or more tests failed (failure)

This allows for easy integration with CI/CD pipelines and automated workflows.

## Test Status Indicators

- **✅ PASS** - Test passed successfully
- **❌ FAIL** - Test failed, requires attention
- **~ Skipped** - Test skipped (usually unsafe to execute automatically)

## Interpreting Test Reports

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

## Common Failure Scenarios

### "Skill not found"
**Issue:** Playwright-skill is not installed in any expected location

**Solution:**
- Install playwright-skill in a standard location
- Run tests from correct directory
- Verify SKILL.md exists in installation

### "Hardcoded paths found"
**Issue:** SKILL.md contains paths that don't use $SKILL_DIR

**Solution:**
- Replace hardcoded paths with $SKILL_DIR placeholder
- Example: Change `cd ~/.claude/skills/playwright-skill` to `cd $SKILL_DIR`

### "Missing path resolution section"
**Issue:** SKILL.md lacks the path resolution preamble

**Solution:**
- Add "**IMPORTANT - Path Resolution:**" section to top of SKILL.md
- Document all three installation paths
- Include $SKILL_DIR usage instructions

### "$SKILL_DIR count mismatch"
**Issue:** Expected 9+ $SKILL_DIR occurrences, but found fewer

**Solution:**
- Verify all commands use $SKILL_DIR instead of hardcoded paths
- Check that setup, execution, and detection commands use placeholder

### "Tests can't find playwright-skill"
**Issue:** Test script cannot locate playwright-skill installation

**Solutions:**
- Ensure playwright-skill is installed in one of the standard locations:
  - `~/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill`
  - `~/.claude/skills/playwright-skill`
  - `<project>/.claude/skills/playwright-skill`
- Run from the playwright-skill repository root directory
- Check that SKILL.md exists in the installation

### "Permission denied errors"
**Issue:** Scripts are not executable

**Solutions:**
- Make scripts executable: `chmod +x scripts/*.sh scripts/*.js`
- Or run with explicit interpreter: `node scripts/test.js` or `bash scripts/test.sh`

### "Node.js errors"
**Issue:** Node.js is not installed or outdated

**Solutions:**
- Ensure Node.js is installed and accessible
- Test scripts require Node.js 14+ (no additional dependencies needed)
- Check version: `node --version`

### "Test failures after skill updates"
**Issue:** Tests fail after modifying playwright-skill

**This is expected!** Tests help identify what needs fixing.

**Solutions:**
- Review the specific test output for guidance
- Fix issues in playwright-skill SKILL.md
- Re-run tests to verify fixes
- Use `--setup` flag if dependency-related

### "Dev server detection test fails"
**Issue:** Optional test for dev server detection fails

**Solutions:**
- Run with `--setup` flag to install dependencies: `node scripts/generate_test_report.js --setup`
- This test requires npm dependencies to be installed
- Manually install: `cd <skill-path> && npm install`

## Dependency Issues

### "Cannot find module"
**Issue:** Test script can't find required modules

**Solutions:**
- Ensure running from the tester skill root directory
- Check that scripts/ directory contains all test files
- Verify detect_test_target.js exists and is accessible

### "npm install fails"
**Issue:** Dependency installation fails

**Solutions:**
- Check internet connection
- Verify npm is installed: `npm --version`
- Try manual installation: `cd <playwright-skill-path> && npm install`
- Review error messages for specific issues

## Mode Detection Issues

### "Test Mode: production" when expecting development
**Issue:** Tests run in production mode instead of development mode

**Solutions:**
- Verify directory structure: `repo/skills/{playwright-skill, playwright-skill-tester}`
- Check that playwright-skill/SKILL.md exists as sibling directory
- Ensure running from `skills/playwright-skill-tester/` directory

### "Test Mode: development" when expecting production
**Issue:** Tests run in development mode instead of production mode

**This is correct behavior when:**
- Testing from workspace with both skills in `skills/` directory
- Making changes to playwright-skill before publishing

**To test production installations:**
- Install tester skill separately from playwright-skill
- Run tests from installed location

## Verbose Output

For more detailed output:

**Run individual test suites:**
```bash
node scripts/test_path_resolution.js
bash scripts/test_installation_methods.sh
node scripts/test_commands.js
```

**Review generated report:**
```bash
cat TEST_REPORT.md
```

**Check references:**
```bash
cat references/test_matrix.md
```

## Getting Help

If tests pass but skill doesn't work in Claude:

1. Run individual test suites for detailed output
2. Review TEST_REPORT.md for comprehensive breakdown
3. Check references/test_matrix.md for manual test procedures
4. Verify Claude can correctly resolve $SKILL_DIR placeholder
5. Test with at least one installation method manually
