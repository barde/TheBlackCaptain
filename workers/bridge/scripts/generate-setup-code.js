#!/usr/bin/env node
/**
 * Generate a setup code for initial passkey registration
 * Run: node scripts/generate-setup-code.js
 */

const crypto = require('crypto');

// Generate a random setup code
const code = crypto.randomBytes(16).toString('hex');

console.log('');
console.log('='.repeat(50));
console.log('CAPTAIN\'S BRIDGE - SETUP CODE');
console.log('='.repeat(50));
console.log('');
console.log('Setup Code:', code);
console.log('');
console.log('To add this code to your D1 database, run:');
console.log('');
console.log(`  pnpm exec wrangler d1 execute captain-bridge-db --command "INSERT INTO setup_codes (code) VALUES ('${code}');"`);
console.log('');
console.log('Then visit https://bridge.blackhoard.com/setup and enter this code.');
console.log('');
console.log('='.repeat(50));
