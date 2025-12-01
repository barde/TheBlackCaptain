/**
 * The Black Captain - Frontend Script
 * Provides automatic translation via Cloudflare AI and browser translation hints
 */

(function() {
  'use strict';

  // Configuration
  const API_ENDPOINT = '/api/translate';
  const BROWSER_HINT_KEY = 'bc_browser_hint_shown';
  const HINT_DELAY_AFTER_TRANSLATE = 3000; // 3 seconds after translation completes
  const HINT_HIDE_DELAY = 8000; // 8 seconds before auto-hide
  const MAX_TEXT_LENGTH = 4500; // Max chars per translation request

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
    'ar': 'العربية',
    'cs': 'Čeština',
    'da': 'Dansk',
    'fi': 'Suomi',
    'el': 'Ελληνικά',
    'hu': 'Magyar',
    'no': 'Norsk',
    'ro': 'Română',
    'sv': 'Svenska',
    'tr': 'Türkçe',
    'uk': 'Українська',
    'bg': 'Български',
    'hr': 'Hrvatski',
    'et': 'Eesti',
    'is': 'Íslenska',
    'lt': 'Lietuvių',
    'lv': 'Latviešu',
    'mk': 'Македонски',
    'sk': 'Slovenčina',
    'sl': 'Slovenščina',
    'hi': 'हिन्दी',
    'id': 'Bahasa Indonesia',
    'th': 'ไทย',
    'vi': 'Tiếng Việt',
    'ta': 'தமிழ்',
    'te': 'తెలుగు',
    'ml': 'മലയാളം',
    'bn': 'বাংলা',
    'ur': 'اردو',
    'fa': 'فارسی',
    'he': 'עברית',
    'ms': 'Bahasa Melayu',
    'my': 'မြန်မာ',
    'af': 'Afrikaans',
    'am': 'አማርኛ',
    'ha': 'Hausa',
    'ig': 'Igbo',
    'sw': 'Kiswahili',
    'yo': 'Yorùbá',
    'zu': 'isiZulu'
  };

  let currentLang = 'en';
  let originalContent = new Map();
  let isTranslating = false;
  let browserHintPopup = null;
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

  // Check if browser hint was already shown
  function wasBrowserHintShown() {
    if (!isStorageAvailable()) return true; // Don't show if no storage
    return localStorage.getItem(BROWSER_HINT_KEY) === 'true';
  }

  // Mark browser hint as shown
  function markBrowserHintShown() {
    if (!isStorageAvailable()) return;
    localStorage.setItem(BROWSER_HINT_KEY, 'true');
  }

  // Get translatable elements
  function getTranslatableElements() {
    const container = document.querySelector('[data-translatable="true"]');
    if (!container) return [];

    const elements = [];
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Skip empty text nodes
          if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
          // Skip script/style content
          const parent = node.parentElement;
          if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      elements.push(node);
    }

    return elements;
  }

  // Store original content
  function storeOriginalContent(elements) {
    elements.forEach((el, index) => {
      if (!originalContent.has(el)) {
        originalContent.set(el, el.textContent);
      }
    });
  }

  // Translate text via API
  async function translateText(text, targetLang, sourceLang = 'en') {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          targetLang: targetLang,
          sourceLang: sourceLang
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.warn('Translation API error:', error);
        return null;
      }

      const data = await response.json();
      return data.translatedText;
    } catch (error) {
      console.warn('Translation request failed:', error);
      return null;
    }
  }

  // Batch translate elements
  async function translateElements(elements, targetLang) {
    // Group text into batches to minimize API calls
    const batches = [];
    let currentBatch = [];
    let currentLength = 0;

    elements.forEach((el, index) => {
      const text = el.textContent;
      if (currentLength + text.length > MAX_TEXT_LENGTH && currentBatch.length > 0) {
        batches.push([...currentBatch]);
        currentBatch = [];
        currentLength = 0;
      }
      currentBatch.push({ element: el, text: text, index: index });
      currentLength += text.length + 10; // +10 for separator
    });

    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    // Process batches
    for (const batch of batches) {
      const combinedText = batch.map(item => item.text).join('\n|||SPLIT|||\n');
      const translated = await translateText(combinedText, targetLang);

      if (translated) {
        const parts = translated.split(/\n?\|\|\|SPLIT\|\|\|\n?/);
        batch.forEach((item, i) => {
          if (parts[i]) {
            item.element.textContent = parts[i].trim();
          }
        });
      }
    }
  }

  // Translate individual important elements (titles, headers)
  async function translateImportantElements(targetLang) {
    // Translate page title
    const titleEl = document.querySelector('.post-title');
    if (titleEl && titleEl.textContent.trim()) {
      const translatedTitle = await translateText(titleEl.textContent, targetLang);
      if (translatedTitle) {
        titleEl.textContent = translatedTitle;
      }
    }

    // Translate headings
    const headings = document.querySelectorAll('.post-content h2, .post-content h3');
    for (const heading of headings) {
      if (heading.textContent.trim()) {
        const translated = await translateText(heading.textContent, targetLang);
        if (translated) {
          heading.textContent = translated;
        }
      }
    }
  }

  // Show translation loading state
  function showTranslatingState() {
    const selector = document.getElementById('lang-selector');
    if (selector) {
      selector.disabled = true;
      selector.style.opacity = '0.6';
    }

    // Add subtle loading indicator
    const article = document.querySelector('.post');
    if (article) {
      article.style.opacity = '0.7';
      article.style.transition = 'opacity 0.3s ease';
    }
  }

  // Hide translation loading state
  function hideTranslatingState() {
    const selector = document.getElementById('lang-selector');
    if (selector) {
      selector.disabled = false;
      selector.style.opacity = '1';
    }

    const article = document.querySelector('.post');
    if (article) {
      article.style.opacity = '1';
    }
  }

  // Perform full page translation
  async function translatePage(targetLang) {
    if (isTranslating || targetLang === currentLang) return;

    isTranslating = true;
    showTranslatingState();

    console.log(`🏴‍☠️ Translating to ${LANG_NAMES[targetLang] || targetLang}...`);

    try {
      const elements = getTranslatableElements();

      // Store original content for potential revert
      if (currentLang === 'en') {
        storeOriginalContent(elements);
      }

      // Translate important elements first (for perceived speed)
      await translateImportantElements(targetLang);

      // Translate body content
      await translateElements(elements, targetLang);

      currentLang = targetLang;
      console.log(`🏴‍☠️ Translation complete!`);

      // Show browser hint popup ONLY ONCE, after translation completes
      if (!wasBrowserHintShown()) {
        setTimeout(() => {
          showBrowserHintPopup(targetLang);
        }, HINT_DELAY_AFTER_TRANSLATE);
      }

    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      isTranslating = false;
      hideTranslatingState();
    }
  }

  // Restore original English content
  function restoreOriginal() {
    originalContent.forEach((text, element) => {
      element.textContent = text;
    });
    currentLang = 'en';
    console.log('🏴‍☠️ Restored original English content');
  }

  // Create browser hint popup
  function createBrowserHintPopup(langName) {
    const div = document.createElement('div');
    div.className = 'translate-popup';
    div.setAttribute('role', 'complementary');
    div.setAttribute('aria-label', 'Translation tip');

    div.innerHTML = `
      <div class="translate-popup-header">
        <span class="translate-popup-title">Translation Tip</span>
        <button class="translate-popup-close" aria-label="Close">&times;</button>
      </div>
      <div class="translate-popup-content">
        <p>The Captain's tales have been translated to <strong>${langName}</strong>!</p>
        <p class="translate-popup-tip">For even better translations, you can also use your browser's built-in translation feature, which preserves all formatting perfectly.</p>
      </div>
    `;

    return div;
  }

  // Show browser hint popup (only once ever)
  function showBrowserHintPopup(langCode) {
    if (browserHintPopup) return; // Already showing

    const langName = LANG_NAMES[langCode] || langCode.toUpperCase();
    browserHintPopup = createBrowserHintPopup(langName);
    document.body.appendChild(browserHintPopup);

    // Set up event listeners
    browserHintPopup.addEventListener('mouseenter', () => {
      isHovering = true;
      clearTimeout(hideTimeout);
      browserHintPopup.classList.add('staying');
    });

    browserHintPopup.addEventListener('mouseleave', () => {
      isHovering = false;
      browserHintPopup.classList.remove('staying');
      startHideTimer();
    });

    const closeBtn = browserHintPopup.querySelector('.translate-popup-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', hideBrowserHintPopup);
    }

    // Trigger animation
    requestAnimationFrame(() => {
      browserHintPopup.classList.add('visible');
    });

    // Start hide timer
    startHideTimer();

    // Mark as shown so it never shows again
    markBrowserHintShown();
  }

  // Hide browser hint popup
  function hideBrowserHintPopup() {
    clearTimeout(hideTimeout);
    if (browserHintPopup) {
      browserHintPopup.classList.remove('visible');
      setTimeout(() => {
        if (browserHintPopup && browserHintPopup.parentNode) {
          browserHintPopup.parentNode.removeChild(browserHintPopup);
        }
        browserHintPopup = null;
      }, 500);
    }
  }

  // Start auto-hide timer for browser hint
  function startHideTimer() {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      if (!isHovering) {
        hideBrowserHintPopup();
      }
    }, HINT_HIDE_DELAY);
  }

  // Handle language selection
  function handleLanguageChange(event) {
    const selectedLang = event.target.value;

    if (selectedLang === 'en') {
      restoreOriginal();
    } else {
      translatePage(selectedLang);
    }
  }

  // Initialize
  function init() {
    const selector = document.getElementById('lang-selector');

    if (!selector) {
      console.log('Language selector not found');
      return;
    }

    // Set up language selector
    selector.addEventListener('change', handleLanguageChange);

    console.log('🏴‍☠️ The Black Captain translation system initialized');
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
