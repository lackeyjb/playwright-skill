#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const skillDir = __dirname;
const nodeModules = path.join(skillDir, 'node_modules');

function ensurePlaywright() {
  try {
    require.resolve('playwright', { paths: [skillDir] });
  } catch {
    console.error('Playwright is not installed. Run `npm run setup` in the skill directory.');
    process.exit(1);
  }
}

function saveScript(file) {
  const directory = process.env.PW_SCRIPT_DIR;
  if (!directory || !file) return;

  const targetDir = path.resolve(directory);
  fs.mkdirSync(targetDir, { recursive: true });
  const name = path.basename(file);
  let target = path.join(targetDir, name);
  if (fs.existsSync(target)) {
    const extension = path.extname(name);
    const stem = path.basename(name, extension);
    target = path.join(targetDir, `${stem}-${Date.now()}${extension}`);
  }
  fs.copyFileSync(file, target);
  console.log(`Script saved to: ${target}`);
}

function run(args) {
  const child = spawn(process.execPath, args, {
    cwd: skillDir,
    env: { ...process.env, NODE_PATH: nodeModules, PW_SKILL_DIR: skillDir },
    stdio: 'inherit',
  });
  child.on('exit', code => process.exit(code ?? 1));
  child.on('error', error => {
    console.error(`Failed to start Node.js: ${error.message}`);
    process.exit(1);
  });
}

ensurePlaywright();

const args = process.argv.slice(2);
if (args[0] === '-e' || args[0] === '--eval') {
  const source = args.slice(1).join(' ');
  if (!source) {
    console.error('Usage: node run.js -e "await page.goto(\'https://example.com\')"');
    process.exit(1);
  }
  const prefix = "const { chromium, firefox, webkit, devices } = require('playwright');\nconst helpers = require('./lib/helpers');\n";
  run(['-e', `${prefix}\n(async () => {\n  try {\n    ${source}\n  } catch (error) {\n    console.error(error.stack || error.message);\n    process.exitCode = 1;\n  }\n})();`]);
} else if (args[0]) {
  const file = path.resolve(args[0]);
  if (!fs.existsSync(file)) {
    console.error(`Script not found: ${file}`);
    process.exit(1);
  }
  saveScript(file);
  run([file, ...args.slice(1)]);
} else if (!process.stdin.isTTY) {
  console.error('Stdin execution is no longer supported. Use a script file or `-e`.');
  process.exit(1);
} else {
  console.error('Usage: node run.js <script.js> [args...]');
  console.error('   or: node run.js -e "await page.goto(\'https://example.com\')"');
  process.exit(1);
}
