const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const helpers = require('../skills/playwright-skill/lib/helpers');

test('parses a single configured header', () => {
  const previous = {
    name: process.env.PW_HEADER_NAME,
    value: process.env.PW_HEADER_VALUE,
    extra: process.env.PW_EXTRA_HEADERS,
  };

  process.env.PW_HEADER_NAME = 'X-Test';
  process.env.PW_HEADER_VALUE = 'true';
  delete process.env.PW_EXTRA_HEADERS;

  assert.deepEqual(helpers.getExtraHeadersFromEnv(), { 'X-Test': 'true' });

  restoreEnv(previous);
});

test('parses multiple configured headers', () => {
  const previous = {
    name: process.env.PW_HEADER_NAME,
    value: process.env.PW_HEADER_VALUE,
    extra: process.env.PW_EXTRA_HEADERS,
  };

  delete process.env.PW_HEADER_NAME;
  delete process.env.PW_HEADER_VALUE;
  process.env.PW_EXTRA_HEADERS = JSON.stringify({ 'X-One': '1', 'X-Two': '2' });

  assert.deepEqual(helpers.getExtraHeadersFromEnv(), { 'X-One': '1', 'X-Two': '2' });

  restoreEnv(previous);
});

test('detects a running HTTP server on a custom port', async () => {
  const server = http.createServer((request, response) => {
    response.writeHead(200);
    response.end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  try {
    const servers = await helpers.detectDevServers([port]);
    assert.ok(servers.includes(`http://localhost:${port}`));
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('creates a configured screenshot directory', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'playwright-skill-'));
  const previous = process.env.PW_ARTIFACT_DIR;
  process.env.PW_ARTIFACT_DIR = path.join(directory, 'artifacts');

  const page = { screenshot: async options => fs.writeFileSync(options.path, 'test') };
  const filename = await helpers.takeScreenshot(page, 'result');

  assert.equal(fs.existsSync(filename), true);
  if (previous === undefined) delete process.env.PW_ARTIFACT_DIR;
  else process.env.PW_ARTIFACT_DIR = previous;
  fs.rmSync(directory, { recursive: true, force: true });
});

function restoreEnv(previous) {
  setOrDelete('PW_HEADER_NAME', previous.name);
  setOrDelete('PW_HEADER_VALUE', previous.value);
  setOrDelete('PW_EXTRA_HEADERS', previous.extra);
}

function setOrDelete(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
