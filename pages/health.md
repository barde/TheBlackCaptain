---
title: System Health
description: Status of The Black Captain's ship systems
---

<div class="health-dashboard" id="health-dashboard">

## Ship's Systems Status

<p class="health-intro">The Captain monitors his vessel's systems with care. Below you can see the status of each subsystem. A proper ship requires all hands on deck and all systems operational.</p>

<div class="health-grid" id="health-grid">
  <div class="health-check" id="check-site">
    <span class="health-icon" id="icon-site">⏳</span>
    <span class="health-label">Main Deck</span>
    <span class="health-status" id="status-site">Checking...</span>
  </div>

  <div class="health-check" id="check-translation">
    <span class="health-icon" id="icon-translation">⏳</span>
    <span class="health-label">Translation Engine</span>
    <span class="health-status" id="status-translation">Checking...</span>
  </div>

  <div class="health-check" id="check-images">
    <span class="health-icon" id="icon-images">⏳</span>
    <span class="health-label">Visual Systems</span>
    <span class="health-status" id="status-images">Checking...</span>
  </div>

  <div class="health-check" id="check-storage">
    <span class="health-icon" id="icon-storage">⏳</span>
    <span class="health-label">Local Charts</span>
    <span class="health-status" id="status-storage">Checking...</span>
  </div>
</div>

<div class="health-footer">
  <p class="health-timestamp" id="health-timestamp">Last checked: --</p>
  <p class="health-note">*Want to build your own ship? The Captain shares his blueprints freely. Study the code, learn the craft, and set sail on your own voyage.*</p>
</div>

</div>

<script>
(function() {
  'use strict';

  // Status indicators
  const STATUS = {
    OK: { icon: '✅', text: 'Operational', class: 'ok' },
    WARN: { icon: '⚠️', text: 'Degraded', class: 'warn' },
    ERROR: { icon: '❌', text: 'Offline', class: 'error' },
    CHECKING: { icon: '⏳', text: 'Checking...', class: 'checking' }
  };

  function setStatus(checkId, status) {
    const icon = document.getElementById('icon-' + checkId);
    const statusEl = document.getElementById('status-' + checkId);
    const check = document.getElementById('check-' + checkId);

    if (icon) icon.textContent = status.icon;
    if (statusEl) statusEl.textContent = status.text;
    if (check) {
      check.classList.remove('ok', 'warn', 'error', 'checking');
      check.classList.add(status.class);
    }
  }

  // Check main site
  async function checkSite() {
    try {
      const response = await fetch('/index.html', { method: 'HEAD' });
      setStatus('site', response.ok ? STATUS.OK : STATUS.ERROR);
    } catch (e) {
      setStatus('site', STATUS.ERROR);
    }
  }

  // Check translation API
  async function checkTranslation() {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'test', targetLang: 'de', sourceLang: 'en' })
      });
      // 200 = OK, 429 = rate limited but working
      setStatus('translation', (response.ok || response.status === 429) ? STATUS.OK : STATUS.WARN);
    } catch (e) {
      setStatus('translation', STATUS.WARN);
    }
  }

  // Check images/assets
  async function checkImages() {
    try {
      const response = await fetch('/assets/style.css', { method: 'HEAD' });
      setStatus('images', response.ok ? STATUS.OK : STATUS.WARN);
    } catch (e) {
      setStatus('images', STATUS.WARN);
    }
  }

  // Check localStorage
  function checkStorage() {
    try {
      const test = '__health_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      setStatus('storage', STATUS.OK);
    } catch (e) {
      setStatus('storage', STATUS.WARN);
    }
  }

  // Update timestamp
  function updateTimestamp() {
    const el = document.getElementById('health-timestamp');
    if (el) {
      el.textContent = 'Last checked: ' + new Date().toLocaleString();
    }
  }

  // Run all checks
  async function runHealthChecks() {
    // Set all to checking
    ['site', 'translation', 'images', 'storage'].forEach(id => {
      setStatus(id, STATUS.CHECKING);
    });

    // Run checks
    await Promise.all([
      checkSite(),
      checkTranslation(),
      checkImages()
    ]);
    checkStorage();
    updateTimestamp();
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runHealthChecks);
  } else {
    runHealthChecks();
  }
})();
</script>

<style>
.health-dashboard {
  max-width: 600px;
  margin: 0 auto;
}

.health-intro {
  color: var(--text-secondary);
  font-style: italic;
  margin-bottom: var(--space-xl);
}

.health-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.health-check {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: white;
  border: 2px solid var(--border-light);
  border-radius: 8px;
  transition: all 0.3s ease;
}

@media (prefers-color-scheme: dark) {
  .health-check {
    background: var(--bg-secondary);
  }
}

.health-check.ok {
  border-left: 4px solid #4CAF50;
}

.health-check.warn {
  border-left: 4px solid #FFC107;
}

.health-check.error {
  border-left: 4px solid #F44336;
}

.health-check.checking {
  border-left: 4px solid var(--brass);
}

.health-icon {
  font-size: 1.5rem;
  width: 2rem;
  text-align: center;
}

.health-label {
  flex: 1;
  font-weight: 600;
  color: var(--text-primary);
}

.health-status {
  font-size: 0.9rem;
  color: var(--text-light);
}

.health-footer {
  margin-top: var(--space-xl);
  padding-top: var(--space-lg);
  border-top: 2px solid var(--border-light);
  text-align: center;
}

.health-timestamp {
  font-size: 0.85rem;
  color: var(--text-light);
  margin-bottom: var(--space-sm);
}

.health-note {
  font-size: 0.9rem;
  font-style: italic;
  color: var(--text-secondary);
}
</style>
