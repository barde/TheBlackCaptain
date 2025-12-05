#!/usr/bin/env node

/**
 * Local Link Checker for The Black Captain
 *
 * Checks all internal links in markdown files to ensure they point to valid targets.
 * Run with: node scripts/check-links.js
 *
 * This script checks:
 * - Links to other posts (/posts/*.html or /*.html)
 * - Links to treasure-trove articles (/treasure-trove/*.html)
 * - Links to avian-studies articles (/avian-studies/*.html)
 * - Links to pages (/ships-crew.html, /health.html, etc.)
 * - Links to assets (/assets/*, /images/*)
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, symbol, message) {
  console.log(`${colors[color]}${symbol}${colors.reset} ${message}`);
}

// Extract all internal links from markdown content
function extractLinks(content, filePath) {
  const links = [];
  const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  let lineNumber = 1;
  let lastIndex = 0;

  while ((match = linkRegex.exec(content)) !== null) {
    // Count newlines to get line number
    const textBefore = content.slice(lastIndex, match.index);
    lineNumber += (textBefore.match(/\n/g) || []).length;
    lastIndex = match.index;

    const [fullMatch, text, url] = match;

    // Skip external links, anchors-only, and mailto
    if (url.startsWith('http://') || url.startsWith('https://') ||
        url.startsWith('#') || url.startsWith('mailto:')) {
      continue;
    }

    links.push({
      text,
      url,
      line: lineNumber,
      file: filePath
    });
  }

  return links;
}

// Check if a link target exists
function checkLink(link) {
  let targetPath = link.url;

  // Remove anchor from URL for file checking
  const anchorIndex = targetPath.indexOf('#');
  let anchor = null;
  if (anchorIndex !== -1) {
    anchor = targetPath.slice(anchorIndex + 1);
    targetPath = targetPath.slice(0, anchorIndex);
  }

  // Handle root-relative paths
  if (targetPath.startsWith('/')) {
    targetPath = targetPath.slice(1);
  }

  // Check in public directory
  const fullPath = path.join(PUBLIC, targetPath);

  if (!fs.existsSync(fullPath)) {
    return {
      valid: false,
      reason: `File not found: ${fullPath}`
    };
  }

  // If there's an anchor, check if it exists in the HTML file
  if (anchor && targetPath.endsWith('.html')) {
    const htmlContent = fs.readFileSync(fullPath, 'utf8');
    // Check for id="anchor" or id='anchor'
    const anchorRegex = new RegExp(`id=["']${anchor}["']`, 'i');
    if (!anchorRegex.test(htmlContent)) {
      return {
        valid: false,
        reason: `Anchor #${anchor} not found in ${targetPath}`
      };
    }
  }

  return { valid: true };
}

async function main() {
  console.log('\n🏴‍☠️ The Black Captain - Link Checker\n');

  // First, build the site to ensure public/ is up to date
  if (!fs.existsSync(PUBLIC)) {
    log('yellow', '⚠', 'Public directory not found. Run "pnpm run build" first.');
    process.exit(1);
  }

  // Find all markdown files
  const patterns = [
    'posts/*.md',
    'pages/*.md',
    'treasure-trove/*.md',
    'avian-studies/*.md'
  ];

  let allLinks = [];
  let filesChecked = 0;

  for (const pattern of patterns) {
    const files = glob.sync(path.join(ROOT, pattern));

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(ROOT, file);
      const links = extractLinks(content, relativePath);
      allLinks = allLinks.concat(links);
      filesChecked++;
    }
  }

  console.log(`Checking ${allLinks.length} internal links across ${filesChecked} files...\n`);

  // Check each link
  const brokenLinks = [];

  for (const link of allLinks) {
    const result = checkLink(link);
    if (!result.valid) {
      brokenLinks.push({
        ...link,
        reason: result.reason
      });
    }
  }

  // Report results
  if (brokenLinks.length === 0) {
    log('green', '✓', 'All internal links are valid!\n');
    process.exit(0);
  } else {
    log('red', '✗', `Found ${brokenLinks.length} broken link(s):\n`);

    for (const link of brokenLinks) {
      console.log(`  ${colors.blue}${link.file}:${link.line}${colors.reset}`);
      console.log(`    [${link.text}](${link.url})`);
      console.log(`    ${colors.red}→ ${link.reason}${colors.reset}\n`);
    }

    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
