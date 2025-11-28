/**
 * The Black Captain - Frontend Script
 * Handles language detection and translation via Google Cloud Translation API
 */

(function() {
  'use strict';

  // Configuration
  const LANG_KEY = 'bc_preferred_lang';
  const DEFAULT_LANG = 'en';

  // State
  let currentLang = DEFAULT_LANG;
  let originalContent = null;
  let isTranslating = false;

  // Get user's browser language
  function getBrowserLanguage() {
    const lang = navigator.language || navigator.userLanguage;
    const shortLang = lang.split('-')[0].toLowerCase();
    // Only auto-detect for common languages
    const supportedAutoDetect = ['de', 'es', 'fr', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'zh', 'ko'];
    return supportedAutoDetect.includes(shortLang) ? shortLang : DEFAULT_LANG;
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

  // Get the language selector element
  function getSelector() {
    return document.getElementById('lang-selector');
  }

  // Update language selector value
  function updateLangSelector(lang) {
    const selector = getSelector();
    if (selector && selector.value !== lang) {
      selector.value = lang;
    }
  }

  // Set loading state on selector
  function setLoadingState(loading) {
    const selector = getSelector();
    if (!selector) return;

    isTranslating = loading;

    if (loading) {
      selector.style.opacity = '0.6';
      selector.style.cursor = 'wait';
    } else {
      selector.style.opacity = '1';
      selector.style.cursor = 'pointer';
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
    if (!originalText || originalText.length < 2) return;

    // Skip elements that are just numbers, dates, or very short
    if (/^[\d\s\-\/\.\,]+$/.test(originalText)) return;

    try {
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
        const errorData = await response.json().catch(() => ({}));
        console.warn('Translation API error:', errorData.error || response.statusText);
        return; // Don't throw, just skip this element
      }

      const data = await response.json();
      if (data.translatedText && data.translatedText !== originalText) {
        element.textContent = data.translatedText;
      }
    } catch (error) {
      console.warn('Failed to translate element:', error.message);
      // Continue with other elements
    }
  }

  // Translate page content
  async function translatePage(targetLang) {
    // Prevent concurrent translations
    if (isTranslating) {
      console.log('Translation already in progress');
      return;
    }

    // If switching to English, just restore original
    if (targetLang === DEFAULT_LANG) {
      restoreOriginalContent();
      currentLang = DEFAULT_LANG;
      storeLanguage(currentLang);
      updateLangSelector(currentLang);
      return;
    }

    // Store original content before translating
    storeOriginalContent();

    const translatableContainers = document.querySelectorAll('[data-translatable="true"]');
    if (translatableContainers.length === 0) {
      console.log('No translatable content found');
      return;
    }

    // Show loading state
    setLoadingState(true);

    let successCount = 0;
    let errorCount = 0;

    try {
      // Collect all text elements to translate
      const elementsToTranslate = [];

      for (const container of translatableContainers) {
        // Find all text-containing elements
        const textElements = container.querySelectorAll(
          'h1, h2, h3, h4, h5, h6, p, li, blockquote, figcaption'
        );

        for (const element of textElements) {
          // Skip if element has no direct text or only contains other elements
          const hasDirectText = Array.from(element.childNodes).some(
            node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
          );

          if (hasDirectText || element.childNodes.length === 0) {
            elementsToTranslate.push(element);
          }
        }
      }

      console.log(`Translating ${elementsToTranslate.length} elements to ${targetLang}...`);

      // Translate elements (with some parallelism but not too aggressive)
      const batchSize = 5;
      for (let i = 0; i < elementsToTranslate.length; i += batchSize) {
        const batch = elementsToTranslate.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(el => translateElement(el, targetLang))
        );

        results.forEach(result => {
          if (result.status === 'fulfilled') {
            successCount++;
          } else {
            errorCount++;
          }
        });

        // Small delay between batches to be nice to the API
        if (i + batchSize < elementsToTranslate.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Only update state if we had some success
      if (successCount > 0) {
        currentLang = targetLang;
        storeLanguage(currentLang);
        console.log(`✓ Translated ${successCount} elements to ${targetLang}`);
        if (errorCount > 0) {
          console.warn(`${errorCount} elements failed to translate`);
        }
      } else {
        // All failed - restore original
        console.error('Translation failed completely, restoring original');
        restoreOriginalContent();
        currentLang = DEFAULT_LANG;
      }

    } catch (error) {
      console.error('Translation error:', error);
      restoreOriginalContent();
      currentLang = DEFAULT_LANG;
    } finally {
      setLoadingState(false);
      updateLangSelector(currentLang);
    }
  }

  // Handle language selection
  function handleLanguageChange(event) {
    const selectedLang = event.target.value;

    // Don't do anything if we're already translating or if same language
    if (isTranslating || selectedLang === currentLang) {
      return;
    }

    translatePage(selectedLang);
  }

  // Initialize
  function init() {
    const selector = getSelector();

    if (!selector) {
      console.log('Language selector not found');
      return;
    }

    // Determine initial language
    const storedLang = getStoredLanguage();
    const browserLang = getBrowserLanguage();

    // Priority: stored preference > browser language > default
    // But only auto-translate if there's a stored preference
    const initialLang = storedLang || DEFAULT_LANG;
    currentLang = initialLang;

    // Set initial selector value
    updateLangSelector(currentLang);

    // Set up language selector - use 'input' event as backup for 'change'
    selector.addEventListener('change', handleLanguageChange);

    // Auto-translate if stored preference is not English
    if (storedLang && storedLang !== DEFAULT_LANG) {
      // Small delay to ensure page is fully loaded
      setTimeout(() => translatePage(storedLang), 500);
    }

    console.log('🏴‍☠️ The Black Captain blog initialized');
    console.log(`Language: ${currentLang} (stored: ${storedLang}, browser: ${browserLang})`);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
