/**
 * HTML template generation for The Black Captain Blog Builder
 */

const config = require('../config');
const { getHeroImage } = require('./hero-images');

/**
 * Generate HTML page from content
 * @param {string} title - Page title
 * @param {string} content - HTML content
 * @param {Object} metadata - Page metadata
 * @returns {string} Complete HTML page
 */
function generatePage(title, content, metadata = {}) {
  const date = metadata.date || '';
  const description = metadata.description || '';
  const slug = metadata.slug || '';
  const type = metadata.type || 'post';

  // Get hero image for this content
  const heroImage = getHeroImage(title, slug, type, metadata);

  // Generate preload link for hero image (improves LCP by 100-300ms)
  const preloadLink = heroImage.url
    ? `<link rel="preload" as="image" href="${heroImage.url}" fetchpriority="high">`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description}">
  <title>${title ? title + ' - ' : ''}${config.site.title}</title>
  <link rel="stylesheet" href="/assets/style.css">
  ${preloadLink}
</head>
<body>
  <nav class="main-nav">
    <div class="nav-container">
      <a href="/" class="site-title">The Black Captain</a>
      <div class="nav-links">
        <a href="/">Home</a>
        <a href="/archive.html">Archive</a>
        <a href="/ships-crew.html">Ship's Crew</a>
        <a href="/treasure-trove.html">Treasure Trove</a>
        <a href="/avian-studies.html">Avian Studies</a>
        <a href="/others.html">Others</a>
        ${generateLanguageSelector()}
      </div>
    </div>
  </nav>

  <main class="container">
    <article class="post" data-translatable="true">
      ${heroImage.html}
      <header class="post-header">
        <h1 class="post-title">${title}</h1>
        ${date ? `<time class="post-date">${date}</time>` : ''}
      </header>
      <div class="post-content">
        ${content}
      </div>
      ${type === 'post' ? generateSupportSection() : ''}
    </article>
  </main>

  <div class="job-notice">
    <p>The Captain's writer is seeking new horizons — <a href="https://www.linkedin.com/posts/activity-7400919305036664832-QHB3" target="_blank" rel="noopener">Open to IT opportunities</a></p>
  </div>

  <footer class="main-footer">
    <p>${config.site.title} - ${config.site.description}</p>
    <p class="footer-links"><a href="/imprint.html">Imprint</a></p>
  </footer>

  <script src="/assets/main.js"></script>
</body>
</html>`;
}

/**
 * Generate language selector dropdown
 * @returns {string} HTML for language selector
 */
function generateLanguageSelector() {
  return `<select id="lang-selector" class="lang-selector" aria-label="Select language">
          <option value="en">🌍 English</option>
          <optgroup label="🇪🇺 Europe">
            <option value="de">Deutsch (German)</option>
            <option value="es">Español (Spanish)</option>
            <option value="fr">Français (French)</option>
            <option value="it">Italiano (Italian)</option>
            <option value="pt">Português (Portuguese)</option>
            <option value="nl">Nederlands (Dutch)</option>
            <option value="pl">Polski (Polish)</option>
            <option value="ru">Русский (Russian)</option>
            <option value="cs">Čeština (Czech)</option>
            <option value="da">Dansk (Danish)</option>
            <option value="fi">Suomi (Finnish)</option>
            <option value="el">Ελληνικά (Greek)</option>
            <option value="hu">Magyar (Hungarian)</option>
            <option value="no">Norsk (Norwegian)</option>
            <option value="ro">Română (Romanian)</option>
            <option value="sv">Svenska (Swedish)</option>
            <option value="tr">Türkçe (Turkish)</option>
            <option value="uk">Українська (Ukrainian)</option>
            <option value="bg">Български (Bulgarian)</option>
            <option value="hr">Hrvatski (Croatian)</option>
            <option value="et">Eesti (Estonian)</option>
            <option value="is">Íslenska (Icelandic)</option>
            <option value="lt">Lietuvių (Lithuanian)</option>
            <option value="lv">Latviešu (Latvian)</option>
            <option value="mk">Македонски (Macedonian)</option>
            <option value="sk">Slovenčina (Slovak)</option>
            <option value="sl">Slovenščina (Slovenian)</option>
          </optgroup>
          <optgroup label="🌏 Asia">
            <option value="zh">中文 (Chinese)</option>
            <option value="ja">日本語 (Japanese)</option>
            <option value="ko">한국어 (Korean)</option>
            <option value="ar">العربية (Arabic)</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="id">Bahasa Indonesia (Indonesian)</option>
            <option value="th">ไทย (Thai)</option>
            <option value="vi">Tiếng Việt (Vietnamese)</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="ml">മലയാളം (Malayalam)</option>
            <option value="bn">বাংলা (Bengali)</option>
            <option value="ur">اردو (Urdu)</option>
            <option value="fa">فارسی (Persian)</option>
            <option value="he">עברית (Hebrew)</option>
            <option value="ms">Bahasa Melayu (Malay)</option>
            <option value="my">မြန်မာ (Burmese)</option>
          </optgroup>
          <optgroup label="🌍 Africa">
            <option value="af">Afrikaans</option>
            <option value="am">አማርኛ (Amharic)</option>
            <option value="ha">Hausa</option>
            <option value="ig">Igbo</option>
            <option value="sw">Kiswahili (Swahili)</option>
            <option value="yo">Yorùbá</option>
            <option value="zu">isiZulu (Zulu)</option>
          </optgroup>
        </select>`;
}

/**
 * Generate Ko-fi support section
 * @returns {string} HTML for support section
 */
function generateSupportSection() {
  return `
      <div class="support-captain">
        <p class="support-text">If this tale warmed your heart or gave you a moment of peace on troubled seas, consider buying the Captain a grog.</p>
        <a href="https://ko-fi.com/theblackcaptain" target="_blank" rel="noopener" class="kofi-button">
          <span class="kofi-icon">☕</span> Buy the Captain a Grog
        </a>
      </div>`;
}

module.exports = {
  generatePage,
  generateLanguageSelector,
  generateSupportSection,
};
