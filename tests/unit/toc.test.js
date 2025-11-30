/**
 * Unit tests for Table of Contents generation
 */

const { extractHeadings, generateTOC } = require('../../src/lib/toc');

describe('toc', () => {
  describe('extractHeadings', () => {
    it('should extract h2 headings', () => {
      const markdown = `## First Section
Some content
## Second Section
More content`;

      const result = extractHeadings(markdown);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ level: 2, text: 'First Section', id: 'first-section' });
      expect(result[1]).toEqual({ level: 2, text: 'Second Section', id: 'second-section' });
    });

    it('should extract h3 headings', () => {
      const markdown = `### Subsection
Content here`;

      const result = extractHeadings(markdown);

      expect(result).toHaveLength(1);
      expect(result[0].level).toBe(3);
    });

    it('should extract h4 headings', () => {
      const markdown = `#### Deep Section`;

      const result = extractHeadings(markdown);

      expect(result).toHaveLength(1);
      expect(result[0].level).toBe(4);
    });

    it('should not extract h1 headings', () => {
      const markdown = `# Title
## Section`;

      const result = extractHeadings(markdown);

      expect(result).toHaveLength(1);
      expect(result[0].level).toBe(2);
    });

    it('should return empty array for content without headings', () => {
      const markdown = 'Just some text without any headings.';

      const result = extractHeadings(markdown);

      expect(result).toEqual([]);
    });

    it('should handle mixed heading levels', () => {
      const markdown = `## Section 1
### Subsection 1.1
#### Detail 1.1.1
## Section 2`;

      const result = extractHeadings(markdown);

      expect(result).toHaveLength(4);
      expect(result[0].level).toBe(2);
      expect(result[1].level).toBe(3);
      expect(result[2].level).toBe(4);
      expect(result[3].level).toBe(2);
    });

    it('should generate slugified IDs', () => {
      const markdown = `## The Captain's Log`;

      const result = extractHeadings(markdown);

      expect(result[0].id).toBe('the-captains-log');
    });
  });

  describe('generateTOC', () => {
    it('should return empty string when fewer than minimum headings', () => {
      const headings = [{ level: 2, text: 'Only One', id: 'only-one' }];

      const result = generateTOC(headings, 2);

      expect(result).toBe('');
    });

    it('should generate TOC with correct structure', () => {
      const headings = [
        { level: 2, text: 'First', id: 'first' },
        { level: 2, text: 'Second', id: 'second' },
      ];

      const result = generateTOC(headings);

      expect(result).toContain('<nav class="toc"');
      expect(result).toContain('aria-label="Table of Contents"');
      expect(result).toContain('<details open>');
      expect(result).toContain('<summary><strong>Contents</strong></summary>');
      expect(result).toContain('<a href="#first">First</a>');
      expect(result).toContain('<a href="#second">Second</a>');
    });

    it('should handle nested headings', () => {
      const headings = [
        { level: 2, text: 'Section', id: 'section' },
        { level: 3, text: 'Subsection', id: 'subsection' },
      ];

      const result = generateTOC(headings);

      expect(result).toContain('<ul>');
      expect(result).toContain('</ul>');
    });

    it('should respect custom minimum headings parameter', () => {
      const headings = [
        { level: 2, text: 'One', id: 'one' },
        { level: 2, text: 'Two', id: 'two' },
        { level: 2, text: 'Three', id: 'three' },
      ];

      const resultWith4Min = generateTOC(headings, 4);
      const resultWith3Min = generateTOC(headings, 3);

      expect(resultWith4Min).toBe('');
      expect(resultWith3Min).not.toBe('');
    });

    it('should handle empty headings array', () => {
      const result = generateTOC([]);
      expect(result).toBe('');
    });
  });
});
