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

  // Update language toggle button
  function updateLangButton(lang) {
    const button = document.getElementById('lang-toggle');
    if (button) {
      button.textContent = LANG_NAMES[lang] || lang.toUpperCase();
      button.setAttribute('aria-label', `Current language: ${lang}. Click to change.`);
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

  // Translate page content
  async function translatePage(targetLang) {
    if (targetLang === DEFAULT_LANG) {
      restoreOriginalContent();
      currentLang = DEFAULT_LANG;
      updateLangButton(currentLang);
      storeLanguage(currentLang);
      return;
    }

    // Store original content before translating
    storeOriginalContent();

    const translatableElements = document.querySelectorAll('[data-translatable="true"]');

    // Show loading state
    const button = document.getElementById('lang-toggle');
    if (button) {
      button.textContent = '...';
      button.disabled = true;
    }

    try {
      // Translate each element
      for (const element of translatableElements) {
        const originalHTML = originalContent.find(oc => oc.element === element)?.html;
        if (!originalHTML) continue;

        // Extract text content (simple approach - strip HTML tags for translation)
        const textContent = element.textContent;

        // Call translation API
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: textContent,
            targetLang: targetLang,
            sourceLang: DEFAULT_LANG
          })
        });

        if (!response.ok) {
          throw new Error(`Translation failed: ${response.statusText}`);
        }

        const data = await response.json();

        // Replace text content while preserving HTML structure (simple approach)
        // This is basic - for production you'd want to translate text nodes only
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = originalHTML;
        tempDiv.textContent = data.translatedText;
        element.innerHTML = tempDiv.innerHTML;
      }

      currentLang = targetLang;
      storeLanguage(currentLang);
      console.log(`✓ Translated to ${targetLang}`);
    } catch (error) {
      console.error('Translation error:', error);
      alert('Translation failed. Showing original content.');
      restoreOriginalContent();
      currentLang = DEFAULT_LANG;
    } finally {
      if (button) {
        button.disabled = false;
        updateLangButton(currentLang);
      }
    }
  }

  // Cycle through available languages
  function cycleLanguage() {
    const languages = Object.keys(LANG_NAMES);
    const currentIndex = languages.indexOf(currentLang);
    const nextIndex = (currentIndex + 1) % languages.length;
    const nextLang = languages[nextIndex];

    translatePage(nextLang);
  }

  // Initialize
  function init() {
    // Determine initial language
    const storedLang = getStoredLanguage();
    const browserLang = getBrowserLanguage();

    // Priority: stored preference > browser language > default
    const initialLang = storedLang || (browserLang !== DEFAULT_LANG ? browserLang : DEFAULT_LANG);

    currentLang = initialLang;
    updateLangButton(currentLang);

    // Set up language toggle button
    const langButton = document.getElementById('lang-toggle');
    if (langButton) {
      langButton.addEventListener('click', cycleLanguage);
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
