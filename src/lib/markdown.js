/**
 * Markdown to HTML conversion for The Black Captain Blog Builder
 */

const { slugify } = require('./utils');
const { extractHeadings, generateTOC } = require('./toc');

/**
 * Convert markdown to HTML
 * @param {string} markdown - Markdown content
 * @param {Object} options - Conversion options
 * @param {boolean} options.includeTOC - Whether to include table of contents
 * @param {number} options.minTocHeadings - Minimum headings for TOC
 * @returns {string} HTML content
 */
function markdownToHTML(markdown, options = {}) {
  let html = markdown;
  const includeTOC = options.includeTOC !== false; // Default to true
  const minTocHeadings = options.minTocHeadings || 2;

  // Extract headings for TOC before conversion
  const headings = extractHeadings(markdown);

  // Headers with IDs for TOC linking (must be in reverse order: h4, h3, h2, h1)
  html = html.replace(/^#### (.+)$/gim, (match, text) => {
    const id = slugify(text);
    return `<h4 id="${id}">${text}</h4>`;
  });
  html = html.replace(/^### (.+)$/gim, (match, text) => {
    const id = slugify(text);
    return `<h3 id="${id}">${text}</h3>`;
  });
  html = html.replace(/^## (.+)$/gim, (match, text) => {
    const id = slugify(text);
    return `<h2 id="${id}">${text}</h2>`;
  });
  // h1 (main title)
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Protect links and images by extracting them before emphasis processing
  const protectedElements = [];
  const placeholder = '%%PROTECTED%%';

  // Extract images first (must come before links since ![]() contains []())
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
    protectedElements.push(`<img src="${src}" alt="${alt}" loading="lazy">`);
    return placeholder + (protectedElements.length - 1) + placeholder;
  });

  // Extract links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, href) => {
    protectedElements.push(`<a href="${href}">${text}</a>`);
    return placeholder + (protectedElements.length - 1) + placeholder;
  });

  // Bold and italic (now safe since links/images are protected)
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Restore protected elements
  html = html.replace(new RegExp(placeholder + '(\\d+)' + placeholder, 'g'), (match, index) => {
    return protectedElements[parseInt(index, 10)];
  });

  // Line breaks and paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');

  // Blockquotes
  html = html.replace(/^&gt; (.*$)/gim, '<blockquote>$1</blockquote>');

  // Lists
  html = html.replace(/^\* (.+)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Wrap in paragraph tags
  html = '<p>' + html + '</p>';

  // Clean up multiple paragraph tags
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>(<h[1-4][^>]*>)/g, '$1');
  html = html.replace(/(<\/h[1-4]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<blockquote>)/g, '$1');
  html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');
  html = html.replace(/<p>(<nav[^>]*>)/g, '$1');
  html = html.replace(/(<\/nav>)<\/p>/g, '$1');

  // Add TOC at the beginning if there are enough headings
  if (includeTOC && headings.length >= minTocHeadings) {
    const toc = generateTOC(headings, minTocHeadings);
    html = toc + html;
  }

  return html;
}

module.exports = {
  markdownToHTML,
};
