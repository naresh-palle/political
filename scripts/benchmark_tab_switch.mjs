import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require('../frontend/node_modules/puppeteer');

async function benchmark() {
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
  await page.waitForFunction(() => !document.body.innerText.includes('Loading module component...'), { timeout: 25000 });
  await page.waitForFunction(() => !document.body.innerText.includes('Loading live metrics…'), { timeout: 25000 });
  console.log('✓ Initial dashboard loaded');

  // Switch to Intelligence
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    btns.find(b => b.textContent?.trim() === 'Intelligence')?.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  console.log('✓ Switched to Intelligence tab');

  // Benchmark Switch Back to Dashboard
  const t0 = Date.now();
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    btns.find(b => b.textContent?.trim() === 'Dashboard')?.click();
  });
  // Wait until audit progress is visible
  await page.waitForFunction(() => document.body.innerText.includes('Audit progress'), { timeout: 5000 });
  const switchBackMs = Date.now() - t0;
  console.log(`✓ Switch back to Dashboard took: ${switchBackMs}ms`);

  // Switch to Rankings
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    btns.find(b => b.textContent?.trim() === 'Ranking')?.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  console.log('✓ Switched to Ranking tab');

  // Benchmark Switch Back to Dashboard again
  const t1 = Date.now();
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    btns.find(b => b.textContent?.trim() === 'Dashboard')?.click();
  });
  await page.waitForFunction(() => document.body.innerText.includes('Audit progress'), { timeout: 5000 });
  const switchBackMs2 = Date.now() - t1;
  console.log(`✓ Second switch back to Dashboard took: ${switchBackMs2}ms`);

  await browser.close();
}

benchmark();
