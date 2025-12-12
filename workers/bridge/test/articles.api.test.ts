/**
 * Articles API Tests for Captain's Bridge
 * Tests CRUD operations for blog articles
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SELF, env } from 'cloudflare:test';
import {
  createTestUser,
  createTestArticle,
  apiRequest,
  BASE_URL,
  type TestUser,
} from './helpers';

describe('Articles API', () => {
  let user: TestUser;

  beforeEach(async () => {
    user = await createTestUser();
  });

  describe('Authentication', () => {
    it('returns 401 for unauthenticated requests', async () => {
      const response = await SELF.fetch(`${BASE_URL}/api/articles`);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/articles', () => {
    it('returns empty list when no articles exist', async () => {
      const response = await apiRequest(user, '/api/articles');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.articles).toEqual([]);
    });

    it('returns all articles', async () => {
      await createTestArticle({ title: 'First Post', slug: 'first-post' });
      await createTestArticle({ title: 'Second Post', slug: 'second-post' });

      const response = await apiRequest(user, '/api/articles');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.articles).toHaveLength(2);
    });

    it('filters by type', async () => {
      await createTestArticle({ type: 'post', slug: 'my-post' });
      await createTestArticle({ type: 'avian-studies', slug: 'my-bird' });

      const response = await apiRequest(user, '/api/articles?type=post');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.articles).toHaveLength(1);
      expect(data.articles[0].type).toBe('post');
    });

    it('filters by status', async () => {
      await createTestArticle({ status: 'draft', slug: 'draft-article' });
      await createTestArticle({ status: 'published', slug: 'published-article' });

      const response = await apiRequest(user, '/api/articles?status=published');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.articles).toHaveLength(1);
      expect(data.articles[0].status).toBe('published');
    });
  });

  describe('POST /api/articles', () => {
    it('creates a new article', async () => {
      const response = await apiRequest(user, '/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'A New Tale',
          type: 'post',
          content: '# The Beginning\n\nOnce upon a time...',
        }),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.title).toBe('A New Tale');
      expect(data.type).toBe('post');
      expect(data.status).toBe('draft');
      expect(data.slug).toMatch(/^\d{4}-\d{2}-\d{2}-a-new-tale$/);
    });

    it('requires title and type', async () => {
      const response = await apiRequest(user, '/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'No title or type' }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Title and type are required');
    });

    it('prevents duplicate slugs', async () => {
      await createTestArticle({ slug: '2024-01-01-existing-post' });

      const response = await apiRequest(user, '/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Post',
          type: 'post',
          slug: '2024-01-01-existing-post',
        }),
      });

      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data.error).toBe('An article with this slug already exists');
    });

    it('generates correct slug for posts (with date prefix)', async () => {
      const response = await apiRequest(user, '/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'My Post Title',
          type: 'post',
        }),
      });

      const data = await response.json();
      // Posts get YYYY-MM-DD prefix
      expect(data.slug).toMatch(/^\d{4}-\d{2}-\d{2}-my-post-title$/);
    });

    it('generates correct slug for pages (no date prefix)', async () => {
      const response = await apiRequest(user, '/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'About Page',
          type: 'page',
        }),
      });

      const data = await response.json();
      // Pages don't get date prefix
      expect(data.slug).toBe('about-page');
    });

    it('stores metadata as JSON', async () => {
      const response = await apiRequest(user, '/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Article with Metadata',
          type: 'post',
          metadata: {
            description: 'A test description',
            tags: ['test', 'example'],
          },
        }),
      });

      const data = await response.json();
      expect(data.metadata).toEqual({
        description: 'A test description',
        tags: ['test', 'example'],
      });
    });
  });

  describe('GET /api/articles/:slug', () => {
    it('returns a single article', async () => {
      const { slug } = await createTestArticle({
        slug: 'my-test-article',
        title: 'My Test Article',
        content: '# Hello World',
      });

      const response = await apiRequest(user, `/api/articles/${slug}`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.slug).toBe('my-test-article');
      expect(data.title).toBe('My Test Article');
      expect(data.content).toBe('# Hello World');
    });

    it('returns 404 for non-existent article', async () => {
      const response = await apiRequest(user, '/api/articles/does-not-exist');
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe('Article not found');
    });

    it('handles URL-encoded slugs', async () => {
      await createTestArticle({ slug: 'article-with-special-chars' });

      const response = await apiRequest(
        user,
        `/api/articles/${encodeURIComponent('article-with-special-chars')}`
      );
      expect(response.status).toBe(200);
    });
  });

  describe('PUT /api/articles/:slug', () => {
    it('updates article title', async () => {
      const { slug } = await createTestArticle({
        slug: 'update-test',
        title: 'Original Title',
      });

      const response = await apiRequest(user, `/api/articles/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title' }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.title).toBe('Updated Title');
    });

    it('updates article content', async () => {
      const { slug } = await createTestArticle({
        slug: 'content-update-test',
        content: 'Original content',
      });

      const response = await apiRequest(user, `/api/articles/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Updated content' }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.content).toBe('Updated content');
    });

    it('updates article status', async () => {
      const { slug } = await createTestArticle({
        slug: 'status-update-test',
        status: 'draft',
      });

      const response = await apiRequest(user, `/api/articles/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('published');
    });

    it('allows changing slug', async () => {
      const { slug } = await createTestArticle({
        slug: 'old-slug',
        title: 'Test Article',
      });

      const response = await apiRequest(user, `/api/articles/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: 'new-slug' }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.slug).toBe('new-slug');

      // Verify old slug no longer works
      const oldResponse = await apiRequest(user, `/api/articles/${slug}`);
      expect(oldResponse.status).toBe(404);
    });

    it('prevents duplicate slug on update', async () => {
      await createTestArticle({ slug: 'existing-slug' });
      const { slug } = await createTestArticle({ slug: 'my-article' });

      const response = await apiRequest(user, `/api/articles/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: 'existing-slug' }),
      });

      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data.error).toBe('An article with this slug already exists');
    });

    it('returns 404 for non-existent article', async () => {
      const response = await apiRequest(user, '/api/articles/does-not-exist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Title' }),
      });

      expect(response.status).toBe(404);
    });

    it('returns 400 when no fields provided', async () => {
      const { slug } = await createTestArticle({ slug: 'no-update-test' });

      const response = await apiRequest(user, `/api/articles/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('No fields to update');
    });
  });

  describe('DELETE /api/articles/:slug', () => {
    it('deletes an article', async () => {
      const { slug } = await createTestArticle({ slug: 'delete-test' });

      const response = await apiRequest(user, `/api/articles/${slug}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.deleted).toBe(true);

      // Verify article is gone
      const getResponse = await apiRequest(user, `/api/articles/${slug}`);
      expect(getResponse.status).toBe(404);
    });

    it('returns 404 for non-existent article', async () => {
      const response = await apiRequest(user, '/api/articles/does-not-exist', {
        method: 'DELETE',
      });

      expect(response.status).toBe(404);
    });
  });
});
