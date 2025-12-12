/**
 * HTML Pages for Captain's Bridge
 * Server-rendered HTML for the editor UI
 */

import type { Env } from '../index';
import type { Session } from '../auth/session';

/**
 * Login page HTML
 */
export function loginPage(env: Env): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Captain's Bridge - Login</title>
  <link rel="stylesheet" href="/static/style.css">
  <link rel="icon" href="https://blackhoard.com/favicon.ico">
</head>
<body class="login-page">
  <main class="login-container">
    <div class="login-card">
      <h1>The Captain's Bridge</h1>
      <p class="subtitle">Command center for The Black Captain's tales</p>

      <div id="status" class="status"></div>

      <button id="login-btn" class="btn btn-primary" disabled>
        <span class="icon">🔐</span>
        Sign in with Passkey
      </button>

      <p class="help-text">
        Use your device's biometrics (TouchID, FaceID, Windows Hello)
        or a security key to access the editor.
      </p>
    </div>
  </main>

  <script src="https://unpkg.com/@simplewebauthn/browser@12.0.0/dist/bundle/index.umd.min.js"></script>
  <script>
    const rpOrigin = '${env.RP_ORIGIN}';
  </script>
  <script src="/static/app.js"></script>
</body>
</html>`;
}

/**
 * Setup page HTML (for initial passkey registration)
 */
export function setupPage(env: Env): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Captain's Bridge - Setup</title>
  <link rel="stylesheet" href="/static/style.css">
  <link rel="icon" href="https://blackhoard.com/favicon.ico">
</head>
<body class="login-page">
  <main class="login-container">
    <div class="login-card">
      <h1>Initial Setup</h1>
      <p class="subtitle">Register your first passkey to access the bridge</p>

      <div id="status" class="status"></div>

      <form id="setup-form">
        <div class="form-group">
          <label for="setup-code">Setup Code</label>
          <input type="text" id="setup-code" name="setupCode" placeholder="Enter your setup code" required>
        </div>

        <div class="form-group">
          <label for="display-name">Display Name</label>
          <input type="text" id="display-name" name="displayName" value="The Captain" placeholder="Your display name">
        </div>

        <button type="submit" id="register-btn" class="btn btn-primary">
          <span class="icon">🔑</span>
          Register Passkey
        </button>
      </form>

      <p class="help-text">
        This is a one-time setup. After registering, you can add more passkeys
        from the editor settings.
      </p>
    </div>
  </main>

  <script src="https://unpkg.com/@simplewebauthn/browser@12.0.0/dist/bundle/index.umd.min.js"></script>
  <script>
    const rpOrigin = '${env.RP_ORIGIN}';
    const isSetupPage = true;
  </script>
  <script src="/static/app.js"></script>
</body>
</html>`;
}

/**
 * Editor page HTML
 */
export function editorPage(env: Env, session: Session): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Captain's Bridge - Editor</title>
  <link rel="stylesheet" href="/static/style.css">
  <link rel="icon" href="https://blackhoard.com/favicon.ico">
</head>
<body class="editor-page">
  <header class="editor-header">
    <div class="header-left">
      <h1>⚓ The Captain's Bridge</h1>
    </div>
    <div class="header-right">
      <span class="user-name">${session.displayName}</span>
      <button id="save-btn" class="btn btn-secondary" disabled>Save</button>
      <button id="deploy-btn" class="btn btn-primary">Deploy</button>
      <button id="logout-btn" class="btn btn-ghost">Logout</button>
    </div>
  </header>

  <div class="editor-layout">
    <aside class="sidebar">
      <div class="sidebar-section">
        <h3>Articles</h3>
        <div class="article-filters">
          <select id="type-filter">
            <option value="">All Types</option>
            <option value="post">Posts</option>
            <option value="treasure-trove">Treasure Trove</option>
            <option value="avian-studies">Avian Studies</option>
            <option value="page">Pages</option>
          </select>
        </div>
        <button id="new-article-btn" class="btn btn-block">+ New Article</button>
        <ul id="article-list" class="article-list"></ul>
      </div>
    </aside>

    <main class="editor-main">
      <div id="no-article" class="no-article">
        <p>Select an article from the sidebar or create a new one.</p>
      </div>

      <div id="article-editor" class="article-editor" style="display: none;">
        <div class="editor-toolbar">
          <button class="tab-btn active" data-tab="edit">✏️ Edit</button>
          <button class="tab-btn" data-tab="preview">👁️ Preview</button>
        </div>

        <div class="editor-meta">
          <div class="meta-row">
            <div class="form-group">
              <label for="article-type">Type</label>
              <select id="article-type">
                <option value="post">Post</option>
                <option value="treasure-trove">Treasure Trove</option>
                <option value="avian-studies">Avian Studies</option>
                <option value="page">Page</option>
              </select>
            </div>
            <div class="form-group">
              <label for="article-status">Status</label>
              <select id="article-status">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            <div class="form-group" id="publish-at-group" style="display: none;">
              <label for="article-publish-at">Publish Date</label>
              <input type="datetime-local" id="article-publish-at">
            </div>
          </div>
          <div class="form-group">
            <label for="article-title">Title</label>
            <input type="text" id="article-title" placeholder="Enter title...">
          </div>
          <div class="form-group">
            <label for="article-slug">Slug</label>
            <input type="text" id="article-slug" placeholder="auto-generated-from-title">
          </div>
          <div class="meta-row">
            <div class="form-group">
              <label for="article-date">Date</label>
              <input type="text" id="article-date" placeholder="December 10, 2025">
            </div>
            <div class="form-group">
              <label for="article-description">Description</label>
              <input type="text" id="article-description" placeholder="Brief description for SEO...">
            </div>
          </div>
        </div>

        <div id="edit-tab" class="tab-content active">
          <textarea id="article-content" placeholder="Write your story in markdown..."></textarea>
          <div class="ai-toolbar">
            <button id="enhance-btn" class="btn btn-ai">✨ Enhance with AI</button>
            <button id="research-btn" class="btn btn-ai">🔍 Research Topic</button>
          </div>
        </div>

        <div id="preview-tab" class="tab-content" style="display: none;">
          <div id="preview-content" class="preview-content"></div>
        </div>

        <div id="ai-output" class="ai-output" style="display: none;">
          <div class="ai-output-header">
            <span>AI Response</span>
            <div class="ai-output-actions">
              <button id="accept-ai" class="btn btn-small">Accept</button>
              <button id="dismiss-ai" class="btn btn-small btn-ghost">Dismiss</button>
            </div>
          </div>
          <div id="ai-content" class="ai-content"></div>
        </div>
      </div>
    </main>
  </div>

  <div id="modal-backdrop" class="modal-backdrop" style="display: none;">
    <div class="modal">
      <div class="modal-header">
        <h3 id="modal-title">Research Topic</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="research-topic">What would you like to research?</label>
          <input type="text" id="research-topic" placeholder="e.g., Greek mythology, nautical terms, historical events...">
        </div>
        <div class="form-group">
          <label for="research-context">Context (optional)</label>
          <textarea id="research-context" placeholder="Any relevant context for the research..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button id="start-research" class="btn btn-primary">Start Research</button>
      </div>
    </div>
  </div>

  <div id="toast" class="toast"></div>

  <script src="https://unpkg.com/@simplewebauthn/browser@12.0.0/dist/bundle/index.umd.min.js"></script>
  <script>
    const rpOrigin = '${env.RP_ORIGIN}';
    const userName = '${session.displayName}';
  </script>
  <script src="/static/app.js"></script>
</body>
</html>`;
}
