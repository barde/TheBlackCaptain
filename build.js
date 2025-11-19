#!/usr/bin/env node

/**
 * The Black Captain Blog Builder
 * Converts markdown posts to HTML pages
 */

const fs = require('fs');
const path = require('path');

// Simple markdown to HTML converter (no dependencies needed)
function markdownToHTML(markdown) {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');

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
  html = html.replace(/<p>(<h[1-3]>)/g, '$1');
  html = html.replace(/(<\/h[1-3]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<blockquote>)/g, '$1');
  html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');

  return html;
}

// Parse frontmatter (YAML-like metadata at top of markdown files)
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]+?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { metadata: {}, content: content };
  }

  const frontmatter = match[1];
  const markdown = match[2];

  const metadata = {};
  frontmatter.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      metadata[key.trim()] = valueParts.join(':').trim();
    }
  });

  return { metadata, content: markdown };
}

// Generate HTML page from template
function generatePage(title, content, metadata = {}) {
  const date = metadata.date || '';
  const description = metadata.description || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description}">
  <title>${title} - The many travels of the Black Captain</title>
  <link rel="stylesheet" href="/assets/style.css">
</head>
<body>
  <nav class="main-nav">
    <div class="nav-container">
      <a href="/" class="site-title">The Black Captain</a>
      <div class="nav-links">
        <a href="/">Home</a>
        <a href="/archive.html">Archive</a>
        <select id="lang-selector" class="lang-selector" aria-label="Select language">
          <option value="en">English</option>
          <option value="de">Deutsch</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="it">Italiano</option>
          <option value="pt">Português</option>
          <option value="nl">Nederlands</option>
          <option value="pl">Polski</option>
          <option value="ru">Русский</option>
          <option value="ja">日本語</option>
          <option value="zh">中文</option>
          <option value="ko">한국어</option>
          <option value="ar">العربية</option>
        </select>
      </div>
    </div>
  </nav>

  <main class="container">
    <article class="post" data-translatable="true">
      <header class="post-header">
        <h1 class="post-title">${title}</h1>
        ${date ? `<time class="post-date">${date}</time>` : ''}
      </header>
      <div class="post-content">
        ${content}
      </div>
    </article>
  </main>

  <footer class="main-footer">
    <p>The many travels of the Black Captain - A journey of healing through words</p>
  </footer>

  <script src="/assets/main.js"></script>
</body>
</html>`;
}

// Build all posts
function build() {
  console.log('🏴‍☠️ Building The Black Captain blog...\n');

  const postsDir = path.join(__dirname, 'posts');
  const publicDir = path.join(__dirname, 'public');

  // Create public directory if it doesn't exist
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Copy assets
  const assetsDir = path.join(__dirname, 'assets');
  const publicAssetsDir = path.join(publicDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    if (!fs.existsSync(publicAssetsDir)) {
      fs.mkdirSync(publicAssetsDir, { recursive: true });
    }
    fs.readdirSync(assetsDir).forEach(file => {
      fs.copyFileSync(
        path.join(assetsDir, file),
        path.join(publicAssetsDir, file)
      );
    });
    console.log('✓ Copied assets');
  }

  // Copy images
  const imagesDir = path.join(__dirname, 'images');
  const publicImagesDir = path.join(publicDir, 'images');
  if (fs.existsSync(imagesDir)) {
    if (!fs.existsSync(publicImagesDir)) {
      fs.mkdirSync(publicImagesDir, { recursive: true });
    }
    fs.readdirSync(imagesDir).forEach(file => {
      fs.copyFileSync(
        path.join(imagesDir, file),
        path.join(publicImagesDir, file)
      );
    });
    console.log('✓ Copied images');
  }

  // Process all markdown files
  if (!fs.existsSync(postsDir)) {
    console.log('⚠ No posts directory found. Creating it...');
    fs.mkdirSync(postsDir, { recursive: true });
    return;
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
    const title = metadata.title || file.replace('.md', '').replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/-/g, ' ');
    const slug = file.replace('.md', '');

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
      description: metadata.description || ''
    });
  });

  // Generate index page with post list
  const indexContent = `
    <div class="post-list">
      <h1>The many travels of the Black Captain</h1>
      <p class="site-description">A journey of healing, discovery, and resilience through the written word.</p>
      ${posts.map(post => `
        <article class="post-preview">
          <h2><a href="/${post.slug}.html">${post.title}</a></h2>
          ${post.date ? `<time>${post.date}</time>` : ''}
          ${post.description ? `<p>${post.description}</p>` : ''}
        </article>
      `).join('\n')}
    </div>
  `;

  const indexPage = generatePage('Home', indexContent);
  fs.writeFileSync(path.join(publicDir, 'index.html'), indexPage);
  console.log('✓ Built: index.html');

  // Generate archive page
  const archiveContent = `
    <div class="archive">
      <h1>Archive</h1>
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

  console.log(`\n🏴‍☠️ Build complete! ${posts.length} post(s) published.\n`);
  console.log('Deploy the "public" directory to Cloudflare Pages.');
}

// Run build
build();
