/**
 * Knowledge base builder for The Black Captain Blog Builder
 * Handles Treasure Trove and Avian Studies sections
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const { parseFrontmatter } = require('../lib/frontmatter');
const { markdownToHTML } = require('../lib/markdown');
const { generatePage } = require('../lib/template');
const { slugFromFilename } = require('../lib/utils');

/**
 * Build a knowledge base section
 * @param {string} sectionName - Section directory name
 * @param {string} sectionTitle - Section display title
 * @param {string} sectionDescription - Section description
 * @returns {Array<Object>} Array of article metadata
 */
function buildKnowledgeBaseSection(sectionName, sectionTitle, sectionDescription) {
  const sectionDir = path.join(config.paths.root, sectionName);
  const publicDir = config.paths.public;
  const publicSectionDir = path.join(publicDir, sectionName);

  if (!fs.existsSync(sectionDir)) {
    return [];
  }

  // Create section directory in public
  if (!fs.existsSync(publicSectionDir)) {
    fs.mkdirSync(publicSectionDir, { recursive: true });
  }

  const articles = [];
  const files = fs.readdirSync(sectionDir)
    .filter(file => file.endsWith('.md'))
    .sort();

  // Determine type based on section name
  const type = sectionName === 'avian-studies' ? 'avian-study' : 'knowledge';

  files.forEach(file => {
    const filePath = path.join(sectionDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { metadata, content: markdown } = parseFrontmatter(content);

    // Generate HTML
    const htmlContent = markdownToHTML(markdown);
    const title = metadata.title || file.replace('.md', '').replace(/-/g, ' ');
    const slug = slugFromFilename(file);

    // Set type for hero image handling
    metadata.type = type;

    // Generate page
    const page = generatePage(title, htmlContent, metadata);

    // Write to public section directory
    const outputPath = path.join(publicSectionDir, `${slug}.html`);
    fs.writeFileSync(outputPath, page);

    console.log(`✓ Built: ${sectionName}/${file} → ${sectionName}/${slug}.html`);

    // Add to articles list
    articles.push({
      title,
      slug,
      subtitle: metadata.subtitle || '',
      description: metadata.description || '',
    });
  });

  // Generate section index page
  const indexContent = `
    <div class="knowledge-base">
      <p class="section-description">${sectionDescription}</p>
      ${articles.map(article => `
        <article class="kb-article">
          <h2><a href="/${sectionName}/${article.slug}.html">${article.title}</a></h2>
          ${article.subtitle ? `<p class="subtitle"><em>${article.subtitle}</em></p>` : ''}
          ${article.description ? `<p>${article.description}</p>` : ''}
        </article>
      `).join('\n')}
    </div>
  `;

  const indexPage = generatePage(sectionTitle, indexContent);
  fs.writeFileSync(path.join(publicDir, `${sectionName}.html`), indexPage);
  console.log(`✓ Built: ${sectionName}.html`);

  return articles;
}

/**
 * Build all knowledge base sections
 * @returns {Object} Object with article counts per section
 */
function buildAllKnowledgeBase() {
  const results = {};

  for (const [sectionName, sectionConfig] of Object.entries(config.knowledgeBase)) {
    const articles = buildKnowledgeBaseSection(
      sectionName,
      sectionConfig.title,
      sectionConfig.description
    );
    results[sectionName] = articles;
  }

  return results;
}

module.exports = {
  buildKnowledgeBaseSection,
  buildAllKnowledgeBase,
};
