/**
 * Test helpers for Captain's Bridge
 * Provides utilities for creating test data and authenticated requests
 */

import { env } from 'cloudflare:test';

export interface TestUser {
  id: string;
  displayName: string;
  sessionId: string;
  cookie: string;
}

/**
 * Create a test user with an active session
 * Bypasses WebAuthn for testing API endpoints
 */
export async function createTestUser(displayName = 'Test Captain'): Promise<TestUser> {
  const userId = crypto.randomUUID();
  const sessionId = generateSessionId();

  // Create user in database
  await env.DB.prepare(
    'INSERT INTO users (id, display_name) VALUES (?, ?)'
  ).bind(userId, displayName).run();

  // Create session in KV
  const session = {
    userId,
    displayName,
    createdAt: Date.now(),
  };
  await env.SESSIONS.put(`session:${sessionId}`, JSON.stringify(session), {
    expirationTtl: 3600, // 1 hour for tests
  });

  return {
    id: userId,
    displayName,
    sessionId,
    cookie: `bridge_session=${sessionId}`,
  };
}

/**
 * Create an authenticated request with session cookie
 */
export function authRequest(
  url: string,
  user: TestUser,
  options: RequestInit = {}
): Request {
  const headers = new Headers(options.headers);
  headers.set('Cookie', user.cookie);

  return new Request(url, {
    ...options,
    headers,
  });
}

/**
 * Create a test article directly in the database
 */
export async function createTestArticle(
  article: {
    slug?: string;
    type?: 'post' | 'treasure-trove' | 'avian-studies' | 'page';
    title?: string;
    content?: string;
    status?: 'draft' | 'published' | 'scheduled';
    publish_at?: number | null;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<{ id: string; slug: string }> {
  const id = crypto.randomUUID();
  const slug = article.slug || `test-article-${id.slice(0, 8)}`;
  const type = article.type || 'post';
  const title = article.title || 'Test Article';
  const content = article.content || '# Test Content';
  const status = article.status || 'draft';
  const publishAt = article.publish_at ?? null;
  const metadata = article.metadata ? JSON.stringify(article.metadata) : null;

  await env.DB.prepare(`
    INSERT INTO articles (id, slug, type, title, content, metadata, status, publish_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, slug, type, title, content, metadata, status, publishAt).run();

  return { id, slug };
}

/**
 * Generate a cryptographically secure session ID
 */
function generateSessionId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Base URL for test requests
 */
export const BASE_URL = 'https://bridge.blackhoard.com';

/**
 * Helper to make authenticated API requests
 */
export async function apiRequest(
  user: TestUser,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const { SELF } = await import('cloudflare:test');
  return SELF.fetch(authRequest(`${BASE_URL}${path}`, user, options));
}
