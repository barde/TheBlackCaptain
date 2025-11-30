/**
 * Static pages builder for The Black Captain Blog Builder
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const { parseFrontmatter } = require('../lib/frontmatter');
const { markdownToHTML } = require('../lib/markdown');
const { generatePage } = require('../lib/template');
const { titleFromFilename, slugFromFilename } = require('../lib/utils');

/**
 * Build all static pages from markdown files
 * @returns {number} Number of pages built
 */
function buildPages() {
  const pagesDir = config.paths.pages;
  const publicDir = config.paths.public;
  let pageCount = 0;

  if (!fs.existsSync(pagesDir)) {
    return pageCount;
  }

  const pageFiles = fs.readdirSync(pagesDir)
    .filter(file => file.endsWith('.md'))
    .sort();

  pageFiles.forEach(file => {
    const filePath = path.join(pagesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { metadata, content: markdown } = parseFrontmatter(content);

    // Generate HTML
    const htmlContent = markdownToHTML(markdown);
    const title = metadata.title || titleFromFilename(file);
    const slug = slugFromFilename(file);

    // Generate page
    const page = generatePage(title, htmlContent, metadata);

    // Write to public directory
    const outputPath = path.join(publicDir, `${slug}.html`);
    fs.writeFileSync(outputPath, page);

    console.log(`✓ Built: pages/${file} → ${slug}.html`);
    pageCount++;
  });

  return pageCount;
}

module.exports = {
  buildPages,
};
