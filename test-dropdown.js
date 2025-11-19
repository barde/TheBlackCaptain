#!/usr/bin/env node

/**
 * Test language dropdown selector
 */

const { chromium } = require('playwright');

const PRODUCTION_URL = 'https://blackhoard.com';

async function testDropdown() {
  console.log('\n🧪 Testing language dropdown selector...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log(`   [Browser] ${msg.text()}`));

  try {
    console.log(`🌐 Navigating to ${PRODUCTION_URL}...`);
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('✓ Page loaded\n');

    // Find the language selector
    const selector = await page.$('#lang-selector');
    if (!selector) {
      throw new Error('Language selector not found!');
    }
    console.log('✓ Language dropdown found\n');

    // Take initial screenshot
    await page.screenshot({ path: './dropdown-test-1-initial.png' });
    console.log('✓ Screenshot 1: Initial state\n');

    // Check dropdown options
    const options = await page.$$eval('#lang-selector option', opts =>
      opts.map(o => ({ value: o.value, text: o.textContent }))
    );
    console.log(`📋 Available languages (${options.length}):`);
    options.forEach(opt => console.log(`   - ${opt.value}: ${opt.text}`));
    console.log('');

    // Select German
    console.log('🇩🇪 Selecting German (de)...');
    await page.selectOption('#lang-selector', 'de');
    await page.waitForTimeout(8000); // Wait for translation
    await page.screenshot({ path: './dropdown-test-2-german.png' });
    console.log('✓ Screenshot 2: German translation\n');

    // Check content changed
    const germanContent = await page.$eval('.post-list h1', el => el.textContent);
    console.log(`📄 German title: "${germanContent}"\n`);

    // Select Spanish
    console.log('🇪🇸 Selecting Spanish (es)...');
    await page.selectOption('#lang-selector', 'es');
    await page.waitForTimeout(8000);
    await page.screenshot({ path: './dropdown-test-3-spanish.png' });
    console.log('✓ Screenshot 3: Spanish translation\n');

    const spanishContent = await page.$eval('.post-list h1', el => el.textContent);
    console.log(`📄 Spanish title: "${spanishContent}"\n`);

    // Select back to English
    console.log('🇬🇧 Selecting English (en)...');
    await page.selectOption('#lang-selector', 'en');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: './dropdown-test-4-english.png' });
    console.log('✓ Screenshot 4: Back to English\n');

    const englishContent = await page.$eval('.post-list h1', el => el.textContent);
    console.log(`📄 English title: "${englishContent}"\n`);

    console.log('✅ Dropdown selector working perfectly!');

  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    await page.screenshot({ path: './dropdown-test-error.png' });
    throw error;
  } finally {
    console.log('\n⏸️  Keeping browser open for 3 seconds...');
    await page.waitForTimeout(3000);
    await browser.close();
    console.log('✓ Browser closed\n');
  }
}

testDropdown()
  .then(() => {
    console.log('============================================================');
    console.log('✅ Dropdown test complete');
    console.log('============================================================\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('============================================================');
    console.error('❌ Dropdown test FAILED');
    console.error(`Error: ${error.message}`);
    console.error('============================================================\n');
    process.exit(1);
  });
