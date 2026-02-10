/**
 * Gemini Module Exports
 */

export { getGeminiClient, GeminiModels, ThinkingLevel } from './client.js';
export type { ThinkingLevelType } from './client.js';

export { LiveAPIProxy, createLiveSession, LIVE_OVERLAY_TOOLS, liveOverlayTools } from './live.js';
export type { LiveSessionConfig, LiveMessageHandlers, LiveToolDeclaration } from './live.js';

export { AgenticVision, getAgenticVision, analyzeScreenWithGemini, compareScreensWithGemini } from './vision.js';
export type { VisionRequest, VisionResponse, UIElement, CompareRequest, CompareResponse } from './vision.js';
