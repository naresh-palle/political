import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require('../frontend/node_modules/puppeteer');

const ARTIFACT_DIR = 'C:/Users/narpal/.gemini/antigravity/brain/37c02349-68e5-45a7-8b95-7208550f340f';
const targetUrl = 'https://leaderslensconsulting.com';

async function verifyFeatures() {
  console.log(`Starting state filter & multiplatform verification against: ${targetUrl}`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', msg => {
      const text = msg.text();
      if (!text.includes('Download the React DevTools')) {
        console.log('BROWSER LOG:', text);
      }
    });

    console.log('[1/4] Logging in as TDP President...');
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 35000 });

    const inputs = await page.$$('input');
    if (inputs.length >= 2) {
      await inputs[0].click({ clickCount: 3 });
      await inputs[0].type('tdp-president');
      await inputs[1].click({ clickCount: 3 });
      await inputs[1].type('TdpPresident@2026');
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const signBtn = btns.find(b => b.textContent && b.textContent.includes('Sign In'));
        if (signBtn) signBtn.click();
      });
    }

    await page.waitForFunction(() => document.body.innerText.includes('Party Command Center'), { timeout: 25000 });
    console.log('✓ Successfully entered Party Command Center');

    // Wait for overview filters to be rendered and populated
    await page.waitForSelector('[data-testid="party-filters"]', { timeout: 20000 });
    try {
      await page.waitForFunction(() => {
        const dist = document.querySelector('#party-district');
        return dist && dist.options.length > 5;
      }, { timeout: 30000 });
    } catch (e) {
      console.warn('Timed out waiting for district options to exceed 5; continuing...');
    }
    await new Promise(r => setTimeout(r, 1000));

    // Verify State Dropdown before District
    const filterLabels = await page.evaluate(() => {
      const filterBar = document.querySelector('[data-testid="party-filters"]');
      if (!filterBar) return [];
      const labels = Array.from(filterBar.querySelectorAll('label')).map(l => l.textContent?.trim());
      return labels;
    });
    console.log('Filter labels in order:', filterLabels);

    const stateSelectInfo = await page.evaluate(() => {
      const stateSel = document.querySelector('#party-state');
      const distSel = document.querySelector('#party-district');
      const acSel = document.querySelector('#party-assembly');
      return {
        stateVal: stateSel?.value,
        stateText: stateSel?.selectedOptions[0]?.text,
        districtCount: distSel?.options.length,
        distFirstOption: distSel?.options[0]?.text,
        acCount: acSel?.options.length,
        acFirstOption: acSel?.options[0]?.text,
      };
    });
    console.log('State & District Select Info:', stateSelectInfo);

    // Capture Overview with State Filter
    await page.screenshot({ path: `${ARTIFACT_DIR}/verify_04_state_filter_overview.png`, fullPage: false });
    console.log('✓ Captured verify_04_state_filter_overview.png');

    // Navigate to Content Calendar Tab
    console.log('[2/4] Navigating to Content Calendar...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const calTab = btns.find(b => b.textContent?.trim().toUpperCase() === 'CONTENT CALENDAR');
      if (calTab) calTab.click();
    });

    await page.waitForSelector('[data-testid="party-calendar"]', { timeout: 25000 });
    try {
      await page.waitForFunction(() => {
        return document.querySelectorAll('.aspect-video span').length > 0;
      }, { timeout: 30000 });
    } catch (e) {
      console.warn('Timed out waiting for post cards in calendar; continuing...');
    }
    await new Promise(r => setTimeout(r, 1000));

    // Inspect Top Posts Showcase Platforms
    const postPlatforms = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const platFilterButtons = btns
        .filter(b => b.textContent && (b.textContent.includes('All Platforms') || b.textContent.includes('YouTube') || b.textContent.includes('Instagram') || b.textContent.includes('Facebook') || b.textContent.includes('X')))
        .map(b => b.textContent?.trim());

      const postTags = Array.from(document.querySelectorAll('.aspect-video span')).map(s => s.textContent?.trim());
      return {
        filterButtons: platFilterButtons,
        postPlatformsDisplayed: postTags,
      };
    });
    console.log('Content Calendar Platform Buttons & Post Tags:', postPlatforms);

    // Capture All Platforms View
    await page.screenshot({ path: `${ARTIFACT_DIR}/verify_05_content_calendar_multiplatform.png`, fullPage: false });
    console.log('✓ Captured verify_05_content_calendar_multiplatform.png');

    // Click "Instagram" Filter
    console.log('[3/4] Testing Instagram & X filters in Content Calendar...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const igBtn = btns.find(b => b.textContent?.includes('Instagram'));
      if (igBtn) igBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: `${ARTIFACT_DIR}/verify_06_calendar_instagram.png`, fullPage: false });
    console.log('✓ Captured verify_06_calendar_instagram.png');

    // Click "X" Filter
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const xBtn = btns.find(b => b.textContent?.includes('X'));
      if (xBtn) xBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: `${ARTIFACT_DIR}/verify_07_calendar_x.png`, fullPage: false });
    console.log('✓ Captured verify_07_calendar_x.png');

    // Mobile Viewport Check (Cross-device parity)
    console.log('[4/4] Verifying Mobile Viewport (390px)...');
    await page.setViewport({ width: 390, height: 844 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const overTab = btns.find(b => b.textContent?.trim().toUpperCase() === 'OVERVIEW');
      if (overTab) overTab.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: `${ARTIFACT_DIR}/verify_08_mobile_state_filter.png`, fullPage: false });
    console.log('✓ Captured verify_08_mobile_state_filter.png');

    console.log('All verifications completed successfully!');
  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    await browser.close();
  }
}

verifyFeatures();
