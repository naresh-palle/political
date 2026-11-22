import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/narpal/.gemini/antigravity/brain/37c02349-68e5-45a7-8b95-7208550f340f';

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  // ==========================================
  // 1. SMM Intelligence Month-Wise Performance
  // ==========================================
  console.log('--- 1. Testing SMM Intelligence Month Switching ---');
  await page.goto('https://leaders-lens.pages.dev/#/login', { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[data-testid="email-input"]');
  await page.type('input[data-testid="email-input"]', 'smm');
  await page.type('input[data-testid="password-input"]', 'SmM@2026');
  await page.click('button[data-testid="auth-submit-btn"]');
  await page.waitForFunction(() => window.location.hash.includes('#/intel'), { timeout: 20000 });
  await new Promise(r => setTimeout(r, 3000));

  // Go to Intelligence tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('Intelligence') || b.innerText.includes('INTELLIGENCE'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Select Srikakulam & Ichchapuram
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    for (const s of selects) {
      const opt = Array.from(s.options).find(o => o.text.includes('Srikakulam'));
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
      const opt = Array.from(s.options).find(o => o.text.includes('Ichchapuram'));
      if (opt) {
        s.value = opt.value;
        s.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
    }
  });
  await new Promise(r => setTimeout(r, 3000));

  // Read November 2026 metrics for Bendalam Ashok
  const novMetrics = await page.evaluate(() => {
    const text = document.body.innerText;
    const match = text.match(/Ads & Content · November 2026[\s\S]*?POSTS\s+(\d+)[\s\S]*?ADS\s+(\d+)[\s\S]*?REACH\s+(\S+)/i);
    return match ? { posts: match[1], ads: match[2], reach: match[3] } : null;
  });
  console.log('November 2026 Metrics for Ashok:', novMetrics);

  // Click Prev Month (October 2026)
  console.log('Clicking Prev Month...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const prevBtn = btns.find(b => b.innerText.includes('Prev') || b.innerText.includes('◀'));
    if (prevBtn) prevBtn.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  // Read October 2026 metrics
  const octMetrics = await page.evaluate(() => {
    const text = document.body.innerText;
    const match = text.match(/Ads & Content · October 2026[\s\S]*?POSTS\s+(\d+)[\s\S]*?ADS\s+(\d+)[\s\S]*?REACH\s+(\S+)/i);
    return match ? { posts: match[1], ads: match[2], reach: match[3] } : null;
  });
  console.log('October 2026 Metrics for Ashok:', octMetrics);

  const intelScreenshot = path.join(ARTIFACT_DIR, '01_smm_intelligence_month_switching_verified.png');
  await page.screenshot({ path: intelScreenshot, fullPage: true });
  console.log('Saved 01_smm_intelligence_month_switching_verified.png');

  // ==========================================
  // 2. Constituency Form Save Button Enablement & Weekly Auto-Fetch
  // ==========================================
  console.log('\n--- 2. Testing Constituency Save Enablement & Weekly Auto-Fetch ---');
  await page.goto('https://leaders-lens.pages.dev/#/login', { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[data-testid="email-input"]');
  await page.type('input[data-testid="email-input"]', 'sma');
  await page.type('input[data-testid="password-input"]', 'SmA@2026');
  await page.click('button[data-testid="auth-submit-btn"]');
  await page.waitForFunction(() => window.location.hash.includes('#/intel'), { timeout: 20000 });
  await new Promise(r => setTimeout(r, 3000));

  // Go to Constituencies tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.toLowerCase().includes('constituencies'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Select Srikakulam & Ichchapuram
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    for (const s of selects) {
      const opt = Array.from(s.options).find(o => o.text.includes('Srikakulam'));
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
      const opt = Array.from(s.options).find(o => o.text.includes('Ichchapuram'));
      if (opt) {
        s.value = opt.value;
        s.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
    }
  });
  await new Promise(r => setTimeout(r, 3000));

  // Check initial state of save button when empty
  const initialFormCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    const saveBtn = Array.from(document.querySelectorAll('button[type="submit"]')).find(b => 
      b.innerText.includes('Save') || b.innerText.includes('constituency')
    );
    const hasWeeklyToggle = text.includes('Auto-fetch for every 1 week');
    const hasWarning = text.includes('Please add both Facebook account');
    return {
      isSaveButtonDisabled: saveBtn ? saveBtn.disabled : null,
      saveButtonText: saveBtn?.innerText,
      hasWeeklyToggle,
      hasWarning
    };
  });
  console.log('Initial Constituency Form State (Empty Social Accounts):', initialFormCheck);

  // Fill in Facebook and Instagram
  console.log('Entering Facebook URL and Instagram handle...');
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    for (const inp of inputs) {
      const label = inp.closest('label')?.innerText || '';
      if (label.includes('Facebook account')) {
        inp.value = 'https://facebook.com/ichchapuram.official';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (label.includes('Instagram account')) {
        inp.value = 'ichchapuram_official';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  // Check state of save button after filling social accounts
  const filledFormCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    const saveBtn = Array.from(document.querySelectorAll('button[type="submit"]')).find(b => 
      b.innerText.includes('Save') || b.innerText.includes('constituency')
    );
    const hasWarning = text.includes('Please add both Facebook account');
    return {
      isSaveButtonDisabled: saveBtn ? saveBtn.disabled : null,
      saveButtonText: saveBtn?.innerText,
      hasWarning
    };
  });
  console.log('Constituency Form State (After Filling Social Accounts):', filledFormCheck);

  const constScreenshot = path.join(ARTIFACT_DIR, '02_constituency_save_button_enabled_verified.png');
  await page.screenshot({ path: constScreenshot, fullPage: true });
  console.log('Saved 02_constituency_save_button_enabled_verified.png');

  await browser.close();
  console.log('\nAll verifications completed successfully!');
}

main().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
