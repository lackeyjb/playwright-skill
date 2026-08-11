const path = require('node:path');
const assert = require('node:assert/strict');

const skillDir = process.env.PW_SKILL_DIR || path.resolve(__dirname, '../skills/playwright-skill');
const { chromium } = require(path.join(skillDir, 'node_modules/playwright'));
const helpers = require(path.join(skillDir, 'lib/helpers'));

const loginUrl = `file://${path.resolve(__dirname, 'fixtures/login.html')}`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(loginUrl);
    assert.equal(await helpers.handleCookieBanner(page), true, 'cookie banner should be dismissed');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('**/dashboard.html');
    await page.getByRole('heading', { name: 'Dashboard' }).waitFor();
  } finally {
    await browser.close();
  }
})();
