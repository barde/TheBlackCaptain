#!/usr/bin/env node

/**
 * Test if the latest story is accessible
 */

const { chromium } = require('playwright');

async function testStory() {
  console.log('\n🧪 Testing story accessibility...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Test homepage
    console.log('📍 Testing homepage (blackhoard.com)...');
    await page.goto('https://blackhoard.com', { waitUntil: 'networkidle' });

    const title = await page.title();
    console.log(`✓ Page title: "${title}"`);

    // Check if "Drunken Scholars" appears on homepage
    const homepageContent = await page.content();
    if (homepageContent.includes('Drunken Scholars') || homepageContent.includes('Thomas') || homepageContent.includes('Wilhelm')) {
      console.log('✓ Latest story "The Drunken Scholars" found on homepage');
    } else {
      console.log('✗ WARNING: "The Drunken Scholars" NOT found on homepage');
      console.log('  Checking what story is displayed...');
      const h1 = await page.$eval('h1', el => el.textContent);
      console.log(`  Current h1: "${h1}"`);
    }

    // Test direct story URL
    console.log('\n📍 Testing direct story URL...');
    const storyUrl = 'https://blackhoard.com/2025-11-24-the-drunken-scholars.html';
    await page.goto(storyUrl, { waitUntil: 'networkidle' });

    const storyTitle = await page.title();
    console.log(`✓ Story page title: "${storyTitle}"`);

    const storyH1 = await page.$eval('h1', el => el.textContent);
    console.log(`✓ Story h1: "${storyH1}"`);

    if (storyH1.includes('Drunken Scholars')) {
      console.log('✓ Story is accessible at direct URL');
    } else {
      console.log('✗ ERROR: Story h1 does not match expected title');
    }

    // Test archive page
    console.log('\n📍 Testing archive page...');
    await page.goto('https://blackhoard.com/archive.html', { waitUntil: 'networkidle' });

    const archiveContent = await page.content();
    if (archiveContent.includes('Drunken Scholars')) {
      console.log('✓ Story appears in archive');
    } else {
      console.log('✗ WARNING: Story NOT in archive');
    }

    // Take screenshot of homepage
    await page.goto('https://blackhoard.com', { waitUntil: 'networkidle' });
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
