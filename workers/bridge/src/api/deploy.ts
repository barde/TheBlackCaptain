/**
 * Deploy API for Captain's Bridge
 * Triggers GitHub Actions workflow to rebuild and deploy the site
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
  status: 'draft' | 'published';
  created_at: number;
  updated_at: number;
}

/**
 * Handle deploy request
 * Exports all published articles to GitHub and triggers deployment
 */
export async function handleDeploy(
  request: Request,
  env: Env,
  session: Session
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get all published articles
    const result = await env.DB.prepare(
      'SELECT * FROM articles WHERE status = ? ORDER BY type, created_at DESC'
    ).bind('published').all<Article>();

    const articles = result.results || [];

    // Generate markdown files content
    const files: Record<string, string> = {};

    for (const article of articles) {
      const path = getArticlePath(article);
      const markdown = generateMarkdown(article);
      files[path] = markdown;
    }

    // Trigger GitHub Actions workflow dispatch
    const workflowResponse = await triggerGitHubWorkflow(env, files);

    if (!workflowResponse.ok) {
      const error = await workflowResponse.text();
      console.error('GitHub workflow trigger failed:', error);
      return new Response(JSON.stringify({
        error: 'Failed to trigger deployment',
        details: error,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Deployment triggered',
      articlesDeployed: articles.length,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Deploy error:', error);
    return new Response(JSON.stringify({ error: 'Deployment failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Get the file path for an article based on its type
 */
function getArticlePath(article: Article): string {
  switch (article.type) {
    case 'post':
      return `posts/${article.slug}.md`;
    case 'treasure-trove':
      return `treasure-trove/${article.slug}.md`;
    case 'avian-studies':
      return `avian-studies/${article.slug}.md`;
    case 'page':
      return `pages/${article.slug}.md`;
    default:
      return `posts/${article.slug}.md`;
  }
}

/**
 * Generate markdown content with frontmatter
 */
function generateMarkdown(article: Article): string {
  const metadata = article.metadata ? JSON.parse(article.metadata) : {};

  // Build frontmatter
  const frontmatter: Record<string, unknown> = {
    title: article.title,
    ...metadata,
  };

  // Convert date timestamp to readable format if not already set
  if (!frontmatter.date) {
    const date = new Date(article.created_at * 1000);
    frontmatter.date = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // Build YAML frontmatter
  const yamlLines = ['---'];
  for (const [key, value] of Object.entries(frontmatter)) {
    if (value !== null && value !== undefined) {
      if (typeof value === 'string' && (value.includes(':') || value.includes('#'))) {
        yamlLines.push(`${key}: "${value}"`);
      } else {
        yamlLines.push(`${key}: ${value}`);
      }
    }
  }
  yamlLines.push('---');
  yamlLines.push('');

  return yamlLines.join('\n') + article.content;
}

/**
 * Trigger deployment (exported for use by scheduled handler)
 */
export async function triggerDeployment(env: Env): Promise<Response> {
  // Get all published articles
  const result = await env.DB.prepare(
    'SELECT * FROM articles WHERE status = ? ORDER BY type, created_at DESC'
  ).bind('published').all<Article>();

  const articles = result.results || [];

  // Generate markdown files content
  const files: Record<string, string> = {};

  for (const article of articles) {
    const path = getArticlePath(article);
    const markdown = generateMarkdown(article);
    files[path] = markdown;
  }

  return triggerGitHubWorkflow(env, files);
}

/**
 * Trigger GitHub Actions workflow to update files and deploy
 */
async function triggerGitHubWorkflow(
  env: Env,
  files: Record<string, string>
): Promise<Response> {
  const owner = 'barde';
  const repo = 'TheBlackCaptain';
  const workflow = 'deploy-from-bridge.yml';

  // First, we need to create/update the files via the GitHub API
  // Then trigger the deploy workflow

  // For now, we'll use workflow_dispatch with the files as input
  // In production, you might want to use the GitHub Contents API directly

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'CaptainBridge/1.0',
      },
      body: JSON.stringify({
        ref: 'master',
        inputs: {
          articles: JSON.stringify(Object.keys(files)),
          // Files content will be fetched from the D1 database by the workflow
          trigger_source: 'bridge',
        },
      }),
    }
  );

  return response;
}
