const path = require('node:path');
const { chromium } = require('../skills/playwright-skill/node_modules/playwright');

const loginUrl = `file://${path.resolve(__dirname, 'fixtures/login.html')}`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(loginUrl);
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('**/dashboard.html');
    await page.getByRole('heading', { name: 'Dashboard' }).waitFor();
  } finally {
    await browser.close();
  }
})();
