#!/usr/bin/env node

/**
 * Test translation UI functionality with browser automation
 */

const { chromium } = require('playwright');

const PRODUCTION_URL = 'https://blackhoard.com';

async function testTranslationUI() {
  console.log('\n🧪 Testing translation UI...\n');

  const browser = await chromium.launch({ headless: false }); // headless: false to see what's happening
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  page.on('console', msg => console.log(`   [Browser Console] ${msg.type()}: ${msg.text()}`));

  // Capture errors
  const errors = [];
  page.on('pageerror', error => {
    console.log(`   [Browser Error] ${error.message}`);
    errors.push(error);
  });

  try {
    console.log(`🌐 Navigating to ${PRODUCTION_URL}...`);
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    console.log('✓ Page loaded\n');

    // Wait a bit for page to fully render
    await page.waitForTimeout(2000);

    // Take screenshot of initial state
    await page.screenshot({ path: './translation-test-1-initial.png' });
    console.log('✓ Screenshot 1: Initial state\n');

    // Check if language toggle button exists
    console.log('🔍 Looking for language toggle button...');
    const langButton = await page.$('#lang-toggle');

    if (!langButton) {
      console.log('❌ Language toggle button not found!');
      await page.screenshot({ path: './translation-test-error.png' });

      // Debug: show what's in the navigation
      const navHTML = await page.$eval('.nav-links', el => el.innerHTML);
      console.log('\n📋 Navigation HTML:');
      console.log(navHTML);

      throw new Error('Language toggle button (#lang-toggle) not found');
    }

    console.log('✓ Language toggle button found\n');

    // Get initial button text
    const initialText = await langButton.textContent();
    console.log(`📝 Initial language button text: "${initialText}"`);

    // Get initial page content
    const initialContent = await page.$eval('.post-content', el => el.textContent.substring(0, 100));
    console.log(`📄 Initial content (first 100 chars): "${initialContent.trim()}"\n`);

    // Click the language button
    console.log('🖱️  Clicking language toggle button...');
    await langButton.click();

    // Wait for potential translation
    console.log('⏳ Waiting for translation (10 seconds)...');
    await page.waitForTimeout(10000);

    // Take screenshot after click
    await page.screenshot({ path: './translation-test-2-after-click.png' });
    console.log('✓ Screenshot 2: After clicking language toggle\n');

    // Check button text again
    const newButtonText = await page.$eval('#lang-toggle', el => el.textContent);
    console.log(`📝 New language button text: "${newButtonText}"`);

    // Check if content changed
    const newContent = await page.$eval('.post-content', el => el.textContent.substring(0, 100));
    console.log(`📄 New content (first 100 chars): "${newContent.trim()}"\n`);

    // Check if button is disabled (loading state)
    const isDisabled = await page.$eval('#lang-toggle', el => el.disabled);
    console.log(`🔒 Button disabled state: ${isDisabled}`);

    // Check network requests to /api/translate
    console.log('\n🌐 Checking network activity...');

    // Set up network monitoring and click again
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('/api/translate')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        });
      }
    });

    console.log('🖱️  Clicking language toggle button again...');
    await langButton.click();
    await page.waitForTimeout(10000);

    await page.screenshot({ path: './translation-test-3-second-click.png' });
    console.log('✓ Screenshot 3: After second click\n');

    // Check for translation API calls
    console.log(`\n📊 Translation API calls detected: ${requests.length}`);
    if (requests.length > 0) {
      requests.forEach((req, i) => {
        console.log(`\n   Request ${i + 1}:`);
        console.log(`   - URL: ${req.url}`);
        console.log(`   - Method: ${req.method}`);
        console.log(`   - Data: ${req.postData}`);
      });
    } else {
      console.log('   ⚠️  No translation API calls detected');
    }

    // Check JavaScript errors
    console.log(`\n❌ JavaScript errors: ${errors.length}`);
    if (errors.length > 0) {
      errors.forEach((err, i) => {
        console.log(`   Error ${i + 1}: ${err.message}`);
      });
    }

    // Final status
    if (initialContent !== newContent || requests.length > 0) {
      console.log('\n✅ Translation UI appears to be working (content changed or API called)');
    } else {
      console.log('\n⚠️  Translation UI may not be working properly');
      console.log('   - Content did not change');
      console.log('   - No API calls detected');
    }

  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    await page.screenshot({ path: './translation-test-error.png' });
    throw error;
  } finally {
    console.log('\n⏸️  Keeping browser open for 5 seconds for manual inspection...');
    await page.waitForTimeout(5000);
    await browser.close();
    console.log('✓ Browser closed\n');
  }
}

testTranslationUI()
  .then(() => {
    console.log('============================================================');
    console.log('✅ Translation UI test complete');
    console.log('============================================================\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('============================================================');
    console.error('❌ Translation UI test FAILED');
    console.error(`Error: ${error.message}`);
    console.error('============================================================\n');
    process.exit(1);
  });
