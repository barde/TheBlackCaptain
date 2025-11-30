/**
 * Homepage E2E tests using Playwright Test Runner
 * @see https://playwright.dev/docs/writing-tests
 */

const { test, expect } = require('@playwright/test');

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response.status()).toBe(200);
  });

  test('should have correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Black Captain/);
  });

  test('should display navigation', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.main-nav')).toBeVisible();
    await expect(page.locator('a[href="/"]')).toBeVisible();
    await expect(page.locator('a[href="/archive.html"]')).toBeVisible();
  });

  test('should display latest story', async ({ page }) => {
    await page.goto('/');

    // Should have story content
    await expect(page.locator('.latest-story, .post-content')).toBeVisible();
  });

  test('should have working archive link', async ({ page }) => {
    await page.goto('/');

    await page.click('a[href="/archive.html"]');
    await expect(page).toHaveURL(/archive/);
  });

  test('should display language selector', async ({ page }) => {
    await page.goto('/');

    const langSelector = page.locator('#lang-selector');
    await expect(langSelector).toBeVisible();
  });

  test('should display footer', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.main-footer')).toBeVisible();
    await expect(page.locator('a[href="/imprint.html"]')).toBeVisible();
  });
});

test.describe('Archive Page', () => {
  test('should display list of stories', async ({ page }) => {
    await page.goto('/archive.html');

    await expect(page.locator('.archive-list')).toBeVisible();
  });

  test('should have clickable story links', async ({ page }) => {
    await page.goto('/archive.html');

    const storyLinks = page.locator('.archive-list a');
    const count = await storyLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Knowledge Base', () => {
  test('Treasure Trove should load', async ({ page }) => {
    const response = await page.goto('/treasure-trove.html');
    expect(response.status()).toBe(200);
    await expect(page).toHaveTitle(/Treasure Trove/);
  });

  test('Avian Studies should load', async ({ page }) => {
    const response = await page.goto('/avian-studies.html');
    expect(response.status()).toBe(200);
    await expect(page).toHaveTitle(/Avian Studies/);
  });
});

test.describe('Accessibility', () => {
  test('should have lang attribute on html', async ({ page }) => {
    await page.goto('/');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en');
  });

  test('should have meta description', async ({ page }) => {
    await page.goto('/');

    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toBeAttached();
  });

  test('navigation should be keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Tab to navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to focus nav links
    const focusedElement = await page.evaluate(() => document.activeElement.tagName);
    expect(focusedElement).toBe('A');
  });
});
