/**
 * The Black Captain - Frontend Script
 * Handles language detection and translation toggle
 */

(function() {
  'use strict';

  // Language configuration
  const LANG_KEY = 'bc_preferred_lang';
  const DEFAULT_LANG = 'en';

  // Language names for display
  const LANG_NAMES = {
    'en': 'EN',
    'de': 'DE',
    'es': 'ES',
    'fr': 'FR',
    'it': 'IT',
    'pt': 'PT',
    'nl': 'NL',
    'pl': 'PL',
    'ru': 'RU',
    'ja': 'JA',
    'zh': 'ZH',
    'ko': 'KO',
    'ar': 'AR'
  };

  // State
  let currentLang = DEFAULT_LANG;
  let originalContent = null;

  // Get user's browser language
  function getBrowserLanguage() {
    const lang = navigator.language || navigator.userLanguage;
    const shortLang = lang.split('-')[0].toLowerCase();
    return LANG_NAMES[shortLang] ? shortLang : DEFAULT_LANG;
  }

  // Get stored language preference
  function getStoredLanguage() {
    try {
      return localStorage.getItem(LANG_KEY) || null;
    } catch (e) {
      return null;
    }
  }

  // Store language preference
  function storeLanguage(lang) {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (e) {
      // LocalStorage not available
    }
  }

  // Update language selector
  function updateLangSelector(lang) {
    const selector = document.getElementById('lang-selector');
    if (selector) {
      selector.value = lang;
    }
  }

  // Store original content before translation
  function storeOriginalContent() {
    if (originalContent) return; // Already stored

    const translatableElements = document.querySelectorAll('[data-translatable="true"]');
    originalContent = Array.from(translatableElements).map(el => ({
      element: el,
      html: el.innerHTML
    }));
  }

  // Restore original English content
  function restoreOriginalContent() {
    if (!originalContent) return;

    originalContent.forEach(({ element, html }) => {
      element.innerHTML = html;
    });
  }

  // Translate a single text element
  async function translateElement(element, targetLang) {
    const originalText = element.textContent.trim();
    if (!originalText) return;

    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: originalText,
        targetLang: targetLang,
        sourceLang: DEFAULT_LANG
      })
    });

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.statusText}`);
    }

    const data = await response.json();
    element.textContent = data.translatedText;
  }

  // Translate page content
  async function translatePage(targetLang) {
    if (targetLang === DEFAULT_LANG) {
      restoreOriginalContent();
      currentLang = DEFAULT_LANG;
      updateLangSelector(currentLang);
      storeLanguage(currentLang);
      return;
    }

    // Store original content before translating
    storeOriginalContent();

    const translatableContainer = document.querySelectorAll('[data-translatable="true"]');

    // Show loading state
    const selector = document.getElementById('lang-selector');
    const originalValue = selector ? selector.value : targetLang;
    if (selector) {
      selector.disabled = true;
      selector.style.opacity = '0.6';
    }

    try {
      // For each translatable container, find individual text elements
      for (const container of translatableContainer) {
        // Find all text-containing elements (headings, paragraphs, list items, etc.)
        const textElements = container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, td, th, figcaption, blockquote, .site-description');

        // Translate each element
        for (const element of textElements) {
          await translateElement(element, targetLang);
        }

        // Also translate direct text in elements with specific classes
        const postTitle = container.querySelector('.post-title');
        if (postTitle) await translateElement(postTitle, targetLang);

        const postDate = container.querySelector('.post-date');
        // Don't translate dates

        // Translate link text but not URLs
        const links = container.querySelectorAll('a');
        for (const link of links) {
          if (link.textContent.trim() && !link.querySelector('h1, h2, h3, h4, h5, h6')) {
            await translateElement(link, targetLang);
          }
        }
      }

      currentLang = targetLang;
      storeLanguage(currentLang);
      console.log(`✓ Translated to ${targetLang}`);
    } catch (error) {
      console.error('Translation error:', error);
      alert('Translation failed. Showing original content.');
      restoreOriginalContent();
      currentLang = DEFAULT_LANG;
      if (selector) {
        selector.value = DEFAULT_LANG;
      }
    } finally {
      if (selector) {
        selector.disabled = false;
        selector.style.opacity = '1';
        updateLangSelector(currentLang);
      }
    }
  }

  // Handle language selection
  function handleLanguageChange(event) {
    const selectedLang = event.target.value;
    translatePage(selectedLang);
  }

  // Initialize
  function init() {
    // Determine initial language
    const storedLang = getStoredLanguage();
    const browserLang = getBrowserLanguage();

    // Priority: stored preference > browser language > default
    const initialLang = storedLang || (browserLang !== DEFAULT_LANG ? browserLang : DEFAULT_LANG);

    currentLang = initialLang;
    updateLangSelector(currentLang);

    // Set up language selector dropdown
    const langSelector = document.getElementById('lang-selector');
    if (langSelector) {
      langSelector.addEventListener('change', handleLanguageChange);
    }

    // Auto-translate if not English
    if (initialLang !== DEFAULT_LANG) {
      // Small delay to ensure page is fully loaded
      setTimeout(() => translatePage(initialLang), 100);
    }

    console.log('🏴‍☠️ The Black Captain blog initialized');
    console.log(`Language: ${currentLang}`);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
