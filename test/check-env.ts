/**
 * Simple test script to verify server starts correctly
 * Run with: npx tsx test/server-test.ts
 */

import { env } from '../apps/server/src/config/env.js';

if (!env) {
  throw new Error('Environment configuration failed to load (env is undefined).');
}

console.log('🔍 Environment Check:');
console.log('─'.repeat(40));
console.log(`PORT: ${env.PORT}`);
console.log(`HOST: ${env.HOST}`);
console.log(`GEMINI_API_KEY: ${env.GEMINI_API_KEY ? '✅ Set' : '❌ Not set'}`);
console.log(`LANGSMITH_TRACING: ${env.LANGSMITH_TRACING_V2 ? 'Enabled' : 'Disabled'}`);
console.log('─'.repeat(40));

if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === 'your-gemini-api-key') {
  console.log('\n⚠️  Please set your GEMINI_API_KEY in .env file');
  console.log('   Get your key at: https://aistudio.google.com/app/apikey');
} else {
  console.log('\n✅ Configuration looks good!');
  console.log('   Start the server with: pnpm dev:server');
}
