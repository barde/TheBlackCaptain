/**
 * Table of Contents generation for The Black Captain Blog Builder
 */

const { slugify } = require('./utils');

/**
 * Extract headings from markdown content
 * @param {string} markdown - Markdown content
 * @returns {Array<{level: number, text: string, id: string}>} Array of headings
 */
function extractHeadings(markdown) {
  const headings = [];
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length; // 2 for ##, 3 for ###, etc.
    const text = match[2].trim();
    const id = slugify(text);
    headings.push({ level, text, id });
  }

  return headings;
}

/**
 * Generate Table of Contents HTML with proper nesting
 * @param {Array<{level: number, text: string, id: string}>} headings - Array of headings
 * @param {number} minHeadings - Minimum headings required to show TOC
 * @returns {string} TOC HTML or empty string
 */
function generateTOC(headings, minHeadings = 2) {
  if (headings.length < minHeadings) return ''; // Don't show TOC for very short articles

  let toc = '<nav class="toc" aria-label="Table of Contents">\n';
  toc += '<details open>\n';
  toc += '<summary><strong>Contents</strong></summary>\n';
  toc += '<ul>\n';

  let currentLevel = 2; // Start at h2 level

  for (const heading of headings) {
    // Close nested lists if going up in hierarchy
    while (currentLevel > heading.level) {
      toc += '</ul></li>\n';
      currentLevel--;
    }

    // Open nested lists if going down in hierarchy
    while (currentLevel < heading.level) {
      toc += '<li><ul>\n';
      currentLevel++;
    }

    toc += `<li><a href="#${heading.id}">${heading.text}</a></li>\n`;
  }

  // Close any remaining nested lists
  while (currentLevel > 2) {
    toc += '</ul></li>\n';
    currentLevel--;
  }

  toc += '</ul>\n';
  toc += '</details>\n';
  toc += '</nav>\n';

  return toc;
}

module.exports = {
  extractHeadings,
  generateTOC,
};
