#!/usr/bin/env node

/**
 * The Black Captain Blog Builder
 * Main entry point - orchestrates the build process
 */

const fs = require('fs');
const config = require('./config');
const { buildAssets } = require('./builders/assets');
const { buildPosts, buildIndexPage, buildArchivePage } = require('./builders/posts');
const { buildPages } = require('./builders/pages');
const { buildAllKnowledgeBase } = require('./builders/knowledge-base');

/**
 * Main build function
 */
function build() {
  console.log('🏴‍☠️ Building The Black Captain blog...\n');

  // Create public directory if it doesn't exist
  if (!fs.existsSync(config.paths.public)) {
    fs.mkdirSync(config.paths.public, { recursive: true });
  }

  // Copy static assets
  buildAssets();

  // Build all posts
  const posts = buildPosts();

  // Build index page with latest post
  buildIndexPage(posts);

  // Build archive page
  buildArchivePage(posts);

  // Build knowledge base sections
  console.log('\n📚 Building knowledge base sections...\n');
  const knowledgeBase = buildAllKnowledgeBase();

  // Build static pages
  console.log('\n📄 Building static pages...\n');
  const pageCount = buildPages();

  // Calculate totals
  const treasureTroveCount = knowledgeBase['treasure-trove']?.length || 0;
  const avianStudiesCount = knowledgeBase['avian-studies']?.length || 0;

  console.log(`\n🏴‍☠️ Build complete! ${posts.length} post(s), ${treasureTroveCount} treasure trove article(s), ${avianStudiesCount} avian study article(s), and ${pageCount} static page(s) published.\n`);
  console.log('Deploy the "public" directory to Cloudflare Pages.');
}

// Run build if called directly
if (require.main === module) {
  build();
}

module.exports = { build };
