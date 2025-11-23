/**
 * Cloudflare Pages Function for Translation
 * Handles /api/translate endpoint
 * SECURITY: Only allows requests from blackhoard.com
 */

// Allowed origins
const ALLOWED_ORIGINS = [
  'https://blackhoard.com',
  'https://www.blackhoard.com',
  'https://the-black-captain.pages.dev'
];

// Rate limiting: max requests per IP per minute
const RATE_LIMIT = 60; // requests
const RATE_WINDOW = 60; // seconds

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Security Check 1: Origin/Referer validation
    const origin = request.headers.get('Origin');
    const referer = request.headers.get('Referer');

    const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);
    const isAllowedReferer = referer && ALLOWED_ORIGINS.some(allowed => referer.startsWith(allowed));

    if (!isAllowedOrigin && !isAllowedReferer) {
      console.warn('Blocked unauthorized request from:', origin || referer || 'unknown');
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || '*'
        }
      });
    }

    // Security Check 2: Rate limiting by IP
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimitKey = `ratelimit:${clientIP}`;

    if (env.TRANSLATIONS_KV) {
      const currentCount = await env.TRANSLATIONS_KV.get(rateLimitKey);
      const count = currentCount ? parseInt(currentCount) : 0;

      if (count >= RATE_LIMIT) {
        console.warn('Rate limit exceeded for IP:', clientIP);
        return new Response(JSON.stringify({
          error: 'Rate limit exceeded. Please try again later.'
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': RATE_WINDOW.toString()
          }
        });
      }

      // Increment rate limit counter
      await env.TRANSLATIONS_KV.put(rateLimitKey, (count + 1).toString(), {
        expirationTtl: RATE_WINDOW
      });
    }

    // Parse request body
    const { text, targetLang, sourceLang = 'en' } = await request.json();

    if (!text || !targetLang) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: text, targetLang'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || 'https://blackhoard.com'
        }
      });
    }

    // Security Check 3: Text length validation (prevent abuse)
    const MAX_TEXT_LENGTH = 5000; // characters
    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(JSON.stringify({
        error: `Text too long. Maximum ${MAX_TEXT_LENGTH} characters allowed.`
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || 'https://blackhoard.com'
        }
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
    // Supports 51 languages across all continents
    const langMap = {
      // Europe
      'en': 'en', 'de': 'de', 'es': 'es', 'fr': 'fr', 'it': 'it', 'pt': 'pt',
      'nl': 'nl', 'pl': 'pl', 'ru': 'ru', 'cs': 'cs', 'da': 'da', 'fi': 'fi',
      'el': 'el', 'hu': 'hu', 'no': 'no', 'ro': 'ro', 'sv': 'sv', 'tr': 'tr',
      'uk': 'uk', 'bg': 'bg', 'hr': 'hr', 'et': 'et', 'is': 'is', 'lt': 'lt',
      'lv': 'lv', 'mk': 'mk', 'sk': 'sk', 'sl': 'sl',
      // Asia
      'zh': 'zh', 'ja': 'ja', 'ko': 'ko', 'ar': 'ar', 'hi': 'hi', 'id': 'id',
      'th': 'th', 'vi': 'vi', 'ta': 'ta', 'te': 'te', 'ml': 'ml', 'bn': 'bn',
      'ur': 'ur', 'fa': 'fa', 'he': 'he', 'ms': 'ms', 'my': 'my',
      // Africa
      'af': 'af', 'am': 'am', 'ha': 'ha', 'ig': 'ig', 'sw': 'sw', 'yo': 'yo',
      'zu': 'zu'
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
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin || 'https://blackhoard.com',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
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

// Handle OPTIONS request for CORS preflight
export async function onRequestOptions(context) {
  const { request } = context;
  const origin = request.headers.get('Origin');

  // Only allow CORS from our domains
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);

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
