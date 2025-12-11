-- Captain's Bridge - D1 Schema
-- Database for the web-based editor at bridge.blackhoard.com

-- Single admin user (the Captain)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Passkey credentials (multiple per user for backup devices)
CREATE TABLE IF NOT EXISTS credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_key BLOB NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  device_type TEXT,
  backed_up INTEGER DEFAULT 0,
  transports TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_used_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_credentials_user ON credentials(user_id);

-- Articles (posts, treasure-trove, avian-studies, pages)
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK(type IN ('post', 'treasure-trove', 'avian-studies', 'page')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_articles_type ON articles(type);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);

-- Setup codes for initial registration (one-time use)
CREATE TABLE IF NOT EXISTS setup_codes (
  code TEXT PRIMARY KEY,
  used INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  used_at INTEGER
);
