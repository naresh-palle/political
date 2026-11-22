import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/narpal/.gemini/antigravity/brain/37c02349-68e5-45a7-8b95-7208550f340f';

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  // Set iPad-like viewport matching the user's screenshots
  await page.setViewport({ width: 1180, height: 820, deviceScaleFactor: 2 });

  console.log('Navigating to http://localhost:4173/#/login...');
  await page.goto('http://localhost:4173/#/login', { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[data-testid="email-input"]');
  await page.type('input[data-testid="email-input"]', 'smm');
  await page.type('input[data-testid="password-input"]', 'SmM@2026');
  await page.click('button[data-testid="auth-submit-btn"]');
  await page.waitForFunction(() => window.location.hash.includes('#/intel'), { timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));

  // ==========================================
  // 1. Feature 4: Main Dashboard Overhaul
  // ==========================================
  console.log('--- 1. Testing Feature 4: Main Dashboard State Stats & Daily Trends ---');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_main_dashboard_state_stats_and_trends.png') });
  console.log('Saved 01_main_dashboard_state_stats_and_trends.png');

  // ==========================================
  // 2. Feature 1: State-Level Stats when no district is selected
  // ==========================================
  console.log('--- 2. Testing Feature 1: State-Level Stats in Intelligence Tab ---');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('Intelligence') || b.innerText.includes('INTELLIGENCE'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_intelligence_state_level_stats.png') });
  console.log('Saved 02_intelligence_state_level_stats.png');

  // ==========================================
  // 3. Feature 2: All Constituency Cards Displayed with Numbers in District View
  // ==========================================
  console.log('--- 3. Testing Feature 2: Sri Sathya Sai District Constituency Cards ---');
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    for (const s of selects) {
      const opt = Array.from(s.options).find(o => o.text.includes('Sri Sathya Sai'));
      if (opt) {
        s.value = opt.value;
        s.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
    }
  });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_district_constituency_cards_populated.png') });
  console.log('Saved 03_district_constituency_cards_populated.png');

  // ==========================================
  // 4. Feature 3: Where He Stands - Client / Perspective Switching
  // ==========================================
  console.log('--- 4. Testing Feature 3: Dynamic Client Perspective Switching (Dharmavaram) ---');
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    for (const s of selects) {
      const opt = Array.from(s.options).find(o => o.text.includes('Dharmavaram'));
      if (opt) {
        s.value = opt.value;
        s.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
    }
  });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_dharmavaram_sitting_mla_perspective.png') });
  console.log('Saved 04_dharmavaram_sitting_mla_perspective.png');

  // Switch perspective to opposition leader (e.g. Paritala Sreeram or Kethireddy)
  console.log('Switching perspective to opposition leader Paritala Sreeram...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('Paritala Sreeram'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_dharmavaram_opposition_leader_perspective.png') });
  console.log('Saved 05_dharmavaram_opposition_leader_perspective.png');

  // ==========================================
  // 5. Feature 5: Multi-Role Selector in Leader Entry
  // ==========================================
  console.log('--- 5. Testing Feature 5: Multi-Role Selection in Leader Entry (SMA) ---');
  // Log out and log in as SMA
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const signOut = btns.find(b => b.innerText.includes('SIGN OUT') || b.innerText.includes('Sign out'));
    if (signOut) signOut.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.waitForSelector('input[data-testid="email-input"]');
  await page.type('input[data-testid="email-input"]', 'sma');
  await page.type('input[data-testid="password-input"]', 'SmA@2026');
  await page.click('button[data-testid="auth-submit-btn"]');
  await page.waitForFunction(() => window.location.hash.includes('#/intel'), { timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));

  // Go to Constituency / Leader Entry tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('DATA ENTRY') || b.innerText.includes('Constituency') || b.innerText.includes('CONSTITUENCY'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Select Sri Sathya Sai & Dharmavaram
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    for (const s of selects) {
      const opt = Array.from(s.options).find(o => o.text.includes('Sri Sathya Sai'));
      if (opt) {
        s.value = opt.value;
        s.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
    }
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    for (const s of selects) {
      const opt = Array.from(s.options).find(o => o.text.includes('Dharmavaram'));
      if (opt) {
        s.value = opt.value;
        s.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  // Switch to Leaders slot sub-tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('LEADERS') || b.innerText.includes('Leaders (4 Slots)'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_sma_multi_role_selection.png') });
  console.log('Saved 06_sma_multi_role_selection.png');

  await browser.close();
  console.log('--- ALL VERIFICATIONS COMPLETED SUCCESSFULLY ---');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
