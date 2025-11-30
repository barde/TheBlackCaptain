/**
 * Hero image system for The Black Captain Blog Builder
 * Curated maritime-themed images from Unsplash and Wikimedia
 */

// Special section pages with custom hero images
const SECTION_IMAGES = {
  'Archive': 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Tsunami_by_hokusai_19th_century.jpg',
  "Ship's Crew": 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Argonautesch%C3%ABff_Lorenzo_Costa_w.jpg',
  "The Captain's Treasure Trove": 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Silver_Adornments_of_the_Vishchyn_Treasure_Trove.jpg',
  "The Captain's Avian Studies": 'https://cloud.vogel.yoga/imgs/IMG_6283.jpg',
  'Others': '/images/internet-pirate-transparent.png',
};

// Map of curated Unsplash photos for different themes (maritime-themed)
const THEME_IMAGES = {
  // Sailing & Ships
  'ship': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=675&fit=crop&auto=format&q=80',
  'voyage': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=675&fit=crop&auto=format&q=80',
  'sailor': 'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1200&h=675&fit=crop&auto=format&q=80',
  'sea': 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200&h=675&fit=crop&auto=format&q=80',
  'ocean': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=675&fit=crop&auto=format&q=80',
  'port': 'https://images.unsplash.com/photo-1605553787144-0c29cd64d13b?w=1200&h=675&fit=crop&auto=format&q=80',
  'captain': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1200&h=675&fit=crop&auto=format&q=80',
  'storm': 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=1200&h=675&fit=crop&auto=format&q=80',
  'dock': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=675&fit=crop&auto=format&q=80',
  'harbor': 'https://images.unsplash.com/photo-1568445186401-2e0213c59eaf?w=1200&h=675&fit=crop&auto=format&q=80',
  // Mood & Season
  'northern': 'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=1200&h=675&fit=crop&auto=format&q=80',
  'winter': 'https://images.unsplash.com/photo-1517299321609-52687d1bc55a?w=1200&h=675&fit=crop&auto=format&q=80',
  'cold': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&h=675&fit=crop&auto=format&q=80',
  'illness': 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=1200&h=675&fit=crop&auto=format&q=80',
  'remedy': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&h=675&fit=crop&auto=format&q=80',
  // People & Stories
  'scholar': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=675&fit=crop&auto=format&q=80',
  'crew': 'https://images.unsplash.com/photo-1593642532781-03e79bf5bec2?w=1200&h=675&fit=crop&auto=format&q=80',
  'beginning': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200&h=675&fit=crop&auto=format&q=80',
  // Default maritime
  'default': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=675&fit=crop&auto=format&q=80',
};

/**
 * Create hero image HTML
 * @param {string} url - Image URL
 * @param {string} alt - Alt text
 * @returns {string} HTML img element
 */
function makeHeroHtml(url, alt) {
  return `<img src="${url}" alt="${alt}" class="post-hero-image" width="1200" height="675" loading="eager" fetchpriority="high">`;
}

/**
 * Get hero image for a page/post
 * @param {string} title - Page title
 * @param {string} slug - Page slug
 * @param {string} type - Content type (post, page, avian-study, etc.)
 * @param {Object} metadata - Page metadata
 * @returns {{ url: string|null, html: string }} Hero image data
 */
function getHeroImage(title, slug, type, metadata = {}) {
  // Check if this is a section page
  if (SECTION_IMAGES[title]) {
    const url = SECTION_IMAGES[title];
    return { url, html: makeHeroHtml(url, title) };
  }

  // Skip hero images for individual avian study articles
  if (type === 'avian-study') {
    return { url: null, html: '' };
  }

  // If image is explicitly set in frontmatter, use it
  if (metadata.image) {
    const url = metadata.image;
    return { url, html: makeHeroHtml(url, title) };
  }

  // Try to match theme based on title and slug
  const searchText = (title + ' ' + slug).toLowerCase();

  for (const [theme, imageUrl] of Object.entries(THEME_IMAGES)) {
    if (theme !== 'default' && searchText.includes(theme)) {
      return { url: imageUrl, html: makeHeroHtml(imageUrl, title) };
    }
  }

  // Default maritime image for posts
  if (type === 'post') {
    const url = THEME_IMAGES.default;
    return { url, html: makeHeroHtml(url, title) };
  }

  return { url: null, html: '' };
}

module.exports = {
  getHeroImage,
  makeHeroHtml,
  SECTION_IMAGES,
  THEME_IMAGES,
};
