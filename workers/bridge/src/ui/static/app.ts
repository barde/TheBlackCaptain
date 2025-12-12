/**
 * Client-side JavaScript for Captain's Bridge
 * Handles authentication, article management, and AI features
 */

export default `
(function() {
  'use strict';

  // State
  let currentArticle = null;
  let articles = [];
  let hasUnsavedChanges = false;

  // Initialize based on page
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof isSetupPage !== 'undefined' && isSetupPage) {
      initSetup();
    } else if (document.querySelector('.login-page')) {
      initLogin();
    } else if (document.querySelector('.editor-page')) {
      initEditor();
    }
  });

  // ==================== LOGIN ====================

  async function initLogin() {
    const loginBtn = document.getElementById('login-btn');
    const status = document.getElementById('status');

    // Check if setup is needed
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();

      if (data.needsSetup) {
        window.location.href = '/setup';
        return;
      }

      loginBtn.disabled = false;
    } catch (err) {
      showStatus(status, 'error', 'Failed to check auth status');
      return;
    }

    loginBtn.addEventListener('click', async () => {
      loginBtn.disabled = true;
      status.style.display = 'none';

      try {
        // Get authentication options
        const optionsRes = await fetch('/api/auth/login/options', { method: 'POST' });
        const options = await optionsRes.json();

        if (options.error) {
          throw new Error(options.error);
        }

        // Trigger passkey authentication
        const credential = await SimpleWebAuthnBrowser.startAuthentication({ optionsJSON: options });

        // Verify with server
        const verifyRes = await fetch('/api/auth/login/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credential),
        });

        const result = await verifyRes.json();

        if (result.verified) {
          window.location.href = '/editor';
        } else {
          throw new Error(result.error || 'Authentication failed');
        }
      } catch (err) {
        console.error('Login error:', err);
        showStatus(status, 'error', err.message || 'Authentication failed');
        loginBtn.disabled = false;
      }
    });
  }

  // ==================== SETUP ====================

  async function initSetup() {
    const form = document.getElementById('setup-form');
    const status = document.getElementById('status');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const setupCode = document.getElementById('setup-code').value;
      const displayName = document.getElementById('display-name').value;
      const registerBtn = document.getElementById('register-btn');

      registerBtn.disabled = true;
      status.style.display = 'none';

      try {
        // Get registration options
        const optionsRes = await fetch('/api/auth/register/options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ setupCode, displayName }),
        });

        const options = await optionsRes.json();

        if (options.error) {
          throw new Error(options.error);
        }

        // Create passkey
        const credential = await SimpleWebAuthnBrowser.startRegistration({ optionsJSON: options });

        // Verify with server
        const verifyRes = await fetch('/api/auth/register/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credential),
        });

        const result = await verifyRes.json();

        if (result.verified) {
          showStatus(status, 'success', 'Passkey registered! Redirecting...');
          setTimeout(() => {
            window.location.href = '/editor';
          }, 1500);
        } else {
          throw new Error(result.error || 'Registration failed');
        }
      } catch (err) {
        console.error('Setup error:', err);
        showStatus(status, 'error', err.message || 'Registration failed');
        registerBtn.disabled = false;
      }
    });
  }

  // ==================== EDITOR ====================

  async function initEditor() {
    // Load articles
    await loadArticles();

    // Event listeners
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('new-article-btn').addEventListener('click', handleNewArticle);
    document.getElementById('save-btn').addEventListener('click', handleSave);
    document.getElementById('deploy-btn').addEventListener('click', handleDeploy);
    document.getElementById('type-filter').addEventListener('change', handleFilterChange);

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // AI features
    document.getElementById('enhance-btn').addEventListener('click', handleEnhance);
    document.getElementById('research-btn').addEventListener('click', openResearchModal);
    document.getElementById('accept-ai').addEventListener('click', acceptAIContent);
    document.getElementById('dismiss-ai').addEventListener('click', dismissAIContent);

    // Modal
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-backdrop').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal-backdrop')) closeModal();
    });
    document.getElementById('start-research').addEventListener('click', handleResearch);

    // Track changes
    const inputs = ['article-title', 'article-slug', 'article-content', 'article-date', 'article-description'];
    inputs.forEach(id => {
      document.getElementById(id).addEventListener('input', () => {
        hasUnsavedChanges = true;
        document.getElementById('save-btn').disabled = false;
      });
    });

    // Auto-generate slug from title
    document.getElementById('article-title').addEventListener('blur', () => {
      const slugInput = document.getElementById('article-slug');
      if (!slugInput.value && document.getElementById('article-title').value) {
        const type = document.getElementById('article-type').value;
        slugInput.value = generateSlug(document.getElementById('article-title').value, type);
      }
    });

    // Warn before leaving with unsaved changes
    window.addEventListener('beforeunload', (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  async function loadArticles() {
    const filter = document.getElementById('type-filter').value;
    const url = filter ? '/api/articles?type=' + filter : '/api/articles';

    try {
      const res = await fetch(url);
      const data = await res.json();
      articles = data.articles || [];
      renderArticleList();
    } catch (err) {
      console.error('Failed to load articles:', err);
      showToast('Failed to load articles', 'error');
    }
  }

  function renderArticleList() {
    const list = document.getElementById('article-list');
    list.innerHTML = '';

    articles.forEach(article => {
      const li = document.createElement('li');
      li.className = currentArticle?.id === article.id ? 'active' : '';
      li.innerHTML = \`
        <div class="article-title">\${escapeHtml(article.title)}</div>
        <div class="article-meta">
          <span class="article-type">\${article.type}</span>
          <span class="article-status">\${article.status}</span>
        </div>
      \`;
      li.addEventListener('click', () => selectArticle(article));
      list.appendChild(li);
    });
  }

  function selectArticle(article) {
    if (hasUnsavedChanges && !confirm('You have unsaved changes. Discard them?')) {
      return;
    }

    currentArticle = article;
    hasUnsavedChanges = false;

    document.getElementById('no-article').style.display = 'none';
    document.getElementById('article-editor').style.display = 'block';

    document.getElementById('article-type').value = article.type;
    document.getElementById('article-status').value = article.status;
    document.getElementById('article-title').value = article.title;
    document.getElementById('article-slug').value = article.slug;
    document.getElementById('article-content').value = article.content;

    const metadata = article.metadata || {};
    document.getElementById('article-date').value = metadata.date || '';
    document.getElementById('article-description').value = metadata.description || '';

    document.getElementById('save-btn').disabled = true;
    renderArticleList();

    // Update preview
    updatePreview();
  }

  function handleNewArticle() {
    if (hasUnsavedChanges && !confirm('You have unsaved changes. Discard them?')) {
      return;
    }

    currentArticle = null;
    hasUnsavedChanges = false;

    document.getElementById('no-article').style.display = 'none';
    document.getElementById('article-editor').style.display = 'block';

    document.getElementById('article-type').value = 'post';
    document.getElementById('article-status').value = 'draft';
    document.getElementById('article-title').value = '';
    document.getElementById('article-slug').value = '';
    document.getElementById('article-content').value = '';
    document.getElementById('article-date').value = '';
    document.getElementById('article-description').value = '';

    document.getElementById('save-btn').disabled = true;
    renderArticleList();
  }

  async function handleSave() {
    const title = document.getElementById('article-title').value.trim();
    if (!title) {
      showToast('Title is required', 'error');
      return;
    }

    const data = {
      type: document.getElementById('article-type').value,
      status: document.getElementById('article-status').value,
      title,
      slug: document.getElementById('article-slug').value || undefined,
      content: document.getElementById('article-content').value,
      metadata: {
        date: document.getElementById('article-date').value || undefined,
        description: document.getElementById('article-description').value || undefined,
      },
    };

    try {
      let res;
      if (currentArticle) {
        res = await fetch('/api/articles/' + encodeURIComponent(currentArticle.slug), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        res = await fetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }

      const result = await res.json();

      if (result.error) {
        throw new Error(result.error);
      }

      currentArticle = result;
      hasUnsavedChanges = false;
      document.getElementById('save-btn').disabled = true;
      document.getElementById('article-slug').value = result.slug;

      await loadArticles();
      showToast('Article saved', 'success');
    } catch (err) {
      console.error('Save error:', err);
      showToast(err.message || 'Failed to save', 'error');
    }
  }

  async function handleDeploy() {
    if (!confirm('Deploy all published articles to the live site?')) {
      return;
    }

    const btn = document.getElementById('deploy-btn');
    btn.disabled = true;
    btn.textContent = 'Deploying...';

    try {
      const res = await fetch('/api/deploy', { method: 'POST' });
      const result = await res.json();

      if (result.error) {
        throw new Error(result.error);
      }

      showToast('Deployment triggered! ' + result.articlesDeployed + ' articles deployed.', 'success');
    } catch (err) {
      console.error('Deploy error:', err);
      showToast(err.message || 'Deployment failed', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Deploy';
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  function handleFilterChange() {
    loadArticles();
  }

  // ==================== TABS ====================

  function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    document.getElementById('edit-tab').style.display = tab === 'edit' ? 'block' : 'none';
    document.getElementById('preview-tab').style.display = tab === 'preview' ? 'block' : 'none';

    if (tab === 'preview') {
      updatePreview();
    }
  }

  function updatePreview() {
    const content = document.getElementById('article-content').value;
    const title = document.getElementById('article-title').value;

    // Simple markdown to HTML conversion
    let html = '# ' + escapeHtml(title) + '\\n\\n' + content;
    html = simpleMarkdown(html);

    document.getElementById('preview-content').innerHTML = html;
  }

  // ==================== AI FEATURES ====================

  async function handleEnhance() {
    const content = document.getElementById('article-content').value;
    if (!content.trim()) {
      showToast('Write some content first', 'error');
      return;
    }

    const btn = document.getElementById('enhance-btn');
    btn.disabled = true;
    btn.textContent = 'Enhancing...';

    const aiOutput = document.getElementById('ai-output');
    const aiContent = document.getElementById('ai-content');
    aiOutput.style.display = 'block';
    aiContent.textContent = '';

    try {
      const res = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          type: document.getElementById('article-type').value,
        }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                aiContent.textContent += parsed.text;
                aiContent.scrollTop = aiContent.scrollHeight;
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      console.error('Enhance error:', err);
      showToast(err.message || 'Enhancement failed', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '✨ Enhance with AI';
    }
  }

  function openResearchModal() {
    document.getElementById('modal-backdrop').style.display = 'flex';
    document.getElementById('research-topic').value = '';
    document.getElementById('research-context').value = '';
    document.getElementById('research-topic').focus();
  }

  function closeModal() {
    document.getElementById('modal-backdrop').style.display = 'none';
  }

  async function handleResearch() {
    const topic = document.getElementById('research-topic').value.trim();
    if (!topic) {
      showToast('Enter a topic to research', 'error');
      return;
    }

    closeModal();

    const btn = document.getElementById('research-btn');
    btn.disabled = true;
    btn.textContent = 'Researching...';

    const aiOutput = document.getElementById('ai-output');
    const aiContent = document.getElementById('ai-content');
    aiOutput.style.display = 'block';
    aiContent.textContent = '';

    try {
      const res = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          context: document.getElementById('research-context').value,
        }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                aiContent.textContent += parsed.text;
                aiContent.scrollTop = aiContent.scrollHeight;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      console.error('Research error:', err);
      showToast(err.message || 'Research failed', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '🔍 Research Topic';
    }
  }

  function acceptAIContent() {
    const aiContent = document.getElementById('ai-content').textContent;
    const contentArea = document.getElementById('article-content');
    contentArea.value = aiContent;
    hasUnsavedChanges = true;
    document.getElementById('save-btn').disabled = false;
    document.getElementById('ai-output').style.display = 'none';
  }

  function dismissAIContent() {
    document.getElementById('ai-output').style.display = 'none';
  }

  // ==================== UTILITIES ====================

  function showStatus(el, type, message) {
    el.className = 'status ' + type;
    el.textContent = message;
    el.style.display = 'block';
  }

  function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function generateSlug(title, type) {
    const today = new Date().toISOString().split('T')[0];
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);

    return type === 'post' ? today + '-' + slug : slug;
  }

  function simpleMarkdown(text) {
    // Headers
    text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold and italic
    text = text.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
    text = text.replace(/\\*(.+?)\\*/g, '<em>$1</em>');

    // Links
    text = text.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2">$1</a>');

    // Line breaks
    text = text.replace(/\\n\\n/g, '</p><p>');
    text = text.replace(/\\n/g, '<br>');

    // Wrap in paragraphs
    text = '<p>' + text + '</p>';
    text = text.replace(/<p>(<h[1-3]>)/g, '$1');
    text = text.replace(/(<\\/h[1-3]>)<\\/p>/g, '$1');

    return text;
  }
})();
`;
