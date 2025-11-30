#!/usr/bin/env node
/**
 * Deployment E2E Test Script for The Black Captain
 * Uses Playwright to verify the deployment is working correctly
 *
 * Can be run:
 * - Standalone: node tests/e2e/deployment.test.js
 * - With Playwright: pnpm test:e2e
 */

const { chromium } = require('playwright');

const PRODUCTION_URL = 'https://blackhoard.com';
const TIMEOUT = 30000;

async function testDeployment() {
  console.log('\n🧪 Testing deployment...\n');

  let browser;
  let success = true;
  const errors = [];

  try {
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });

    const page = await context.newPage();

    // Navigate to production URL
    console.log(`📍 Navigating to ${PRODUCTION_URL}...`);
    const response = await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: TIMEOUT,
    });

    // Check HTTP status
    if (response.status() !== 200) {
      errors.push(`❌ HTTP status ${response.status()} (expected 200)`);
      success = false;
    } else {
      console.log('✓ HTTP status: 200 OK');
    }

    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    console.log('✓ Page loaded');

    // Check page title
    const title = await page.title();
    if (!title || title.trim() === '') {
      errors.push('❌ Page title is empty');
      success = false;
    } else {
      console.log(`✓ Page title: "${title}"`);
    }

    // Check for main content
    const bodyText = await page.textContent('body');
    if (!bodyText || bodyText.trim() === '') {
      errors.push('❌ Page body is empty');
      success = false;
    } else {
      console.log(`✓ Page has content (${bodyText.length} characters)`);
    }

    // Check for specific content
    const hasBlackCaptain =
      bodyText.includes('Black Captain') || title.includes('Black Captain');
    if (!hasBlackCaptain) {
      errors.push('⚠ Warning: "Black Captain" not found in page content or title');
    } else {
      console.log('✓ Found "Black Captain" in page');
    }

    // Take screenshot
    const screenshotPath = './deployment-test-screenshot.png';
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });
    console.log(`✓ Screenshot saved: ${screenshotPath}`);

    // Check for JavaScript errors
    const jsErrors = [];
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });

    await page.waitForTimeout(2000);

    if (jsErrors.length > 0) {
      errors.push(`⚠ JavaScript errors detected:\n  ${jsErrors.join('\n  ')}`);
    } else {
      console.log('✓ No JavaScript errors detected');
    }
  } catch (error) {
    errors.push(`❌ Test failed: ${error.message}`);
    success = false;
  } finally {
    if (browser) {
      await browser.close();
      console.log('✓ Browser closed');
    }
  }

  // Print results
  console.log('\n' + '='.repeat(60));
  if (success && errors.length === 0) {
    console.log('✅ Deployment test PASSED! All checks successful.');
  } else if (errors.some((e) => e.includes('❌'))) {
    console.log('❌ Deployment test FAILED!');
    console.log('\nErrors:');
    errors.forEach((err) => console.log(`  ${err}`));
  } else {
    console.log('⚠️  Deployment test passed with warnings:');
    errors.forEach((err) => console.log(`  ${err}`));
  }
  console.log('='.repeat(60) + '\n');

  process.exit(success && !errors.some((e) => e.includes('❌')) ? 0 : 1);
}

// Run the test
testDeployment();
