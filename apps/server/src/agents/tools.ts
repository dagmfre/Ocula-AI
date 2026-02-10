/**
 * Agent Tools - Tool definitions for Ocula AI ReAct agent
 * 
 * Defines 4 tools using LangChain's tool() helper with Zod schemas:
 * 1. inspectScreen  - Analyze screen to find UI elements (Gemini Vision)
 * 2. drawVisualGuide - Return draw commands for client SVG overlay
 * 3. searchKnowledge - Search the hardcoded knowledge base
 * 4. clearOverlays   - Return clear command for client
 * 
 * All tools return serialized JSON strings that the agent framework
 * handles as ToolMessage content.
 */

import { z } from 'zod';
import { tool } from 'langchain';
import { analyzeScreenWithGemini } from '../gemini/vision.js';
import { lookupKnowledge } from '../knowledge/index.js';

/**
 * Tool: Inspect the current screen to find a UI element
 * 
 * Uses Gemini 3 Agentic Vision to analyze the screen capture
 * and return coordinates for visual grounding.
 * 
 * Note: screenBase64 is injected by screenContextMiddleware
 * from the runtime context, so the model doesn't need to
 * pass the full base64 string — just the target description.
 */
export const inspectScreen = tool(
  async ({ target, screenBase64 }: { target: string; screenBase64: string }) => {
    if (!screenBase64) {
      return JSON.stringify({
        found: false,
        elements: [],
        currentPage: 'No screen capture available',
        suggestedAction: 'Ask the user to share their screen first.',
      });
    }

    const result = await analyzeScreenWithGemini({
      frame: screenBase64,
      query: `Find the UI element: ${target}. Return JSON with element locations.`,
      thinkingLevel: 'MEDIUM',
    });

    return JSON.stringify(result);
  },
  {
    name: 'inspect_screen',
    description: 'Analyze the current screen to find a specific UI element. Returns coordinates in 0-1000 normalized space and a description of what was found.',
    schema: z.object({
      target: z.string().describe('What to look for on screen (e.g., "billing button", "export menu", "settings gear icon")'),
      screenBase64: z.string().describe('Base64-encoded JPEG of the current screen (injected automatically)'),
    }),
  }
);



/**
 * Tool: Search the knowledge base
 * 
 * For MVP, searches the hardcoded Acme CRM knowledge base.
 * Returns matching documentation sections with relevance scores.
 */
export const searchKnowledge = tool(
  async ({ query }: { query: string }) => {
    const result = await lookupKnowledge(query);
    return JSON.stringify(result);
  },
  {
    name: 'search_knowledge',
    description: 'Search the platform knowledge base for help documentation, tutorials, or feature explanations. Use this to find step-by-step instructions for user tasks.',
    schema: z.object({
      query: z.string().describe('What to search for in the knowledge base (e.g., "how to export report", "billing settings", "add new contact")'),
    }),
  }
);

/**
 * Tool: Clear all overlays from screen
 * 
 * Removes all visual annotations (arrows, highlights, circles)
 * from the user's screen. Call this before drawing new overlays
 * for a new step, or when the user is done with guidance.
 */
export const clearOverlays = tool(
  async () => {
    return JSON.stringify({ command: 'clear' });
  },
  {
    name: 'clear_overlays',
    description: 'Remove all visual annotations (arrows, highlights, circles) from the user\'s screen. Use this before drawing new guides for a new step.',
    schema: z.object({}),
  }
);

/**
 * Tool: Highlight specific element using CSS selector
 * 
 * Instructs the client to apply a CSS border highlight to the
 * element matching the given selector.
 */
export const highlightElement = tool(
  async ({ selector, label, action }: { selector: string; label?: string; action: 'apply' | 'clear' }) => {
    return JSON.stringify({
      command: 'draw',
      type: 'highlight_element',
      selector,
      label,
      action
    });
  },
  {
    name: 'highlight_element',
    description: 'Highlights a specific UI element on the page using a CSS selector. ALWAYS target the outer container/wrapper (e.g., ".search-bar") instead of inner elements (e.g., "input") for better visuals.',
    schema: z.object({
      selector: z.string().describe('The CSS selector (e.g., "#login-btn" or "button.submit")'),
      label: z.string().optional().describe('Label to show next to the highlight'),
      action: z.enum(['apply', 'clear']).describe('Whether to apply the highlight or clear it'),
    }),
  }
);

/** All tools as array for createAgent */
export const oculaTools = [inspectScreen, highlightElement, searchKnowledge, clearOverlays];
