const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const skillDir = path.resolve(__dirname, '../skills/playwright-skill');

test('file scripts can load skill helpers', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'playwright-skill-'));
  const script = path.join(directory, 'helper-check.js');
  fs.writeFileSync(script, "const helpers = require(`${process.env.PW_SKILL_DIR}/lib/helpers`); console.log(typeof helpers.detectDevServers);");

  const result = spawnSync(process.execPath, [path.join(skillDir, 'run.js'), script], {
    cwd: skillDir,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /function/);
  fs.rmSync(directory, { recursive: true, force: true });
});
