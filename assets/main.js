/**
 * The Black Captain - Frontend Script
 * Recommends browser translation when user selects a non-English language
 */

(function() {
  'use strict';

  // Configuration
  const HIDE_DELAY = 8000; // 8 seconds before auto-hide
  const LANG_NAMES = {
    'en': 'English',
    'de': 'Deutsch',
    'es': 'Español',
    'fr': 'Français',
    'it': 'Italiano',
    'pt': 'Português',
    'nl': 'Nederlands',
    'pl': 'Polski',
    'ru': 'Русский',
    'ja': '日本語',
    'zh': '中文',
    'ko': '한국어',
    'ar': 'العربية'
  };

  let popup = null;
  let hideTimeout = null;
  let isHovering = false;

  // Get the language selector element
  function getSelector() {
    return document.getElementById('lang-selector');
  }

  // Create the translation help popup
  function createTranslationPopup(langName) {
    const div = document.createElement('div');
    div.className = 'translate-popup';
    div.setAttribute('role', 'complementary');
    div.setAttribute('aria-label', 'Translation help');

    div.innerHTML = `
      <div class="translate-popup-header">
        <span class="translate-popup-title">Translation</span>
        <button class="translate-popup-close" aria-label="Close">&times;</button>
      </div>
      <div class="translate-popup-content">
        <p>To read this page in <strong>${langName}</strong>, use your browser's built-in translation:</p>
        <ul class="translate-popup-list">
          <li><strong>Chrome:</strong> Right-click → "Translate to ${langName}"</li>
          <li><strong>Firefox:</strong> Install translation add-on</li>
          <li><strong>Safari:</strong> Click translate icon in address bar</li>
          <li><strong>Edge:</strong> Click translate icon or right-click</li>
        </ul>
        <p class="translate-popup-tip">Browser translation preserves formatting and works offline once loaded.</p>
      </div>
    `;

    return div;
  }

  // Show the popup
  function showPopup(langCode) {
    // Remove existing popup if any
    hidePopup();

    const langName = LANG_NAMES[langCode] || langCode.toUpperCase();
    popup = createTranslationPopup(langName);
    document.body.appendChild(popup);

    // Set up event listeners
    popup.addEventListener('mouseenter', handleMouseEnter);
    popup.addEventListener('mouseleave', handleMouseLeave);

    const closeBtn = popup.querySelector('.translate-popup-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', hidePopup);
    }

    // Trigger animation
    requestAnimationFrame(() => {
      popup.classList.add('visible');
    });

    // Start hide timer
    startHideTimer();
  }

  // Hide the popup
  function hidePopup() {
    clearTimeout(hideTimeout);
    if (popup) {
      popup.classList.remove('visible');
      setTimeout(() => {
        if (popup && popup.parentNode) {
          popup.parentNode.removeChild(popup);
        }
        popup = null;
      }, 500);
    }
  }

  // Start auto-hide timer
  function startHideTimer() {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      if (!isHovering) {
        hidePopup();
      }
    }, HIDE_DELAY);
  }

  // Handle mouse enter
  function handleMouseEnter() {
    isHovering = true;
    clearTimeout(hideTimeout);
    if (popup) popup.classList.add('staying');
  }

  // Handle mouse leave
  function handleMouseLeave() {
    isHovering = false;
    if (popup) popup.classList.remove('staying');
    startHideTimer();
  }

  // Handle language selection
  function handleLanguageChange(event) {
    const selectedLang = event.target.value;

    // If not English, show the translation help popup
    if (selectedLang !== 'en') {
      showPopup(selectedLang);
    }

    // Reset selector to English (we don't actually translate)
    setTimeout(() => {
      event.target.value = 'en';
    }, 100);
  }

  // Initialize
  function init() {
    const selector = getSelector();

    if (!selector) {
      console.log('Language selector not found');
      return;
    }

    // Set up language selector
    selector.addEventListener('change', handleLanguageChange);

    console.log('🏴‍☠️ The Black Captain blog initialized');
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/**
 * What's New Notification System
 * Uses localStorage to track what content the user has seen and shows
 * a subtle popup notification for new content.
 */
(function() {
  'use strict';

  // Configuration
  const STORAGE_KEY = 'bc_last_seen_version';
  const SHOW_DELAY = 5000; // 5 seconds before showing
  const HIDE_DELAY = 5000; // 5 seconds before hiding

  // Current site version - update this when publishing new content
  // Format: YYYYMMDD-N where N is the update number for that day
  const CURRENT_VERSION = '20251201-1';

  // Changes since last version the user might have seen
  // Only include recent changes (last 1-2 versions)
  const RECENT_CHANGES = [
    {
      title: 'Mallard (Anas platyrhynchos)',
      url: '/avian-studies/anas-platyrhynchos.html',
      type: 'avian-studies'
    },
    {
      title: 'Tawny Owl (Strix aluco)',
      url: '/avian-studies/strix-aluco.html',
      type: 'avian-studies'
    },
    {
      title: 'Enhanced Herring Gull article',
      url: '/avian-studies/larus-argentatus.html',
      type: 'update'
    },
    {
      title: 'Enhanced Cormorant article',
      url: '/avian-studies/phalacrocorax-carbo.html',
      type: 'update'
    }
  ];

  let popup = null;
  let hideTimeout = null;
  let isHovering = false;

  // Check if localStorage is available
  function isStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Get the last seen version from localStorage
  function getLastSeenVersion() {
    if (!isStorageAvailable()) return null;
    return localStorage.getItem(STORAGE_KEY);
  }

  // Mark current version as seen
  function markAsSeen() {
    if (!isStorageAvailable()) return;
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
  }

  // Create the popup HTML
  function createPopup() {
    const div = document.createElement('div');
    div.className = 'whats-new-popup';
    div.setAttribute('role', 'complementary');
    div.setAttribute('aria-label', 'What\'s new on this site');

    const changesHtml = RECENT_CHANGES.map(change => {
      const typeLabel = change.type === 'avian-studies' ? 'New' : 'Updated';
      return `<li><a href="${change.url}">${change.title}</a> <small>(${typeLabel})</small></li>`;
    }).join('');

    div.innerHTML = `
      <div class="whats-new-header">
        <span class="whats-new-title">What's New</span>
        <button class="whats-new-close" aria-label="Close notification">&times;</button>
      </div>
      <div class="whats-new-content">
        <ul class="whats-new-list">
          ${changesHtml}
        </ul>
      </div>
      <div class="whats-new-footer">
        New content since your last visit
      </div>
    `;

    return div;
  }

  // Show the popup
  function showPopup() {
    if (!popup) return;

    popup.classList.add('visible');

    // Start hide timer unless hovering
    if (!isHovering) {
      startHideTimer();
    }
  }

  // Hide the popup
  function hidePopup() {
    if (!popup) return;

    popup.classList.remove('visible');

    // Mark as seen when user has had a chance to see it
    markAsSeen();
  }

  // Start the auto-hide timer
  function startHideTimer() {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      if (!isHovering) {
        hidePopup();
      }
    }, HIDE_DELAY);
  }

  // Handle mouse enter
  function handleMouseEnter() {
    isHovering = true;
    clearTimeout(hideTimeout);
    popup.classList.add('staying');
  }

  // Handle mouse leave
  function handleMouseLeave() {
    isHovering = false;
    popup.classList.remove('staying');
    startHideTimer();
  }

  // Handle close button click
  function handleClose() {
    clearTimeout(hideTimeout);
    hidePopup();
  }

  // Initialize the notification system
  function initWhatsNew() {
    // Don't show if no recent changes
    if (RECENT_CHANGES.length === 0) return;

    // Check if user has seen current version
    const lastSeen = getLastSeenVersion();

    // If same version, don't show
    if (lastSeen === CURRENT_VERSION) {
      console.log('🏴‍☠️ User has seen current version');
      return;
    }

    // Create and append popup
    popup = createPopup();
    document.body.appendChild(popup);

    // Set up event listeners
    popup.addEventListener('mouseenter', handleMouseEnter);
    popup.addEventListener('mouseleave', handleMouseLeave);

    const closeBtn = popup.querySelector('.whats-new-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', handleClose);
    }

    // Show after delay
    setTimeout(showPopup, SHOW_DELAY);

    console.log('🏴‍☠️ What\'s New notification initialized');
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWhatsNew);
  } else {
    initWhatsNew();
  }
})();
