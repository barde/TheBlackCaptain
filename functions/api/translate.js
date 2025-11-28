/**
 * Cloudflare Pages Function for Translation
 * Uses Google Cloud Translation API
 * SECURITY: Only allows requests from blackhoard.com
 */

// Allowed origins
const ALLOWED_ORIGINS = [
  'https://blackhoard.com',
  'https://www.blackhoard.com',
  'https://the-black-captain.pages.dev'
];

// Rate limiting: max requests per IP per minute
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60; // seconds

// Google Cloud Translation API endpoint
const GOOGLE_TRANSLATE_API = 'https://translation.googleapis.com/language/translate/v2';

// Language code mapping (our codes to Google codes)
const LANG_MAP = {
  // Europe
  'en': 'en', 'de': 'de', 'es': 'es', 'fr': 'fr', 'it': 'it', 'pt': 'pt',
  'nl': 'nl', 'pl': 'pl', 'ru': 'ru', 'cs': 'cs', 'da': 'da', 'fi': 'fi',
  'el': 'el', 'hu': 'hu', 'no': 'no', 'ro': 'ro', 'sv': 'sv', 'tr': 'tr',
  'uk': 'uk', 'bg': 'bg', 'hr': 'hr', 'et': 'et', 'is': 'is', 'lt': 'lt',
  'lv': 'lv', 'mk': 'mk', 'sk': 'sk', 'sl': 'sl',
  // Asia
  'zh': 'zh-CN', 'ja': 'ja', 'ko': 'ko', 'ar': 'ar', 'hi': 'hi', 'id': 'id',
  'th': 'th', 'vi': 'vi', 'ta': 'ta', 'te': 'te', 'ml': 'ml', 'bn': 'bn',
  'ur': 'ur', 'fa': 'fa', 'he': 'iw', 'ms': 'ms', 'my': 'my',
  // Africa
  'af': 'af', 'am': 'am', 'ha': 'ha', 'ig': 'ig', 'sw': 'sw', 'yo': 'yo',
  'zu': 'zu'
};

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Security Check 1: Origin/Referer validation
    const origin = request.headers.get('Origin');
    const referer = request.headers.get('Referer');

    const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);
    const isAllowedReferer = referer && ALLOWED_ORIGINS.some(allowed => referer.startsWith(allowed));

    // Allow localhost for development
    const isLocalhost = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));

    if (!isAllowedOrigin && !isAllowedReferer && !isLocalhost) {
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

    // Check for Google API key
    const apiKey = env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_TRANSLATE_API_KEY not configured');
      return new Response(JSON.stringify({
        error: 'Translation service not configured',
        message: 'Please configure GOOGLE_TRANSLATE_API_KEY in Cloudflare secrets'
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || 'https://blackhoard.com'
        }
      });
    }

    // Security Check 2: Rate limiting by IP
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimitKey = `ratelimit:translate:${clientIP}`;

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
            'Retry-After': RATE_WINDOW.toString(),
            'Access-Control-Allow-Origin': origin || 'https://blackhoard.com'
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
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || 'https://blackhoard.com'
        }
      });
    }

    // Map language codes
    const googleSourceLang = LANG_MAP[sourceLang] || sourceLang;
    const googleTargetLang = LANG_MAP[targetLang] || targetLang;

    // Generate cache key
    const cacheKey = `google:${sourceLang}:${targetLang}:${hashString(text)}`;

    // Check cache first (if KV is available)
    if (env.TRANSLATIONS_KV) {
      const cached = await env.TRANSLATIONS_KV.get(cacheKey);
      if (cached) {
        console.log('Cache hit for translation');
        return new Response(JSON.stringify({
          translatedText: cached,
          cached: true,
          sourceLang,
          targetLang
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin || 'https://blackhoard.com'
          }
        });
      }
    }

    // Call Google Cloud Translation API
    const googleResponse = await fetch(`${GOOGLE_TRANSLATE_API}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: googleSourceLang,
        target: googleTargetLang,
        format: 'text'
      })
    });

    if (!googleResponse.ok) {
      const errorData = await googleResponse.json().catch(() => ({}));
      console.error('Google Translation API error:', errorData);

      // Check for quota exceeded
      if (googleResponse.status === 403 || googleResponse.status === 429) {
        return new Response(JSON.stringify({
          error: 'Translation quota exceeded or API key invalid',
          message: 'Please check your Google Cloud Translation API configuration'
        }), {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin || 'https://blackhoard.com'
          }
        });
      }

      throw new Error(`Google API error: ${googleResponse.status}`);
    }

    const googleData = await googleResponse.json();
    const translatedText = googleData.data?.translations?.[0]?.translatedText || text;

    // Decode HTML entities that Google sometimes returns
    const decodedText = decodeHtmlEntities(translatedText);

    // Cache the result (7 day TTL to reduce API calls)
    if (env.TRANSLATIONS_KV) {
      await env.TRANSLATIONS_KV.put(cacheKey, decodedText, {
        expirationTtl: 604800 // 7 days
      });
    }

    console.log(`Translated ${text.length} chars: ${sourceLang} → ${targetLang}`);

    return new Response(JSON.stringify({
      translatedText: decodedText,
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
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Handle OPTIONS request for CORS preflight
export async function onRequestOptions(context) {
  const { request } = context;
  const origin = request.headers.get('Origin');

  // Allow CORS from our domains and localhost
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

// Decode HTML entities that Google sometimes returns
function decodeHtmlEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' '
  };

  return text.replace(/&[^;]+;/g, match => entities[match] || match);
}
