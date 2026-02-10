/**
 * Agent Creation - createAgent() setup with Gemini model
 * 
 * Creates the Ocula AI ReAct agent using LangChain's createAgent():
 * - Model: ChatGoogleGenerativeAI (gemini-2.0-flash for fast tool calling)
 * - Tools: inspectScreen, drawVisualGuide, searchKnowledge, clearOverlays
 * - Middleware: toolErrorHandler + screenContextMiddleware
 * - Checkpointer: MemorySaver for multi-turn conversation via thread_id
 * - LangSmith: Automatic tracing when LANGSMITH_TRACING_V2=true
 */

import { createAgent, createMiddleware, ToolMessage } from 'langchain';
import { MemorySaver } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { oculaTools } from './tools.js';
import { env } from '../config/env.js';

/**
 * System prompt for Ocula AI
 * 
 * Defines the agent's role, capabilities, and behavior guidelines
 * for visual guidance interactions.
 */
const SYSTEM_PROMPT = `You are Ocula AI, a visual support assistant that helps users navigate software interfaces in real-time.

Your capabilities:
1. INSPECT the user's screen to find UI elements using the inspect_screen tool
2. HIGHLIGHT elements using draw_visual_guide to guide the user visually
3. SEARCH internal help context using search_knowledge

VISUAL GUIDANCE RULES:
- Highlight elements and speak your guidance simultaneously.
- NEVER say "I'm highlighting", "let me show you", "I've highlighted", or any variation. The user already sees the highlight. Just describe the element and what to do with it.
- NEVER mention tools, selectors, overlays, clearing, or any internal mechanism.
- Speak as if the user is naturally looking at a glowing element — describe what IT is and what to do.

VOICE STYLE:
- Speak naturally, like a knowledgeable colleague sitting next to the user.
- Be concise — keep responses under 2 sentences per element.
- Do NOT enumerate steps out loud ("Step 1, Step 2...") — just guide fluidly.
- NEVER reference "documentation", "knowledge base", "our records", or "according to the system". Everything you say should sound like personal expertise.
- NEVER repeat yourself.

If no screen is shared, ask the user to share their screen first.`;

/**
 * Middleware: Tool Error Handler
 * 
 * Catches tool execution errors and returns a user-friendly
 * ToolMessage instead of crashing the agent loop.
 */
const toolErrorHandler = createMiddleware({
  name: 'ToolErrorHandler',
  wrapToolCall: async (request: any, handler: any) => {
    try {
      return await handler(request);
    } catch (error) {
      console.error(`[Agent] Tool "${request.toolCall.name}" failed:`, error);
      return new ToolMessage({
        content: `Tool error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try a different approach.`,
        tool_call_id: request.toolCall.id!,
      });
    }
  },
});

/**
 * Middleware: Screen Context Injection
 * 
 * Injects the current screen capture (screenBase64) from the
 * runtime context into inspect_screen tool calls. This way
 * the model doesn't need to pass the large base64 string itself —
 * it only provides the target description.
 */
const screenContextMiddleware = createMiddleware({
  name: 'ScreenContextInjection',
  wrapToolCall: async (request: any, handler: any) => {
    if (request.toolCall.name === 'inspect_screen') {
      const screenBase64 = request.runtime?.context?.screenBase64;
      if (screenBase64) {
        request.toolCall.args = {
          ...request.toolCall.args,
          screenBase64,
        };
      }
    }
    return handler(request);
  },
});

/**
 * Create the Ocula Agent
 * 
 * Uses createAgent() which builds a LangGraph internally with:
 * - Automatic ReAct loop (model → tools → model → ...)
 * - Built-in tool execution
 * - Memory via MemorySaver checkpointer
 * - LangSmith tracing (when enabled via env vars)
 */
export function createOculaAgent() {
  // Initialize Gemini model for tool calling
  const model = new ChatGoogleGenerativeAI({
    model: 'gemini-2.0-flash',
    apiKey: env.GEMINI_API_KEY,
    temperature: 0.3,
  });

  // Create the agent with tools, middleware, and checkpointer
  const agent = createAgent({
    model,
    tools: oculaTools,
    systemPrompt: SYSTEM_PROMPT,
    middleware: [toolErrorHandler, screenContextMiddleware],
    checkpointer: new MemorySaver(),
  });

  console.log('[Agent] Ocula agent created with', oculaTools.length, 'tools');
  return agent;
}

/** Singleton agent instance */
let agentInstance: ReturnType<typeof createOculaAgent> | null = null;

/**
 * Get the singleton Ocula agent instance
 * 
 * Lazily creates the agent on first call.
 * The singleton pattern ensures a single MemorySaver
 * is shared across all sessions.
 */
export function getOculaAgent() {
  if (!agentInstance) {
    agentInstance = createOculaAgent();
  }
  return agentInstance;
}
