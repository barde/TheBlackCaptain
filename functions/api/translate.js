/**
 * Cloudflare Pages Function for Translation
 * Handles /api/translate endpoint
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Parse request body
    const { text, targetLang, sourceLang = 'en' } = await request.json();

    if (!text || !targetLang) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: text, targetLang'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Don't translate if source and target are the same
    if (sourceLang === targetLang) {
      return new Response(JSON.stringify({
        translatedText: text,
        cached: false,
        sourceLang,
        targetLang
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate cache key
    const cacheKey = `translation:${sourceLang}:${targetLang}:${hashString(text)}`;

    // Check cache first (if KV is available)
    if (env.TRANSLATIONS_KV) {
      const cached = await env.TRANSLATIONS_KV.get(cacheKey);
      if (cached) {
        console.log('Cache hit:', cacheKey);
        return new Response(JSON.stringify({
          translatedText: cached,
          cached: true,
          sourceLang,
          targetLang
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Language code mapping for m2m100 model
    const langMap = {
      'en': 'en',
      'de': 'de',
      'es': 'es',
      'fr': 'fr',
      'it': 'it',
      'pt': 'pt',
      'nl': 'nl',
      'pl': 'pl',
      'ru': 'ru',
      'ja': 'ja',
      'zh': 'zh',
      'ko': 'ko',
      'ar': 'ar'
    };

    const mappedSourceLang = langMap[sourceLang] || sourceLang;
    const mappedTargetLang = langMap[targetLang] || targetLang;

    // Use Cloudflare Workers AI for translation
    const translationResult = await env.AI.run('@cf/meta/m2m100-1.2b', {
      text: text,
      source_lang: mappedSourceLang,
      target_lang: mappedTargetLang
    });

    const translatedText = translationResult.translated_text || text;

    // Cache the result (24 hour TTL)
    if (env.TRANSLATIONS_KV) {
      await env.TRANSLATIONS_KV.put(cacheKey, translatedText, {
        expirationTtl: 86400 // 24 hours
      });
    }

    console.log(`Translated ${sourceLang} → ${targetLang}`);

    return new Response(JSON.stringify({
      translatedText,
      cached: false,
      sourceLang,
      targetLang
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(JSON.stringify({
      error: 'Translation failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Simple hash function for cache keys
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
