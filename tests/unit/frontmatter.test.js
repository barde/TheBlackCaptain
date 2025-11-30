/**
 * Unit tests for frontmatter parsing
 */

const { parseFrontmatter, createFrontmatter } = require('../../src/lib/frontmatter');

describe('frontmatter', () => {
  describe('parseFrontmatter', () => {
    it('should parse valid frontmatter', () => {
      // Arrange
      const content = `---
title: My Post
date: November 18, 2025
---
This is the content.`;

      // Act
      const result = parseFrontmatter(content);

      // Assert
      expect(result.metadata.title).toBe('My Post');
      expect(result.metadata.date).toBe('November 18, 2025');
      expect(result.content).toBe('This is the content.');
    });

    it('should return empty metadata when no frontmatter exists', () => {
      const content = 'Just some content without frontmatter.';
      const result = parseFrontmatter(content);

      expect(result.metadata).toEqual({});
      expect(result.content).toBe(content);
    });

    it('should handle multiline content after frontmatter', () => {
      const content = `---
title: Test
---
Line 1
Line 2
Line 3`;

      const result = parseFrontmatter(content);

      expect(result.content).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should handle values with colons', () => {
      const content = `---
title: Time: 10:30 AM
url: https://example.com
---
Content`;

      const result = parseFrontmatter(content);

      expect(result.metadata.title).toBe('Time: 10:30 AM');
      expect(result.metadata.url).toBe('https://example.com');
    });

    it('should handle empty frontmatter', () => {
      // Note: Empty frontmatter (---\n---) doesn't match the regex pattern
      // which requires at least one character between delimiters
      // This is expected behavior - empty frontmatter returns the whole content
      const content = `---
---
Content`;

      const result = parseFrontmatter(content);

      // When frontmatter regex doesn't match, content is returned as-is
      expect(result.metadata).toEqual({});
      expect(result.content).toBe(content);
    });

    it('should trim whitespace from keys and values', () => {
      const content = `---
  title  :   My Title
---
Content`;

      const result = parseFrontmatter(content);

      expect(result.metadata.title).toBe('My Title');
    });

    it('should handle multiple metadata fields', () => {
      const content = `---
title: Test Post
date: January 1, 2025
description: A test description
author: The Captain
---
Content`;

      const result = parseFrontmatter(content);

      expect(Object.keys(result.metadata)).toHaveLength(4);
      expect(result.metadata.title).toBe('Test Post');
      expect(result.metadata.date).toBe('January 1, 2025');
      expect(result.metadata.description).toBe('A test description');
      expect(result.metadata.author).toBe('The Captain');
    });
  });

  describe('createFrontmatter', () => {
    it('should create valid frontmatter string', () => {
      const metadata = {
        title: 'My Post',
        date: 'January 1, 2025',
      };

      const result = createFrontmatter(metadata);

      expect(result).toContain('---');
      expect(result).toContain('title: My Post');
      expect(result).toContain('date: January 1, 2025');
    });

    it('should handle empty metadata', () => {
      const result = createFrontmatter({});

      expect(result).toBe('---\n\n---\n');
    });

    it('should handle single field', () => {
      const result = createFrontmatter({ title: 'Test' });

      expect(result).toBe('---\ntitle: Test\n---\n');
    });
  });
});
