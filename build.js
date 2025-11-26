#!/usr/bin/env node

/**
 * The Black Captain Blog Builder
 * Converts markdown posts to HTML pages
 */

const fs = require('fs');
const path = require('path');
const { generateAllImages } = require('./generate-images.js');

// Simple markdown to HTML converter (no dependencies needed)
function markdownToHTML(markdown) {
  let html = markdown;

  // Headers (must be in reverse order: h4, h3, h2, h1)
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
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

// Hero image system - curated maritime images from Unsplash
function getHeroImage(title, slug, type, metadata = {}) {
  // Special section pages with custom hero images
  const sectionImages = {
    'Archive': 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Tsunami_by_hokusai_19th_century.jpg', // Hokusai's Great Wave - Wikimedia Commons
    'Ship\'s Crew': 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Argonautesch%C3%ABff_Lorenzo_Costa_w.jpg', // Argonauts by Lorenzo Costa - Wikimedia Commons
    'The Captain\'s Treasure Trove': 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Silver_Adornments_of_the_Vishchyn_Treasure_Trove.jpg', // Silver Adornments of the Vishchyn Treasure Trove - Wikimedia Commons
    'The Captain\'s Avian Studies': 'https://cloud.vogel.yoga/imgs/IMG_6283.jpg', // Custom bird image
    'Others': '/images/internet-pirate-transparent.png' // Internet Pirate with transparent background (processed locally)
  };

  // Check if this is a section page
  if (sectionImages[title]) {
    return `<img src="${sectionImages[title]}" alt="${title}" class="post-hero-image" loading="lazy">`;
  }

  // Skip hero images for individual avian study articles (they have their own Wikimedia images in content)
  if (type === 'avian-study') {
    return '';
  }

  // If image is explicitly set in frontmatter, use it
  if (metadata.image) {
    return `<img src="${metadata.image}" alt="${title}" class="post-hero-image" loading="lazy">`;
  }

  // Map of curated Unsplash photos for different themes (maritime-themed)
  const themeImages = {
    // Sailing & Ships
    'ship': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&h=900&fit=crop',
    'voyage': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&h=900&fit=crop',
    'sailor': 'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1600&h=900&fit=crop',
    'sea': 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1600&h=900&fit=crop',
    'ocean': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&h=900&fit=crop',
    'port': 'https://images.unsplash.com/photo-1605553787144-0c29cd64d13b?w=1600&h=900&fit=crop',
    'captain': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1600&h=900&fit=crop',
    'storm': 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=1600&h=900&fit=crop',
    'dock': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600&h=900&fit=crop',
    'harbor': 'https://images.unsplash.com/photo-1568445186401-2e0213c59eaf?w=1600&h=900&fit=crop',
    // Mood & Season
    'northern': 'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=1600&h=900&fit=crop',
    'winter': 'https://images.unsplash.com/photo-1517299321609-52687d1bc55a?w=1600&h=900&fit=crop',
    'cold': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1600&h=900&fit=crop',
    'illness': 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=1600&h=900&fit=crop',
    'remedy': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1600&h=900&fit=crop',
    // People & Stories
    'scholar': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&h=900&fit=crop',
    'crew': 'https://images.unsplash.com/photo-1593642532781-03e79bf5bec2?w=1600&h=900&fit=crop',
    'beginning': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1600&h=900&fit=crop',
    // Default maritime
    'default': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&h=900&fit=crop'
  };

  // Try to match theme based on title and slug
  const searchText = (title + ' ' + slug).toLowerCase();

  for (const [theme, imageUrl] of Object.entries(themeImages)) {
    if (searchText.includes(theme)) {
      return `<img src="${imageUrl}" alt="${title}" class="post-hero-image" loading="lazy">`;
    }
  }

  // Default maritime image for posts
  if (type === 'post') {
    return `<img src="${themeImages.default}" alt="${title}" class="post-hero-image" loading="lazy">`;
  }

  return '';
}

// Generate HTML page from template
function generatePage(title, content, metadata = {}) {
  const date = metadata.date || '';
  const description = metadata.description || '';
  const slug = metadata.slug || '';
  const type = metadata.type || 'post';

  // Get hero image for this content
  const heroImage = getHeroImage(title, slug, type, metadata);

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
        <a href="/ships-crew.html">Ship's Crew</a>
        <a href="/treasure-trove.html">Treasure Trove</a>
        <a href="/avian-studies.html">Avian Studies</a>
        <a href="/others.html">Others</a>
        <select id="lang-selector" class="lang-selector" aria-label="Select language">
          <option value="en">🌍 English</option>
          <optgroup label="🇪🇺 Europe">
            <option value="de">Deutsch (German)</option>
            <option value="es">Español (Spanish)</option>
            <option value="fr">Français (French)</option>
            <option value="it">Italiano (Italian)</option>
            <option value="pt">Português (Portuguese)</option>
            <option value="nl">Nederlands (Dutch)</option>
            <option value="pl">Polski (Polish)</option>
            <option value="ru">Русский (Russian)</option>
            <option value="cs">Čeština (Czech)</option>
            <option value="da">Dansk (Danish)</option>
            <option value="fi">Suomi (Finnish)</option>
            <option value="el">Ελληνικά (Greek)</option>
            <option value="hu">Magyar (Hungarian)</option>
            <option value="no">Norsk (Norwegian)</option>
            <option value="ro">Română (Romanian)</option>
            <option value="sv">Svenska (Swedish)</option>
            <option value="tr">Türkçe (Turkish)</option>
            <option value="uk">Українська (Ukrainian)</option>
            <option value="bg">Български (Bulgarian)</option>
            <option value="hr">Hrvatski (Croatian)</option>
            <option value="et">Eesti (Estonian)</option>
            <option value="is">Íslenska (Icelandic)</option>
            <option value="lt">Lietuvių (Lithuanian)</option>
            <option value="lv">Latviešu (Latvian)</option>
            <option value="mk">Македонски (Macedonian)</option>
            <option value="sk">Slovenčina (Slovak)</option>
            <option value="sl">Slovenščina (Slovenian)</option>
          </optgroup>
          <optgroup label="🌏 Asia">
            <option value="zh">中文 (Chinese)</option>
            <option value="ja">日本語 (Japanese)</option>
            <option value="ko">한국어 (Korean)</option>
            <option value="ar">العربية (Arabic)</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="id">Bahasa Indonesia (Indonesian)</option>
            <option value="th">ไทย (Thai)</option>
            <option value="vi">Tiếng Việt (Vietnamese)</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="ml">മലയാളം (Malayalam)</option>
            <option value="bn">বাংলা (Bengali)</option>
            <option value="ur">اردو (Urdu)</option>
            <option value="fa">فارسی (Persian)</option>
            <option value="he">עברית (Hebrew)</option>
            <option value="ms">Bahasa Melayu (Malay)</option>
            <option value="my">မြန်မာ (Burmese)</option>
          </optgroup>
          <optgroup label="🌍 Africa">
            <option value="af">Afrikaans</option>
            <option value="am">አማርኛ (Amharic)</option>
            <option value="ha">Hausa</option>
            <option value="ig">Igbo</option>
            <option value="sw">Kiswahili (Swahili)</option>
            <option value="yo">Yorùbá</option>
            <option value="zu">isiZulu (Zulu)</option>
          </optgroup>
        </select>
      </div>
    </div>
  </nav>

  <main class="container">
    <article class="post" data-translatable="true">
      ${heroImage}
      <header class="post-header">
        <h1 class="post-title">${title}</h1>
        ${date ? `<time class="post-date">${date}</time>` : ''}
      </header>
      <div class="post-content">
        ${content}
      </div>
      ${type === 'post' ? `
      <div class="support-captain">
        <p class="support-text">If this tale warmed your heart or gave you a moment of peace on troubled seas, consider buying the Captain a grog.</p>
        <a href="https://ko-fi.com/theblackcaptain" target="_blank" rel="noopener" class="kofi-button">
          <span class="kofi-icon">☕</span> Buy the Captain a Grog
        </a>
      </div>
      ` : ''}
    </article>
  </main>

  <footer class="main-footer">
    <p>The many travels of the Black Captain - A journey of healing through words</p>
    <p class="footer-links"><a href="/imprint.html">Imprint</a> · <a href="https://ko-fi.com/theblackcaptain" target="_blank" rel="noopener">Give the Black Captain Grog</a></p>
  </footer>

  <script src="/assets/main.js"></script>
</body>
</html>`;
}

// Build knowledge base sections (Treasure Trove and Avian Studies)
function buildKnowledgeBase(sectionName, sectionTitle, sectionDescription) {
  const sectionDir = path.join(__dirname, sectionName);
  const publicDir = path.join(__dirname, 'public');
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

  files.forEach(file => {
    const filePath = path.join(sectionDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { metadata, content: markdown } = parseFrontmatter(content);

    // Generate HTML
    const htmlContent = markdownToHTML(markdown);
    const title = metadata.title || file.replace('.md', '').replace(/-/g, ' ');
    const slug = file.replace('.md', '');

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
      description: metadata.description || ''
    });
  });

  // Generate section index page
  const indexContent = `
    <div class="knowledge-base">
      <h1>${sectionTitle}</h1>
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

  // Copy generated images if they exist
  const generatedImagesDir = path.join(publicDir, 'images', 'generated');
  if (fs.existsSync(generatedImagesDir)) {
    fs.readdirSync(generatedImagesDir).forEach(file => {
      const sourcePath = path.join(generatedImagesDir, file);
      const destPath = path.join(publicImagesDir, 'generated', file);
      if (!fs.existsSync(path.dirname(destPath))) {
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
      }
      fs.copyFileSync(sourcePath, destPath);
    });
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

    // Add slug to metadata for image lookup
    metadata.slug = slug;

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

  // Generate index page with latest post's full content
  const latestPost = posts[0]; // Already sorted newest first
  let indexContent;

  if (latestPost) {
    // Read the latest post's markdown file to get full content
    const latestPostPath = path.join(postsDir, files[0]); // files is also sorted newest first
    const latestPostContent = fs.readFileSync(latestPostPath, 'utf-8');
    const { metadata, content: markdown } = parseFrontmatter(latestPostContent);
    const htmlContent = markdownToHTML(markdown);

    indexContent = `
      <div class="latest-story">
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
        <h1>The many travels of the Black Captain</h1>
        <p class="site-description">A journey of healing, discovery, and resilience through the written word.</p>
        <p>No tales yet. The Captain's first voyage begins soon...</p>
      </div>
    `;
  }

  const indexPage = generatePage('', indexContent);
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

  // Build knowledge base sections
  console.log('\n📚 Building knowledge base sections...\n');

  const treasureTrove = buildKnowledgeBase(
    'treasure-trove',
    'The Captain\'s Treasure Trove',
    'Knowledge and wisdom from the Captain\'s journeys - where science meets the sea. Inspired by the "Schlaues Buch" from Donald Duck comics, these articles explain fascinating concepts in both scientific and Captain\'s terms.'
  );

  const avianStudies = buildKnowledgeBase(
    'avian-studies',
    'The Captain\'s Avian Studies',
    'The Black Captain is an avid admirer of our feathered friends. These articles explore the birds encountered on his travels, combining ornithological science with maritime observation.'
  );

  // Build static pages
  console.log('\n📄 Building static pages...\n');
  const pagesDir = path.join(__dirname, 'pages');
  let pageCount = 0;

  if (fs.existsSync(pagesDir)) {
    const pageFiles = fs.readdirSync(pagesDir)
      .filter(file => file.endsWith('.md'))
      .sort();

    pageFiles.forEach(file => {
      const filePath = path.join(pagesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const { metadata, content: markdown } = parseFrontmatter(content);

      // Generate HTML
      const htmlContent = markdownToHTML(markdown);
      const title = metadata.title || file.replace('.md', '').replace(/-/g, ' ');
      const slug = file.replace('.md', '');

      // Generate page
      const page = generatePage(title, htmlContent, metadata);

      // Write to public directory
      const outputPath = path.join(publicDir, `${slug}.html`);
      fs.writeFileSync(outputPath, page);

      console.log(`✓ Built: pages/${file} → ${slug}.html`);
      pageCount++;
    });
  }

  console.log(`\n🏴‍☠️ Build complete! ${posts.length} post(s), ${treasureTrove.length} treasure trove article(s), ${avianStudies.length} avian study article(s), and ${pageCount} static page(s) published.\n`);
  console.log('Deploy the "public" directory to Cloudflare Pages.');
}

// Run build
build();
