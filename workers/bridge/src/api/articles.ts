/**
 * Articles API for Captain's Bridge
 * CRUD operations for blog posts, treasure trove, avian studies, and pages
 */

import type { Env } from '../index';
import type { Session } from '../auth/session';

interface Article {
  id: string;
  slug: string;
  type: 'post' | 'treasure-trove' | 'avian-studies' | 'page';
  title: string;
  content: string;
  metadata: string | null;
  status: 'draft' | 'published' | 'scheduled';
  publish_at: number | null;
  created_at: number;
  updated_at: number;
}

interface ArticleInput {
  slug?: string;
  type?: Article['type'];
  title?: string;
  content?: string;
  metadata?: Record<string, unknown>;
  status?: Article['status'];
  publish_at?: number | null;
}

/**
 * Handle all article routes
 */
export async function handleArticles(
  request: Request,
  env: Env,
  path: string,
  session: Session
): Promise<Response> {
  const method = request.method;

  // GET /api/articles - List all articles
  if (path === '/api/articles' && method === 'GET') {
    return listArticles(request, env);
  }

  // POST /api/articles - Create new article
  if (path === '/api/articles' && method === 'POST') {
    return createArticle(request, env);
  }

  // Single article operations: /api/articles/:slug
  const slugMatch = path.match(/^\/api\/articles\/(.+)$/);
  if (slugMatch) {
    const slug = decodeURIComponent(slugMatch[1]);

    // GET /api/articles/:slug - Get single article
    if (method === 'GET') {
      return getArticle(slug, env);
    }

    // PUT /api/articles/:slug - Update article
    if (method === 'PUT') {
      return updateArticle(slug, request, env);
    }

    // DELETE /api/articles/:slug - Delete article
    if (method === 'DELETE') {
      return deleteArticle(slug, env);
    }
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * List all articles with optional filtering
 */
async function listArticles(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const status = url.searchParams.get('status');

  let query = 'SELECT * FROM articles WHERE 1=1';
  const params: string[] = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  const stmt = env.DB.prepare(query);
  const result = params.length > 0
    ? await stmt.bind(...params).all<Article>()
    : await stmt.all<Article>();

  // Parse metadata JSON for each article
  const articles = result.results?.map((article) => ({
    ...article,
    metadata: article.metadata ? JSON.parse(article.metadata) : null,
  })) || [];

  return new Response(JSON.stringify({ articles }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Get a single article by slug
 */
async function getArticle(slug: string, env: Env): Promise<Response> {
  const article = await env.DB.prepare(
    'SELECT * FROM articles WHERE slug = ?'
  ).bind(slug).first<Article>();

  if (!article) {
    return new Response(JSON.stringify({ error: 'Article not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    ...article,
    metadata: article.metadata ? JSON.parse(article.metadata) : null,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Create a new article
 */
async function createArticle(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as ArticleInput;

  // Validate required fields
  if (!body.title || !body.type) {
    return new Response(JSON.stringify({ error: 'Title and type are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = crypto.randomUUID();
  const slug = body.slug || generateSlug(body.title, body.type);
  const content = body.content || '';
  const metadata = body.metadata ? JSON.stringify(body.metadata) : null;
  const status = body.status || 'draft';
  const publishAt = body.publish_at || null;

  // Validate scheduled publishing
  if (status === 'scheduled' && !publishAt) {
    return new Response(JSON.stringify({ error: 'Scheduled articles require a publish_at date' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check for duplicate slug
  const existing = await env.DB.prepare(
    'SELECT id FROM articles WHERE slug = ?'
  ).bind(slug).first();

  if (existing) {
    return new Response(JSON.stringify({ error: 'An article with this slug already exists' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await env.DB.prepare(`
    INSERT INTO articles (id, slug, type, title, content, metadata, status, publish_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, slug, body.type, body.title, content, metadata, status, publishAt).run();

  const article = await env.DB.prepare(
    'SELECT * FROM articles WHERE id = ?'
  ).bind(id).first<Article>();

  return new Response(JSON.stringify({
    ...article,
    metadata: article?.metadata ? JSON.parse(article.metadata) : null,
  }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Update an existing article
 */
async function updateArticle(slug: string, request: Request, env: Env): Promise<Response> {
  const body = await request.json() as ArticleInput;

  // Check article exists
  const existing = await env.DB.prepare(
    'SELECT * FROM articles WHERE slug = ?'
  ).bind(slug).first<Article>();

  if (!existing) {
    return new Response(JSON.stringify({ error: 'Article not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Build update query dynamically
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (body.title !== undefined) {
    updates.push('title = ?');
    values.push(body.title);
  }

  if (body.content !== undefined) {
    updates.push('content = ?');
    values.push(body.content);
  }

  if (body.metadata !== undefined) {
    updates.push('metadata = ?');
    values.push(JSON.stringify(body.metadata));
  }

  if (body.status !== undefined) {
    updates.push('status = ?');
    values.push(body.status);
  }

  if (body.publish_at !== undefined) {
    updates.push('publish_at = ?');
    values.push(body.publish_at);
  }

  // Validate scheduled publishing
  const finalStatus = body.status !== undefined ? body.status : existing.status;
  const finalPublishAt = body.publish_at !== undefined ? body.publish_at : existing.publish_at;
  if (finalStatus === 'scheduled' && !finalPublishAt) {
    return new Response(JSON.stringify({ error: 'Scheduled articles require a publish_at date' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (body.slug !== undefined && body.slug !== slug) {
    // Check new slug doesn't exist
    const slugExists = await env.DB.prepare(
      'SELECT id FROM articles WHERE slug = ? AND id != ?'
    ).bind(body.slug, existing.id).first();

    if (slugExists) {
      return new Response(JSON.stringify({ error: 'An article with this slug already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    updates.push('slug = ?');
    values.push(body.slug);
  }

  if (updates.length === 0) {
    return new Response(JSON.stringify({ error: 'No fields to update' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  updates.push('updated_at = unixepoch()');
  values.push(existing.id);

  await env.DB.prepare(
    `UPDATE articles SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...values).run();

  // Get updated article
  const newSlug = body.slug || slug;
  const article = await env.DB.prepare(
    'SELECT * FROM articles WHERE slug = ?'
  ).bind(newSlug).first<Article>();

  return new Response(JSON.stringify({
    ...article,
    metadata: article?.metadata ? JSON.parse(article.metadata) : null,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Delete an article
 */
async function deleteArticle(slug: string, env: Env): Promise<Response> {
  const existing = await env.DB.prepare(
    'SELECT id FROM articles WHERE slug = ?'
  ).bind(slug).first();

  if (!existing) {
    return new Response(JSON.stringify({ error: 'Article not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await env.DB.prepare('DELETE FROM articles WHERE slug = ?').bind(slug).run();

  return new Response(JSON.stringify({ deleted: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Generate a URL-friendly slug from title
 */
function generateSlug(title: string, type: Article['type']): string {
  const today = new Date();
  const datePrefix = today.toISOString().split('T')[0]; // YYYY-MM-DD

  const slugified = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);

  // Posts get date prefix, others don't
  if (type === 'post') {
    return `${datePrefix}-${slugified}`;
  }

  return slugified;
}
