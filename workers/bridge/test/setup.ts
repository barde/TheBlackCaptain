/**
 * Test setup file for Captain's Bridge
 * Initializes database schema before tests run
 */

import { env } from 'cloudflare:test';
import { beforeAll, beforeEach } from 'vitest';

// Initialize database schema once before all tests
beforeAll(async () => {
  // Create users table
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, display_name TEXT NOT NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch()))`).run();

  // Create credentials table
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS credentials (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, public_key BLOB NOT NULL, counter INTEGER NOT NULL DEFAULT 0, device_type TEXT, backed_up INTEGER DEFAULT 0, transports TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), last_used_at INTEGER)`).run();

  // Create index on credentials
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_credentials_user ON credentials(user_id)`).run();

  // Create articles table
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS articles (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, type TEXT NOT NULL CHECK(type IN ('post', 'treasure-trove', 'avian-studies', 'page')), title TEXT NOT NULL, content TEXT NOT NULL, metadata TEXT, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'scheduled')), publish_at INTEGER, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()))`).run();

  // Create indexes on articles
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_articles_type ON articles(type)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_articles_publish_at ON articles(publish_at)`).run();

  // Create setup_codes table
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS setup_codes (code TEXT PRIMARY KEY, used INTEGER DEFAULT 0, created_at INTEGER NOT NULL DEFAULT (unixepoch()), used_at INTEGER)`).run();
});

// Clean up tables before each test for isolation
beforeEach(async () => {
  // Clear all data but keep schema
  await env.DB.exec('DELETE FROM credentials');
  await env.DB.exec('DELETE FROM users');
  await env.DB.exec('DELETE FROM articles');
  await env.DB.exec('DELETE FROM setup_codes');
});
