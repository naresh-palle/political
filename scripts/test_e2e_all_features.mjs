import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const puppeteer = require('../frontend/node_modules/puppeteer');

const ARTIFACT_DIR = 'C:/Users/narpal/.gemini/antigravity/brain/37c02349-68e5-45a7-8b95-7208550f340f';
const targetUrl = 'https://leaderslensconsulting.com';

async function runE2ETest() {
  console.log(`Starting Comprehensive E2E Test against: ${targetUrl}`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('BROWSER CONSOLE ERROR:', msg.text());
      }
    });

    console.log('[Step 1] Navigating and logging in...');
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 45000 });

    const inputs = await page.$$('input');
    if (inputs.length >= 2) {
      await inputs[0].click({ clickCount: 3 });
      await inputs[0].type('smm');
      await inputs[1].click({ clickCount: 3 });
      await inputs[1].type('SmM@2026');
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const signBtn = btns.find(b => b.textContent && b.textContent.includes('Sign In'));
        if (signBtn) signBtn.click();
      });
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 25000 }).catch(() => {});
    }

    console.log('[Step 2] Verifying Dashboard Tab...');
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_01_dashboard.png'), fullPage: false });

    // Extract Dashboard state
    const dashInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasTrendsTitle: text.includes('Trends - Andhra Pradesh'),
        hasOldSourceLine: text.includes('Source: Public Discourse'),
        hasOldPill: text.includes('EXECUTIVE POLITICAL INTELLIGENCE'),
        hasFootprintTop: text.includes('Statewide Electorate & Digital Social Footprint'),
        hasRepTiers: text.includes('Representative Leadership Tiers'),
      };
    });
    console.log('Dashboard checks:', dashInfo);

    console.log('[Step 3] Switching to Intelligence Tab...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const intelBtn = btns.find(b => b.textContent && b.textContent.trim().toUpperCase() === 'INTELLIGENCE');
      if (intelBtn) intelBtn.click();
    });
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_02_intelligence_tab.png'), fullPage: false });

    const intelInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      const selects = Array.from(document.querySelectorAll('select')).map(s => s.value);
      return {
        selectCount: selects.length,
        hasFilterBar: text.includes('Filter Intelligence'),
        hasDistLeaderboard: text.includes('District Digital Penetration Leaderboard'),
        hasPriorityFocus: text.includes('Priority Focus Districts'),
        hasWeakestDistricts: text.includes('Weakest 3 Districts'),
      };
    });
    console.log('Intelligence root checks:', intelInfo);

    console.log('[Step 4] Drilling down into District Anantapur and Constituency Rayadurg...');
    await page.evaluate(() => {
      // Find district select or table row for Anantapur
      const selects = Array.from(document.querySelectorAll('select'));
      // Find district select
      for (const sel of selects) {
        const opt = Array.from(sel.options).find(o => o.text.includes('Anantapur'));
        if (opt) {
          sel.value = opt.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
      }
    });
    await new Promise(r => setTimeout(r, 3000));

    // Now select constituency Rayadurg
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
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_03_constituency_rayadurg.png'), fullPage: true });

    const constInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasComparativeTable: text.includes('Comparative Leader Intelligence Table'),
        hasKalava: text.includes('Kalava Srinivas'),
        hasMettu: text.includes('Mettu Govinda Reddy'),
        hasWhereTheyStand: text.includes('Where They Stand'),
        hasPartyComparison: text.includes('Party Comparison'),
        hasPlatformComparison: text.includes('Platform Comparison & Gap'),
      };
    });
    console.log('Constituency detail checks:', constInfo);

    console.log('[Step 5] Switching to Ranking Tab...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const rankBtn = btns.find(b => b.textContent && b.textContent.trim().toUpperCase() === 'RANKING');
      if (rankBtn) rankBtn.click();
    });
    await new Promise(r => setTimeout(r, 6000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_04_ranking_tab.png'), fullPage: true });

    const rankInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      const rows = document.querySelectorAll('tbody tr').length;
      return {
        tableRows: rows,
        hasStateRankingsTitle: text.includes('State Political Digital Rankings'),
        hasOldPill: text.includes('LEADER DIGITAL RANKINGS ·'),
        hasAwaitingData: text.includes('Awaiting data'),
        hasNaraLokesh: text.includes('Nara Lokesh'),
      };
    });
    console.log('Ranking tab checks:', rankInfo);

  } catch (err) {
    console.error('E2E Test Error:', err);
  } finally {
    await browser.close();
    console.log('E2E Test completed.');
  }
}

runE2ETest();
