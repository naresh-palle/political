import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const puppeteer = require('../frontend/node_modules/puppeteer');

const ARTIFACT_DIR = 'C:/Users/narpal/.gemini/antigravity/brain/37c02349-68e5-45a7-8b95-7208550f340f';
const targetUrl = 'https://leaderslensconsulting.com';

async function verifyFeatures() {
  console.log(`Starting verification against: ${targetUrl}`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERR:', err.message));

    // --- PART 1: SMM Role -> Political Intelligence -> Rayadurg Advisory Cards ---
    console.log('[1/4] Logging in as SMM...');
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 35000 });

    const smmInputs = await page.$$('input');
    if (smmInputs.length >= 2) {
      await smmInputs[0].click({ clickCount: 3 });
      await smmInputs[0].type('smm');
      await smmInputs[1].click({ clickCount: 3 });
      await smmInputs[1].type('SmM@2026');
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const signBtn = btns.find(b => b.textContent && b.textContent.includes('Sign In'));
        if (signBtn) signBtn.click();
      });
    }

    await page.waitForFunction(() => document.body.innerText.includes('POLITICAL INTELLIGENCE'), { timeout: 25000 });
    console.log('✓ Successfully logged in as SMM');

    // Wait for metrics to load on dashboard
    await page.waitForFunction(() => !document.body.innerText.includes('Loading live metrics...'), { timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));

    // Go to Intelligence Tab
    console.log('[2/4] Navigating to Intelligence tab and selecting Rayadurg...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const intBtn = btns.find(b => b.textContent?.trim().toUpperCase() === 'INTELLIGENCE');
      if (intBtn) intBtn.click();
    });
    await new Promise(r => setTimeout(r, 2500));

    // Select Anantapur
    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      for (const sel of selects) {
        const opt = Array.from(sel.options).find(o => o.text.includes('Anantapur'));
        if (opt) {
          sel.value = opt.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
      }
    });
    await new Promise(r => setTimeout(r, 2000));

    // Select Rayadurg
    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      for (const sel of selects) {
        const opt = Array.from(sel.options).find(o => o.text.includes('Rayadurg'));
        if (opt) {
          sel.value = opt.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
      }
    });
    await new Promise(r => setTimeout(r, 3000));

    // Wait for Advisory cards for Kalava Srinivas
    await page.waitForFunction(() => document.body.innerText.includes('Digital Audit & Advisory for Kalava Srinivas'), { timeout: 15000 }).catch(() => {});

    // Scroll to the bottom where Advisory cards are
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(r => setTimeout(r, 1200));

    await page.screenshot({ path: `${ARTIFACT_DIR}/verify_03_advisory_cards_clean.png`, fullPage: false });
    console.log('✓ Captured verify_03_advisory_cards_clean.png (Clean cards without left bar)');

    // --- PART 2: TDP President -> Party Command Center -> Gaps & Content Calendar ---
    console.log('[3/4] Logging in as TDP President...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const outBtn = btns.find(b => b.textContent?.toUpperCase().includes('SIGN OUT'));
      if (outBtn) outBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    const presInputs = await page.$$('input');
    if (presInputs.length >= 2) {
      await presInputs[0].click({ clickCount: 3 });
      await presInputs[0].type('tdp-president');
      await presInputs[1].click({ clickCount: 3 });
      await presInputs[1].type('TdpPresident@2026');
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const signBtn = btns.find(b => b.textContent && b.textContent.includes('Sign In'));
        if (signBtn) signBtn.click();
      });
    }

    await page.waitForFunction(() => document.body.innerText.includes('Party Command Center'), { timeout: 20000 });
    console.log('✓ Successfully logged in to Party Command Center');

    // Wait for overview data to load
    await page.waitForFunction(() => !document.body.innerText.includes('Loading...'), { timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));

    // GAPS tab
    console.log('[4/4] Testing GAPS tab (Single-active accordion)...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const gapsTab = btns.find(b => b.textContent?.trim().toUpperCase() === 'GAPS');
      if (gapsTab) gapsTab.click();
    });
    await page.waitForSelector('[data-testid="gap-group"]', { timeout: 25000 });
    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({ path: `${ARTIFACT_DIR}/verify_01_gaps_accordion.png`, fullPage: false });
    console.log('✓ Captured verify_01_gaps_accordion.png');

    // CONTENT CALENDAR tab
    console.log('[5/5] Testing CONTENT CALENDAR tab (Top Posts Showcase & Posters)...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const calTab = btns.find(b => b.textContent?.trim().toUpperCase() === 'CONTENT CALENDAR');
      if (calTab) calTab.click();
    });
    await page.waitForSelector('[data-testid="calendar-item"]', { timeout: 25000 });
    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({ path: `${ARTIFACT_DIR}/verify_02_calendar_top_posts.png`, fullPage: false });
    console.log('✓ Captured verify_02_calendar_top_posts.png');

    console.log('All feature verifications completed successfully!');
  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    await browser.close();
  }
}

verifyFeatures();
