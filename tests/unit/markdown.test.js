/**
 * Unit tests for markdown to HTML conversion
 */

const { markdownToHTML } = require('../../src/lib/markdown');

describe('markdown', () => {
  describe('markdownToHTML', () => {
    describe('headings', () => {
      it('should convert h1 headings', () => {
        const result = markdownToHTML('# Title', { includeTOC: false });
        expect(result).toContain('<h1>Title</h1>');
      });

      it('should convert h2 headings with IDs', () => {
        const result = markdownToHTML('## Section', { includeTOC: false });
        expect(result).toContain('<h2 id="section">Section</h2>');
      });

      it('should convert h3 headings with IDs', () => {
        const result = markdownToHTML('### Subsection', { includeTOC: false });
        expect(result).toContain('<h3 id="subsection">Subsection</h3>');
      });

      it('should convert h4 headings with IDs', () => {
        const result = markdownToHTML('#### Detail', { includeTOC: false });
        expect(result).toContain('<h4 id="detail">Detail</h4>');
      });
    });

    describe('text formatting', () => {
      it('should convert bold text with asterisks', () => {
        const result = markdownToHTML('**bold**', { includeTOC: false });
        expect(result).toContain('<strong>bold</strong>');
      });

      it('should convert bold text with underscores', () => {
        const result = markdownToHTML('__bold__', { includeTOC: false });
        expect(result).toContain('<strong>bold</strong>');
      });

      it('should convert italic text with asterisks', () => {
        const result = markdownToHTML('*italic*', { includeTOC: false });
        expect(result).toContain('<em>italic</em>');
      });

      it('should convert italic text with underscores', () => {
        const result = markdownToHTML('_italic_', { includeTOC: false });
        expect(result).toContain('<em>italic</em>');
      });

      it('should convert bold-italic text with asterisks', () => {
        const result = markdownToHTML('***bold italic***', { includeTOC: false });
        expect(result).toContain('<strong><em>bold italic</em></strong>');
      });

      it('should convert bold-italic text with underscores', () => {
        const result = markdownToHTML('___bold italic___', { includeTOC: false });
        expect(result).toContain('<strong><em>bold italic</em></strong>');
      });
    });

    describe('links and images', () => {
      it('should convert markdown links', () => {
        const result = markdownToHTML('[Click here](https://example.com)', { includeTOC: false });
        expect(result).toContain('<a href="https://example.com">Click here</a>');
      });

      it('should convert images with lazy loading', () => {
        const result = markdownToHTML('![Alt text](image.jpg)', { includeTOC: false });
        expect(result).toContain('<img src="image.jpg" alt="Alt text" loading="lazy">');
      });

      it('should handle images with empty alt text', () => {
        const result = markdownToHTML('![](image.jpg)', { includeTOC: false });
        expect(result).toContain('<img src="image.jpg" alt="" loading="lazy">');
      });
    });

    describe('paragraphs and line breaks', () => {
      it('should convert double newlines to paragraphs', () => {
        const result = markdownToHTML('Para 1\n\nPara 2', { includeTOC: false });
        expect(result).toContain('</p><p>');
      });

      it('should convert single newlines to br tags', () => {
        const result = markdownToHTML('Line 1\nLine 2', { includeTOC: false });
        expect(result).toContain('<br>');
      });
    });

    describe('TOC generation', () => {
      it('should include TOC by default when enough headings', () => {
        const markdown = `## Section 1
Content
## Section 2
More content`;

        const result = markdownToHTML(markdown);

        expect(result).toContain('<nav class="toc"');
      });

      it('should not include TOC when disabled', () => {
        const markdown = `## Section 1
## Section 2`;

        const result = markdownToHTML(markdown, { includeTOC: false });

        expect(result).not.toContain('<nav class="toc"');
      });

      it('should not include TOC when fewer than minimum headings', () => {
        const markdown = '## Only One Section';

        const result = markdownToHTML(markdown, { minTocHeadings: 2 });

        expect(result).not.toContain('<nav class="toc"');
      });
    });

    describe('cleanup', () => {
      it('should not create empty paragraph tags', () => {
        const result = markdownToHTML('# Title\n\nContent', { includeTOC: false });
        expect(result).not.toContain('<p></p>');
      });

      it('should not wrap headings in paragraph tags', () => {
        const result = markdownToHTML('# Title', { includeTOC: false });
        expect(result).not.toContain('<p><h1>');
      });
    });
  });
});
