#!/usr/bin/env node

/**
 * Detect Test Target
 *
 * Smart detection of which playwright-skill installation to test.
 *
 * Logic:
 * 1. If we're in the playwright-skill repository (development mode):
 *    - Test ONLY the local workspace version
 *    - This is for development/testing changes before publishing
 *
 * 2. If we're in a normal installation (production mode):
 *    - Test all standard installation locations
 *    - This is for validating deployed installations
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function detectTestTarget() {
  const currentDir = process.cwd();

  // Check if we're in a development environment
  // Indicators: we're in a skills/playwright-skill-tester directory that has a sibling playwright-skill
  const parentDir = path.dirname(currentDir);
  const grandparentDir = path.dirname(parentDir);

  // Check for workspace structure: repo/skills/playwright-skill-tester
  const workspacePlaywrightSkill = path.join(parentDir, 'playwright-skill');

  if (fs.existsSync(path.join(workspacePlaywrightSkill, 'SKILL.md'))) {
    // Development mode: test local workspace version only
    return {
      mode: 'development',
      targets: [
        {
          name: 'Workspace (local)',
          path: workspacePlaywrightSkill,
          priority: true
        }
      ]
    };
  }

  // Production mode: test all standard installations
  const homeDir = os.homedir();

  return {
    mode: 'production',
    targets: [
      {
        name: 'Plugin System',
        path: path.join(homeDir, '.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill'),
        priority: true
      },
      {
        name: 'Manual Global',
        path: path.join(homeDir, '.claude/skills/playwright-skill'),
        priority: true
      },
      {
        name: 'Project-Specific (current)',
        path: path.join(currentDir, '.claude/skills/playwright-skill'),
        priority: false
      },
      {
        name: 'Project-Specific (parent)',
        path: path.join(parentDir, '.claude/skills/playwright-skill'),
        priority: false
      }
    ]
  };
}

// Export for use in other scripts
if (require.main === module) {
  // Run as CLI
  const result = detectTestTarget();
  console.log(JSON.stringify(result, null, 2));
} else {
  // Used as module
  module.exports = { detectTestTarget };
}
