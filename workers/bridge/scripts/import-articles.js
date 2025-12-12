#!/usr/bin/env node
/**
 * Import existing markdown articles into D1 database
 * Run: node scripts/import-articles.js
 *
 * Then execute the generated SQL:
 * pnpm exec wrangler d1 execute captain-bridge-db --remote --file=scripts/import-articles.sql
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROJECT_ROOT = path.resolve(__dirname, '../../..');

// Article types and their directories
const ARTICLE_TYPES = {
  'post': 'posts',
  'treasure-trove': 'treasure-trove',
  'avian-studies': 'avian-studies',
  'page': 'pages'
};

// Parse frontmatter from markdown file
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { metadata: {}, content: content };
  }

  const frontmatterText = match[1];
  const body = match[2];
  const metadata = {};

  // Parse YAML-like frontmatter
  frontmatterText.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      metadata[key] = value;
    }
  });

  return { metadata, content: body };
}

// Convert date string to Unix timestamp
function parseDate(dateStr) {
  if (!dateStr) return null;

  // Try parsing various date formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return Math.floor(date.getTime() / 1000);
  }
  return null;
}

// Generate slug from filename
function getSlugFromFilename(filename, type) {
  const basename = path.basename(filename, '.md');

  if (type === 'post') {
    // Posts use date-based slugs: 2025-11-18-the-beginning -> 2025-11-18-the-beginning
    return basename;
  } else if (type === 'page') {
    // Pages use simple slugs
    return basename;
  } else {
    // treasure-trove and avian-studies use their directory as prefix
    return basename;
  }
}

// Escape SQL string
function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + str.replace(/'/g, "''") + "'";
}

// Generate INSERT statement
function generateInsert(article) {
  const id = crypto.randomUUID();
  const metadataJson = JSON.stringify(article.metadata);

  return `INSERT OR REPLACE INTO articles (id, slug, type, title, content, metadata, status, publish_at, created_at, updated_at)
VALUES (
  ${escapeSql(id)},
  ${escapeSql(article.slug)},
  ${escapeSql(article.type)},
  ${escapeSql(article.title)},
  ${escapeSql(article.content)},
  ${escapeSql(metadataJson)},
  'published',
  ${article.publishAt || 'NULL'},
  ${article.createdAt || 'unixepoch()'},
  unixepoch()
);`;
}

// Main import function
function importArticles() {
  const articles = [];
  const errors = [];

  for (const [type, dir] of Object.entries(ARTICLE_TYPES)) {
    const dirPath = path.join(PROJECT_ROOT, dir);

    if (!fs.existsSync(dirPath)) {
      console.log(`Directory not found: ${dirPath}`);
      continue;
    }

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
    console.log(`Found ${files.length} files in ${dir}/`);

    for (const file of files) {
      try {
        const filePath = path.join(dirPath, file);
        const rawContent = fs.readFileSync(filePath, 'utf8');
        const { metadata, content } = parseFrontmatter(rawContent);

        const slug = getSlugFromFilename(file, type);
        const title = metadata.title || slug;
        const publishAt = parseDate(metadata.date);

        articles.push({
          type,
          slug,
          title,
          content: content.trim(),
          metadata,
          publishAt,
          createdAt: publishAt
        });

        console.log(`  ✓ ${file} -> ${slug}`);
      } catch (err) {
        errors.push({ file, error: err.message });
        console.error(`  ✗ ${file}: ${err.message}`);
      }
    }
  }

  // Generate SQL file
  const sqlStatements = [
    '-- Import existing articles into D1',
    '-- Generated: ' + new Date().toISOString(),
    '',
    '-- First, add publish_at column if it doesn\'t exist (migration)',
    'ALTER TABLE articles ADD COLUMN publish_at INTEGER;',
    '',
    '-- Import articles',
    ...articles.map(generateInsert),
    '',
    '-- Done!'
  ];

  const sqlPath = path.join(__dirname, 'import-articles.sql');
  fs.writeFileSync(sqlPath, sqlStatements.join('\n\n'));

  console.log('');
  console.log('='.repeat(50));
  console.log(`Generated SQL file: ${sqlPath}`);
  console.log(`Total articles: ${articles.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log('');
  console.log('To import into D1, run:');
  console.log('');
  console.log('  pnpm exec wrangler d1 execute captain-bridge-db --remote --file=scripts/import-articles.sql');
  console.log('');
  console.log('='.repeat(50));

  if (errors.length > 0) {
    console.log('');
    console.log('Errors:');
    errors.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`);
    });
  }
}

importArticles();
