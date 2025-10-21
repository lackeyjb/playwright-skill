#!/usr/bin/env node

/**
 * Shared Utilities for Playwright Skill Tester
 *
 * Provides security validation and command sanitization utilities
 * to prevent command injection and ensure safe test execution.
 */

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Allowlist of safe command patterns
 * Commands must match one of these patterns to be executed
 */
const SAFE_COMMAND_PATTERNS = [
  // Node.js execution patterns
  /^node\s+-e\s+"[^"]*"$/,
  /^node\s+run\.js\s+/,
  /^node\s+scripts\/[a-zA-Z_-]+\.js$/,

  // NPM patterns
  /^npm\s+(install|run\s+setup|run\s+test)$/,

  // File operations (read-only)
  /^cat\s+[a-zA-Z0-9_\-\/\.]+$/,
  /^ls\s+-[a-zA-Z]+\s+[a-zA-Z0-9_\-\/\.]+$/,

  // Test script patterns
  /^bash\s+scripts\/test_[a-zA-Z_-]+\.sh$/,

  // CD with safe paths (starting with $SKILL_DIR or relative paths)
  /^cd\s+\$SKILL_DIR(\s+&&\s+.+)?$/,
  /^cd\s+[a-zA-Z0-9_\-\/\.]+(\s+&&\s+.+)?$/,
];

/**
 * Patterns that should trigger warnings (potentially suspicious)
 */
const SUSPICIOUS_PATTERNS = [
  /rm\s+-rf/i,                    // Recursive delete
  />\s*\/dev\/null/,              // Output redirection
  /sudo/i,                        // Elevated privileges
  /curl\s+.*\|\s*bash/i,         // Pipe to bash
  /wget\s+.*\|\s*bash/i,         // Pipe to bash
  /eval\s+["'`]/,                // Eval with quotes
  /;\s*rm\s+/i,                  // Command chaining with rm
  /&&\s*rm\s+/i,                 // Command chaining with rm
  /\$\([^)]*\)/,                 // Command substitution
  /`[^`]*`/,                     // Backtick command execution
];

/**
 * Validate that a command matches the allowlist
 * @param {string} command - The command to validate
 * @returns {object} - { valid: boolean, reason: string }
 */
function validateCommand(command) {
  if (!command || typeof command !== 'string') {
    return { valid: false, reason: 'Command is empty or not a string' };
  }

  // Trim whitespace
  const trimmedCommand = command.trim();

  // Check for suspicious patterns first
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(trimmedCommand)) {
      return {
        valid: false,
        reason: `Command contains suspicious pattern: ${pattern.source}`,
        suspicious: true
      };
    }
  }

  // Handle compound commands (with cd and &&)
  if (trimmedCommand.includes('cd ') && trimmedCommand.includes('&&')) {
    const parts = trimmedCommand.split('&&').map(p => p.trim());

    // Validate each part
    for (const part of parts) {
      const result = validateSingleCommand(part);
      if (!result.valid) {
        return result;
      }
    }

    return { valid: true, reason: 'Compound command validated' };
  }

  // Validate single command
  return validateSingleCommand(trimmedCommand);
}

/**
 * Validate a single command (no &&)
 * @param {string} command - The command to validate
 * @returns {object} - { valid: boolean, reason: string }
 */
function validateSingleCommand(command) {
  // Check against allowlist
  for (const pattern of SAFE_COMMAND_PATTERNS) {
    if (pattern.test(command)) {
      return { valid: true, reason: 'Matches safe pattern' };
    }
  }

  return {
    valid: false,
    reason: 'Command does not match any safe pattern in allowlist'
  };
}

/**
 * Sanitize a command by replacing $SKILL_DIR with actual path
 * and validating the result
 * @param {string} command - The command to sanitize
 * @param {string} skillPath - The actual skill directory path
 * @returns {object} - { sanitized: string, valid: boolean, reason: string }
 */
function sanitizeCommand(command, skillPath) {
  if (!skillPath) {
    return {
      sanitized: null,
      valid: false,
      reason: 'Skill path is required for sanitization'
    };
  }

  // Replace $SKILL_DIR with actual path
  const sanitized = command.replace(/\$SKILL_DIR/g, skillPath);

  // Validate the sanitized command
  const validation = validateCommand(sanitized);

  return {
    sanitized: sanitized,
    valid: validation.valid,
    reason: validation.reason,
    suspicious: validation.suspicious || false
  };
}

/**
 * Extract commands from a markdown file
 * @param {string} content - The markdown content
 * @returns {Array} - Array of extracted commands
 */
function extractCommandsFromMarkdown(content) {
  const codeBlockRegex = /```(?:bash|sh|shell)?\n([\s\S]*?)```/g;
  const commands = [];
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const block = match[1].trim();
    const lines = block.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip comments and empty lines
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      // Extract commands
      if (trimmedLine.includes('cd ') ||
          trimmedLine.includes('node ') ||
          trimmedLine.includes('npm ') ||
          trimmedLine.includes('bash ')) {
        commands.push(trimmedLine);
      }
    }
  }

  return commands;
}

/**
 * Check if a command is safe to execute
 * @param {string} command - The command to check
 * @param {string} skillPath - The skill directory path (optional)
 * @returns {boolean} - True if safe, false otherwise
 */
function isSafeCommand(command, skillPath = null) {
  const toCheck = skillPath ? command.replace(/\$SKILL_DIR/g, skillPath) : command;
  const result = validateCommand(toCheck);
  return result.valid;
}

/**
 * Log validation result with color coding
 * @param {string} command - The command being validated
 * @param {object} result - The validation result
 */
function logValidation(command, result) {
  if (result.valid) {
    log(`✅ SAFE: ${command.substring(0, 60)}...`, 'green');
  } else if (result.suspicious) {
    log(`⚠️  SUSPICIOUS: ${command.substring(0, 60)}...`, 'red');
    log(`   Reason: ${result.reason}`, 'yellow');
  } else {
    log(`❌ BLOCKED: ${command.substring(0, 60)}...`, 'red');
    log(`   Reason: ${result.reason}`, 'cyan');
  }
}

// Export utilities
module.exports = {
  colors,
  log,
  validateCommand,
  validateSingleCommand,
  sanitizeCommand,
  extractCommandsFromMarkdown,
  isSafeCommand,
  logValidation,
  SAFE_COMMAND_PATTERNS,
  SUSPICIOUS_PATTERNS
};

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node utils.js <command> [skillPath]');
    console.log('Example: node utils.js "cd $SKILL_DIR && npm install"');
    process.exit(1);
  }

  const command = args[0];
  const skillPath = args[1] || '/path/to/skill';

  const result = sanitizeCommand(command, skillPath);

  log('\n=== Command Validation ===', 'blue');
  log(`Original: ${command}`, 'cyan');
  log(`Sanitized: ${result.sanitized}`, 'cyan');
  log(`Valid: ${result.valid}`, result.valid ? 'green' : 'red');
  log(`Reason: ${result.reason}`, 'yellow');

  process.exit(result.valid ? 0 : 1);
}
