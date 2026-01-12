/**
 * Translation Feature Test
 * Verifies that the language selector works and content is translated.
 * 
 * Usage:
 *   npx playwright test tests/e2e/translation.test.js
 */

const { test, expect } = require('@playwright/test');

// Allow testing against different environments
const TARGET_URL = process.env.TEST_URL || 'https://blackhoard.com';

test.describe('Translation System', () => {
  test('should translate content when language is changed', async ({ page }) => {
    // 1. Navigate to a specific post to ensure we have content
    // Using a known post that exists in the repo
    const postUrl = `${TARGET_URL}/2025-11-18-the-beginning.html`;
    console.log(`Navigating to ${postUrl}...`);
    await page.goto(postUrl);

    // 2. Initial state check (English)
    const langSelector = page.locator('#lang-selector');
    await expect(langSelector).toBeVisible();
    await expect(langSelector).toHaveValue('en');

    // Get initial text of the main heading
    // Use h1 which should always be the title
    const postTitle = page.locator('h1').first();
    await expect(postTitle).toBeVisible();
    
    const originalTitle = await postTitle.textContent();
    console.log(`Original title: "${originalTitle}"`);
    expect(originalTitle).toBeTruthy();
    expect(originalTitle.trim().length).toBeGreaterThan(0);

    // 3. Trigger Translation (Change to German)
    console.log('Switching language to German (de)...');
    
    // Listen for the API request to ensure it's triggered
    const apiRequestPromise = page.waitForRequest(request => 
      request.url().includes('/api/translate') && request.method() === 'POST'
    );

    // Select German
    await langSelector.selectOption('de');

    // Wait for the API call to be made
    // Note: If running against a static dev server without the API, this part might fail or need mocking.
    // For this e2e test on prod/preview, we expect it to work.
    try {
      const request = await apiRequestPromise;
      console.log('Translation API request detected.');
    } catch (e) {
      console.warn('Warning: Translation API request not detected or timed out (could be cached or rate limited).');
    }

    // 4. Wait for translation to apply
    // The frontend logic updates the DOM. We verify the text changes.
    // We wait for the title to be DIFFERENT from the original
    await expect(postTitle).not.toHaveText(originalTitle, { timeout: 15000 });
    
    const translatedTitle = await postTitle.textContent();
    console.log(`Translated title: "${translatedTitle}"`);

    // Basic verification that it's not empty and different
    expect(translatedTitle).not.toBe(originalTitle);
    expect(translatedTitle.length).toBeGreaterThan(0);

    // 5. Verify visual feedback (opacity change during translation)
    // This happens quickly, so it's hard to catch deterministically in a test without slowing things down,
    // but we can check if the browser hint popup appears eventually (if not seen before)
    // However, for a robust test, simply checking the text change is sufficient.

    // 6. Screenshot for manual verification
    await page.screenshot({ path: 'translation-test-result.png', fullPage: false });
    console.log('Saved screenshot to translation-test-result.png');
  });
});
