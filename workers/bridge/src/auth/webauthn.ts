/**
 * WebAuthn/Passkey Authentication for Captain's Bridge
 * Uses SimpleWebAuthn for credential management
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/types';
import type { Env } from '../index';
import { createSession, deleteSession } from './session';

const CHALLENGE_TTL = 60 * 5; // 5 minutes

interface StoredCredential {
  id: string;
  publicKey: Uint8Array;
  counter: number;
  deviceType: string;
  backedUp: boolean;
  transports: AuthenticatorTransportFuture[];
}

/**
 * Handle all authentication routes
 */
export async function handleAuth(
  request: Request,
  env: Env,
  path: string
): Promise<Response> {
  // Registration flow
  if (path === '/api/auth/register/options') {
    return handleRegistrationOptions(request, env);
  }
  if (path === '/api/auth/register/verify') {
    return handleRegistrationVerify(request, env);
  }

  // Authentication flow
  if (path === '/api/auth/login/options') {
    return handleLoginOptions(request, env);
  }
  if (path === '/api/auth/login/verify') {
    return handleLoginVerify(request, env);
  }

  // Logout
  if (path === '/api/auth/logout') {
    return handleLogout(request, env);
  }

  // Check if setup is needed
  if (path === '/api/auth/status') {
    return handleAuthStatus(env);
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Check if the system needs initial setup
 */
async function handleAuthStatus(env: Env): Promise<Response> {
  const result = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
  const needsSetup = !result || result.count === 0;

  return new Response(JSON.stringify({ needsSetup }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Generate registration options for a new passkey
 */
async function handleRegistrationOptions(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json() as { displayName?: string; setupCode?: string };

  // Check if this is initial setup or adding a new passkey
  const userCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
  const isInitialSetup = !userCount || userCount.count === 0;

  if (isInitialSetup) {
    // Require setup code for initial registration
    if (!body.setupCode) {
      return new Response(JSON.stringify({ error: 'Setup code required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate setup code
    const code = await env.DB.prepare(
      'SELECT * FROM setup_codes WHERE code = ? AND used = 0'
    ).bind(body.setupCode).first();

    if (!code) {
      return new Response(JSON.stringify({ error: 'Invalid or used setup code' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Generate user ID
  const userId = crypto.randomUUID();
  const displayName = body.displayName || 'The Captain';

  // Get existing credentials for this user (if any)
  const existingCredentials = await env.DB.prepare(
    'SELECT id FROM credentials WHERE user_id = ?'
  ).bind(userId).all<{ id: string }>();

  const excludeCredentials = existingCredentials.results?.map((cred) => ({
    id: cred.id,
    transports: ['internal', 'hybrid'] as AuthenticatorTransportFuture[],
  })) || [];

  const options = await generateRegistrationOptions({
    rpName: env.RP_NAME,
    rpID: env.RP_ID,
    userName: displayName,
    userDisplayName: displayName,
    attestationType: 'none',
    excludeCredentials,
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform',
    },
    supportedAlgorithmIDs: [-7, -257], // ES256 and RS256
  });

  // Store challenge and user info for verification
  await env.SESSIONS.put(
    `challenge:${options.challenge}`,
    JSON.stringify({
      userId,
      displayName,
      setupCode: body.setupCode,
      type: 'registration',
    }),
    { expirationTtl: CHALLENGE_TTL }
  );

  return new Response(JSON.stringify(options), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Verify registration response and store credential
 */
async function handleRegistrationVerify(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json() as RegistrationResponseJSON;

  // Get challenge data
  const challengeData = await env.SESSIONS.get(`challenge:${body.response.clientDataJSON}`);

  // Try to find challenge by iterating (since we don't have the raw challenge)
  // This is a workaround - in production you'd pass the challenge back
  let storedChallenge: string | null = null;
  let challengeInfo: { userId: string; displayName: string; setupCode?: string } | null = null;

  // The challenge is embedded in clientDataJSON, we need to extract it
  const clientData = JSON.parse(atob(body.response.clientDataJSON));
  const challenge = clientData.challenge;

  const stored = await env.SESSIONS.get(`challenge:${challenge}`);
  if (stored) {
    storedChallenge = challenge;
    challengeInfo = JSON.parse(stored);
  }

  if (!storedChallenge || !challengeInfo) {
    return new Response(JSON.stringify({ error: 'Challenge expired or invalid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: storedChallenge,
      expectedOrigin: env.RP_ORIGIN,
      expectedRPID: env.RP_ID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return new Response(JSON.stringify({ error: 'Verification failed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    // Create user if needed
    await env.DB.prepare(
      'INSERT OR IGNORE INTO users (id, display_name) VALUES (?, ?)'
    ).bind(challengeInfo.userId, challengeInfo.displayName).run();

    // Store credential
    await env.DB.prepare(`
      INSERT INTO credentials (id, user_id, public_key, counter, device_type, backed_up, transports)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      credential.id,
      challengeInfo.userId,
      credential.publicKey,
      credential.counter,
      credentialDeviceType,
      credentialBackedUp ? 1 : 0,
      JSON.stringify(credential.transports || [])
    ).run();

    // Mark setup code as used
    if (challengeInfo.setupCode) {
      await env.DB.prepare(
        'UPDATE setup_codes SET used = 1, used_at = unixepoch() WHERE code = ?'
      ).bind(challengeInfo.setupCode).run();
    }

    // Delete challenge
    await env.SESSIONS.delete(`challenge:${storedChallenge}`);

    // Create session
    const { cookie } = await createSession(env, challengeInfo.userId, challengeInfo.displayName);

    return new Response(JSON.stringify({ verified: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
      },
    });
  } catch (error) {
    console.error('Registration verification error:', error);
    return new Response(JSON.stringify({ error: 'Verification failed' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Generate authentication options for login
 */
async function handleLoginOptions(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get all registered credentials
  const credentials = await env.DB.prepare(
    'SELECT c.id, c.transports FROM credentials c JOIN users u ON c.user_id = u.id'
  ).all<{ id: string; transports: string }>();

  const allowCredentials = credentials.results?.map((cred) => ({
    id: cred.id,
    transports: JSON.parse(cred.transports || '[]') as AuthenticatorTransportFuture[],
  })) || [];

  const options = await generateAuthenticationOptions({
    rpID: env.RP_ID,
    allowCredentials,
    userVerification: 'preferred',
  });

  // Store challenge
  await env.SESSIONS.put(
    `challenge:${options.challenge}`,
    JSON.stringify({ type: 'authentication' }),
    { expirationTtl: CHALLENGE_TTL }
  );

  return new Response(JSON.stringify(options), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Verify authentication response and create session
 */
async function handleLoginVerify(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json() as AuthenticationResponseJSON;

  // Extract challenge from clientDataJSON
  const clientData = JSON.parse(atob(body.response.clientDataJSON));
  const challenge = clientData.challenge;

  const stored = await env.SESSIONS.get(`challenge:${challenge}`);
  if (!stored) {
    return new Response(JSON.stringify({ error: 'Challenge expired or invalid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get credential from database
  const credential = await env.DB.prepare(`
    SELECT c.*, u.display_name
    FROM credentials c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).bind(body.id).first<{
    id: string;
    user_id: string;
    public_key: ArrayBuffer;
    counter: number;
    transports: string;
    display_name: string;
  }>();

  if (!credential) {
    return new Response(JSON.stringify({ error: 'Credential not found' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: env.RP_ORIGIN,
      expectedRPID: env.RP_ID,
      credential: {
        id: credential.id,
        publicKey: new Uint8Array(credential.public_key),
        counter: credential.counter,
        transports: JSON.parse(credential.transports || '[]'),
      },
    });

    if (!verification.verified) {
      return new Response(JSON.stringify({ error: 'Verification failed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update counter
    await env.DB.prepare(
      'UPDATE credentials SET counter = ?, last_used_at = unixepoch() WHERE id = ?'
    ).bind(verification.authenticationInfo.newCounter, credential.id).run();

    // Delete challenge
    await env.SESSIONS.delete(`challenge:${challenge}`);

    // Create session
    const { cookie } = await createSession(env, credential.user_id, credential.display_name);

    return new Response(JSON.stringify({ verified: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
      },
    });
  } catch (error) {
    console.error('Authentication verification error:', error);
    return new Response(JSON.stringify({ error: 'Verification failed' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Handle logout
 */
async function handleLogout(request: Request, env: Env): Promise<Response> {
  const cookie = await deleteSession(request, env);

  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie,
    },
  });
}
