/**
 * Captain's Bridge - Web-based Editor for The Black Captain
 * Main entry point for the Cloudflare Worker
 */

import { handleAuth } from './auth/webauthn';
import { handleArticles } from './api/articles';
import { handleAI } from './api/ai';
import { handleDeploy } from './api/deploy';
import { getSession } from './auth/session';
import { loginPage, editorPage, setupPage } from './ui/pages';

export interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  ANTHROPIC_API_KEY: string;
  GITHUB_TOKEN: string;
  RP_ID: string;
  RP_NAME: string;
  RP_ORIGIN: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for API requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.RP_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Static assets
      if (path.startsWith('/static/')) {
        return handleStatic(path, env);
      }

      // Auth routes (no session required)
      if (path.startsWith('/api/auth/')) {
        const response = await handleAuth(request, env, path);
        return addCorsHeaders(response, corsHeaders);
      }

      // Setup page (for initial passkey registration)
      if (path === '/setup') {
        return new Response(setupPage(env), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      // Login page
      if (path === '/login' || path === '/') {
        // Check if already logged in
        const session = await getSession(request, env);
        if (session) {
          return Response.redirect(`${env.RP_ORIGIN}/editor`, 302);
        }
        return new Response(loginPage(env), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      // Protected routes - require authentication
      const session = await getSession(request, env);
      if (!session) {
        if (path.startsWith('/api/')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
        return Response.redirect(`${env.RP_ORIGIN}/login`, 302);
      }

      // Editor page
      if (path === '/editor') {
        return new Response(editorPage(env, session), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      // Article API
      if (path.startsWith('/api/articles')) {
        const response = await handleArticles(request, env, path, session);
        return addCorsHeaders(response, corsHeaders);
      }

      // AI API
      if (path.startsWith('/api/ai/')) {
        const response = await handleAI(request, env, path, session);
        return addCorsHeaders(response, corsHeaders);
      }

      // Deploy API
      if (path === '/api/deploy') {
        const response = await handleDeploy(request, env, session);
        return addCorsHeaders(response, corsHeaders);
      }

      // 404
      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
  },
};

function addCorsHeaders(response: Response, corsHeaders: Record<string, string>): Response {
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    newHeaders.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

async function handleStatic(path: string, env: Env): Promise<Response> {
  // Static files are embedded in the worker
  const staticFiles: Record<string, { content: string; type: string }> = {
    '/static/app.js': { content: (await import('./ui/static/app')).default, type: 'application/javascript' },
    '/static/style.css': { content: (await import('./ui/static/style')).default, type: 'text/css' },
  };

  const file = staticFiles[path];
  if (file) {
    return new Response(file.content, {
      headers: {
        'Content-Type': file.type,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  return new Response('Not Found', { status: 404 });
}
