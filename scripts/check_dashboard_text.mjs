import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require('../frontend/node_modules/puppeteer');

async function check() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://leaderslensconsulting.com', { waitUntil: 'networkidle2' });
  const inputs = await page.$$('input');
  await inputs[0].type('smm');
  await inputs[1].type('SmM@2026');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    btns.find(b => b.textContent && b.textContent.includes('Sign In')).click();
  });
  await page.waitForFunction(() => document.body.innerText.includes('POLITICAL INTELLIGENCE'));
  await page.waitForFunction(() => !document.body.innerText.includes('Loading module component...'), { timeout: 25000 });
  await page.waitForFunction(() => !document.body.innerText.includes('Loading live metrics…'), { timeout: 25000 });
  const text = await page.evaluate(() => document.body.innerText);
  console.log('=== PAGE BODY TEXT FULLY LOADED ===\n' + text.substring(0, 1500));
  await browser.close();
}

check();
