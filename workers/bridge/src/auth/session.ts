/**
 * Session Management for Captain's Bridge
 * Uses KV for session storage with 24-hour TTL
 */

import type { Env } from '../index';

export interface Session {
  userId: string;
  displayName: string;
  createdAt: number;
}

const SESSION_TTL = 60 * 60 * 24; // 24 hours in seconds
const SESSION_COOKIE = 'bridge_session';

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
 * Create a new session for a user
 */
export async function createSession(
  env: Env,
  userId: string,
  displayName: string
): Promise<{ sessionId: string; cookie: string }> {
  const sessionId = generateSessionId();
  const session: Session = {
    userId,
    displayName,
    createdAt: Date.now(),
  };

  await env.SESSIONS.put(`session:${sessionId}`, JSON.stringify(session), {
    expirationTtl: SESSION_TTL,
  });

  const cookie = `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL}`;

  return { sessionId, cookie };
}

/**
 * Get session from request cookies
 */
export async function getSession(request: Request, env: Env): Promise<Session | null> {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  const cookies = parseCookies(cookieHeader);
  const sessionId = cookies[SESSION_COOKIE];
  if (!sessionId) return null;

  const sessionData = await env.SESSIONS.get(`session:${sessionId}`);
  if (!sessionData) return null;

  try {
    return JSON.parse(sessionData) as Session;
  } catch {
    return null;
  }
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(request: Request, env: Env): Promise<string> {
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    const sessionId = cookies[SESSION_COOKIE];
    if (sessionId) {
      await env.SESSIONS.delete(`session:${sessionId}`);
    }
  }

  // Return cookie that expires immediately
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

/**
 * Parse cookie header into key-value pairs
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  const pairs = cookieHeader.split(';');

  for (const pair of pairs) {
    const [name, ...rest] = pair.trim().split('=');
    if (name && rest.length > 0) {
      cookies[name] = rest.join('=');
    }
  }

  return cookies;
}
