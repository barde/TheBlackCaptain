#!/usr/bin/env node
/**
 * Story Accessibility E2E Test Script
 * Verifies that stories are accessible on the live site
 *
 * Can be run:
 * - Standalone: node tests/e2e/story.test.js
 * - With Playwright: pnpm test:e2e
 */

const { chromium } = require('playwright');

const PRODUCTION_URL = 'https://blackhoard.com';

async function testStory() {
  console.log('\n🧪 Testing story accessibility...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Test homepage
    console.log('📍 Testing homepage (blackhoard.com)...');
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });

    const title = await page.title();
    console.log(`✓ Page title: "${title}"`);

    // Check if latest story content is visible
    const homepageContent = await page.content();
    const h1 = await page.$eval('h1', (el) => el.textContent).catch(() => 'No h1 found');
    console.log(`✓ Homepage h1: "${h1}"`);

    // Test archive page
    console.log('\n📍 Testing archive page...');
    await page.goto(`${PRODUCTION_URL}/archive.html`, { waitUntil: 'networkidle' });

    const archiveTitle = await page.title();
    console.log(`✓ Archive page title: "${archiveTitle}"`);

    const archiveContent = await page.content();
    const hasArchiveList = archiveContent.includes('archive-list');
    if (hasArchiveList) {
      console.log('✓ Archive list found');
    } else {
      console.log('✗ WARNING: Archive list not found');
    }

    // Count archive entries
    const archiveLinks = await page.$$('.archive-list a');
    console.log(`✓ Found ${archiveLinks.length} stories in archive`);

    // Test navigation
    console.log('\n📍 Testing navigation...');
    const navLinks = await page.$$('.nav-links a');
    console.log(`✓ Found ${navLinks.length} navigation links`);

    // Test treasure trove section
    console.log('\n📍 Testing Treasure Trove section...');
    await page.goto(`${PRODUCTION_URL}/treasure-trove.html`, { waitUntil: 'networkidle' });
    const ttTitle = await page.title();
    console.log(`✓ Treasure Trove page title: "${ttTitle}"`);

    // Test avian studies section
    console.log('\n📍 Testing Avian Studies section...');
    await page.goto(`${PRODUCTION_URL}/avian-studies.html`, { waitUntil: 'networkidle' });
    const asTitle = await page.title();
    console.log(`✓ Avian Studies page title: "${asTitle}"`);

    // Take screenshot of homepage
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: './homepage-check.png', fullPage: true });
    console.log('\n✓ Screenshot saved: ./homepage-check.png');

    console.log('\n============================================================');
    console.log('✅ Story accessibility test complete!');
    console.log('============================================================\n');
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testStory();
