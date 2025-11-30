/**
 * Unit tests for utility functions
 * Following 2025 best practices: clear naming, AAA pattern, single assertions
 */

const { slugify, titleFromFilename, slugFromFilename } = require('../../src/lib/utils');

describe('utils', () => {
  describe('slugify', () => {
    it('should convert text to lowercase', () => {
      // Arrange
      const input = 'Hello World';

      // Act
      const result = slugify(input);

      // Assert
      expect(result).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      const result = slugify('the black captain');
      expect(result).toBe('the-black-captain');
    });

    it('should remove special characters', () => {
      const result = slugify("The Captain's Log!");
      expect(result).toBe('the-captains-log');
    });

    it('should handle multiple consecutive spaces', () => {
      const result = slugify('hello    world');
      expect(result).toBe('hello-world');
    });

    it('should handle multiple consecutive hyphens', () => {
      const result = slugify('hello---world');
      expect(result).toBe('hello-world');
    });

    it('should handle empty string', () => {
      const result = slugify('');
      expect(result).toBe('');
    });

    it('should handle string with only special characters', () => {
      const result = slugify('!@#$%^&*()');
      expect(result).toBe('');
    });

    it('should preserve numbers', () => {
      const result = slugify('Chapter 1: The Beginning');
      expect(result).toBe('chapter-1-the-beginning');
    });

    it('should handle unicode characters by removing them', () => {
      const result = slugify('Café del Mar');
      expect(result).toBe('caf-del-mar');
    });
  });

  describe('titleFromFilename', () => {
    it('should remove .md extension', () => {
      const result = titleFromFilename('hello-world.md');
      expect(result).toBe('hello world');
    });

    it('should remove date prefix from filename', () => {
      const result = titleFromFilename('2025-11-18-the-beginning.md');
      expect(result).toBe('the beginning');
    });

    it('should replace hyphens with spaces', () => {
      const result = titleFromFilename('the-black-captain.md');
      expect(result).toBe('the black captain');
    });

    it('should handle filename without date prefix', () => {
      const result = titleFromFilename('about-page.md');
      expect(result).toBe('about page');
    });

    it('should handle complex filenames', () => {
      const result = titleFromFilename('2025-01-01-my-first-post.md');
      expect(result).toBe('my first post');
    });
  });

  describe('slugFromFilename', () => {
    it('should remove .md extension', () => {
      const result = slugFromFilename('hello-world.md');
      expect(result).toBe('hello-world');
    });

    it('should preserve date prefix', () => {
      const result = slugFromFilename('2025-11-18-the-beginning.md');
      expect(result).toBe('2025-11-18-the-beginning');
    });

    it('should handle filename without extension', () => {
      const result = slugFromFilename('already-slug');
      expect(result).toBe('already-slug');
    });
  });
});
