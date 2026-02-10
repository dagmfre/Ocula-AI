/**
 * Environment Configuration
 * 
 * Validates and exports environment variables with type safety.
 * Includes Gemini API and optional LangSmith configuration.
 */

import { z } from 'zod';
import 'dotenv/config';

/**
 * Environment schema with validation
 */
const envSchema = z.object({
  // Server Configuration
  PORT: z.string().default('3001').transform(Number),
  HOST: z.string().default('0.0.0.0'),
  
  // CORS Configuration
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000'),
  
  // Gemini API (Required)
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  
  // LangSmith Configuration (Optional - for development tracing)
  // Defaults to false so the server works without a LangSmith key
  LANGSMITH_TRACING_V2: z.string().default('false').transform(val => val === 'true'),
  LANGSMITH_API_KEY: z.string().optional(),
  LANGSMITH_PROJECT: z.string().default('OculaAI'),
  LANGSMITH_ENDPOINT: z.string().default('https://api.smith.langchain.com'),
});

// Parse and validate environment
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Environment validation failed:');
  console.error(parseResult.error.format());
  process.exit(1);
}

export const env = parseResult.data;

// Validation: If LangSmith tracing enabled, API key required
if (env.LANGSMITH_TRACING_V2 && !env.LANGSMITH_API_KEY) {
  console.warn('⚠️ LANGSMITH_TRACING_V2=true but LANGSMITH_API_KEY not set. Tracing disabled.');
}

// Parse CORS origins
export const corsOrigins = env.CORS_ORIGIN.split(',').map(s => s.trim());

// Export type for TypeScript
export type Env = typeof env;

export default env;
