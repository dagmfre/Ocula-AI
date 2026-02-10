/**
 * Gemini Client - Google GenAI SDK wrapper
 * 
 * Provides singleton access to the Gemini API client.
 */

import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';

let clientInstance: GoogleGenAI | null = null;

/**
 * Get the Gemini API client singleton
 */
export function getGeminiClient(): GoogleGenAI {
  if (!clientInstance) {
    clientInstance = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    console.log('[Gemini] Client initialized');
  }
  return clientInstance;
}

/**
 * Model names for different use cases
 */
export const GeminiModels = {
  // Agentic Vision - screen analysis with thinking
  VISION: 'gemini-3-flash-preview',
  
  // Live API - real-time voice conversation
  // Use gemini-2.5-flash-native-audio-preview-12-2025 for native audio with live capabilities
  LIVE_AUDIO: 'gemini-2.5-flash-native-audio-preview-12-2025',
  
  // Fast general purpose (for tool calling)
  FLASH: 'gemini-2.0-flash',
  
  // Image generation/editing
  IMAGE: 'gemini-2.5-flash-image',
} as const;

/**
 * Thinking levels for Gemini 3 models
 */
export const ThinkingLevel = {
  HIGH: 'HIGH',       // ~16K tokens - complex reasoning
  MEDIUM: 'MEDIUM',   // ~8K tokens - screen analysis
  LOW: 'LOW',         // ~4K tokens - simple responses
  MINIMAL: 'MINIMAL', // ~1K tokens - quick completions
} as const;

export type ThinkingLevelType = typeof ThinkingLevel[keyof typeof ThinkingLevel];

export default getGeminiClient;
