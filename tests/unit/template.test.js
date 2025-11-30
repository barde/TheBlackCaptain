/**
 * Unit tests for HTML template generation
 */

const {
  generatePage,
  generateLanguageSelector,
  generateSupportSection,
} = require('../../src/lib/template');

describe('template', () => {
  describe('generatePage', () => {
    it('should generate valid HTML5 document', () => {
      const result = generatePage('Test Title', '<p>Content</p>');

      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html lang="en">');
      expect(result).toContain('</html>');
    });

    it('should include meta tags', () => {
      const result = generatePage('Test', '<p>Content</p>', { description: 'Test desc' });

      expect(result).toContain('<meta charset="UTF-8">');
      expect(result).toContain('<meta name="viewport"');
      expect(result).toContain('content="Test desc"');
    });

    it('should include page title', () => {
      const result = generatePage('My Page', '<p>Content</p>');

      expect(result).toContain('<title>My Page - ');
    });

    it('should handle empty title', () => {
      const result = generatePage('', '<p>Content</p>');

      expect(result).toContain('<title>The many travels');
    });

    it('should include navigation', () => {
      const result = generatePage('Test', '<p>Content</p>');

      expect(result).toContain('<nav class="main-nav">');
      expect(result).toContain('href="/"');
      expect(result).toContain('href="/archive.html"');
      expect(result).toContain("Ship's Crew");
      expect(result).toContain('Treasure Trove');
      expect(result).toContain('Avian Studies');
    });

    it('should include footer', () => {
      const result = generatePage('Test', '<p>Content</p>');

      expect(result).toContain('<footer class="main-footer">');
      expect(result).toContain('href="/imprint.html"');
    });

    it('should include language selector', () => {
      const result = generatePage('Test', '<p>Content</p>');

      expect(result).toContain('id="lang-selector"');
      expect(result).toContain('<option value="en">');
    });

    it('should include post date when provided', () => {
      const result = generatePage('Test', '<p>Content</p>', { date: 'January 1, 2025' });

      expect(result).toContain('<time class="post-date">January 1, 2025</time>');
    });

    it('should include support section for posts', () => {
      const result = generatePage('Test', '<p>Content</p>', { type: 'post' });

      expect(result).toContain('support-captain');
      expect(result).toContain('ko-fi.com/theblackcaptain');
    });

    it('should not include support section for non-posts', () => {
      const result = generatePage('Test', '<p>Content</p>', { type: 'page' });

      expect(result).not.toContain('support-captain');
    });

    it('should include preload link for hero images', () => {
      // When a theme matches, hero image is included
      const result = generatePage('Voyage Test', '<p>Content</p>', {
        type: 'post',
        slug: 'voyage-test',
      });

      expect(result).toContain('<link rel="preload" as="image"');
    });
  });

  describe('generateLanguageSelector', () => {
    it('should include European languages', () => {
      const result = generateLanguageSelector();

      expect(result).toContain('Europe');
      expect(result).toContain('value="de"');
      expect(result).toContain('value="fr"');
      expect(result).toContain('value="es"');
    });

    it('should include Asian languages', () => {
      const result = generateLanguageSelector();

      expect(result).toContain('Asia');
      expect(result).toContain('value="zh"');
      expect(result).toContain('value="ja"');
      expect(result).toContain('value="ko"');
    });

    it('should include African languages', () => {
      const result = generateLanguageSelector();

      expect(result).toContain('Africa');
      expect(result).toContain('value="sw"');
    });

    it('should have English as default', () => {
      const result = generateLanguageSelector();

      expect(result).toContain('value="en"');
    });

    it('should have accessible label', () => {
      const result = generateLanguageSelector();

      expect(result).toContain('aria-label="Select language"');
    });
  });

  describe('generateSupportSection', () => {
    it('should include Ko-fi link', () => {
      const result = generateSupportSection();

      expect(result).toContain('ko-fi.com/theblackcaptain');
    });

    it('should have correct styling classes', () => {
      const result = generateSupportSection();

      expect(result).toContain('class="support-captain"');
      expect(result).toContain('class="kofi-button"');
    });

    it('should have external link attributes', () => {
      const result = generateSupportSection();

      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener"');
    });
  });
});
