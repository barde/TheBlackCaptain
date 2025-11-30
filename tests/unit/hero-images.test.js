/**
 * Unit tests for hero image system
 */

const {
  getHeroImage,
  makeHeroHtml,
  SECTION_IMAGES,
  THEME_IMAGES,
} = require('../../src/lib/hero-images');

describe('hero-images', () => {
  describe('makeHeroHtml', () => {
    it('should create img element with correct attributes', () => {
      const result = makeHeroHtml('https://example.com/image.jpg', 'Test Image');

      expect(result).toContain('src="https://example.com/image.jpg"');
      expect(result).toContain('alt="Test Image"');
      expect(result).toContain('class="post-hero-image"');
      expect(result).toContain('width="1200"');
      expect(result).toContain('height="675"');
      expect(result).toContain('loading="eager"');
      expect(result).toContain('fetchpriority="high"');
    });
  });

  describe('getHeroImage', () => {
    describe('section pages', () => {
      it('should return correct image for Archive page', () => {
        const result = getHeroImage('Archive', '', 'page');

        expect(result.url).toBe(SECTION_IMAGES['Archive']);
        expect(result.html).toContain('Archive');
      });

      it('should return correct image for Ship\'s Crew page', () => {
        const result = getHeroImage("Ship's Crew", '', 'page');

        expect(result.url).toBe(SECTION_IMAGES["Ship's Crew"]);
      });

      it('should return correct image for Treasure Trove page', () => {
        const result = getHeroImage("The Captain's Treasure Trove", '', 'page');

        expect(result.url).toBe(SECTION_IMAGES["The Captain's Treasure Trove"]);
      });

      it('should return correct image for Avian Studies page', () => {
        const result = getHeroImage("The Captain's Avian Studies", '', 'page');

        expect(result.url).toBe(SECTION_IMAGES["The Captain's Avian Studies"]);
      });

      it('should return correct image for Others page', () => {
        const result = getHeroImage('Others', '', 'page');

        expect(result.url).toBe('/images/internet-pirate-transparent.png');
      });
    });

    describe('avian studies', () => {
      it('should return null url for avian study articles', () => {
        const result = getHeroImage('Herring Gull', 'larus-argentatus', 'avian-study');

        expect(result.url).toBeNull();
        expect(result.html).toBe('');
      });
    });

    describe('frontmatter image', () => {
      it('should use image from frontmatter when provided', () => {
        const customUrl = 'https://custom.com/image.jpg';
        const result = getHeroImage('My Post', 'my-post', 'post', { image: customUrl });

        expect(result.url).toBe(customUrl);
        expect(result.html).toContain(customUrl);
      });
    });

    describe('theme matching', () => {
      it('should match ship theme in title', () => {
        const result = getHeroImage('The Great Ship', 'great-ship', 'post');

        expect(result.url).toBe(THEME_IMAGES['ship']);
      });

      it('should match voyage theme in title', () => {
        const result = getHeroImage('A Voyage to Kamchatka', 'voyage-kamchatka', 'post');

        expect(result.url).toBe(THEME_IMAGES['voyage']);
      });

      it('should match theme in slug', () => {
        const result = getHeroImage('Unknown Title', 'voyage-to-somewhere', 'post');

        expect(result.url).toBe(THEME_IMAGES['voyage']);
      });

      it('should match northern theme', () => {
        const result = getHeroImage('Northern Station', 'northern-station', 'post');

        expect(result.url).toBe(THEME_IMAGES['northern']);
      });

      it('should match remedy theme', () => {
        const result = getHeroImage("Grandfather's Remedy", 'remedy', 'post');

        expect(result.url).toBe(THEME_IMAGES['remedy']);
      });
    });

    describe('default image', () => {
      it('should return default image for posts without theme match', () => {
        const result = getHeroImage('Random Title', 'random-slug', 'post');

        expect(result.url).toBe(THEME_IMAGES['default']);
      });

      it('should return null for non-post content without theme match', () => {
        const result = getHeroImage('Random Title', 'random-slug', 'page');

        expect(result.url).toBeNull();
        expect(result.html).toBe('');
      });
    });
  });

  describe('SECTION_IMAGES', () => {
    it('should have all required section images', () => {
      expect(SECTION_IMAGES).toHaveProperty('Archive');
      expect(SECTION_IMAGES).toHaveProperty("Ship's Crew");
      expect(SECTION_IMAGES).toHaveProperty("The Captain's Treasure Trove");
      expect(SECTION_IMAGES).toHaveProperty("The Captain's Avian Studies");
      expect(SECTION_IMAGES).toHaveProperty('Others');
    });
  });

  describe('THEME_IMAGES', () => {
    it('should have default theme', () => {
      expect(THEME_IMAGES).toHaveProperty('default');
    });

    it('should have maritime themes', () => {
      expect(THEME_IMAGES).toHaveProperty('ship');
      expect(THEME_IMAGES).toHaveProperty('voyage');
      expect(THEME_IMAGES).toHaveProperty('sea');
      expect(THEME_IMAGES).toHaveProperty('ocean');
      expect(THEME_IMAGES).toHaveProperty('captain');
    });
  });
});
