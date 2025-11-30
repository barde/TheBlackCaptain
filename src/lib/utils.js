/**
 * Utility functions for The Black Captain Blog Builder
 */

/**
 * Generate URL-safe slug from text
 * @param {string} text - Text to slugify
 * @returns {string} URL-safe slug
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .trim();
}

/**
 * Extract title from filename
 * @param {string} filename - Markdown filename
 * @returns {string} Extracted title
 */
function titleFromFilename(filename) {
  return filename
    .replace('.md', '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, '') // Remove date prefix
    .replace(/-/g, ' ');
}

/**
 * Get slug from filename
 * @param {string} filename - Markdown filename
 * @returns {string} Slug without extension
 */
function slugFromFilename(filename) {
  return filename.replace('.md', '');
}

module.exports = {
  slugify,
  titleFromFilename,
  slugFromFilename,
};
