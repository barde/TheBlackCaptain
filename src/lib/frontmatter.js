/**
 * Frontmatter parsing for The Black Captain Blog Builder
 * Parses YAML-like metadata at top of markdown files
 */

/**
 * Parse frontmatter from markdown content
 * @param {string} content - Raw markdown content with frontmatter
 * @returns {{ metadata: Object, content: string }} Parsed metadata and content
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]+?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { metadata: {}, content: content };
  }

  const frontmatter = match[1];
  const markdown = match[2];

  const metadata = {};
  frontmatter.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      metadata[key.trim()] = valueParts.join(':').trim();
    }
  });

  return { metadata, content: markdown };
}

/**
 * Create frontmatter string from metadata object
 * @param {Object} metadata - Metadata object
 * @returns {string} Frontmatter string
 */
function createFrontmatter(metadata) {
  const lines = Object.entries(metadata)
    .map(([key, value]) => `${key}: ${value}`);
  return `---\n${lines.join('\n')}\n---\n`;
}

module.exports = {
  parseFrontmatter,
  createFrontmatter,
};
