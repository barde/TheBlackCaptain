#!/usr/bin/env node
/**
 * Daily Image Generator for The Black Captain
 *
 * Uses Cloudflare Workers AI (FLUX-1-schnell) to generate daily maritime scenes
 * that appear on the Ship's Crew page.
 *
 * Environment variables required:
 * - CLOUDFLARE_ACCOUNT_ID: Your Cloudflare account ID
 * - CLOUDFLARE_API_TOKEN: API token with Workers AI permissions
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const MODEL = '@cf/black-forest-labs/flux-1-schnell';
const OUTPUT_DIR = path.join(__dirname, '..', 'images', 'daily');
const OUTPUT_FILE = 'captains-vision.jpg';

// Daily maritime prompts - one for each day of the week
const DAILY_PROMPTS = {
  0: 'A majestic tall ship at anchor in a misty harbor at dawn, golden light piercing through fog, seagulls circling, oil painting style, dramatic maritime art, 19th century romanticism',
  1: 'A weathered sea captain standing at the helm during a storm, waves crashing, lightning in the distance, dramatic chiaroscuro lighting, classical maritime painting style',
  2: 'A quiet harbor at sunset with fishing boats returning, warm orange and purple sky reflected on calm waters, Mediterranean atmosphere, impressionist style',
  3: 'A mysterious ghost ship emerging from dense fog, ethereal blue moonlight, ravens perched on masts, gothic maritime art, haunting and beautiful',
  4: 'Sailors gathered around a lantern on deck at night, telling stories under stars, warm candlelight on weathered faces, intimate Rembrandt-style lighting',
  5: 'A grand three-masted sailing ship cresting a massive wave, dramatic seascape, spray and foam, Turner-style romantic maritime painting',
  6: 'An old sailor and herring gulls at a northern port, grey November sky, contemplative mood, melancholic beauty, Edward Hopper inspired',
};

// Character portrait prompts for variety
const CHARACTER_PROMPTS = [
  'Portrait of a wise sea captain with a black woolen hat, weathered face, knowing eyes, dramatic side lighting, oil painting style, 19th century maritime portrait',
  'A bald Russian sailor with battle scars, fierce but loyal expression, dramatic chiaroscuro, classical portrait style',
  'A elegant woman navigator with a subtle knowing smile, graceful and intelligent, Renaissance portrait lighting',
  'A Cretan sailor with a mischievous grin, Mediterranean features, warm lighting, Baroque portrait style',
  'Herring gulls perched on a ship railing, intelligent yellow eyes, grey sky background, detailed naturalist illustration style',
  'The stern of a beautiful old sailing ship named "Regina", carved wood details, morning light, photorealistic maritime art',
];

// Seasonal modifiers
function getSeasonalModifier() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return ', spring morning, fresh green and blue tones';
  if (month >= 5 && month <= 7) return ', warm summer evening, golden light';
  if (month >= 8 && month <= 10) return ', autumn atmosphere, muted browns and grays';
  return ', winter scene, cold blue and grey tones, frost';
}

// Get today's prompt
function getTodayPrompt() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const dayOfMonth = today.getDate();

  // On certain days, use character portraits instead of scenes
  if (dayOfMonth % 7 === 0) {
    // Every 7th day of the month, use a character portrait
    const portraitIndex = Math.floor(dayOfMonth / 7) % CHARACTER_PROMPTS.length;
    return CHARACTER_PROMPTS[portraitIndex];
  }

  // Otherwise use the daily scene prompt with seasonal modifier
  return DAILY_PROMPTS[dayOfWeek] + getSeasonalModifier();
}

// Generate image using Cloudflare Workers AI
async function generateImage(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      prompt: prompt,
      steps: 8, // Maximum quality
    });

    const options = {
      hostname: 'api.cloudflare.com',
      port: 443,
      path: `/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${MODEL}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);

          if (!response.success) {
            reject(new Error(`API Error: ${JSON.stringify(response.errors)}`));
            return;
          }

          if (response.result && response.result.image) {
            resolve(response.result.image);
          } else {
            reject(new Error('No image in response'));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Request failed: ${e.message}`));
    });

    req.write(data);
    req.end();
  });
}

// Save base64 image to file
function saveImage(base64Data, outputPath) {
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Image saved to: ${outputPath}`);
}

// Generate metadata file for the image
function saveMetadata(prompt, outputDir) {
  const metadata = {
    generatedAt: new Date().toISOString(),
    prompt: prompt,
    model: MODEL,
    dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()],
  };

  const metadataPath = path.join(outputDir, 'metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`Metadata saved to: ${metadataPath}`);
}

// Main function
async function main() {
  console.log('🏴‍☠️ The Black Captain\'s Daily Vision Generator\n');

  // Validate environment
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    console.error('Error: Missing required environment variables.');
    console.error('Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN');
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }

  // Get today's prompt
  const prompt = getTodayPrompt();
  console.log(`Today's prompt:\n"${prompt}"\n`);

  try {
    console.log('Generating image with Cloudflare Workers AI (FLUX-1-schnell)...');
    const base64Image = await generateImage(prompt);

    // Save the image
    const outputPath = path.join(OUTPUT_DIR, OUTPUT_FILE);
    saveImage(base64Image, outputPath);

    // Save metadata
    saveMetadata(prompt, OUTPUT_DIR);

    console.log('\n✅ Daily vision generated successfully!');

    // Also save as dated archive
    const today = new Date().toISOString().split('T')[0];
    const archivePath = path.join(OUTPUT_DIR, `archive-${today}.jpg`);
    saveImage(base64Image, archivePath);
    console.log(`Archive saved to: ${archivePath}`);

  } catch (error) {
    console.error(`\n❌ Error generating image: ${error.message}`);
    process.exit(1);
  }
}

main();
