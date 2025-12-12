/**
 * Scheduled Publishing Tests for Captain's Bridge
 * Tests the scheduled article functionality and cron trigger
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import {
  createTestUser,
  createTestArticle,
  apiRequest,
  type TestUser,
} from './helpers';

describe('Scheduled Publishing', () => {
  let user: TestUser;

  beforeEach(async () => {
    user = await createTestUser();
  });

  describe('Creating Scheduled Articles', () => {
    it('creates article with scheduled status and publish_at', async () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      const response = await apiRequest(user, '/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Scheduled Post',
          type: 'post',
          status: 'scheduled',
          publish_at: futureTime,
          content: '# Coming Soon',
        }),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.status).toBe('scheduled');
      expect(data.publish_at).toBe(futureTime);
    });

    it('requires publish_at for scheduled status', async () => {
      const response = await apiRequest(user, '/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Missing Publish Date',
          type: 'post',
          status: 'scheduled',
          // No publish_at provided
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Scheduled articles require a publish_at date');
    });

    it('allows updating to scheduled status with publish_at', async () => {
      const { slug } = await createTestArticle({
        slug: 'draft-to-scheduled',
        status: 'draft',
      });

      const futureTime = Math.floor(Date.now() / 1000) + 7200; // 2 hours from now

      const response = await apiRequest(user, `/api/articles/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'scheduled',
          publish_at: futureTime,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('scheduled');
      expect(data.publish_at).toBe(futureTime);
    });

    it('requires publish_at when updating to scheduled status', async () => {
      const { slug } = await createTestArticle({
        slug: 'draft-to-scheduled-fail',
        status: 'draft',
      });

      const response = await apiRequest(user, `/api/articles/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'scheduled',
          // No publish_at
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Scheduled articles require a publish_at date');
    });

    it('clears publish_at when changing from scheduled to draft', async () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const { slug } = await createTestArticle({
        slug: 'scheduled-to-draft',
        status: 'scheduled',
        publish_at: futureTime,
      });

      const response = await apiRequest(user, `/api/articles/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'draft',
          publish_at: null,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('draft');
      expect(data.publish_at).toBeNull();
    });
  });

  describe('Listing Scheduled Articles', () => {
    it('filters articles by scheduled status', async () => {
      await createTestArticle({ slug: 'draft-1', status: 'draft' });
      await createTestArticle({ slug: 'published-1', status: 'published' });
      await createTestArticle({
        slug: 'scheduled-1',
        status: 'scheduled',
        publish_at: Math.floor(Date.now() / 1000) + 3600,
      });
      await createTestArticle({
        slug: 'scheduled-2',
        status: 'scheduled',
        publish_at: Math.floor(Date.now() / 1000) + 7200,
      });

      const response = await apiRequest(user, '/api/articles?status=scheduled');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.articles).toHaveLength(2);
      expect(data.articles.every((a: { status: string }) => a.status === 'scheduled')).toBe(true);
    });
  });

  describe('Database Queries for Due Articles', () => {
    it('finds articles due for publishing', async () => {
      const now = Math.floor(Date.now() / 1000);
      const pastTime = now - 3600; // 1 hour ago
      const futureTime = now + 3600; // 1 hour from now

      // Create articles with different publish times
      await createTestArticle({
        slug: 'past-due',
        status: 'scheduled',
        publish_at: pastTime,
      });
      await createTestArticle({
        slug: 'future',
        status: 'scheduled',
        publish_at: futureTime,
      });
      await createTestArticle({
        slug: 'already-published',
        status: 'published',
      });

      // Query for due articles (like the scheduled handler would)
      const result = await env.DB.prepare(`
        SELECT * FROM articles
        WHERE status = 'scheduled' AND publish_at <= ?
      `).bind(now).all();

      expect(result.results).toHaveLength(1);
      expect(result.results?.[0].slug).toBe('past-due');
    });

    it('can update scheduled articles to published', async () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const { id } = await createTestArticle({
        slug: 'to-publish',
        status: 'scheduled',
        publish_at: pastTime,
      });

      // Simulate what the scheduled handler does
      await env.DB.prepare(`
        UPDATE articles
        SET status = 'published', updated_at = unixepoch()
        WHERE id = ?
      `).bind(id).run();

      // Verify the update
      const result = await env.DB.prepare(
        'SELECT * FROM articles WHERE id = ?'
      ).bind(id).first();

      expect(result?.status).toBe('published');
    });
  });

  describe('Scheduled Handler Logic', () => {
    it('publishes multiple due articles at once', async () => {
      const now = Math.floor(Date.now() / 1000);
      const pastTime1 = now - 3600;
      const pastTime2 = now - 1800;

      await createTestArticle({
        slug: 'due-1',
        status: 'scheduled',
        publish_at: pastTime1,
      });
      await createTestArticle({
        slug: 'due-2',
        status: 'scheduled',
        publish_at: pastTime2,
      });
      await createTestArticle({
        slug: 'not-due',
        status: 'scheduled',
        publish_at: now + 3600,
      });

      // Find due articles
      const dueArticles = await env.DB.prepare(`
        SELECT id FROM articles
        WHERE status = 'scheduled' AND publish_at <= ?
      `).bind(now).all();

      expect(dueArticles.results).toHaveLength(2);

      // Publish them
      for (const article of dueArticles.results || []) {
        await env.DB.prepare(`
          UPDATE articles
          SET status = 'published', updated_at = unixepoch()
          WHERE id = ?
        `).bind(article.id).run();
      }

      // Verify all due articles are now published
      const publishedCount = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM articles WHERE status = 'published'
      `).first();

      const scheduledCount = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM articles WHERE status = 'scheduled'
      `).first();

      expect(publishedCount?.count).toBe(2);
      expect(scheduledCount?.count).toBe(1);
    });

    it('does not publish articles scheduled for the future', async () => {
      const futureTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

      await createTestArticle({
        slug: 'future-article',
        status: 'scheduled',
        publish_at: futureTime,
      });

      // Query for due articles
      const now = Math.floor(Date.now() / 1000);
      const result = await env.DB.prepare(`
        SELECT * FROM articles
        WHERE status = 'scheduled' AND publish_at <= ?
      `).bind(now).all();

      expect(result.results).toHaveLength(0);
    });
  });
});
