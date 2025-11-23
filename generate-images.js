#!/usr/bin/env node

/**
 * The Black Captain - AI Image Generator
 * Generates images for articles using Cloudflare Workers AI
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const MODEL = '@cf/black-forest-labs/flux-1-schnell';

/**
 * Generate an image using Cloudflare Workers AI
 * @param {string} prompt - Text prompt for image generation
 * @param {string} outputPath - Where to save the generated image
 * @returns {Promise<boolean>} - Success status
 */
async function generateImage(prompt, outputPath) {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    console.warn('⚠ Cloudflare credentials not found. Skipping image generation.');
    console.warn('  Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables.');
    return false;
  }

  // Check if image already exists
  if (fs.existsSync(outputPath)) {
    console.log(`✓ Image already exists: ${outputPath}`);
    return true;
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${MODEL}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        num_steps: 4 // Fast generation for Flux Schnell
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare AI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    // The API returns base64 encoded image
    if (result.result && result.result.image) {
      const base64Image = result.result.image;
      const imageBuffer = Buffer.from(base64Image, 'base64');

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, imageBuffer);
      console.log(`✓ Generated image: ${outputPath}`);
      return true;
    } else {
      throw new Error('No image data in API response');
    }
  } catch (error) {
    console.error(`✗ Failed to generate image: ${error.message}`);
    return false;
  }
}

/**
 * Generate a prompt for an article based on its title and description
 * @param {string} title - Article title
 * @param {string} description - Article description
 * @returns {string} - Image generation prompt
 */
function createPromptFromArticle(title, description) {
  // Create a maritime-themed prompt based on the article
  const basePrompt = 'Cinematic illustration in the style of maritime adventure art, ';

  // Extract key themes
  let theme = '';
  if (title.toLowerCase().includes('ship') || title.toLowerCase().includes('voyage')) {
    theme = 'a tall sailing ship on stormy seas, dramatic clouds, ';
  } else if (title.toLowerCase().includes('station') || title.toLowerCase().includes('port')) {
    theme = 'a misty coastal station with seagulls, moody atmosphere, ';
  } else if (title.toLowerCase().includes('tarot') || title.toLowerCase().includes('cards')) {
    theme = 'mystical tarot cards on weathered wooden ship deck, candlelight, ';
  } else if (title.toLowerCase().includes('gull') || title.toLowerCase().includes('bird')) {
    theme = 'a majestic herring gull in flight over coastal waters, natural lighting, ';
  } else {
    theme = 'a mysterious sailing ship emerging from fog, nautical atmosphere, ';
  }

  const style = 'oil painting style, rich colors, dramatic lighting, detailed, high quality';

  return `${basePrompt}${theme}${style}`;
}

/**
 * Generate images for all posts
 */
async function generateAllImages() {
  const postsDir = path.join(__dirname, 'posts');
  const publicImagesDir = path.join(__dirname, 'public', 'images', 'generated');

  if (!fs.existsSync(postsDir)) {
    console.log('⚠ No posts directory found.');
    return;
  }

  console.log('🎨 Generating AI images for articles...\n');

  const files = fs.readdirSync(postsDir)
    .filter(file => file.endsWith('.md'))
    .sort();

  for (const file of files) {
    const filePath = path.join(postsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) continue;

    const metadata = {};
    frontmatterMatch[1].split('\n').forEach(line => {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        metadata[match[1]] = match[2].trim();
      }
    });

    const slug = file.replace('.md', '');
    const title = metadata.title || slug;
    const description = metadata.description || '';

    const outputPath = path.join(publicImagesDir, `${slug}.jpg`);
    const prompt = createPromptFromArticle(title, description);

    console.log(`📝 ${title}`);
    console.log(`   Prompt: ${prompt.substring(0, 80)}...`);

    await generateImage(prompt, outputPath);
    console.log('');
  }

  console.log('🏴‍☠️ Image generation complete!\n');
}

// Run if called directly
if (require.main === module) {
  generateAllImages().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { generateImage, createPromptFromArticle, generateAllImages };
