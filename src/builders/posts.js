/**
 * Posts builder for The Black Captain Blog Builder
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const { parseFrontmatter } = require('../lib/frontmatter');
const { markdownToHTML } = require('../lib/markdown');
const { generatePage } = require('../lib/template');
const { titleFromFilename, slugFromFilename } = require('../lib/utils');

/**
 * Build all posts from markdown files
 * @returns {Array<Object>} Array of post metadata
 */
function buildPosts() {
  const postsDir = config.paths.posts;
  const publicDir = config.paths.public;

  if (!fs.existsSync(postsDir)) {
    console.log('⚠ No posts directory found. Creating it...');
    fs.mkdirSync(postsDir, { recursive: true });
    return [];
  }

  const posts = [];
  const files = fs.readdirSync(postsDir)
    .filter(file => file.endsWith('.md'))
    .sort()
    .reverse(); // Newest first

  files.forEach(file => {
    const filePath = path.join(postsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { metadata, content: markdown } = parseFrontmatter(content);

    // Generate HTML
    const htmlContent = markdownToHTML(markdown);
    const title = metadata.title || titleFromFilename(file);
    const slug = slugFromFilename(file);

    // Add slug to metadata for image lookup
    metadata.slug = slug;
    metadata.type = 'post';

    // Generate page
    const page = generatePage(title, htmlContent, metadata);

    // Write to public directory
    const outputPath = path.join(publicDir, `${slug}.html`);
    fs.writeFileSync(outputPath, page);

    console.log(`✓ Built: ${file} → ${slug}.html`);

    // Add to posts list
    posts.push({
      title,
      slug,
      date: metadata.date || '',
      description: metadata.description || '',
    });
  });

  return posts;
}

/**
 * Build the index page with latest post content
 * @param {Array<Object>} posts - Array of post metadata
 */
function buildIndexPage(posts) {
  const postsDir = config.paths.posts;
  const publicDir = config.paths.public;

  let indexContent;

  if (posts.length > 0) {
    const latestPost = posts[0];
    // Find the file for the latest post
    const files = fs.readdirSync(postsDir)
      .filter(file => file.endsWith('.md'))
      .sort()
      .reverse();

    const latestPostPath = path.join(postsDir, files[0]);
    const latestPostContent = fs.readFileSync(latestPostPath, 'utf-8');
    const { content: markdown } = parseFrontmatter(latestPostContent);
    const htmlContent = markdownToHTML(markdown);

    indexContent = `
      <div class="latest-story">
        <h1 class="story-title">${latestPost.title}</h1>
        ${latestPost.date ? `<time class="post-date">${latestPost.date}</time>` : ''}
        <div class="story-content">
          ${htmlContent}
        </div>
        <div class="support-captain">
          <p class="support-text">If this tale warmed your heart or gave you a moment of peace on troubled seas, consider buying the Captain a grog.</p>
          <a href="https://ko-fi.com/theblackcaptain" target="_blank" rel="noopener" class="kofi-button">
            <span class="kofi-icon">☕</span> Buy the Captain a Grog
          </a>
        </div>
        <div class="archive-notice">
          <p><a href="/archive.html">View all previous tales in the Archive →</a></p>
        </div>
      </div>
    `;
  } else {
    indexContent = `
      <div class="post-list">
        <h1>${config.site.title}</h1>
        <p class="site-description">${config.site.description}</p>
        <p>No tales yet. The Captain's first voyage begins soon...</p>
      </div>
    `;
  }

  const indexPage = generatePage('', indexContent, { type: 'index' });
  fs.writeFileSync(path.join(publicDir, 'index.html'), indexPage);
  console.log('✓ Built: index.html');
}

/**
 * Build the archive page
 * @param {Array<Object>} posts - Array of post metadata
 */
function buildArchivePage(posts) {
  const publicDir = config.paths.public;

  const archiveContent = `
    <div class="archive">
      <ul class="archive-list">
        ${posts.map(post => `
          <li>
            ${post.date ? `<time>${post.date}</time>` : ''}
            <a href="/${post.slug}.html">${post.title}</a>
          </li>
        `).join('\n')}
      </ul>
    </div>
  `;

  const archivePage = generatePage('Archive', archiveContent);
  fs.writeFileSync(path.join(publicDir, 'archive.html'), archivePage);
  console.log('✓ Built: archive.html');
}

module.exports = {
  buildPosts,
  buildIndexPage,
  buildArchivePage,
};
