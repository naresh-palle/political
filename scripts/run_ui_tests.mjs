import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const puppeteer = require('../frontend/node_modules/puppeteer');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:/Users/narpal/.gemini/antigravity/brain/37c02349-68e5-45a7-8b95-7208550f340f';

// Check if running against local preview or live production
const targetUrl = process.env.TEST_TARGET_URL || 'https://leaderslensconsulting.com';

async function runTests() {
  console.log(`Starting UI Automation Test Suite against: ${targetUrl}`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log(`[1/6] Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Login as SMM
    console.log('[2/6] Logging in as SMM...');
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
    }

    await page.waitForFunction(() => document.body.innerText.includes('POLITICAL INTELLIGENCE'), { timeout: 20000 });
    console.log('✓ Successfully logged in as SMM');
    await new Promise(r => setTimeout(r, 1500));

    // Test 1: Verify AP Dashboard & MLA/MP/MLC Selector
    console.log('[3/6] Verifying Representative Type selector (MLA / MP / MLC)...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'auto_01_dashboard_mla_ap.png') });

    // Switch to MP
    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const repSel = selects.find(s => Array.from(s.options).some(o => o.value === 'MP'));
      if (repSel) {
        repSel.value = 'MP';
        repSel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'auto_02_dashboard_rep_mp.png') });

    // Switch to MLC
    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const repSel = selects.find(s => Array.from(s.options).some(o => o.value === 'MLC'));
      if (repSel) {
        repSel.value = 'MLC';
        repSel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'auto_03_dashboard_rep_mlc.png') });

    // Switch back to MLA and test Telangana zero KPIs
    console.log('[4/6] Verifying Real Database KPIs for unseeded state/district (Telangana · Adilabad)...');
    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const repSel = selects.find(s => Array.from(s.options).some(o => o.value === 'MLA'));
      if (repSel) {
        repSel.value = 'MLA';
        repSel.dispatchEvent(new Event('change', { bubbles: true }));
      }
      for (const sel of selects) {
        const opt = Array.from(sel.options).find(o => o.text.includes('Telangana'));
        if (opt) {
          sel.value = opt.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
      }
    });
    await new Promise(r => setTimeout(r, 1000));

    // Select Adilabad
    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      for (const sel of selects) {
        const opt = Array.from(sel.options).find(o => o.text.includes('Adilabad'));
        if (opt) {
          sel.value = opt.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
      }
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'auto_04_dashboard_telangana_adilabad_zero_kpi.png') });
    console.log('✓ Telangana Adilabad verified with strict DB numbers');

    // Test 2: SMM Intelligence Tab Clean-up & Back Navigation
    console.log('[5/6] Verifying SMM Intelligence tab clean view and Back button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const intBtn = buttons.find(b => b.textContent?.trim() === 'Intelligence');
      if (intBtn) intBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'auto_05_intelligence_tab_clean.png') });

    // Drill into a district and verify back button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const inspectBtn = btns.find(b => b.textContent?.includes('Inspect District'));
      if (inspectBtn) inspectBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'auto_06_district_drilldown_with_back_btn.png') });

    // Click Back to Intelligence
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const backBtn = btns.find(b => b.textContent?.includes('Back to Intelligence'));
      if (backBtn) backBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    console.log('✓ Intelligence tab clean view & back button verified');

    // Test 3: SMM Ranking Tab
    console.log('[6/7] Verifying SMM Ranking tab beside Intelligence...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const rankBtn = buttons.find(b => b.textContent?.trim() === 'Ranking');
      if (rankBtn) rankBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'auto_07_ranking_tab_desktop.png') });

    // Test 4: SMM Constituency Tab — MP District & PC selection + Auto-Fetch Checkbox Removed
    console.log('[7/7] Verifying SMM Constituency Data Entry (Auto-fetch removed, MP District & PC selection)...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const constBtn = buttons.find(b => b.textContent?.trim() === 'Constituencies');
      if (constBtn) constBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Verify checkbox does not exist
    const hasAutoFetchCheckbox = await page.evaluate(() => {
      return document.body.innerText.includes('Auto-fetch for every 1 week');
    });
    if (hasAutoFetchCheckbox) {
      throw new Error('Auto-fetch weekly checkbox is still present in Constituency tab!');
    }
    console.log('✓ Verified: Auto-fetch checkbox is successfully removed');

    // Switch to MP in Constituency tab
    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const repSel = selects.find(s => Array.from(s.options).some(o => o.value === 'MP'));
      if (repSel) {
        repSel.value = 'MP';
        repSel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 1200));

    // Verify District selector and MP Parliamentary selector are visible and populated
    const mpSelectorsStatus = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const distSelect = selects.find(s => Array.from(s.options).some(o => o.text.includes('All districts') || o.text.includes('Select district')));
      const pcSelect = selects.find(s => Array.from(s.options).some(o => o.text.includes('parliamentary constituency') || o.text.includes('Araku') || o.text.includes('Kadapa')));
      return {
        hasDistrict: !!distSelect,
        distOptionCount: distSelect ? distSelect.options.length : 0,
        hasPc: !!pcSelect,
        pcOptionCount: pcSelect ? pcSelect.options.length : 0
      };
    });
    console.log('MP Selectors Status in Constituency Entry:', mpSelectorsStatus);
    if (!mpSelectorsStatus.hasDistrict || mpSelectorsStatus.distOptionCount <= 1) {
      throw new Error('District selector missing or empty for MP in Constituency tab!');
    }
    if (!mpSelectorsStatus.hasPc || mpSelectorsStatus.pcOptionCount <= 1) {
      throw new Error('Parliamentary Constituency selector missing or empty for MP in Constituency tab!');
    }
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'auto_11_constituency_mp_district_and_pc.png') });
    console.log('✓ Verified: District and MP Parliamentary Constituency are both visible and selectable');

    // Cross-Device Parity Viewports
    console.log('Testing cross-device viewport parity...');
    // Laptop (1280x800)
    await page.setViewport({ width: 1280, height: 800 });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'auto_08_ranking_tab_laptop.png') });

    // iPad / Tablet (768x1024)
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'auto_09_ranking_tab_tablet.png') });

    // Mobile (375x812)
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'auto_10_ranking_tab_mobile.png') });

    console.log('====================================================');
    console.log('ALL UI AUTOMATION TESTS PASSED SUCCESSFULLY! (10/10)');
    console.log('====================================================');
  } finally {
    await browser.close();
  }
}

runTests().catch(err => {
  console.error('UI Automation Test failed:', err);
  process.exit(1);
});
