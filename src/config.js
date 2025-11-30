/**
 * Configuration for The Black Captain Blog Builder
 * Central configuration file following 2025 best practices
 */

const path = require('path');

const rootDir = path.resolve(__dirname, '..');

module.exports = {
  // Directory paths
  paths: {
    root: rootDir,
    posts: path.join(rootDir, 'posts'),
    pages: path.join(rootDir, 'pages'),
    assets: path.join(rootDir, 'assets'),
    images: path.join(rootDir, 'images'),
    treasureTrove: path.join(rootDir, 'treasure-trove'),
    avianStudies: path.join(rootDir, 'avian-studies'),
    public: path.join(rootDir, 'public'),
    publicAssets: path.join(rootDir, 'public', 'assets'),
    publicImages: path.join(rootDir, 'public', 'images'),
  },

  // Site metadata
  site: {
    title: 'The many travels of the Black Captain',
    description: 'A journey of healing through words',
    author: 'The Black Captain',
    url: 'https://blackhoard.com',
  },

  // Build options
  build: {
    minTocHeadings: 2, // Minimum headings to show TOC
  },

  // Knowledge base sections
  knowledgeBase: {
    'treasure-trove': {
      title: "The Captain's Treasure Trove",
      description: 'Knowledge and wisdom from the Captain\'s journeys - where science meets the sea. Inspired by the "Schlaues Buch" from Donald Duck comics, these articles explain fascinating concepts in both scientific and Captain\'s terms.',
    },
    'avian-studies': {
      title: "The Captain's Avian Studies",
      description: 'The Black Captain is an avid admirer of our feathered friends. These articles explore the birds encountered on his travels, combining ornithological science with maritime observation.',
    },
  },
};
