import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require('../frontend/node_modules/puppeteer');

const targetUrl = 'https://36b284a7.leaders-lens.pages.dev';

async function testGaps() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERR:', err));
  page.on('response', res => {
    if (res.url().includes('/api/')) console.log('API:', res.status(), res.url());
  });

  await page.goto(targetUrl, { waitUntil: 'networkidle2' });
  const inputs = await page.$$('input');
  await inputs[0].type('tdp-president');
  await inputs[1].type('TdpPresident@2026');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const signBtn = btns.find(b => b.textContent && b.textContent.includes('Sign In'));
    if (signBtn) signBtn.click();
  });

  await new Promise(r => setTimeout(r, 4000));
  console.log('--- Page text after login: ---');
  console.log(await page.evaluate(() => document.body.innerText));

  // Click Gaps
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const gapsTab = btns.find(b => b.textContent?.trim().toUpperCase() === 'GAPS');
    if (gapsTab) gapsTab.click();
  });

  await new Promise(r => setTimeout(r, 10000));
  console.log('--- Page text after clicking GAPS (10s wait): ---');
  console.log(await page.evaluate(() => document.body.innerText));

  // Click Calendar
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const calTab = btns.find(b => b.textContent?.trim().toUpperCase() === 'CONTENT CALENDAR');
    if (calTab) calTab.click();
  });

  await new Promise(r => setTimeout(r, 10000));
  console.log('--- Page text after clicking CALENDAR (10s wait): ---');
  console.log(await page.evaluate(() => document.body.innerText));

  await browser.close();
}

testGaps();
