/**
 * Integration tests for the build process
 * Tests the complete build pipeline from markdown to HTML
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '../..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const TEST_PUBLIC_DIR = path.join(ROOT_DIR, 'public-test');

describe('build process', () => {
  beforeAll(() => {
    // Backup existing public directory if it exists
    if (fs.existsSync(PUBLIC_DIR)) {
      fs.renameSync(PUBLIC_DIR, TEST_PUBLIC_DIR);
    }

    // Run the build
    execSync('node src/index.js', { cwd: ROOT_DIR, stdio: 'pipe' });
  });

  afterAll(() => {
    // Clean up build output
    if (fs.existsSync(PUBLIC_DIR)) {
      fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
    }

    // Restore original public directory
    if (fs.existsSync(TEST_PUBLIC_DIR)) {
      fs.renameSync(TEST_PUBLIC_DIR, PUBLIC_DIR);
    }
  });

  describe('directory structure', () => {
    it('should create public directory', () => {
      expect(fs.existsSync(PUBLIC_DIR)).toBe(true);
    });

    it('should create assets directory', () => {
      const assetsDir = path.join(PUBLIC_DIR, 'assets');
      expect(fs.existsSync(assetsDir)).toBe(true);
    });

    it('should create images directory', () => {
      const imagesDir = path.join(PUBLIC_DIR, 'images');
      expect(fs.existsSync(imagesDir)).toBe(true);
    });

    it('should create knowledge base directories', () => {
      const treasureDir = path.join(PUBLIC_DIR, 'treasure-trove');
      const avianDir = path.join(PUBLIC_DIR, 'avian-studies');

      expect(fs.existsSync(treasureDir)).toBe(true);
      expect(fs.existsSync(avianDir)).toBe(true);
    });
  });

  describe('generated pages', () => {
    it('should generate index.html', () => {
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      expect(fs.existsSync(indexPath)).toBe(true);

      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('Black Captain');
    });

    it('should generate archive.html', () => {
      const archivePath = path.join(PUBLIC_DIR, 'archive.html');
      expect(fs.existsSync(archivePath)).toBe(true);

      const content = fs.readFileSync(archivePath, 'utf-8');
      expect(content).toContain('Archive');
    });

    it('should generate treasure-trove.html', () => {
      const ttPath = path.join(PUBLIC_DIR, 'treasure-trove.html');
      expect(fs.existsSync(ttPath)).toBe(true);

      const content = fs.readFileSync(ttPath, 'utf-8');
      expect(content).toContain('Treasure Trove');
    });

    it('should generate avian-studies.html', () => {
      const asPath = path.join(PUBLIC_DIR, 'avian-studies.html');
      expect(fs.existsSync(asPath)).toBe(true);

      const content = fs.readFileSync(asPath, 'utf-8');
      expect(content).toContain('Avian Studies');
    });
  });

  describe('posts', () => {
    it('should generate HTML for each post', () => {
      const postsDir = path.join(ROOT_DIR, 'posts');
      if (!fs.existsSync(postsDir)) return;

      const postFiles = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));

      postFiles.forEach(file => {
        const htmlFile = file.replace('.md', '.html');
        const htmlPath = path.join(PUBLIC_DIR, htmlFile);
        expect(fs.existsSync(htmlPath)).toBe(true);
      });
    });

    it('should include post content in generated HTML', () => {
      const postsDir = path.join(ROOT_DIR, 'posts');
      if (!fs.existsSync(postsDir)) return;

      const postFiles = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
      if (postFiles.length === 0) return;

      const firstPost = postFiles[0];
      const htmlPath = path.join(PUBLIC_DIR, firstPost.replace('.md', '.html'));
      const content = fs.readFileSync(htmlPath, 'utf-8');

      expect(content).toContain('post-content');
    });
  });

  describe('assets', () => {
    it('should copy CSS files', () => {
      const cssPath = path.join(PUBLIC_DIR, 'assets', 'style.css');
      expect(fs.existsSync(cssPath)).toBe(true);
    });

    it('should copy JS files', () => {
      const jsPath = path.join(PUBLIC_DIR, 'assets', 'main.js');
      expect(fs.existsSync(jsPath)).toBe(true);
    });
  });

  describe('knowledge base articles', () => {
    it('should generate treasure-trove articles', () => {
      const ttDir = path.join(ROOT_DIR, 'treasure-trove');
      if (!fs.existsSync(ttDir)) return;

      const mdFiles = fs.readdirSync(ttDir).filter(f => f.endsWith('.md'));

      mdFiles.forEach(file => {
        const htmlFile = file.replace('.md', '.html');
        const htmlPath = path.join(PUBLIC_DIR, 'treasure-trove', htmlFile);
        expect(fs.existsSync(htmlPath)).toBe(true);
      });
    });

    it('should generate avian-studies articles', () => {
      const asDir = path.join(ROOT_DIR, 'avian-studies');
      if (!fs.existsSync(asDir)) return;

      const mdFiles = fs.readdirSync(asDir).filter(f => f.endsWith('.md'));

      mdFiles.forEach(file => {
        const htmlFile = file.replace('.md', '.html');
        const htmlPath = path.join(PUBLIC_DIR, 'avian-studies', htmlFile);
        expect(fs.existsSync(htmlPath)).toBe(true);
      });
    });
  });

  describe('static pages', () => {
    it('should generate imprint.html', () => {
      const imprintPath = path.join(PUBLIC_DIR, 'imprint.html');
      expect(fs.existsSync(imprintPath)).toBe(true);
    });

    it('should generate ships-crew.html', () => {
      const crewPath = path.join(PUBLIC_DIR, 'ships-crew.html');
      expect(fs.existsSync(crewPath)).toBe(true);
    });
  });
});
