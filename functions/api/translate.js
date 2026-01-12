/**
 * Cloudflare Pages Function for Translation
 * Uses Cloudflare Workers AI for automatic translation
 * Caches translations in Workers KV for performance
 */

// Allowed origins
const ALLOWED_ORIGINS = [
  'https://blackhoard.com',
  'https://www.blackhoard.com',
  'https://the-black-captain.pages.dev'
];

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Adjusted dynamically below
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // Security Check 1: Origin/Referer validation
    const origin = request.headers.get('Origin');
    const referer = request.headers.get('Referer');

    const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);
    const isAllowedReferer = referer && ALLOWED_ORIGINS.some(allowed => referer.startsWith(allowed));
    const isLocalhost = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));

    if (!isAllowedOrigin && !isAllowedReferer && !isLocalhost) {
      console.warn('Blocked unauthorized request from:', origin || referer || 'unknown');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Adjust CORS origin
    corsHeaders['Access-Control-Allow-Origin'] = origin || 'https://blackhoard.com';

    // Parse request body
    const { text, targetLang, sourceLang = 'en' } = await request.json();

    if (!text || !targetLang) {
      return new Response(JSON.stringify({ error: 'Missing required fields: text, targetLang' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
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
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
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
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // Language code mapping for m2m100 model
    const langMap = {
      'en': 'en', 'de': 'de', 'es': 'es', 'fr': 'fr', 'it': 'it',
      'pt': 'pt', 'nl': 'nl', 'pl': 'pl', 'ru': 'ru', 'ja': 'ja',
      'zh': 'zh', 'ko': 'ko', 'ar': 'ar'
    };

    const mappedSourceLang = langMap[sourceLang] || sourceLang;
    const mappedTargetLang = langMap[targetLang] || targetLang;

    // Use Cloudflare Workers AI
    if (!env.AI) {
      throw new Error('AI binding not found');
    }

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
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(JSON.stringify({
      error: 'Translation failed',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Fallback
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
}

export async function onRequestOptions(context) {
  const { request } = context;
  const origin = request.headers.get('Origin');
  
  const isAllowed = origin && (
    ALLOWED_ORIGINS.includes(origin) ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1')
  );

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': isAllowed ? origin : 'https://blackhoard.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}