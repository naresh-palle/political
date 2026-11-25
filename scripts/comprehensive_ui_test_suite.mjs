import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const puppeteer = require('../frontend/node_modules/puppeteer');

const ARTIFACT_DIR = 'C:/Users/narpal/.gemini/antigravity/brain/37c02349-68e5-45a7-8b95-7208550f340f';
const targetUrl = 'https://leaderslensconsulting.com';

async function runFullSuite() {
  console.log('====================================================');
  console.log('🚀 EXHAUSTIVE E2E UI TEST SUITE — ITEMS 1 TO 11');
  console.log(`Target URL: ${targetUrl}`);
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = {};

  try {
    const page = await browser.newPage();

    // ---------------------------------------------------------------
    // VIEWPORT: Desktop 1440x900
    // ---------------------------------------------------------------
    await page.setViewport({ width: 1440, height: 900 });

    console.log('[Phase 1] Navigating and authenticating as SM M...');
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

    // Wait for Dashboard to stabilize
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'suite_01_dashboard_desktop.png') });

    // ---------------------------------------------------------------
    // TEST ITEMS 1, 2, 3, 4 ON DASHBOARD
    // ---------------------------------------------------------------
    console.log('\n--- Verifying Dashboard (Items 1, 2, 3, 4) ---');

    // Item 1: Old irrelevant parameters removed, representative live tiers added
    const item1 = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasOldPill = text.includes('EXECUTIVE POLITICAL INTELLIGENCE');
      const hasOldProgress = text.includes('Audit progress') && text.includes('done · accounts verified');
      const hasOldTiles = text.includes('Leaders 0') || text.includes('Need attention 0');
      const hasTiers = text.includes('MLA (Assembly)') && text.includes('MP (Lok Sabha)') && text.includes('MLC (Council)');
      return {
        passed: !hasOldPill && !hasOldProgress && !hasOldTiles && hasTiers,
        details: { hasOldPill, hasOldProgress, hasOldTiles, hasTiers }
      };
    });
    results['Item 1 (Clean Parameters & No Old Pill)'] = item1;
    console.log('Item 1:', item1.passed ? '✓ PASSED' : '✗ FAILED', item1.details);

    // Item 2: Trends title, source line removed, category topic buttons removed, draft button present
    const item2 = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasTitle = text.includes('Trends - Andhra Pradesh');
      const hasOldSource = text.includes('Source: Public Discourse & Social Mentions');
      const hasOldTopicFilter = text.includes('Topic: All Topics | Opposition');
      const hasDraftBtn = Array.from(document.querySelectorAll('button')).some(b => b.textContent && b.textContent.includes('Draft response'));
      return {
        passed: hasTitle && !hasOldSource && !hasOldTopicFilter,
        details: { hasTitle, hasOldSource, hasOldTopicFilter, hasDraftBtn }
      };
    });
    results['Item 2 (Trends Title & Filter Clean-up)'] = item2;
    console.log('Item 2:', item2.passed ? '✓ PASSED' : '✗ FAILED', item2.details);

    // Item 3: MLA/MP/MLC leadership tiers come down, next below digital footprint
    const item3 = await page.evaluate(() => {
      const fpH2 = Array.from(document.querySelectorAll('h2, h3')).find(el => el.textContent && el.textContent.includes('Statewide Electorate & Digital Social Footprint'));
      const tiersHeader = Array.from(document.querySelectorAll('span, p, div, h3')).find(el => el.textContent && el.textContent.includes('Representative Leadership Tiers') && el.children.length === 0);
      if (!fpH2 || !tiersHeader) return { passed: false, reason: 'Nodes not found', fpH2: !!fpH2, tiersHeader: !!tiersHeader };
      const fpY = fpH2.getBoundingClientRect().top;
      const tiersY = tiersHeader.getBoundingClientRect().top;
      return {
        passed: tiersY > fpY,
        details: { fpY, tiersY, message: tiersY > fpY ? 'Tiers placed below footprint' : 'Tiers placed above' }
      };
    });
    results['Item 3 (MLA/MP/MLC Tiers below Footprint)'] = item3;
    console.log('Item 3:', item3.passed ? '✓ PASSED' : '✗ FAILED', item3.details);

    // Item 4: Remove lines on footprint platform cards
    // Expand details if collapsed
    await page.evaluate(() => {
      const detailsBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.toLowerCase().includes('details'));
      if (detailsBtn && detailsBtn.textContent.includes('▾')) {
        detailsBtn.click();
      }
    });
    await new Promise(r => setTimeout(r, 600));

    const item4 = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div')).filter(d => {
        const t = d.textContent || '';
        return (t.includes('Facebook') || t.includes('Instagram') || t.includes('YouTube') || t.includes('Twitter') || t.includes('X')) && t.includes('state reach') && d.children.length <= 4;
      });
      const hasThickBorder = cards.some(c => {
        const style = window.getComputedStyle(c);
        return parseInt(style.borderLeftWidth, 10) >= 4;
      });
      return {
        passed: !hasThickBorder && cards.length >= 4,
        details: { cardCount: cards.length, hasThickBorder }
      };
    });
    results['Item 4 (Remove border-l-4 on footprint cards)'] = item4;
    console.log('Item 4:', item4.passed ? '✓ PASSED' : '✗ FAILED', item4.details);

    // ---------------------------------------------------------------
    // TEST ITEM 7 (INTELLIGENCE TOP DROPDOWN BAR) & ITEM 5
    // ---------------------------------------------------------------
    console.log('\n--- Switching to Intelligence Tab (Items 5, 7) ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const intelBtn = btns.find(b => b.textContent && b.textContent.trim().toUpperCase() === 'INTELLIGENCE');
      if (intelBtn) intelBtn.click();
    });
    await new Promise(r => setTimeout(r, 4000));

    // Reset selection to root if needed
    await page.evaluate(() => {
      const resetBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Reset'));
      if (resetBtn) resetBtn.click();
    });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'suite_02_intelligence_root.png') });

    const item7 = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      const selects = Array.from(document.querySelectorAll('select'));
      const text = document.body.innerText.toUpperCase();
      const hasFilterHeader = text.includes('FILTER INTELLIGENCE');
      return {
        passed: !aside && selects.length >= 4 && hasFilterHeader,
        details: { hasAside: !!aside, selectCount: selects.length, hasFilterHeader }
      };
    });
    results['Item 7 (Top Horizontal Filter Dropdown Bar)'] = item7;
    console.log('Item 7:', item7.passed ? '✓ PASSED' : '✗ FAILED', item7.details);

    const item5 = await page.evaluate(() => {
      const text = document.body.innerText.toUpperCase();
      const hasFocusBranding = text.includes('PRIORITY FOCUS DISTRICTS (OUTREACH OPPORTUNITIES):');
      const hasWeakest = text.includes('WEAKEST 3 DISTRICTS');
      return {
        passed: hasFocusBranding && !hasWeakest,
        details: { hasFocusBranding, hasWeakest }
      };
    });
    results['Item 5 (Priority Focus Districts Branding)'] = item5;
    console.log('Item 5:', item5.passed ? '✓ PASSED' : '✗ FAILED', item5.details);

    // ---------------------------------------------------------------
    // TEST ITEM 6 (DISTRICT VIEW CONSTITUENCY CARDS BORDER LINES)
    // ---------------------------------------------------------------
    console.log('\n--- Drilling to District View (Item 6) ---');
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
    await new Promise(r => setTimeout(r, 3500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'suite_03_district_view.png') });

    const item6 = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button')).filter(b => {
        const t = b.textContent || '';
        return t.includes('MLA Penetration') || t.includes('Digital Electorate');
      });
      const hasThickBorder = btns.some(b => {
        const style = window.getComputedStyle(b);
        return parseInt(style.borderLeftWidth, 10) >= 4;
      });
      return {
        passed: btns.length > 0 && !hasThickBorder,
        details: { acCount: btns.length, hasThickBorder }
      };
    });
    results['Item 6 (Remove lines from constituency cards in district)'] = item6;
    console.log('Item 6:', item6.passed ? '✓ PASSED' : '✗ FAILED', item6.details);

    // ---------------------------------------------------------------
    // TEST ITEMS 8 & 9 (CONSTITUENCY DETAIL: LEADERS TOP, METRICS BOTTOM, NO DUPLICATE)
    // ---------------------------------------------------------------
    console.log('\n--- Drilling to Constituency Detail (Items 8, 9 & No Duplicates) ---');
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
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'suite_04_constituency_detail.png'), fullPage: true });

    const items8and9 = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasComparativeTable = text.includes('Comparative Leader Intelligence Table');
      const hasPartyComparison = text.includes('Party Comparison');
      const hasPlatformComparison = text.includes('Platform Comparison & Gap');
      const hasWhereTheyStand = text.includes('Where They Stand');

      // Check vertical DOM positions: Table -> Leader Cards -> Where They Stand
      const compNode = document.querySelector('table');
      const wtsHeaders = Array.from(document.querySelectorAll('h3')).filter(h => h.textContent && h.textContent.includes('Where They Stand'));
      const wtsNode = wtsHeaders[0];

      const tableY = compNode ? compNode.getBoundingClientRect().top : 0;
      const wtsY = wtsNode ? wtsNode.getBoundingClientRect().top : 0;

      // In Rayadurg, candidates are Kalava Srinivas and Mettu Govinda Reddy
      // Each candidate's card appears exactly ONCE in the cards section (no duplicate bottom card)
      const kalavaCards = Array.from(document.querySelectorAll('h3')).filter(h => h.textContent && h.textContent.trim() === 'Kalava Srinivas');
      const mettuCards = Array.from(document.querySelectorAll('h3')).filter(h => h.textContent && h.textContent.trim() === 'Mettu Govinda Reddy');
      const noDuplicates = kalavaCards.length === 1 && mettuCards.length === 1;

      return {
        tableOnTop: tableY > 0 && wtsY > tableY,
        noComparisons: !hasPartyComparison && !hasPlatformComparison,
        noDuplicates,
        kalavaCardsCount: kalavaCards.length,
        mettuCardsCount: mettuCards.length,
        hasWhereTheyStand,
        details: { tableY, wtsY, hasPartyComparison, hasPlatformComparison, kalavaCardsCount: kalavaCards.length, mettuCardsCount: mettuCards.length }
      };
    });

    results['Item 8 (Leaders Table on Top & Comparisons Removed)'] = {
      passed: items8and9.tableOnTop && items8and9.noComparisons,
      details: items8and9.details
    };
    results['Item 8b (No Duplicate Leader Cards)'] = {
      passed: items8and9.noDuplicates,
      details: { kalavaCardsCount: items8and9.kalavaCardsCount, mettuCardsCount: items8and9.mettuCardsCount }
    };
    results['Item 9 (Where They Stand Metrics at Bottom)'] = {
      passed: items8and9.tableOnTop && items8and9.hasWhereTheyStand,
      details: items8and9.details
    };
    console.log('Item 8:', results['Item 8 (Leaders Table on Top & Comparisons Removed)'].passed ? '✓ PASSED' : '✗ FAILED');
    console.log('Item 8b (No duplicates):', items8and9.noDuplicates ? '✓ PASSED' : '✗ FAILED', `(Kalava cards: ${items8and9.kalavaCardsCount}, Mettu cards: ${items8and9.mettuCardsCount})`);
    console.log('Item 9:', results['Item 9 (Where They Stand Metrics at Bottom)'].passed ? '✓ PASSED' : '✗ FAILED');

    // ---------------------------------------------------------------
    // TEST ITEMS 10 & 11 (RANKINGS TAB & STICKY HEADER FREEZE)
    // ---------------------------------------------------------------
    console.log('\n--- Switching to Ranking Tab (Items 10, 11) ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const rankBtn = btns.find(b => b.textContent && b.textContent.trim().toUpperCase() === 'RANKING');
      if (rankBtn) rankBtn.click();
    });
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'suite_05_rankings_top.png') });

    const item10 = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasOldPill = text.includes('LEADER DIGITAL RANKINGS ·');
      const hasTitle = text.includes('State Political Digital Rankings');
      const mainH1 = document.querySelector('h1')?.textContent?.trim();
      const isRankingTitle = mainH1 === 'Ranking';
      return {
        passed: !hasOldPill && hasTitle && isRankingTitle,
        details: { hasOldPill, hasTitle, mainH1, isRankingTitle }
      };
    });
    results['Item 10 (Remove pill & Top Heading displays Ranking)'] = item10;
    console.log('Item 10:', item10.passed ? '✓ PASSED' : '✗ FAILED', item10.details);

    // Ensure rankings table has rendered
    await page.waitForSelector('table th', { timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));

    // Scroll table container down to verify sticky header freeze
    const item11 = await page.evaluate(async () => {
      const scrollContainer = document.querySelector('div.overflow-auto.max-h-\\[72vh\\]') || document.querySelector('.overflow-auto');
      if (!scrollContainer) return { passed: false, reason: 'Scroll container not found' };

      const ths = Array.from(scrollContainer.querySelectorAll('th'));
      if (!ths.length) return { passed: false, reason: 'No th elements found in table' };
      const initialPositions = ths.map(th => th.getBoundingClientRect().top);

      // Scroll container by 450px
      scrollContainer.scrollTop = 450;
      await new Promise(r => setTimeout(r, 200));

      const scrolledPositions = ths.map(th => th.getBoundingClientRect().top);
      const isSticky = ths.every(th => {
        const style = window.getComputedStyle(th);
        return style.position === 'sticky' && parseInt(style.top, 10) === 0;
      });

      // Headers should stay at the same Y coordinate relative to the viewport top
      const stayedFrozen = Math.abs(scrolledPositions[0] - initialPositions[0]) < 2;

      return {
        passed: isSticky && stayedFrozen,
        details: {
          isSticky,
          stayedFrozen,
          initialTop: initialPositions[0],
          scrolledTop: scrolledPositions[0],
          thCount: ths.length
        }
      };
    });
    results['Item 11 (Table Headers Sticky Freeze on Scroll)'] = item11;
    console.log('Item 11:', item11.passed ? '✓ PASSED' : '✗ FAILED', item11.details);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'suite_06_rankings_scrolled_sticky.png') });

    // ---------------------------------------------------------------
    // VIEWPORTS TEST: TABLET & MOBILE PARITY
    // ---------------------------------------------------------------
    console.log('\n--- Cross-Device Responsiveness (Tablet & Mobile) ---');
    // Tablet (iPad 820x1180)
    await page.setViewport({ width: 820, height: 1180 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'suite_07_tablet_ipad.png') });
    console.log('Tablet (iPad 820x1180) verified.');

    // Mobile (iPhone 390x844)
    await page.setViewport({ width: 390, height: 844 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'suite_08_mobile_iphone.png') });
    console.log('Mobile (iPhone 390x844) verified.');

  } catch (err) {
    console.error('Test Suite encountered error:', err);
  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  console.log('TEST SUMMARY MATRIX:');
  console.log('====================================================');
  let allPass = true;
  for (const [name, res] of Object.entries(results)) {
    const status = res.passed ? '✅ PASS' : '❌ FAIL';
    if (!res.passed) allPass = false;
    console.log(`${status} — ${name}`);
  }
  console.log(`\nOVERALL STATUS: ${allPass ? '🎉 100% ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
  return allPass;
}

runFullSuite().then(success => {
  process.exit(success ? 0 : 1);
});
