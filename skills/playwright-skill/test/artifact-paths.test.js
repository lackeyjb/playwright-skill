#!/usr/bin/env node
/**
 * Artifact path tests.
 *
 * These cover where generated files land, which is platform-sensitive: a
 * literal '/tmp/shot.png' resolves to C:\tmp\shot.png on Windows — the root of
 * the current drive, outside the directory the OS cleans up.
 *
 * No Playwright install required: the module is stubbed, because what is under
 * test is path handling, not the browser. Run with `npm test`.
 */

const assert = require('assert');
const os = require('os');
const path = require('path');
const Module = require('module');

// Stub 'playwright' so lib/helpers.js loads without node_modules present.
const originalLoad = Module._load;
Module._load = function (request) {
  if (request === 'playwright') {
    return { chromium: {}, firefox: {}, webkit: {} };
  }
  return originalLoad.apply(this, arguments);
};
const helpers = require('../lib/helpers');
Module._load = originalLoad;

let passed = 0;
function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        () => { console.log(`  ok  ${name}`); passed++; },
        (e) => { console.error(`  FAIL ${name}\n       ${e.message}`); process.exitCode = 1; }
      );
    }
    console.log(`  ok  ${name}`);
    passed++;
  } catch (e) {
    console.error(`  FAIL ${name}\n       ${e.message}`);
    process.exitCode = 1;
  }
}

/** Minimal page double: records what Playwright would have been given. */
function fakePage() {
  const page = { calls: [] };
  page.screenshot = async (options) => { page.calls.push(options); };
  return page;
}

async function main() {
  console.log(`artifact paths (platform: ${process.platform}, tmpdir: ${os.tmpdir()})`);

  await test('artifactPath puts a bare name in os.tmpdir()', () => {
    const p = helpers.artifactPath('screenshot.png');
    assert.strictEqual(p, path.join(os.tmpdir(), 'screenshot.png'));
    assert.ok(path.isAbsolute(p), 'must be absolute');
  });

  await test("artifactPath('/tmp/x.png') never resolves to the drive root", () => {
    const p = helpers.artifactPath('/tmp/screenshot.png');
    if (process.platform === 'win32') {
      // path.isAbsolute('/tmp/x') is true here but the path is drive-relative:
      // passing it through would land in C:\tmp, the bug this function exists
      // to avoid. The file name is relocated to the temp directory instead.
      assert.strictEqual(p, path.join(os.tmpdir(), 'screenshot.png'));
      assert.notStrictEqual(path.resolve(p), path.resolve('/tmp/screenshot.png'));
    } else {
      // On POSIX, /tmp really is an absolute location; leave it alone.
      assert.strictEqual(p, '/tmp/screenshot.png');
    }
  });

  await test('artifactPath honours a directory override', () => {
    const dir = path.join(os.tmpdir(), 'custom-artifacts');
    assert.strictEqual(helpers.artifactPath('a.png', dir), path.join(dir, 'a.png'));
  });

  await test('artifactPath keeps relative sub-directories', () => {
    assert.strictEqual(
      helpers.artifactPath(path.join('run-1', 'a.png')),
      path.join(os.tmpdir(), 'run-1', 'a.png')
    );
  });

  await test('artifactPath passes pinned absolute paths through untouched', () => {
    // os.tmpdir() is drive-qualified on Windows and /-rooted on POSIX, so this
    // is a pinned path on both.
    const abs = path.join(os.tmpdir(), 'already', 'absolute.png');
    assert.strictEqual(helpers.artifactPath(abs), abs);
    if (process.platform === 'win32') {
      // UNC and extended-length paths are pinned too.
      assert.strictEqual(helpers.artifactPath('\\\\srv\\share\\a.png'), '\\\\srv\\share\\a.png');
      assert.strictEqual(helpers.artifactPath('\\\\?\\C:\\a.png'), '\\\\?\\C:\\a.png');
    }
  });

  await test('artifactPath returns an absolute path even for a relative dir', () => {
    const p = helpers.artifactPath('a.png', 'shots');
    assert.ok(path.isAbsolute(p), `expected absolute, got ${p}`);
    assert.strictEqual(p, path.resolve('shots', 'a.png'));
  });

  await test('artifactPath rejects an empty or non-string name', () => {
    assert.throws(() => helpers.artifactPath(''), TypeError);
    assert.throws(() => helpers.artifactPath(undefined), TypeError);
  });

  await test('artifactPath relocates a drive-relative "C:name" on Windows', () => {
    if (process.platform !== 'win32') return;
    // 'C:a.png' means "a.png in C:'s current directory"; joining it verbatim
    // would create an NTFS alternate data stream rather than a file.
    assert.strictEqual(helpers.artifactPath('C:a.png'), path.join(os.tmpdir(), 'a.png'));
  });

  await test('takeScreenshot writes into os.tmpdir(), not the cwd', async () => {
    const page = fakePage();
    const returned = await helpers.takeScreenshot(page, 'result');
    const given = page.calls[0].path;
    assert.ok(path.isAbsolute(given), `expected absolute path, got ${given}`);
    assert.strictEqual(path.dirname(given), os.tmpdir());
    assert.strictEqual(returned, given, 'must return the path it wrote');
    // run.js does process.chdir(__dirname); Playwright resolves a relative
    // path against cwd, so a bare name would land in the skill directory.
    assert.notStrictEqual(path.dirname(given), process.cwd());
  });

  await test('takeScreenshot honours options.dir and does not forward it', async () => {
    const page = fakePage();
    const dir = path.join(os.tmpdir(), 'shots');
    await helpers.takeScreenshot(page, 'result', { dir });
    assert.strictEqual(path.dirname(page.calls[0].path), dir);
    assert.strictEqual('dir' in page.calls[0], false, 'dir is not a Playwright option');
  });

  await test('takeScreenshot still defaults fullPage to true and allows opting out', async () => {
    const page = fakePage();
    await helpers.takeScreenshot(page, 'a');
    assert.strictEqual(page.calls[0].fullPage, true);
    await helpers.takeScreenshot(page, 'b', { fullPage: false });
    assert.strictEqual(page.calls[1].fullPage, false);
    // An explicit undefined must not silently clobber the default.
    await helpers.takeScreenshot(page, 'c', { fullPage: undefined });
    assert.strictEqual(page.calls[2].fullPage, true);
  });

  await test('takeScreenshot reports the path Playwright actually got', async () => {
    const page = fakePage();
    // A caller-supplied relative path must not be forwarded raw, and whatever
    // is used must be what gets logged and returned.
    const returned = await helpers.takeScreenshot(page, 'ignored', { path: 'custom.png' });
    assert.strictEqual(page.calls[0].path, returned);
    assert.strictEqual(returned, path.join(os.tmpdir(), 'custom.png'));
  });

  await test('generated file name is legal on Windows', async () => {
    const page = fakePage();
    await helpers.takeScreenshot(page, 'result');
    const base = path.basename(page.calls[0].path);
    assert.ok(!/[<>:"/\\|?*]/.test(base), `illegal character in ${base}`);
  });

  console.log(`\n${passed} passed${process.exitCode ? ', SOME FAILED' : ''}`);
}

main();
