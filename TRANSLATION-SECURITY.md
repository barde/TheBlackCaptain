# Translation API Security

The translation API at `/api/translate` is secured against unauthorized use with multiple layers of protection.

## Security Measures

### 1. **Origin Validation**
- Only accepts requests from:
  - `https://blackhoard.com`
  - `https://www.blackhoard.com`
  - `https://the-black-captain.pages.dev`
- Checks both `Origin` and `Referer` headers
- Returns `403 Forbidden` for unauthorized domains

### 2. **Rate Limiting**
- **Limit**: 60 requests per minute per IP address
- Tracks using Cloudflare's `CF-Connecting-IP` header
- Returns `429 Too Many Requests` when exceeded
- Automatic reset after 60 seconds

### 3. **Text Length Validation**
- Maximum text length: 5,000 characters per request
- Prevents API abuse and excessive costs
- Returns `400 Bad Request` for oversized requests

### 4. **CORS Protection**
- Proper CORS headers only for allowed origins
- Preflight (OPTIONS) requests handled correctly
- Prevents cross-origin abuse from other websites

### 5. **Caching**
- Translation results cached in KV store (24 hours)
- Reduces duplicate API calls
- Lower costs and faster responses

## How It Works

```javascript
// Request from blackhoard.com - ALLOWED
fetch('https://blackhoard.com/api/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Hello',
    targetLang: 'de',
    sourceLang: 'en'
  })
});
// ✅ Returns: { translatedText: 'Hallo', ... }

// Request from evil-site.com - BLOCKED
fetch('https://blackhoard.com/api/translate', { ... });
// ❌ Returns: 403 Forbidden - Unauthorized
```

## Monitoring

Unauthorized requests and rate limit violations are logged:

```
Blocked unauthorized request from: https://evil-site.com
Rate limit exceeded for IP: 1.2.3.4
```

## Cost Protection

These measures protect against:
- **API abuse** from bots or scrapers
- **Excessive costs** from unauthorized usage
- **DDoS attacks** via translation spam
- **Resource exhaustion** from large text requests

## Legitimate Use

Legitimate users on blackhoard.com are unaffected:
- Translations work seamlessly
- Cached results load instantly
- Rate limits accommodate normal browsing
- No authentication required for site visitors

## Technical Details

- **Implementation**: Cloudflare Pages Function (`functions/api/translate.js`)
- **Backend**: Cloudflare Workers AI (`@cf/meta/m2m100-1.2b`)
- **Storage**: Cloudflare KV for caching and rate limiting
- **Protection**: Multi-layer defense (origin + rate + size + CORS)
