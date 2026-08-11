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

test('throwing scripts propagate a non-zero exit code', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'playwright-skill-'));
  const script = path.join(directory, 'throw-check.js');
  fs.writeFileSync(script, "throw new Error('boom');");

  const result = spawnSync(process.execPath, [path.join(skillDir, 'run.js'), script], { encoding: 'utf8' });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /boom/);
  fs.rmSync(directory, { recursive: true, force: true });
});

test('missing scripts fail with a non-zero exit code', () => {
  const result = spawnSync(process.execPath, [path.join(skillDir, 'run.js'), '/nonexistent/missing.js'], { encoding: 'utf8' });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Script not found/);
});

test('inline execution exits even when handles stay open', () => {
  const result = spawnSync(process.execPath, [path.join(skillDir, 'run.js'), '-e', "setInterval(() => {}, 1000); console.log('inline-ok');"], {
    encoding: 'utf8',
    timeout: 15000,
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /inline-ok/);
});

test('inline execution flushes output larger than the pipe buffer', () => {
  const size = 200000;
  const result = spawnSync(process.execPath, [path.join(skillDir, 'run.js'), '-e', `console.log('x'.repeat(${size}));`], {
    encoding: 'utf8',
    timeout: 15000,
    maxBuffer: 10 * 1024 * 1024,
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.length, size + 1);
});

test('inline execution flushes stderr larger than the pipe buffer', () => {
  const size = 200000;
  const result = spawnSync(process.execPath, [path.join(skillDir, 'run.js'), '-e', `console.error('y'.repeat(${size}));`], {
    encoding: 'utf8',
    timeout: 15000,
    maxBuffer: 10 * 1024 * 1024,
  });

  assert.equal(result.status, 0);
  assert.equal(result.stderr.length, size + 1);
});

test('scripts keep the caller working directory', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'playwright-skill-'));
  const script = path.join(directory, 'cwd-check.js');
  fs.writeFileSync(script, 'console.log(process.cwd());');

  const result = spawnSync(process.execPath, [path.join(skillDir, 'run.js'), script], {
    cwd: directory,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), fs.realpathSync(directory));
  fs.rmSync(directory, { recursive: true, force: true });
});

test('PW_SCRIPT_DIR preserves scripts and avoids collisions', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'playwright-skill-'));
  const saveDir = path.join(directory, 'saved');
  const script = path.join(directory, 'save-me.js');
  fs.writeFileSync(script, "console.log('saved');");

  const runArgs = { encoding: 'utf8', env: { ...process.env, PW_SCRIPT_DIR: saveDir } };
  const first = spawnSync(process.execPath, [path.join(skillDir, 'run.js'), script], runArgs);
  const second = spawnSync(process.execPath, [path.join(skillDir, 'run.js'), script], runArgs);

  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  const saved = fs.readdirSync(saveDir);
  assert.ok(saved.includes('save-me.js'), saved.join(', '));
  assert.equal(saved.filter(name => name.startsWith('save-me')).length, 2, saved.join(', '));
  fs.rmSync(directory, { recursive: true, force: true });
});
