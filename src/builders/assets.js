/**
 * Assets builder for The Black Captain Blog Builder
 * Copies static assets and images to public directory
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Copy a directory recursively
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Copy CSS and JS assets to public directory
 */
function copyAssets() {
  const assetsDir = config.paths.assets;
  const publicAssetsDir = config.paths.publicAssets;

  if (fs.existsSync(assetsDir)) {
    if (!fs.existsSync(publicAssetsDir)) {
      fs.mkdirSync(publicAssetsDir, { recursive: true });
    }
    fs.readdirSync(assetsDir).forEach(file => {
      fs.copyFileSync(
        path.join(assetsDir, file),
        path.join(publicAssetsDir, file)
      );
    });
    console.log('✓ Copied assets');
  }
}

/**
 * Copy images to public directory
 */
function copyImages() {
  const imagesDir = config.paths.images;
  const publicImagesDir = config.paths.publicImages;

  if (fs.existsSync(imagesDir)) {
    if (!fs.existsSync(publicImagesDir)) {
      fs.mkdirSync(publicImagesDir, { recursive: true });
    }
    fs.readdirSync(imagesDir).forEach(file => {
      fs.copyFileSync(
        path.join(imagesDir, file),
        path.join(publicImagesDir, file)
      );
    });
    console.log('✓ Copied images');
  }

  // Copy generated images if they exist
  const generatedImagesDir = path.join(config.paths.public, 'images', 'generated');
  if (fs.existsSync(generatedImagesDir)) {
    fs.readdirSync(generatedImagesDir).forEach(file => {
      const sourcePath = path.join(generatedImagesDir, file);
      const destPath = path.join(publicImagesDir, 'generated', file);
      if (!fs.existsSync(path.dirname(destPath))) {
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
      }
      fs.copyFileSync(sourcePath, destPath);
    });
  }
}

/**
 * Copy all static assets
 */
function buildAssets() {
  copyAssets();
  copyImages();
}

module.exports = {
  buildAssets,
  copyAssets,
  copyImages,
  copyDirectory,
};
