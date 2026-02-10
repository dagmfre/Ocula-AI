# 🚀 Ocula AI - MVP Technical Specification

## 6-Day Hackathon Implementation Guide

> **Tagline**: *"AI that sees, understands, and guides in real-time"*

---

# 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [High-Level Architecture](#high-level-architecture)
3. [Project Structure](#project-structure)
4. [LangGraph Agent Architecture](#langgraph-agent-architecture)
5. [Gemini 3 Technical Reference](#gemini-3-technical-reference)
6. [Core Workflows](#core-workflows)
7. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
8. [API Specifications](#api-specifications)
9. [Implementation Guardrails](#implementation-guardrails)
10. [Demo Scenario](#demo-scenario)
11. [Success Criteria](#success-criteria)

---

# 📌 Executive Summary

**Ocula AI** is a B2B embeddable widget that provides AI-powered visual support for any SaaS platform.

## Core Capabilities

| Capability | Implementation | Gemini Feature |
|------------|----------------|----------------|
| **SEES** | Screen capture via `getDisplayMedia` | Agentic Vision (gemini-3-flash-preview) |
| **SPEAKS** | Real-time voice I/O | Live API (gemini-2.5-flash-native-audio-preview-12-2025) |
| **GUIDES** | CSS class highlights + floating labels | UI_SELECTORS map + `highlight_element` tool |
| **REMEMBERS** | Stateful reasoning across turns | Thought Signatures |

## MVP Scope (Extended Hackathon)

### Core AI Widget (Days 1-5) ✅ COMPLETE
- ✅ Screen capture and streaming
- ✅ Real-time voice conversation (Live API)
- ✅ Visual grounding (point to UI elements)
- ✅ CSS class-based element highlighting with pulsing glow animations
- ✅ Glassmorphism-inspired floating labels with rAF repositioning
- ✅ Hardcoded knowledge base for demo
- ✅ Live API function calling (zero-latency visual commands)
- ✅ DOM-anchored overlays with rAF repositioning
- ✅ Glassmorphism-inspired labels, double-ring pulsing, fade-out exits
- ✅ CSS class-based element highlighting with pulsing glow animations
- ✅ UI_SELECTORS map for exact CSS selector targeting
- ✅ Auto-onboarding tour on first screen share
- ✅ Single-response AI output (no double messages)

### SaaS Platform Layer (Days 6-10) ✅ COMPLETE
- ✅ Landing page (Next.js) — hero, features, how-it-works, tech-stack, CTA, footer
- ✅ Authentication (better-auth: email/password + Google OAuth)
- ✅ Platform onboarding (2-step KYC form)
- ✅ Dashboard (document upload, script generation, platform overview)
- ✅ Cloudinary file uploads (PDF, images, markdown → drag-and-drop UI)
- ✅ Mock CRM demo platform (6 pages with Ocula widget embedded)
- ✅ Knowledge base template document for platform owners

---

# 🏗️ High-Level Architecture

## Script-Injected Agentic Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HOST SAAS (e.g., Acme CRM)                                             │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  <script src="https://ocula.ai/widget.js"></script>               │ │
│  │                                                                    │ │
│  │  ┌──────────────────┐                                             │ │
│  │  │ 💬 Help Button   │ ← Triggers widget                           │ │
│  │  └──────────────────┘                                             │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  OCULA CLIENT SDK (Injected JS Bundle)                                 │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │ capture.ts      │  │ overlay.ts      │  │ connection.ts   │        │
│  │ • getDisplayMedia│  │ • SVG arrows    │  │ • WebSocket     │        │
│  │ • Frame capture │  │ • Highlights    │  │ • Audio stream  │        │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘        │
└────────────────────────────────────────────────────────────────────────┘
                                    │ WebSocket
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  OCULA SERVER (Node.js + Fastify)                                      │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  /agents                                                         │  │
│  │  ├── router.ts      → LangGraph orchestration                   │  │
│  │  └── tools.ts       → Visual grounding & knowledge retrieval    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  /gemini                                                         │  │
│  │  ├── live.ts        → Live API WebSocket proxy                  │  │
│  │  └── vision.ts      → Agentic Vision (screen analysis)          │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  GEMINI 3 APIs                                                         │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │ Live API        │  │ Vision API      │  │ Nano Banana     │        │
│  │ Voice I/O       │  │ Screen Analysis │  │ Image Gen       │        │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘        │
└────────────────────────────────────────────────────────────────────────┘
```

---

# 📁 Project Structure

```
/ocula-ai
├── /apps
│   ├── /client-sdk           # Vanilla TypeScript → Single JS bundle
│   │   ├── src/
│   │   │   ├── index.ts      # Entry point, widget initialization
│   │   │   ├── capture.ts    # Screen capture (getDisplayMedia)
│   │   │   ├── overlay.ts    # CSS class highlights + floating labels
│   │   │   ├── audio.ts      # PCM audio capture/playback
│   │   │   └── connection.ts # WebSocket wrapper
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── /web-dashboard        # Next.js 14 (Embed code generator)
│   │   └── [MVP: Basic landing page only]
│   │
│   └── /server               # Node.js + Fastify + WebSocket
│       ├── src/
│       │   ├── index.ts      # Server entry
│       │   ├── /agents       # ⭐ LangChain Agent System (createAgent)
│       │   │   ├── agent.ts  # createAgent() setup with middleware
│       │   │   ├── tools.ts  # Tool definitions (Zod schemas)
│       │   │   ├── state.ts  # Extended state schema (optional)
│       │   │   ├── stream.ts # Streaming responses
│       │   │   └── index.ts  # runOculaAgent() entry point
│       │   ├── /gemini
│       │   │   ├── client.ts # Google GenAI SDK wrapper
│       │   │   ├── live.ts   # Live API WebSocket handler
│       │   │   └── vision.ts # Agentic Vision calls
│       │   ├── /knowledge
│       │   │   └── demo.md   # Hardcoded demo knowledge base
│       │   └── /config
│       │       └── env.ts    # Environment config (incl. LangSmith)
│       ├── package.json
│       └── tsconfig.json
│
├── package.json              # Monorepo root (pnpm workspaces)
├── pnpm-workspace.yaml
└── README.md
```

---

# 🔗 LangGraph Agent Architecture

> **Why `createAgent()`?** LangChain's `createAgent()` provides a production-ready agent with built-in tool handling, ReAct loop, and automatic state management. It builds a LangGraph under the hood, so we get checkpointing and LangSmith tracing for free.

## NPM Dependencies

```bash
# Server package.json
pnpm add langchain @langchain/langgraph @langchain/core langsmith zod
```

## MVP Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Agent Creation** | `createAgent()` | Production-ready ReAct agent with built-in tool handling |
| **Checkpointer** | `MemorySaver` (in-memory) | Simple for MVP; upgrade to `PostgresSaver` for production |
| **Thought Signatures** | Middleware + custom state | Custom middleware preserves Gemini 3's stateful reasoning |
| **Tool Calling** | LangChain `tool()` helper | Type-safe tools with Zod schemas |
| **HITL (Human-in-the-Loop)** | ❌ Skip for MVP | `interrupt()` adds complexity; defer to post-MVP |
| **LangSmith** | Env-var driven auto-tracing | Zero-code observability during development |

## Tool Definitions (Zod Schemas)

**server/src/agents/tools.ts**:

```typescript
import * as z from 'zod';
import { tool } from 'langchain';
import { analyzeScreenWithGemini } from '../gemini/vision';
import { lookupKnowledge } from '../knowledge/demo';

/**
 * Tool: Inspect the current screen to find a UI element
 * 
 * Uses Gemini 3 Agentic Vision to analyze the screen capture
 * and return coordinates for visual grounding.
 */
export const inspectScreen = tool(
  async ({ target, screenBase64 }: { target: string; screenBase64: string }) => {
    const result = await analyzeScreenWithGemini({
      frame: screenBase64,
      query: `Find the UI element: ${target}. Return JSON with { found: boolean, point: [y, x], label: string }`,
      thinkingLevel: 'MEDIUM',
    });
    return JSON.stringify(result);
  },
  {
    name: 'inspect_screen',
    description: 'Analyze the current screen to find a specific UI element. Returns coordinates in 0-1000 normalized space.',
    schema: z.object({
      target: z.string().describe('What to look for (e.g., "billing button", "export menu")'),
      screenBase64: z.string().describe('Base64-encoded JPEG of the current screen'),
    }),
  }
);

/**
 * Tool: Highlight a UI element using CSS selector
 * 
 * Uses CSS class injection for pixel-perfect, scroll-resistant highlights.
 * Replaces the old drawVisualGuide SVG tool.
 */
export const highlightElement = tool(
  async ({ selector, label, action }: { selector: string; label?: string; action?: string }) => {
    return JSON.stringify({
      command: 'draw',
      type: 'highlight_element',
      selector,
      label,
      action: action || 'apply',
    });
  },
  {
    name: 'highlight_element',
    description: 'Highlights a specific UI element on the page using a CSS selector. ALWAYS target the outer container/wrapper (e.g., ".search-bar") instead of inner elements (e.g., "input") for better visuals.',
    schema: z.object({
      selector: z.string().describe('The CSS selector (e.g., "#login-btn" or "button.submit")'),
      label: z.string().optional().describe('Label to show next to the highlight'),
      action: z.enum(['apply', 'clear']).optional().describe('Action to perform (default: apply)'),
    }),
  }
);

/**
 * Tool: Search the knowledge base
 * 
 * For MVP, this searches the hardcoded demo knowledge base.
 */
export const searchKnowledge = tool(
  async ({ query }: { query: string }) => {
    const result = await lookupKnowledge(query);
    return JSON.stringify(result);
  },
  {
    name: 'search_knowledge',
    description: 'Search the platform knowledge base for help documentation, tutorials, or feature explanations.',
    schema: z.object({
      query: z.string().describe('What to search for in the knowledge base'),
    }),
  }
);

/**
 * Tool: Clear all overlays from screen
 */
export const clearOverlays = tool(
  async () => {
    return JSON.stringify({ command: 'clear' });
  },
  {
    name: 'clear_overlays',
    description: 'Remove all visual annotations (arrows, highlights) from the screen.',
    schema: z.object({}),
  }
);

// Export all tools as array for createAgent
export const oculaTools = [inspectScreen, highlightElement, searchKnowledge, clearOverlays];
```

## Agent Creation with `createAgent()`

**server/src/agents/agent.ts**:

```typescript
import { createAgent, createMiddleware, tool } from 'langchain';
import { MemorySaver } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { oculaTools } from './tools';
import { env } from '../config/env';

/**
 * System prompt for Ocula AI
 * 
 * Defines the agent's role and capabilities for visual guidance.
 */
const SYSTEM_PROMPT = `You are Ocula AI, a visual support assistant that helps users navigate software interfaces.

Your capabilities:
1. INSPECT the user's screen to find UI elements
2. DRAW visual guides (arrows, highlights) pointing to elements
3. SEARCH the knowledge base for help documentation
4. CLEAR overlays when no longer needed

When helping users:
- First use inspect_screen to find the relevant UI element
- Then use highlight_element to point to it using the exact CSS selector
- Explain what you found and guide them step by step
- Clear overlays when moving to a new step

Available Tools:
- highlight_element(selector, label, action): Highlight a UI element with a glowing border (PREFERRED)
- clear_overlays(): Remove all visual guides
- search_knowledge(query): Search help documentation
- inspect_screen(target, screenBase64): Analyze the screen

Always be concise and helpful. The user can see their screen - you're pointing things out to them.`;

/**
 * Middleware: Tool Error Handler
 * 
 * Provides graceful error handling for tool failures.
 */
const toolErrorHandler = createMiddleware({
  name: 'ToolErrorHandler',
  wrapToolCall: async (request, handler) => {
    try {
      return await handler(request);
    } catch (error) {
      // Return user-friendly error message
      const { ToolMessage } = await import('@langchain/core/messages');
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
 * Injects the current screen capture into tool calls that need it.
 */
const screenContextMiddleware = createMiddleware({
  name: 'ScreenContextInjection',
  wrapToolCall: async (request, handler) => {
    // Inject screenBase64 from runtime context into inspect_screen calls
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
    model: 'gemini-2.0-flash', // Fast model for tool calling
    apiKey: env.GEMINI_API_KEY,
    temperature: 0.3,
  });

  // Create the agent with tools and middleware
  const agent = createAgent({
    model,
    tools: oculaTools,
    systemPrompt: SYSTEM_PROMPT,
    middleware: [toolErrorHandler, screenContextMiddleware],
    // Optional: Configure checkpointer for session persistence
    checkpointer: new MemorySaver(),
  });

  return agent;
}

// Singleton agent instance
let agentInstance: ReturnType<typeof createOculaAgent> | null = null;

export function getOculaAgent() {
  if (!agentInstance) {
    agentInstance = createOculaAgent();
  }
  return agentInstance;
}
```

## Custom State for Extended Context

**server/src/agents/state.ts**:

```typescript
import * as z from 'zod';
import { StateSchema, MessagesValue } from '@langchain/langgraph';

/**
 * Extended agent state schema for Ocula AI
 * 
 * Extends the default MessagesValue with session-specific context:
 * - sessionId: Unique session identifier for checkpointing
 * - screenBase64: Current screen capture (injected into tools)
 * - thoughtSignature: Gemini 3 thought signature for stateful reasoning
 * - visualCommands: Queue of visual commands to send to client
 */
export const OculaAgentState = new StateSchema({
  // Default message history (required by createAgent)
  messages: MessagesValue,
  
  // Session identity
  sessionId: z.string().optional(),
  
  // Screen capture (passed via runtime context)
  screenBase64: z.string().optional(),
  
  // Gemini 3 thought signature (for future integration)
  thoughtSignature: z.string().optional(),
  
  // Visual commands to relay to client
  visualCommands: z.array(z.object({
    type: z.enum(['highlight_element', 'clear']),
    selector: z.string().optional(),
    label: z.string().optional(),
    action: z.enum(['apply', 'clear']).optional(),
  })).default([]),
});

export type OculaAgentStateType = z.infer<typeof OculaAgentState>;
```

## Running the Agent

**server/src/agents/index.ts**:

```typescript
import { getOculaAgent } from './agent';
import { HumanMessage } from '@langchain/core/messages';

/**
 * Execute the Ocula agent for a user session
 * 
 * @param sessionId - Unique session identifier (for checkpointing)
 * @param userMessage - User's question or request
 * @param screenBase64 - Current screen capture (base64 JPEG)
 */
export async function runOculaAgent(input: {
  sessionId: string;
  userMessage: string;
  screenBase64?: string;
}): Promise<{
  response: string;
  visualCommands: Array<{
    type: 'highlight_element' | 'clear';
    selector?: string;
    label?: string;
    action?: 'apply' | 'clear';
  }>;
}> {
  const agent = getOculaAgent();

  // Invoke the agent with session context
  const result = await agent.invoke(
    {
      messages: [new HumanMessage(input.userMessage)],
    },
    {
      // Session-based checkpointing
      configurable: { thread_id: input.sessionId },
      // Inject screen capture into runtime context
      context: { screenBase64: input.screenBase64 },
      // LangSmith tracing tags
      tags: [`session:${input.sessionId}`],
      metadata: { userMessage: input.userMessage },
    }
  );

  // Extract response and visual commands from tool calls
  const lastMessage = result.messages.at(-1);
  const response = typeof lastMessage?.content === 'string' 
    ? lastMessage.content 
    : 'I analyzed your screen.';

  // Parse visual commands from tool results
  const visualCommands = extractVisualCommands(result.messages);

  return { response, visualCommands };
}

/**
 * Extract visual commands from agent message history
 */
function extractVisualCommands(messages: unknown[]): Array<{
  type: 'highlight_element' | 'clear';
  selector?: string;
  label?: string;
  action?: 'apply' | 'clear';
}> {
  const commands: Array<{
    type: 'arrow' | 'highlight' | 'circle' | 'clear';
    point?: [number, number];
    label?: string;
  }> = [];

  for (const msg of messages) {
    // Look for ToolMessage with draw/clear commands
    if (msg && typeof msg === 'object' && 'content' in msg) {
      try {
        const content = typeof msg.content === 'string' 
          ? JSON.parse(msg.content) 
          : msg.content;
        
        if (content?.command === 'draw') {
          commands.push({
            type: content.type,
            point: content.point,
            label: content.label,
          });
        } else if (content?.command === 'clear') {
          commands.push({ type: 'clear' });
        }
      } catch {
        // Ignore non-JSON content
      }
    }
  }

  return commands;
}

// Re-export for convenience
export { getOculaAgent } from './agent';
export { oculaTools } from './tools';
```

## Streaming Responses

For real-time feedback during agent execution:

**server/src/agents/stream.ts**:

```typescript
import { getOculaAgent } from './agent';
import { HumanMessage } from '@langchain/core/messages';

/**
 * Stream agent responses for real-time UI updates
 */
export async function* streamOculaAgent(input: {
  sessionId: string;
  userMessage: string;
  screenBase64?: string;
}) {
  const agent = getOculaAgent();

  const stream = await agent.stream(
    {
      messages: [new HumanMessage(input.userMessage)],
    },
    {
      configurable: { thread_id: input.sessionId },
      context: { screenBase64: input.screenBase64 },
      streamMode: 'values',
    }
  );

  for await (const chunk of stream) {
    // Each chunk contains the full state at that point
    const latestMessage = chunk.messages?.at(-1);
    
    if (latestMessage?.content) {
      yield { type: 'text', content: latestMessage.content };
    }
    
    if (latestMessage?.tool_calls) {
      for (const toolCall of latestMessage.tool_calls) {
        yield { type: 'tool_call', name: toolCall.name, args: toolCall.args };
      }
    }
  }
}
```

## LangSmith Integration (Observability)

**server/src/config/env.ts**:

```typescript
import { z } from 'zod';

/**
 * Environment Configuration with LangSmith
 * 
 * LangSmith provides automatic tracing when enabled.
 * No code changes needed - just set env vars.
 */
const envSchema = z.object({
  // ─────────────────────────────────────────────────────────────────
  // Core
  // ─────────────────────────────────────────────────────────────────
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ─────────────────────────────────────────────────────────────────
  // Gemini API
  // ─────────────────────────────────────────────────────────────────
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),

  // ─────────────────────────────────────────────────────────────────
  // LangSmith (Optional - enables automatic tracing)
  // ─────────────────────────────────────────────────────────────────
  LANGSMITH_TRACING_V2: z.coerce.boolean().default(false),
  LANGSMITH_API_KEY: z.string().optional(),
  LANGSMITH_PROJECT: z.string().default('ocula-ai-mvp'),
  LANGSMITH_ENDPOINT: z.string().default('https://api.smith.langchain.com'),
});

// Parse and validate
export const env = envSchema.parse(process.env);

// Validation: If tracing enabled, API key required
if (env.LANGSMITH_TRACING_V2 && !env.LANGSMITH_API_KEY) {
  throw new Error('LANGSMITH_TRACING_V2=true requires LANGSMITH_API_KEY');
}
```

**.env.example**:

```bash
# Gemini API
GEMINI_API_KEY=your-gemini-api-key

# LangSmith (optional - for development tracing)
LANGSMITH_TRACING_V2=true
LANGSMITH_API_KEY=your-langsmith-api-key
LANGSMITH_PROJECT=ocula-ai-mvp
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│  createAgent() - ReAct Agent Architecture                               │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Input: User Message + Screen Capture                               │ │
│  └─────────────────────────────┬──────────────────────────────────────┘ │
│                                │                                         │
│                                ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  MODEL NODE (Gemini 2.0 Flash)                                    │   │
│  │  • Reasons about user request                                     │   │
│  │  • Decides which tool(s) to call                                  │   │
│  │  • Generates natural language response                            │   │
│  └─────────────────────────────┬────────────────────────────────────┘   │
│                                │                                         │
│              ┌─────────────────┴─────────────────┐                      │
│              │ Tool calls?                        │                      │
│              │                                    │                      │
│         Yes  ▼                               No   ▼                      │
│  ┌──────────────────┐                   ┌──────────────────┐            │
│  │  TOOLS NODE       │                   │  OUTPUT           │            │
│  │                   │                   │  (Final Response) │            │
│  │  • inspect_screen │                   └──────────────────┘            │
│  │  • draw_visual    │                                                   │
│  │  • search_kb      │                                                   │
│  │  • clear_overlays │                                                   │
│  └─────────┬─────────┘                                                   │
│            │                                                             │
│            │ Tool results                                                │
│            ▼                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  MODEL NODE (loop back with tool results)                         │   │
│  │  • Processes tool output                                          │   │
│  │  • May call more tools or finish                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Middleware Pipeline                                               │  │
│  │  • ToolErrorHandler: Graceful error handling                       │  │
│  │  • ScreenContextInjection: Injects screenBase64 into tool calls   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Checkpointer: MemorySaver (MVP) → PostgresSaver (Production)     │  │
│  │  • thread_id: sessionId for conversation persistence              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  LangSmith: Auto-tracing via LANGSMITH_TRACING_V2=true            │  │
│  │  • Traces all model calls, tool executions, and state changes     │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# 🤖 Gemini 3 Technical Reference

> **Source**: [docs/fetched/](./fetched/) - Comprehensive documentation extracted from official sources

## Models & Use Cases

| Model | Use Case | Features |
|-------|----------|----------|
| `gemini-3-flash-preview` | Agentic Vision, fast reasoning | Think-Act-Observe loop, code execution |
| `gemini-3-pro-preview` | Complex orchestration | Deep reasoning, 64K output |
| `gemini-2.5-flash-native-audio-preview-12-2025` | Real-time voice | Natural speech, WebSocket, native audio |
| `gemini-2.5-flash-image` | Visual guide generation | Fast image editing |

## Thinking Configuration

> ⚠️ **CRITICAL**: Use `thinkingLevel`, NOT `thinkingBudget` (deprecated)

```typescript
// ✅ CORRECT - Gemini 3
config: {
  thinkingConfig: {
    thinkingLevel: 'HIGH' // HIGH | MEDIUM | LOW | MINIMAL
  }
}

// ❌ DEPRECATED - Do not use
config: {
  thinkingConfig: {
    thinkingBudget: 8192 // DEPRECATED
  }
}
```

| Level | Token Budget | Use Case |
|-------|--------------|----------|
| `HIGH` | ~16K tokens | Session Controller, complex reasoning |
| `MEDIUM` | ~8K tokens | Screen analysis, planning |
| `LOW` | ~4K tokens | Simple responses |
| `MINIMAL` | ~1K tokens | Quick completions |

## Thought Signatures

> ⚠️ **MANDATORY** for function calling and multi-turn conversations

Thought signatures are encrypted tokens that preserve the model's reasoning state across API calls.

### Extraction & Usage

```typescript
// Extract signature from response
function extractThoughtSignature(response: GenerateContentResponse): string | null {
  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.thoughtSignature) {
      return part.thoughtSignature;
    }
  }
  return null;
}

// Include signature in next request
function buildMessageWithSignature(text: string, signature: string | null) {
  const parts: Part[] = [];
  if (signature) {
    parts.push({ thoughtSignature: signature });
  }
  parts.push({ text });
  return { role: 'user', parts };
}
```

### State Persistence Pattern

```typescript
// CRITICAL: Every model response with thoughtSignature MUST be preserved
const updatedHistory = [
  ...history,
  {
    role: 'model',
    parts: response.candidates[0].content.parts.map(p => ({
      text: p.text,
      thoughtSignature: p.thoughtSignature // MUST preserve
    })).filter(p => p.text || p.thoughtSignature) // Remove empty
  }
];
```

## Live API Configuration

### Audio Requirements

| Direction | Format | Sample Rate | Bit Depth | Channels |
|-----------|--------|-------------|-----------|----------|
| **Input** (to Gemini) | PCM | 16,000 Hz | 16-bit signed | Mono |
| **Output** (from Gemini) | PCM | 24,000 Hz | 16-bit signed | Mono |

### WebSocket Connection

```typescript
import { GoogleGenAI, Modality } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const session = await ai.live.connect({
  model: 'gemini-2.5-flash-native-audio-preview-12-2025',
  config: {
    responseModalities: [Modality.AUDIO, Modality.TEXT],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: 'Kore' // Options: Puck, Charon, Kore, Fenrir, Aoede
        }
      }
    },
    systemInstruction: {
      parts: [{ text: 'You are Ocula AI, a helpful visual support assistant...' }]
    }
  }
});

// Handle responses
session.on('message', (message) => {
  if (message.serverContent?.modelTurn?.parts) {
    for (const part of message.serverContent.modelTurn.parts) {
      if (part.text) handleText(part.text);
      if (part.inlineData?.mimeType?.startsWith('audio/')) {
        playAudio(part.inlineData.data); // 24kHz PCM
      }
    }
  }
});

// Send audio (16kHz PCM)
session.sendRealtimeInput({
  media: {
    mimeType: 'audio/pcm;rate=16000',
    data: base64AudioChunk
  }
});
```

### Direct WebSocket (Alternative)

```typescript
const WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  ws.send(JSON.stringify({
    setup: {
      model: 'models/gemini-2.5-flash-preview-native-audio-dialog',
      generationConfig: {
        responseModalities: ['AUDIO', 'TEXT']
      },
      systemInstruction: {
        parts: [{ text: 'System prompt here' }]
      },
      tools: functionDeclarations // Include tools in setup
    }
  }));
});
```

---

# 🔄 Core Workflows

## A. Visual Grounding Flow

User asks: *"Where is the billing section?"*

```
┌──────────────────────────────────────────────────────────────────┐
│  1. USER QUERY                                                    │
│     "Where is the billing section?"                              │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. SCREEN CAPTURE                                                │
│     Client captures current screen via getDisplayMedia           │
│     Sends base64 JPEG frame to server                            │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  3. AGENTIC VISION (gemini-3-flash-preview)                      │
│                                                                   │
│  const response = await ai.models.generateContent({              │
│    model: 'gemini-3-flash-preview',                              │
│    contents: [{                                                   │
│      role: 'user',                                                │
│      parts: [                                                     │
│        { inlineData: { mimeType: 'image/jpeg', data: frame } },  │
│        { text: 'Find the billing section. Return JSON with:      │
│                 { "found": bool, "point": [y, x], "label": str }' │
│        }                                                          │
│      ]                                                            │
│    }],                                                            │
│    config: {                                                      │
│      thinkingConfig: {                                            │
│        thinkingLevel: 'MEDIUM',                                   │
│        includeThoughtSignatures: true                             │
│      }                                                            │
│    }                                                              │
│  });                                                              │
│                                                                   │
│  OUTPUT: { "found": true, "point": [85, 920], "label": "Billing" }│
└────────────────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  4. COORDINATE MAPPING                                            │
│                                                                   │
│  Gemini returns coordinates in 0-1000 normalized space           │
│                                                                   │
│  // Map to actual viewport pixels                                 │
│  const pixelX = (point[1] / 1000) * window.innerWidth;           │
│  const pixelY = (point[0] / 1000) * window.innerHeight;          │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  5. RENDER SVG OVERLAY                                            │
│                                                                   │
│  drawArrow(pixelX, pixelY, "Billing Link");                      │
│                                                                   │
│  // Creates SVG arrow pointing to exact location                 │
│  <svg>                                                            │
│    <defs><marker id="arrowhead">...</marker></defs>              │
│    <line x1="..." y1="..." x2="${pixelX}" y2="${pixelY}"         │
│          marker-end="url(#arrowhead)" />                         │
│    <text>Billing Link</text>                                     │
│  </svg>                                                           │
└──────────────────────────────────────────────────────────────────┘
```

## B. Thought Signature Persistence (The "Golden Rule")

```
┌───────────────────────────────────────────────────────────────────────┐
│  TURN 1: Initial Query                                                │
│                                                                        │
│  User: "Help me export my report"                                     │
│  Screen: Shows dashboard                                               │
│                                                                        │
│  → Gemini analyzes, plans 3-step solution                             │
│  → Returns thoughtSignature: "abc123..."                              │
│  → Response: "I'll help you export. First, click Reports in sidebar"  │
│                                                                        │
│  SESSION STATE: { thoughtSignature: "abc123...", step: 1 }            │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│  TURN 2: Follow-up (MUST include previous signature)                  │
│                                                                        │
│  User: "I clicked it, now what?"                                      │
│  Screen: Shows Reports page                                            │
│                                                                        │
│  REQUEST MUST INCLUDE:                                                 │
│  {                                                                     │
│    contents: [                                                         │
│      ...previousHistory,                                               │
│      {                                                                 │
│        role: 'user',                                                   │
│        parts: [                                                        │
│          { thoughtSignature: "abc123..." }, // ⚠️ CRITICAL            │
│          { inlineData: { mimeType: 'image/jpeg', data: newFrame } },  │
│          { text: "I clicked it, now what?" }                          │
│        ]                                                               │
│      }                                                                 │
│    ]                                                                   │
│  }                                                                     │
│                                                                        │
│  → Gemini REMEMBERS the export plan from Turn 1                       │
│  → Returns NEW thoughtSignature: "def456..."                          │
│  → Response: "Great! Now click the Export button in the top right"    │
│                                                                        │
│  SESSION STATE: { thoughtSignature: "def456...", step: 2 }            │
└───────────────────────────────────────────────────────────────────────┘
```

---

# 📅 Phase-by-Phase Implementation

> **Implementation Guide**: Each phase has a **Success Checklist** at the end. Complete ALL items before moving to the next phase.

## Quick Reference: Extended Timeline

| Phase | Days | Focus | Key Deliverables | Status |
|-------|------|-------|------------------|--------|
| **Phase 1** | 1-2 | Foundation & Connectivity | Monorepo, Screen Capture, WebSocket, Live API | ✅ COMPLETE |
| **Phase 2** | 3-4 | Agentic Vision & Reasoning | LangChain agent, Tools, Live API function calling | ✅ COMPLETE |
| **Phase 3** | 5 | Advanced Visual Overlay | DOM-anchored overlays, glassmorphism, rAF loop | ✅ COMPLETE |
| **Phase 4** | 6 | Polish & Widget Bundle | Widget UI, Audio, esbuild bundle | ✅ COMPLETE |
| **Phase 5** | 7 | Landing Page & Auth | Next.js landing, better-auth, Google OAuth | 🔲 PLANNED |
| **Phase 6** | 8 | Platform Onboarding | KYC form, dashboard UI, Cloudinary uploads | 🔲 PLANNED |
| **Phase 7** | 9 | Knowledge Pipeline | Doc ingestion → agent knowledge, script generation | 🔲 PLANNED |
| **Phase 8** | 10 | Mock CRM & Demo | Mock CRM with embedded Ocula widget, demo recording | 🔲 PLANNED |

---

## Phase 1: Foundation & Connectivity (Days 1-2)

### Day 1: Monorepo Setup & Screen Capture

**Objective**: Scaffold project, implement `getDisplayMedia`

```bash
# Initialize monorepo
pnpm init
mkdir -p apps/client-sdk apps/server

# Client SDK setup
cd apps/client-sdk
pnpm init
pnpm add -D typescript esbuild
```

**capture.ts** - Core Implementation:

```typescript
export class ScreenCapture {
  private stream: MediaStream | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'browser', // Prefer browser tab
        frameRate: 1 // 1 FPS is sufficient
      },
      audio: false
    });
  }

  captureFrame(): string {
    if (!this.stream) throw new Error('Stream not started');
    
    const video = document.createElement('video');
    video.srcObject = this.stream;
    video.play();

    this.canvas.width = video.videoWidth;
    this.canvas.height = video.videoHeight;
    this.ctx.drawImage(video, 0, 0);

    return this.canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
  }

  stop(): void {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }
}
```

### Day 2: Server & Live API Connection

**Objective**: Establish bidirectional audio with Gemini Live API

**server/src/gemini/live.ts**:

```typescript
import { GoogleGenAI, Modality } from '@google/genai';
import { WebSocket as WS } from 'ws';

export class LiveAPIProxy {
  private ai: GoogleGenAI;
  private session: any = null;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async connect(systemPrompt: string, tools: any[]): Promise<void> {
    this.session = await this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      tools,
      config: {
        responseModalities: [Modality.AUDIO],  // Only ONE modality for native audio
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }
          }
        },
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        outputAudioTranscription: {}  // Get text transcription from audio
      },
      callbacks: {
        // ⚠️ CRITICAL: SDK requires lowercase callback names
        onopen: () => console.log('[LiveAPI] Connected'),
        onmessage: (msg: any) => this.handleMessage(msg),
        onerror: (err: any) => console.error('Live API error:', err),
        onclose: (event: any) => console.log('Closed:', event?.code),
      }
    });
  }

  sendAudio(base64Audio: string): void {
    this.session?.sendRealtimeInput({
      media: {
        mimeType: 'audio/pcm;rate=16000',
        data: base64Audio
      }
    });
  }

  sendText(text: string): void {
    this.session?.sendClientContent({
      turns: [{ role: 'user', parts: [{ text }] }],
      turnComplete: true
    });
  }

  private handleMessage(message: any): void {
    if (message.serverContent?.modelTurn?.parts) {
      // Emit to client WebSocket
    }
    if (message.toolCall) {
      // Handle function calls
    }
  }

  close(): void {
    this.session?.close();
  }
}
```

### ✅ Phase 1 Success Checklist

Complete ALL items before proceeding to Phase 2:

**Day 1 - Monorepo & Screen Capture:**
- [x] `pnpm init` at root, `pnpm-workspace.yaml` configured
- [x] `/apps/client-sdk/` folder created with `package.json`, `tsconfig.json`
- [x] `/apps/server/` folder created with `package.json`, `tsconfig.json`
- [x] `capture.ts` implemented with `ScreenCapture` class
- [x] `getDisplayMedia` works with `displaySurface: 'browser'`, `frameRate: 1`
- [x] `captureFrame()` returns base64 JPEG string
- [x] Manual test: Run in browser, grant screen share, capture logs base64

**Day 2 - Server & Live API:**
- [x] Fastify server starts on `PORT` (default 3001)
- [x] WebSocket server (`ws`) accepts connections at `/ws`
- [x] `@google/genai` package installed
- [x] `GEMINI_API_KEY` loaded from `.env`
- [x] `LiveAPIProxy` class connects to `gemini-2.5-flash-native-audio-preview-12-2025`
- [x] `sendAudio()` sends PCM 16kHz base64 to Live API
- [x] `onmessage` callback receives audio/text responses (lowercase callbacks required by SDK)
- [x] Manual test: Connect WebSocket client, send text, receive response

**Integration Test:**
- [x] Client SDK sends `{ type: 'frame', data: base64 }` over WebSocket
- [x] Server receives and logs frame data
- [x] Client SDK sends `{ type: 'text', text: 'Hello' }` 
- [x] Server forwards to Live API and receives response
- [x] Response relayed back to client WebSocket

---

## Phase 2: Agentic Vision & Reasoning (Days 3-4)

### Day 3: LangChain Agent Integration

**Objective**: Implement the ReAct agent with `createAgent()` and tools

> 📖 **See [LangGraph Agent Architecture](#langgraph-agent-architecture)** for complete implementation details including tool definitions, agent creation, and middleware patterns.

**Key files to create:**

| File | Purpose |
|------|---------|
| `agents/tools.ts` | Tool definitions using `tool()` helper with Zod schemas |
| `agents/agent.ts` | `createAgent()` setup with model, tools, and middleware |
| `agents/state.ts` | Extended state schema (optional, for custom fields) |
| `agents/stream.ts` | Streaming responses for real-time UI updates |
| `agents/index.ts` | `runOculaAgent()` entry point |
| `config/env.ts` | Environment config with LangSmith support |

**Install dependencies:**

```bash
cd apps/server
pnpm add langchain @langchain/langgraph @langchain/core @langchain/google-genai langsmith zod
```

**Integration with WebSocket handler** (update `server/src/index.ts`):

```typescript
import { runOculaAgent } from './agents';

// In WebSocket message handler
wss.on('connection', (ws) => {
  let sessionId = crypto.randomUUID();

  ws.on('message', async (data) => {
    const msg = JSON.parse(data.toString());

    if (msg.type === 'user_query') {
      // Run LangChain agent with createAgent()
      const result = await runOculaAgent({
        sessionId,
        userMessage: msg.text,
        screenBase64: msg.frame,
      });

      // Send response and visual commands to client
      ws.send(JSON.stringify({
        type: 'assistant_response',
        text: result.response,
        visualCommands: result.visualCommands,
      }));

      // Execute visual commands on client
      for (const cmd of result.visualCommands) {
        ws.send(JSON.stringify({
          type: 'draw',
          ...cmd,
        }));
      }
    }
  });
});
```

### Day 4: Agentic Vision Integration

**server/src/gemini/vision.ts**:

```typescript
import { GoogleGenAI } from '@google/genai';

export class AgenticVision {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async analyzeScreen(
    frame: string,
    query: string,
    thoughtSignature?: string
  ): Promise<{
    analysis: any;
    newSignature: string | null;
  }> {
    const parts: any[] = [];
    
    // Include thought signature for continuity
    if (thoughtSignature) {
      parts.push({ thoughtSignature });
    }
    
    parts.push(
      { inlineData: { mimeType: 'image/jpeg', data: frame } },
      { text: `${query}

Analyze the screen and respond in JSON format:
{
  "found": boolean,
  "elements": [
    {
      "type": "button|link|input|menu",
      "label": "text on element",
      "point": [y, x], // 0-1000 normalized coordinates
      "confidence": 0.0-1.0
    }
  ],
  "currentPage": "description of current screen state",
  "suggestedAction": "what the user should do next"
}` }
    );

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts }],
      config: {
        thinkingConfig: {
          thinkingLevel: 'MEDIUM',
          includeThoughtSignatures: true
        }
      }
    });

    // Extract thought signature
    let newSignature: string | null = null;
    const responseParts = response.candidates?.[0]?.content?.parts || [];
    for (const part of responseParts) {
      if (part.thoughtSignature) {
        newSignature = part.thoughtSignature;
      }
    }

    // Extract text response
    const textPart = responseParts.find(p => p.text && !p.thought);
    const analysis = JSON.parse(textPart?.text || '{}');

    return { analysis, newSignature };
  }

  async findElement(
    frame: string,
    elementDescription: string
  ): Promise<{ point: [number, number]; label: string } | null> {
    const { analysis } = await this.analyzeScreen(
      frame,
      `Find the UI element: "${elementDescription}". Return its exact location.`
    );

    if (analysis.found && analysis.elements?.length > 0) {
      const element = analysis.elements[0];
      return {
        point: element.point,
        label: element.label
      };
    }

    return null;
  }
}
```

### ✅ Phase 2 Success Checklist

Complete ALL items before proceeding to Phase 3:

**Day 3 - LangChain Agent Integration:** ✅ COMPLETE
- [x] `langchain`, `@langchain/langgraph`, `@langchain/core`, `@langchain/google-genai`, `langsmith`, `zod` packages installed
- [x] `agents/tools.ts` created with 4 tools using `tool()` helper:
  - [x] `inspectScreen` - Analyzes screen to find UI elements
  - [x] `drawVisualGuide` - Returns draw commands for client
  - [x] `searchKnowledge` - Searches knowledge base
  - [x] `clearOverlays` - Returns clear command
- [x] All tools have Zod schemas with `.describe()` on each field
- [x] `agents/agent.ts` created with `createAgent()`:
  - [x] Model: `ChatGoogleGenerativeAI({ model: 'gemini-2.0-flash' })`
  - [x] `systemPrompt` defines Ocula AI's role and capabilities
  - [x] `middleware` includes `toolErrorHandler` and `screenContextMiddleware`
  - [x] `checkpointer` is `MemorySaver`
- [x] `agents/index.ts` exports `runOculaAgent()` function
- [x] `config/env.ts` validates `GEMINI_API_KEY` and optional LangSmith vars
- [x] WebSocket handler calls `runOculaAgent()` with `sessionId`, `userMessage`, `screenBase64`

**Day 4 - Agentic Vision:**
- [ ] `gemini/vision.ts` created with `AgenticVision` class
- [ ] `analyzeScreenWithGemini()` accepts `frame`, `query`, `thinkingLevel`
- [ ] Request includes `thinkingConfig: { thinkingLevel: 'MEDIUM', includeThoughtSignatures: true }`
- [ ] Response parsing extracts `thoughtSignature` from parts (for future use)
- [ ] Response parsing extracts JSON analysis from text parts
- [ ] `findElement()` returns `{ point: [y, x], label }` or `null`
- [ ] `inspectScreen` tool calls `analyzeScreenWithGemini()` internally

**Integration Test:**
- [ ] Send `{ type: 'user_query', text: 'Find the settings button', frame: base64 }`
- [ ] Agent calls `inspect_screen` tool automatically
- [ ] Agent calls `draw_visual_guide` with coordinates
- [ ] Response includes `visualCommands` array
- [ ] If `LANGSMITH_TRACING_V2=true`, traces appear in LangSmith dashboard
- [ ] Multi-turn conversation maintains context via `thread_id`

---

## Phase 3: Visual Overlay System (Day 5)

### SVG Overlay Engine

**client-sdk/src/overlay.ts**:

```typescript
export class OverlayEngine {
  private svg: SVGSVGElement;
  private container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'ocula-overlay';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 999999;
    `;

    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', '100%');
    this.svg.innerHTML = `
      <defs>
        <marker id="ocula-arrowhead" markerWidth="10" markerHeight="7" 
                refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#FF4444" />
        </marker>
        <filter id="ocula-glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    `;

    this.container.appendChild(this.svg);
    document.body.appendChild(this.container);
  }

  /**
   * Draw an arrow pointing to normalized coordinates
   * @param normalizedY - Y coordinate (0-1000)
   * @param normalizedX - X coordinate (0-1000)
   * @param label - Text label for the arrow
   */
  drawArrow(normalizedY: number, normalizedX: number, label?: string): void {
    // Convert normalized (0-1000) to pixels
    const targetX = (normalizedX / 1000) * window.innerWidth;
    const targetY = (normalizedY / 1000) * window.innerHeight;

    // Calculate arrow start (offset from target)
    const offsetX = targetX > window.innerWidth / 2 ? 80 : -80;
    const offsetY = targetY > window.innerHeight / 2 ? 80 : -80;
    const startX = targetX + offsetX;
    const startY = targetY + offsetY;

    // Create arrow line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(startX));
    line.setAttribute('y1', String(startY));
    line.setAttribute('x2', String(targetX));
    line.setAttribute('y2', String(targetY));
    line.setAttribute('stroke', '#FF4444');
    line.setAttribute('stroke-width', '3');
    line.setAttribute('marker-end', 'url(#ocula-arrowhead)');
    line.setAttribute('filter', 'url(#ocula-glow)');
    line.classList.add('ocula-annotation');

    this.svg.appendChild(line);

    // Add label if provided
    if (label) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(startX));
      text.setAttribute('y', String(startY - 10));
      text.setAttribute('fill', '#FFFFFF');
      text.setAttribute('font-size', '14');
      text.setAttribute('font-weight', 'bold');
      text.classList.add('ocula-annotation');
      
      // Background rect for readability
      const bbox = { width: label.length * 8 + 16, height: 24 };
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', String(startX - 8));
      rect.setAttribute('y', String(startY - 28));
      rect.setAttribute('width', String(bbox.width));
      rect.setAttribute('height', String(bbox.height));
      rect.setAttribute('rx', '4');
      rect.setAttribute('fill', '#333333');
      rect.classList.add('ocula-annotation');

      this.svg.appendChild(rect);
      text.textContent = label;
      this.svg.appendChild(text);
    }
  }

  /**
   * Draw a highlight box around an element
   */
  highlightElement(
    normalizedY: number,
    normalizedX: number,
    normalizedWidth: number,
    normalizedHeight: number
  ): void {
    const x = (normalizedX / 1000) * window.innerWidth;
    const y = (normalizedY / 1000) * window.innerHeight;
    const width = (normalizedWidth / 1000) * window.innerWidth;
    const height = (normalizedHeight / 1000) * window.innerHeight;

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', String(x));
    rect.setAttribute('y', String(y));
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.setAttribute('fill', 'rgba(255, 255, 0, 0.3)');
    rect.setAttribute('stroke', '#FFD700');
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('rx', '4');
    rect.classList.add('ocula-annotation');

    this.svg.appendChild(rect);
  }

  /**
   * Clear all annotations
   */
  clear(): void {
    const annotations = this.svg.querySelectorAll('.ocula-annotation');
    annotations.forEach(el => el.remove());
  }

  /**
   * Remove overlay from DOM
   */
  destroy(): void {
    this.container.remove();
  }
}
```

### ✅ Phase 3 Success Checklist

Complete ALL items before proceeding to Phase 4:

**SVG Overlay Engine:**
- [ ] `overlay.ts` created with `OverlayEngine` class
- [ ] Container div has `position: fixed`, `pointer-events: none`, `z-index: 999999`
- [ ] SVG element fills viewport (`width: 100%`, `height: 100%`)
- [ ] Arrow marker defined in `<defs>` with id `ocula-arrowhead`
- [ ] Glow filter defined for visibility
- [ ] `drawArrow(normalizedY, normalizedX, label?)` implemented
- [ ] Coordinate conversion: `(normalized / 1000) * viewport`
- [ ] Arrow line uses `marker-end="url(#ocula-arrowhead)"`
- [ ] Label text with background rect for readability
- [ ] All annotations have class `ocula-annotation`
- [ ] `highlightElement(y, x, width, height)` draws yellow highlight box
- [ ] `clear()` removes all `.ocula-annotation` elements
- [ ] `destroy()` removes container from DOM

**Client Integration:**
- [ ] `connection.ts` handles `{ type: 'draw', ... }` messages from server
- [ ] On `type: 'draw'`, calls appropriate overlay method
- [ ] On `action: 'arrow'`, calls `drawArrow(point[0], point[1], label)`
- [ ] On `action: 'highlight'`, calls `highlightElement(...)`
- [ ] On `action: 'clear'` or new interaction, calls `clear()`

**Integration Test:**
- [ ] Send query "Where is the billing button?"
- [ ] Server returns `visualCommand: { type: 'arrow', point: [y, x], label: 'Billing' }`
- [ ] Red arrow appears on screen pointing to correct location
- [ ] Label text visible next to arrow
- [ ] Arrow visible on top of all page content
- [ ] `clear()` removes arrow before next instruction
- [ ] Coordinates accurately point to UI elements (within ~20px)

---

## Phase 4: Polish & Demo (Day 6)

### Chat Widget UI

**client-sdk/src/widget.ts**:

```typescript
export class OculaWidget {
  private container: HTMLDivElement;
  private isLive: boolean = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'ocula-widget';
    this.container.innerHTML = `
      <style>
        #ocula-widget {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 999998;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .ocula-bubble {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          transition: transform 0.2s;
        }
        
        .ocula-bubble:hover {
          transform: scale(1.1);
        }
        
        .ocula-bubble svg {
          width: 28px;
          height: 28px;
          fill: white;
        }
        
        .ocula-live-indicator {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 16px;
          height: 16px;
          background: #22c55e;
          border-radius: 50%;
          border: 2px solid white;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .ocula-panel {
          position: absolute;
          bottom: 70px;
          right: 0;
          width: 380px;
          height: 500px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          display: none;
          flex-direction: column;
          overflow: hidden;
        }
        
        .ocula-panel.active {
          display: flex;
        }
        
        .ocula-header {
          padding: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .ocula-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        
        .ocula-input {
          padding: 16px;
          border-top: 1px solid #eee;
          display: flex;
          gap: 8px;
        }
        
        .ocula-input input {
          flex: 1;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
        }
        
        .ocula-mic-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          background: #667eea;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .ocula-mic-btn.recording {
          background: #ef4444;
          animation: pulse 1s infinite;
        }
      </style>
      
      <div class="ocula-bubble" id="ocula-trigger">
        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
        <div class="ocula-live-indicator" style="display: none;"></div>
      </div>
      
      <div class="ocula-panel" id="ocula-panel">
        <div class="ocula-header">
          <h3 style="margin:0;font-size:16px;">🤖 Ocula AI</h3>
          <p style="margin:4px 0 0;font-size:12px;opacity:0.8;">Visual Support Assistant</p>
        </div>
        <div class="ocula-messages" id="ocula-messages"></div>
        <div class="ocula-input">
          <input type="text" placeholder="Type or speak..." id="ocula-text-input" />
          <button class="ocula-mic-btn" id="ocula-mic-btn">
            <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/></svg>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.container);
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const trigger = this.container.querySelector('#ocula-trigger')!;
    const panel = this.container.querySelector('#ocula-panel')!;
    
    trigger.addEventListener('click', () => {
      panel.classList.toggle('active');
    });
  }

  setLive(isLive: boolean): void {
    this.isLive = isLive;
    const indicator = this.container.querySelector('.ocula-live-indicator') as HTMLElement;
    indicator.style.display = isLive ? 'block' : 'none';
  }

  addMessage(role: 'user' | 'assistant', content: string): void {
    const messages = this.container.querySelector('#ocula-messages')!;
    const msg = document.createElement('div');
    msg.style.cssText = `
      margin-bottom: 12px;
      padding: 12px;
      border-radius: 12px;
      max-width: 80%;
      ${role === 'user' 
        ? 'background: #667eea; color: white; margin-left: auto;' 
        : 'background: #f3f4f6; color: #333;'}
    `;
    msg.textContent = content;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }
}
```

### ✅ Phase 4 Success Checklist

Complete ALL items - this is the final phase!

**Chat Widget UI:**
- [ ] `widget.ts` created with `OculaWidget` class
- [ ] Widget has floating bubble button (bottom-right, `z-index: 999998`)
- [ ] Click bubble toggles chat panel visibility
- [ ] Panel has header with "Ocula AI" branding
- [ ] Messages area with scrollable history
- [ ] Input area with text field and mic button
- [ ] Live indicator (green dot) shows when session active
- [ ] `setLive(boolean)` toggles indicator visibility
- [ ] `addMessage(role, content)` appends styled message bubbles
- [ ] User messages: right-aligned, purple background
- [ ] Assistant messages: left-aligned, gray background
- [ ] Auto-scroll to latest message

**Audio Integration:**
- [ ] `audio.ts` implements PCM capture (16kHz) and playback (24kHz)
- [ ] Mic button toggles recording state (red when active)
- [ ] Audio chunks sent as `{ type: 'audio', data: base64 }`
- [ ] Received audio `{ type: 'audio', data: base64 }` plays immediately
- [ ] Sample rate conversion handled correctly

**Bundle & Build:**
- [ ] esbuild configured for single `widget.js` bundle
- [ ] `pnpm --filter client-sdk build` produces `/dist/widget.js`
- [ ] Bundle is self-contained (no external dependencies at runtime)
- [ ] Bundle size < 100KB minified

**End-to-End Demo Flow:**
- [ ] Load test page with `<script src="widget.js"></script>`
- [ ] Widget bubble appears in corner
- [ ] Click bubble → panel opens
- [ ] Grant screen share permission
- [ ] Speak or type: "Where is the billing section?"
- [ ] See arrow appear pointing to billing element
- [ ] Hear voice response explaining location
- [ ] Ask follow-up: "What about settings?"
- [ ] Previous context maintained (thought signatures working)
- [ ] Complete 3+ turn conversation without errors

**Demo Recording Ready:**
- [ ] Screen recording software ready
- [ ] Demo script rehearsed (see Demo Scenario section)
- [ ] Test app (e.g., mock CRM dashboard) prepared
- [ ] All error cases handled gracefully
- [ ] Voice latency < 2 seconds
- [ ] Vision accuracy > 90% on test elements

---

# ⚠️ Implementation Guardrails

## Critical Rules

| Rule | Requirement | Consequence if Violated |
|------|-------------|------------------------|
| **G1** | Use `thinkingLevel`, NOT `thinkingBudget` | `thinkingBudget` is deprecated in Gemini 3 |
| **G2** | Preserve `thoughtSignature` in every turn | `400 Bad Request` on function calling |
| **G3** | Audio input: 16-bit PCM, 16kHz, mono | Live API won't process audio correctly |
| **G4** | Audio output: 24kHz for playback | Garbled/sped-up audio |
| **G5** | Include `tools` in Live API setup message | Function calling won't work mid-session |
| **G6** | Filter `thought: true` parts from user display | Confusing internal reasoning shown to user |
| **G7** | Pass `thread_id` in LangGraph config | Checkpointing won't work, sessions won't persist |
| **G8** | Limit LangGraph iterations (MAX=5) | Infinite loops possible without guard |

## Anti-Patterns to Avoid

```typescript
// ❌ DON'T: Forget to pass thought signature
const response = await ai.models.generateContent({
  contents: [{ role: 'user', parts: [{ text: 'Follow up question' }] }]
});

// ✅ DO: Always include thought signature
const response = await ai.models.generateContent({
  contents: [{ 
    role: 'user', 
    parts: [
      { thoughtSignature: previousSignature }, // CRITICAL
      { text: 'Follow up question' }
    ] 
  }]
});
```

```typescript
// ❌ DON'T: Use deprecated thinking budget
config: { thinkingConfig: { thinkingBudget: 8192 } }

// ✅ DO: Use thinking level
config: { thinkingConfig: { thinkingLevel: 'HIGH' } }
```

```typescript
// ❌ DON'T: Forget thread_id for LangGraph checkpointing
const result = await graph.invoke(state);

// ✅ DO: Always pass configurable with thread_id
const result = await graph.invoke(state, {
  configurable: { thread_id: sessionId },
  tags: [`session:${sessionId}`],  // Optional: for LangSmith tracing
});
```

```typescript
// ❌ DON'T: Allow infinite loops in Think-Act-Observe
function routeAfterObserve(state) {
  if (state.goalAchieved) return '__end__';
  return 'think';  // No iteration guard!
}

// ✅ DO: Always guard with max iterations
const MAX_ITERATIONS = 5;
function routeAfterObserve(state) {
  if (state.goalAchieved) return '__end__';
  if (state.iteration >= MAX_ITERATIONS) return '__end__';
  return 'think';
}
```

---

# 🎬 Demo Scenario

## "The Billing Button" Flow

**Script for hackathon demo video:**

```
┌────────────────────────────────────────────────────────────────────┐
│  SCENE 1: User on "Acme CRM" dashboard                             │
│                                                                     │
│  [User clicks Ocula help bubble]                                   │
│                                                                     │
│  Widget: "Hi! I'm Ocula. Share your screen and I'll help you."    │
│                                                                     │
│  [User grants screen share]                                        │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  SCENE 2: User asks for help                                       │
│                                                                     │
│  User (voice): "Where do I find billing settings?"                 │
│                                                                     │
│  [Ocula captures screen, sends to Gemini]                         │
│  [Gemini analyzes with Agentic Vision]                            │
│  [Returns coordinates: point [85, 920]]                           │
│                                                                     │
│  Ocula (voice): "I can see your dashboard. The billing section    │
│                  is in the top-right corner. Let me show you..."  │
│                                                                     │
│  [RED ARROW appears, pointing to "Billing" link]                  │
│                                                                     │
│  Ocula: "Click right there!"                                       │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  SCENE 3: User follows instruction                                 │
│                                                                     │
│  [User clicks where arrow points]                                  │
│  [Screen changes to Billing page]                                  │
│  [Ocula detects screen change via new frame]                      │
│                                                                     │
│  Ocula (voice): "Perfect! You're now on the Billing page.         │
│                  What would you like to do here?"                  │
│                                                                     │
│  [Arrow disappears, ready for next instruction]                   │
└────────────────────────────────────────────────────────────────────┘
```

---

# ✅ Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Voice Latency** | < 2 seconds | Time from speech end to response start |
| **Vision Accuracy** | > 90% | Correct UI element identification |
| **Thought Signature** | 0 errors | No `400 Bad Request` from missing signatures |
| **Agentic Flow** | Autonomous | "Zoom → Inspect → Guide" without intervention |
| **LangGraph Loop** | ≤ 3 iterations | Average iterations to achieve goal |
| **LangSmith Traces** | 100% captured | All graph runs visible in dashboard |
| **Demo Duration** | 3-5 minutes | Complete billing flow end-to-end |

---

# 📚 Reference Documentation

All technical details in this specification are sourced from:

## Gemini 3 Documentation

| Document | Path | Content |
|----------|------|---------|
| Gemini 3 Overview | [01-gemini-3-overview.md](./fetched/01-gemini-3-overview.md) | Models, features, migration |
| Thinking & Signatures | [02-thinking-and-signatures.md](./fetched/02-thinking-and-signatures.md) | `thinkingLevel`, signature handling |
| Live API Guide | [03-live-api-guide.md](./fetched/03-live-api-guide.md) | WebSocket, audio formats, session |
| Agentic Vision | [04-agentic-vision.md](./fetched/04-agentic-vision.md) | Think-Act-Observe, coordinates |
| Audio Helpers | [05-audio-helpers.md](./fetched/05-audio-helpers.md) | PCM player, mic capture |
| Image Generation | [06-image-generation.md](./fetched/06-image-generation.md) | Nano Banana, visual guides |

## LangChain / LangGraph / LangSmith

| Resource | URL | Content |
|----------|-----|---------|
| LangGraph Concepts | [langchain-ai.github.io/langgraph/concepts/](https://langchain-ai.github.io/langgraph/concepts/) | StateGraph, Annotation, checkpointers |
| LangGraph How-To | [langchain-ai.github.io/langgraph/how-tos/](https://langchain-ai.github.io/langgraph/how-tos/) | Conditional edges, persistence |
| LangSmith Docs | [docs.smith.langchain.com](https://docs.smith.langchain.com/) | Tracing, evaluation, observability |
| `@langchain/langgraph` | [npm](https://www.npmjs.com/package/@langchain/langgraph) | StateGraph, MemorySaver, Annotation |
| `@langchain/core` | [npm](https://www.npmjs.com/package/@langchain/core) | Base types, messages, tools |
| `langsmith` | [npm](https://www.npmjs.com/package/langsmith) | Client SDK for tracing |

---

*Last Updated: February 2026 | Ocula AI Hackathon MVP*

---

# 🔧 Implementation Session Log (Feb 5–6, 2026)

## Phase 1: COMPLETE ✅

All foundation features are implemented and verified working:

| Feature | File(s) | Status |
|---------|---------|--------|
| Monorepo (pnpm workspaces) | `pnpm-workspace.yaml`, root `package.json` | ✅ |
| Screen capture | `client-sdk/src/capture.ts` | ✅ |
| WebSocket server | `server/src/index.ts` (Fastify + `@fastify/websocket`) | ✅ |
| Live API proxy | `server/src/gemini/live.ts` | ✅ |
| Audio capture (mic → PCM 16kHz) | `client-sdk/src/audio.ts` | ✅ |
| Audio playback (PCM 24kHz → speaker) | `client-sdk/src/audio.ts` | ✅ |
| Text-to-Live-API forwarding | `server/src/index.ts` | ✅ |
| Vision API analysis | `server/src/gemini/vision.ts` | ✅ |
| SVG overlay engine | `client-sdk/src/overlay.ts` | ✅ |
| Frame forwarding to Live API | `server/src/index.ts` + `live.ts` | ✅ |
| Test page with full controls | `test/index.html` | ✅ |

## Bugs Fixed During Phase 1

### Bug 1: Live API Not Receiving Responses
**Root cause**: The `@google/genai` SDK uses **lowercase** callback names (`onmessage`, `onerror`, `onclose`, `onopen`) but our code used camelCase (`onMessage`, `onError`, `onClose`).

**Fix**: Changed all callbacks in `live.ts` to lowercase.

### Bug 2: Wrong Model Name
**Root cause**: Used incorrect model identifier `gemini-2.5-flash-preview-native-audio-dialog`.

**Fix**: Changed to `gemini-2.5-flash-native-audio-preview-12-2025`.

### Bug 3: Dual Response Modalities Rejected
**Root cause**: Native audio models only allow ONE response modality per session.

**Fix**: Use `responseModalities: [Modality.AUDIO]` only, with `outputAudioTranscription: {}` to get text transcripts.

### Bug 4: Model Hallucinating Screen Content
**Root cause**: Screen frames were captured by the client and stored on the server, but **never forwarded to the Gemini Live API**. The model had zero visual input and fabricated responses.

**Fix**:
1. Added `sendFrame()` method to `LiveAPIProxy` using `sendRealtimeInput({ media: { mimeType: 'image/jpeg', data } })`
2. Server now forwards every `frame` message to the Live API session
3. Updated system prompt to instruct model to be honest when no screen is shared

## 🚨 Known Critical Issues (Phase 2 Priorities)

### ISSUE 1: Screen Vision Requires Active Microphone 🔴
**Severity**: CRITICAL  
**Symptom**: When the user shares their screen but does NOT start their microphone, the AI hallucinates about screen content. It sometimes says it can't see the screen, sometimes fabricates what it sees. Vision only works correctly when audio is also streaming.  
**Likely cause**: The Gemini Live API may require an active audio stream to properly process video/image frames sent via `sendRealtimeInput`. Without audio, the session may not be fully "engaged".  
**Proposed solutions**:
- Send silent audio frames to keep the session alive when mic is off
- Try sending frames via `sendClientContent` with inline image data instead of `sendRealtimeInput`
- Investigate if the Live API session has a "video-only" mode

### ISSUE 2: ~50 Second Latency for Visual Overlays 🔴
**Severity**: CRITICAL  
**Symptom**: After clicking "Send Query", it takes ~50 seconds for annotations to appear.  
**Root cause**: The `user_query` path uses a **separate** `analyzeScreenWithGemini()` call to the Vision API (not the Live API), which is slow and disconnected from the voice stream.  
**Required fix**:
1. **Unify vision + voice**: Use **function calling/tools within the Live API session** so the model can emit draw commands in real-time while talking — no separate Vision API call
2. **Stream visual commands**: As the model talks during the live interaction, it should emit visual overlay commands simultaneously
3. **Zero delay goal**: Audio guidance and visual annotations MUST appear at the same time during conversation — there should be no "send query" step for visuals
4. The visual guidance should happen naturally during live voice conversation, not as a separate button/action

### ISSUE 3: Scroll-Offset Misalignment 🔴
**Severity**: CRITICAL  
**Symptom**: If the user scrolls after sending a query, annotations appear in wrong positions.  
**Root cause**: Coordinates are based on the viewport at capture time, not at render time.  
**Required fix**:
1. Capture `scrollX/scrollY` at the moment the frame is taken
2. Adjust overlay coordinates based on the current scroll position vs. the captured scroll position at render time
3. The coordinates should reflect the user's current viewport, not the viewport at capture time

### ISSUE 4: Ugly / Unprofessional Visual Overlays 🟡
**Severity**: HIGH  
**Symptom**: Current arrows are too big, colors are harsh red (#FF4444), overall look is not polished.  
**Required fix**:
1. Redesign arrows: smaller, sleeker, modern aesthetics
2. Use brand-aligned color palette (purples/blues with subtle glow instead of harsh red)
3. Add smooth entry animations (fade-in, slide-in)
4. Pill-shaped label backgrounds instead of plain rectangles
5. Subtle drop shadows for depth
6. Pulsing/breathing animations on target points
7. Softer translucent highlight fills with clean borders

## Architecture Decisions Confirmed

| Decision | Value | Reason |
|----------|-------|--------|
| Live API model | `gemini-2.5-flash-native-audio-preview-12-2025` | Only working native audio model |
| SDK callback style | Lowercase (`onmessage`, `onerror`, etc.) | `@google/genai` SDK requirement |
| Response modality | `AUDIO` only + `outputAudioTranscription` | Native audio models reject dual modalities |
| Frame delivery to Gemini | `sendRealtimeInput({ media: { mimeType: 'image/jpeg' } })` | Standard Live API image input |
| Frame rate | 1 FPS continuous when screen sharing | Balance between freshness and bandwidth |
| Voice name | `Kore` | Default Gemini voice |
| SDK version | `@google/genai` v1.39.0+ | Required for Live API support |

=================================

# 📝 Session 3: Day 4 — Agentic Vision + Live API Tools (Feb 7, 2026) ✅

## All 4 Critical Issues Resolved

| Issue | Root Cause | Fix Applied | Status |
|-------|-----------|-------------|--------|
| Vision requires active mic | Live API ignores frames without audio stream | Silent audio keepalive (100ms PCM16 every 250ms) | ✅ |
| Scroll misalignment | Coords based on capture-time viewport | Scroll context tracking (captureScrollX/Y → render delta) | ✅ |
| ~50s overlay latency | Separate Vision API call | Live API function calling tools (draw_arrow, etc.) | ✅ |
| Ugly overlays | Harsh red, oversized | Brand purple (#7C5CFC), pill labels, animations | ✅ |

## Key Implementations
- 5 Live API function declarations: `draw_arrow`, `draw_highlight`, `draw_circle`, `clear_overlays`, `search_knowledge`
- `handleLiveToolCall()` on server processes tools during voice conversation
- `sendToolResponse()` reports results back to Gemini for conversational flow
- `CapturedFrame` with scrollX/scrollY sent with every frame
- Server sends scroll context with every draw command to client
- Overlay engine applies scroll delta correction

=================================

# 📝 Session 4: Day 5 — Advanced Visual Overlay System (Feb 8, 2026) ✅

## Complete Overlay Engine v3 Rewrite

Full rewrite of `apps/client-sdk/src/overlay.ts` (~460 lines) with premium visual polish:

| Feature | Implementation |
|---------|---------------|
| **AnnotationRecord map** | `Map<string, AnnotationRecord>` tracking all live annotations with id, type, coords, SVG group, anchored element, scroll context |
| **DOM anchoring** | `document.elementFromPoint()` at render time → anchored element + offset from top-left |
| **rAF repositioning loop** | Every 2nd frame (~30fps) → `getBoundingClientRect()` for anchored elements, scroll-delta fallback |
| **Glassmorphism labels** | SVG `feGaussianBlur` + `feComposite` filter, frosted glow rect, inner top-highlight, measured text widths |
| **Double-ring ripple** | Two staggered expanding/fading rings (0s + 0.9s delay) on arrows and circles |
| **Fade-out exits** | CSS `ocula-fade-out` keyframe (opacity 1→0, translateY -8px, 250ms), applied on `clear()` |
| **Off-screen clamping** | Labels clamped to viewport with 8px padding |
| **Targeted removal** | `removeAnnotation(id)` with fade-out for individual annotations |

## Build Verification
- `tsc --noEmit` → 0 errors on both `client-sdk` and `server`
- No changes needed to `index.ts` — new overlay API is backward-compatible

=================================

# 📅 Phase 5-8: SaaS Platform Layer — IMPLEMENTATION PLAN

> These phases extend Ocula from a pure AI widget into a full B2B SaaS platform
> with auth, onboarding, document upload, and a demo CRM.

---

## Phase 5: Landing Page & Authentication (Day 7)

### New Package: `apps/web` (Next.js 14 App Router)

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout with fonts, metadata
│   │   ├── page.tsx             # Landing page
│   │   ├── (auth)/
│   │   │   ├── sign-in/page.tsx # Sign-in page
│   │   │   ├── sign-up/page.tsx # Sign-up page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx       # Protected dashboard layout
│   │   │   ├── onboarding/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── api/
│   │       └── auth/[...all]/route.ts  # Better Auth catch-all
│   ├── lib/
│   │   ├── auth.ts              # Better Auth server instance
│   │   └── auth-client.ts       # Better Auth React client
│   └── components/
│       ├── landing/             # Landing page sections
│       ├── auth/                # Sign-in/sign-up forms
│       └── ui/                  # Shared UI components
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config.ts
```

### Landing Page Design
- **Hero section**: Tagline "AI that sees, understands, and guides in real-time" + animated demo GIF/video
- **Features grid**: SEES / SPEAKS / GUIDES / REMEMBERS cards with icons
- **How it works**: 3-step flow (Embed script → AI analyzes → Users get guided)
- **Tech stack badges**: Gemini 3, WebSocket, Real-time Vision
- **CTA button**: "Get Started" → Sign-up page
- **Style**: Dark theme, brand purple (#7C5CFC) accents, glassmorphism cards, Inter/DM Sans fonts
- **Framework**: Next.js 14 + Tailwind CSS + shadcn/ui components

### Authentication Setup (Better Auth)

**Dependencies**:
```bash
pnpm add better-auth better-sqlite3
pnpm add -D @types/better-sqlite3
```

**Server config** (`lib/auth.ts`):
```typescript
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

export const auth = betterAuth({
  database: new Database("./sqlite.db"),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  trustedOrigins: ["http://localhost:3000"],
});
```

**API route** (`app/api/auth/[...all]/route.ts`):
```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
export const { POST, GET } = toNextJsHandler(auth);
```

**Client** (`lib/auth-client.ts`):
```typescript
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient();
```

**Auth pages**:
- Sign-up form: name, email, password + "Sign up with Google" button
- Sign-in form: email, password + "Sign in with Google" button
- `authClient.signUp.email()`, `authClient.signIn.email()`, `authClient.signIn.social({ provider: "google" })`

**Environment variables**:
```bash
BETTER_AUTH_SECRET=<generated-32-char-secret>
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>
```

**Google OAuth callback URL**: `http://localhost:3000/api/auth/callback/google`

### ✅ Phase 5 Success Checklist
- [ ] `apps/web/` Next.js 14 project created with Tailwind + shadcn/ui
- [ ] Landing page with hero, features, how-it-works, CTA
- [ ] Dark theme with brand purple (#7C5CFC)
- [ ] `better-auth` installed and configured with SQLite
- [ ] `npx @better-auth/cli migrate` creates auth tables
- [ ] Email/password sign-up and sign-in working
- [ ] Google OAuth sign-in working
- [ ] Protected dashboard route redirects unauthenticated users to sign-in
- [ ] Session accessible via `authClient.useSession()` and `auth.api.getSession()`

---

## Phase 6: Platform Onboarding & Dashboard (Day 8)

### KYC Onboarding Flow
After a platform registers (sign-up), they must complete a simple onboarding form before accessing the dashboard:

**KYC form fields** (stored in a `platforms` table):
| Field | Type | Required |
|-------|------|----------|
| `platformName` | string | ✅ |
| `platformUrl` | string (URL) | ✅ |
| `contactName` | string | ✅ |
| `contactRole` | string | ✅ |
| `companySize` | enum (1-10, 11-50, 51-200, 200+) | ✅ |
| `industry` | string | ✅ |
| `useCase` | text | ❌ |

**Flow**: Sign-up → Onboarding form → Dashboard
- No external verification needed — just collect the info
- `platforms` table linked to `user.id` via foreign key
- Onboarding status tracked; incomplete → redirect to onboarding page

### Dashboard Page
The main dashboard after onboarding is complete:

**Sections**:
1. **Platform overview card** — Name, URL, status, created date
2. **Knowledge base panel** — Upload documents/images for the agent
3. **Embed script panel** — Generated `<script>` tag to copy-paste
4. **Usage stats** (placeholder for MVP) — Session count, queries

### ✅ Phase 6 Success Checklist
- [ ] `platforms` database table created (via Drizzle or raw SQL)
- [ ] Onboarding form page at `/onboarding`
- [ ] Form validation (Zod + React Hook Form)
- [ ] Platform data saved to database on submit
- [ ] Redirect logic: no platform → onboarding, has platform → dashboard
- [ ] Dashboard page at `/dashboard`
- [ ] Platform overview card displays user's platform info
- [ ] Embed script panel shows `<script src="...">` code block with copy button

---

## Phase 7: Knowledge Pipeline & File Uploads (Day 9)

### Cloudinary Integration
Platform users upload documents and screenshots about their SaaS product. These are stored in Cloudinary and fed to the agent for analysis.

**Dependencies**:
```bash
pnpm add cloudinary
```

**Environment variables**:
```bash
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

**Upload flow**:
1. User selects file(s) on dashboard (PDF, PNG, JPG, WEBP, MD)
2. Client uploads to Next.js API route → server uploads to Cloudinary
3. Cloudinary returns URL + metadata
4. URL stored in `platform_documents` table
5. For images: URL is passed to Gemini Vision for analysis
6. For PDFs: text extracted (via Cloudinary or server-side), passed as knowledge context
7. Agent knowledge base is rebuilt/augmented with uploaded content

**Database table**: `platform_documents`
| Column | Type |
|--------|------|
| `id` | string (UUID) |
| `platformId` | string (FK) |
| `type` | enum (pdf, image, markdown) |
| `cloudinaryUrl` | string |
| `cloudinaryPublicId` | string |
| `filename` | string |
| `analysis` | text (Gemini's analysis result) |
| `createdAt` | timestamp |

### Script Tag Generation
After uploading docs, the dashboard generates a platform-specific `<script>` tag:

```html
<script src="https://ocula.ai/widget.js" 
  data-platform-id="plat_abc123" 
  data-server="wss://api.ocula.ai/ws">
</script>
```

The `data-platform-id` ties the widget to the platform's knowledge base so the agent has context about that specific SaaS product.

### ✅ Phase 7 Success Checklist
- [ ] Cloudinary SDK configured
- [ ] File upload API route (`/api/upload`) working
- [ ] Dashboard file upload UI with drag-and-drop
- [ ] Supports PDF, PNG, JPG, WEBP, MD files
- [ ] Uploaded files stored in Cloudinary, URLs in database
- [ ] Images analyzed by Gemini Vision, results stored
- [ ] PDFs text-extracted and stored as knowledge context
- [ ] `<script>` tag generated with platform-specific ID
- [ ] Copy-to-clipboard for script tag

---

## Phase 8: Mock CRM & Demo (Day 10)

### Mock CRM Application
A simple multi-page CRM app used for the hackathon demo. It doesn't need real data — just realistic-looking UI.

**New package**: `apps/mock-crm/`
```
apps/mock-crm/
├── index.html          # Multi-page mock CRM
├── contacts.html
├── deals.html
├── reports.html
├── billing.html
├── settings.html
├── styles.css
└── mock-data.js
```

**Pages**:
- **Dashboard**: Overview with charts/cards (mock data)
- **Contacts**: Table of contacts with search
- **Deals**: Kanban-style deal pipeline
- **Reports**: Charts and export button
- **Billing**: Subscription info, payment method
- **Settings**: Account settings, integrations

**Ocula Integration**:
- Embed the Ocula `<script>` tag in each page
- The widget connects to the server and has knowledge about the CRM's UI
- Demo script: user asks "Where is billing?" → AI sees the CRM screen via Live API → draws arrow to Billing nav item → speaks guidance

### Demo Recording Prep
- Full end-to-end flow: Landing → Sign-up → Onboarding → Dashboard → Upload CRM docs → Get script → Embed in CRM → Live AI guidance
- 3-5 minute video showing the complete B2B SaaS story

### ✅ Phase 8 Success Checklist
- [ ] Mock CRM app with 5+ pages and realistic UI
- [ ] Ocula `<script>` tag embedded in all pages
- [ ] Widget loads, connects to server, shows help button
- [ ] Voice query "Where is billing?" triggers correct arrow overlay
- [ ] Multi-turn conversation works (3+ turns with context)
- [ ] Full platform flow works end-to-end (landing → auth → dashboard → embed → demo)
- [ ] Demo video recorded (3-5 minutes)

---

## Updated Project Structure

```
/ocula-ai
├── /apps
│   ├── /client-sdk           # Vanilla TS → widget.js IIFE bundle
│   │   └── src/
│   │       ├── index.ts
│   │       ├── capture.ts
│   │       ├── overlay.ts    # v3 — DOM-anchored, glassmorphism
│   │       ├── audio.ts
│   │       └── connection.ts
│   │
│   ├── /server               # Node.js + Fastify + WebSocket
│   │   └── src/
│   │       ├── index.ts
│   │       ├── /agents       # LangChain createAgent()
│   │       ├── /gemini       # Live API, Vision, Client
│   │       ├── /knowledge    # Demo knowledge base
│   │       └── /config       # Environment config
│   │
│   ├── /web                  # NEW — Next.js 14 dashboard
│   │   └── src/
│   │       ├── app/
│   │       │   ├── page.tsx              # Landing page
│   │       │   ├── (auth)/               # Sign-in, sign-up
│   │       │   ├── (dashboard)/          # Onboarding, dashboard, settings
│   │       │   └── api/auth/[...all]/    # Better Auth API route
│   │       ├── lib/
│   │       │   ├── auth.ts               # Better Auth server instance
│   │       │   ├── auth-client.ts        # Better Auth React client
│   │       │   └── cloudinary.ts         # Cloudinary SDK wrapper
│   │       └── components/               # React components
│   │
│   └── /mock-crm             # NEW — Static mock CRM for demo
│       ├── index.html
│       ├── contacts.html
│       ├── deals.html
│       ├── billing.html
│       └── settings.html
│
├── /docs                     # Specifications & fetched docs
├── /test                     # Test page
├── package.json              # Monorepo root
└── pnpm-workspace.yaml       # apps/* workspaces
```

## New Dependencies Summary

| Package | Location | Purpose |
|---------|----------|--------|
| `better-auth` | `apps/web` | Authentication framework |
| `better-sqlite3` | `apps/web` | SQLite database for auth |
| `cloudinary` | `apps/web` | File upload API |
| `next` | `apps/web` | React framework |
| `tailwindcss` | `apps/web` | Styling |
| `shadcn/ui` | `apps/web` | UI component library |
| `react-hook-form` | `apps/web` | Form handling |
| `zod` | `apps/web` | Validation schemas |

## New Environment Variables

```bash
# Better Auth
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth 
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
# Callback URL: {BETTER_AUTH_URL}/api/auth/callback/google

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your-cloud>
CLOUDINARY_API_KEY=<your-key>
CLOUDINARY_API_SECRET=<your-secret>
```

---

## Session 5: Days 6-10 — SaaS Platform Layer ✅ COMPLETE

**Date**: February 8, 2026  
**Scope**: Complete implementation of Phases 5-8 (Landing Page, Auth, Onboarding, Dashboard, File Uploads, Mock CRM)  
**Result**: All SaaS platform features implemented, 0 TypeScript errors, 11 pages compiled

---

### Phase 5: Landing Page & Authentication ✅

**Files created** (`apps/web/`):

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Landing page composing all section components |
| `src/app/layout.tsx` | Root layout with Inter font, dark theme |
| `src/app/globals.css` | Tailwind v4 theme, CSS variables, glassmorphism, animations |
| `src/components/landing/navbar.tsx` | Floating navbar with scroll progress, mobile menu |
| `src/components/landing/hero-section.tsx` | Animated code terminal, typewriter effect |
| `src/components/landing/features-grid.tsx` | Interactive vision/voice/auth demo tiles |
| `src/components/landing/how-it-works.tsx` | Scroll-driven scan animation, step cards |
| `src/components/landing/tech-stack.tsx` | Spotlight hover cards for tech logos |
| `src/components/landing/cta-section.tsx` | CTA with star dust background |
| `src/components/landing/footer.tsx` | Footer with status indicator |
| `src/app/(auth)/layout.tsx` | Auth layout with gradient mesh background |
| `src/app/(auth)/sign-in/page.tsx` | Email + Google OAuth sign-in |
| `src/app/(auth)/sign-up/page.tsx` | Email + Google OAuth sign-up → redirects to /onboarding |
| `src/app/api/auth/[...all]/route.ts` | Better Auth catch-all API handler |
| `src/lib/auth.ts` | Better Auth server config (SQLite, Google OAuth, sessions) |
| `src/lib/auth-client.ts` | Better Auth React client (signIn, signUp, signOut, useSession) |
| `src/middleware.ts` | Route protection via session cookie check |

**Auth config**:
- SQLite database (`./sqlite.db`) shared between auth + custom tables
- Email/password (min 8 chars) + Google OAuth
- 7-day sessions with 24h refresh, 5-min cookie cache
- Protected routes: `/dashboard/*`, `/onboarding/*`

---

### Phase 6: Platform Onboarding & Dashboard ✅

**Files created/modified**:

| File | Purpose |
|------|---------|
| `src/lib/db.ts` | SQLite helper: `platform` table schema + CRUD functions |
| `src/app/api/platform/route.ts` | GET/POST API for platform CRUD |
| `src/app/(dashboard)/onboarding/page.tsx` | 2-step KYC form (platform info → contact info) |
| `src/app/(dashboard)/dashboard/page.tsx` | Platform overview, embed script, knowledge base |
| `src/app/(dashboard)/layout.tsx` | Protected layout, platform check, dashboard navbar |

**Platform table schema**:
- `id` (UUID), `userId` (FK), `platformName`, `platformUrl`, `contactName`, `contactRole`, `companySize`, `industry`, `useCase`, `createdAt`

**Dashboard sections**:
1. Platform overview card (name, URL, contact, industry)
2. Embed script panel with copy-to-clipboard (includes `data-platform-id`)
3. Knowledge base panel (upload area + document list)
4. Quick stats (documents count, platform status)

---

### Phase 7: Knowledge Pipeline & File Uploads ✅

**Files created/modified**:

| File | Purpose |
|------|---------|
| `src/lib/cloudinary.ts` | Cloudinary upload/delete helpers, file type detection, 10MB limit |
| `src/lib/db.ts` (updated) | Added `platform_document` table + document CRUD functions |
| `src/app/api/upload/route.ts` | POST: FormData → Cloudinary → DB record |
| `src/app/api/documents/route.ts` | GET: list documents, DELETE: remove from Cloudinary + DB |
| `src/app/(dashboard)/dashboard/page.tsx` (updated) | Drag-and-drop upload UI, document list with View/Delete |

**Document table schema**:
- `id` (UUID), `platformId` (FK), `type` (pdf/image/markdown), `cloudinaryUrl`, `cloudinaryPublicId`, `filename`, `sizeBytes`, `analysis`, `createdAt`

**Supported uploads**: PDF, PNG, JPG, WEBP, Markdown (max 10MB each)

---

### Phase 8: Mock CRM & Demo ✅

**New package**: `apps/mock-crm/` — Static HTML/CSS/JS CRM application

| File | Purpose |
|------|---------|
| `index.html` | Dashboard: stats, revenue chart, activity feed, top deals |
| `contacts.html` | Contact list with search, import, export, add contact |
| `deals.html` | Kanban pipeline board (6 stages), pipeline stats |
| `reports.html` | KPIs, revenue trend, pipeline breakdown, team activity |
| `billing.html` | Plan comparison (Free/Pro/Enterprise), payment method, invoices |
| `settings.html` | Account, notifications, team members, integrations, danger zone |
| `styles.css` | Full dark-themed CSS (~400 lines) matching Ocula brand |
| `mock-data.js` | Contacts, deals, activity, revenue, invoices |
| `components.js` | Shared sidebar + header renderer |

**Knowledge documents** (for Ocula AI to digest):

| File | Purpose |
|------|---------|
| `knowledge/acme-crm-knowledge.md` | Full CRM knowledge base: all pages, navigation, tasks, FAQ |
| `knowledge/ui-element-map.md` | Precise UI element locations for visual grounding |
| `knowledge/quick-start-guide.md` | User onboarding guide (5-step walkthrough) |

**Ocula integration**: Every CRM page includes:
```html
<script src="http://localhost:3000/widget.js"
  data-platform-id="mock-crm-demo"
  data-server="ws://localhost:3001/ws">
</script>
```

**Customer template**: `docs/ocula-knowledge-base-template.md` — A structured template that platform owners can fill in to create compatible knowledge base documents for their own products.

---

### Link Audit & Fixes

During final review, a comprehensive audit identified and fixed:

| Issue | File | Fix |
|-------|------|-----|
| `/login` → 404 | navbar.tsx | Changed to `/sign-in` (2 occurrences) |
| `/register` → 404 | navbar.tsx | Changed to `/sign-up` (2 occurrences) |
| `/docs` → 404 | navbar.tsx | Removed, replaced with "How It Works" → `#how-it-works` |
| `/blog` → 404 | navbar.tsx | Removed |
| `#pricing` dead anchor | navbar.tsx | Removed |
| Dead buttons (no navigation) | hero-section.tsx | Wired to `/sign-up` and `#features` |
| Dead buttons (no navigation) | cta-section.tsx | Wired to `/sign-up` and `#features` |
| 8 placeholder `#` links | footer.tsx | Wired to real routes and external docs |
| Missing anchor target | how-it-works.tsx | Added `id="how-it-works"` to section |
| Orphan `/settings` matcher | middleware.ts | Removed from matcher (no settings page) |

---

### Final Architecture Summary

```
apps/
├── client-sdk/          # Vanilla TS widget (capture, overlay, audio, WebSocket)
├── server/              # Fastify + WebSocket + LangChain Agent + Gemini APIs
├── web/                 # Next.js 15 (landing, auth, dashboard, file uploads)
│   ├── src/app/         # 11 pages (0 errors)
│   ├── src/lib/         # auth, db, cloudinary helpers
│   └── src/components/  # Landing page sections
└── mock-crm/            # 6-page static CRM demo + 3 knowledge documents
```

**Build result**: `npx next build` → 11 pages compiled, 0 errors  
**Dependencies installed**: better-auth, better-sqlite3, cloudinary, lucide-react, next, react  
**Environment variables**: BETTER_AUTH_SECRET, BETTER_AUTH_URL, GOOGLE_CLIENT_ID/SECRET, CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET  

---

*Last Updated: February 10, 2026 | Ocula AI Hackathon — All Phases Complete*
===============================

## Session 6: Day 11 — Highlighting Accuracy, Double Response Fix & Onboarding Tour ✅ COMPLETE

**Date**: Feb 10, 2026
**Scope**: Fix CSS selector accuracy for highlighting, eliminate double AI messages, add auto-onboarding tour, redesign highlight styling.
**Result**: All issues resolved, 0 TypeScript errors, client SDK rebuilt

---

### What Was Done

#### 1. CSS Class-Based Highlight System (`overlay.ts`)
**Before**: Inline styles (`element.style.outline = ...`) that were invisible due to host page CSS overrides.

**After**: Injects a `<style id="ocula-highlight-styles">` into the host DOM with:
- `ocula-hl-active` class: Multi-layer pulsing glow (`box-shadow` animation), color-shifting border (`ocula-hl-border-flow`), fade-in entrance
- `ocula-hl-label` div: Floating glassmorphism pill (dark translucent background, backdrop blur, `✦` icon, gentle float animation)
- Applied via `classList.add('ocula-hl-active')` with `!important` — reliable, GPU-accelerated
- Labels track element position via `requestAnimationFrame` loop

#### 2. UI_SELECTORS Map (`live.ts`)
Added a static map of known platform elements with their exact CSS selectors:
```typescript
export const UI_SELECTORS: Record<string, string> = {
  'Sidebar':            '#sidebar-root',
  'Main Content':       '.main-content',
  'Search Bar':         '.search-bar',
  'New Deal Button':    '.btn-primary',
  'Stats Grid':         '.stats-grid',
  'Revenue Chart Card': '#revenue-chart',
  'Activity Feed':      '#activity-feed',
  'Deals Table':        '#deals-table',
};
```
`formatSelectorMap()` injects this into the system prompt so the model uses exact selectors instead of guessing.

#### 3. Double Message Fix (`live.ts`)
**Root cause**: `handleMessage()` fired `onText` from **two** sources — `part.text` in `modelTurn.parts` AND `outputTranscription.text`. Both sent `assistant_response` to the client.

**Fix**: Removed `part.text` forwarding. In AUDIO modality with `outputAudioTranscription` enabled, only `outputTranscription` is the correct text source.

#### 4. Action Parameter Bug (`index.ts`)
**Root cause**: `handleLiveToolCall` sent `action: 'highlight_element'` (the tool name string) instead of the actual action from args (`'apply'` / `'clear'`). This invalid value propagated to the client.

**Fix**: Changed to `action: action || 'apply'`.

#### 5. Auto-Onboarding Tour (`index.ts`)
- Added `hasOnboarded: boolean` flag to `SessionState`
- Moved onboarding trigger to **first frame received** (not on WebSocket connect)
- Sends a tour prompt only once, and only after the user starts screen sharing so the model can see the UI
- Tour highlights: Sidebar → Search Bar → Stats Grid → Main Content

#### 6. System Prompt Overhaul (`index.ts`)
- Injected `KNOWN UI SELECTORS` section with exact selectors
- Added strict anti-double-response rules: "DO NOT announce tool calls", "DO NOT confirm after execution"
- Removed obsolete draw_arrow/draw_highlight/draw_circle tool references from prompt
- Added `NEVER repeat yourself` rule

---

### Files Changed

| File | Change |
|------|--------|
| `apps/client-sdk/src/overlay.ts` | CSS class highlight system + floating labels + `clear()` fix |
| `apps/server/src/gemini/live.ts` | `UI_SELECTORS` map, `formatSelectorMap()`, removed duplicate `part.text` forwarding |
| `apps/server/src/index.ts` | Fixed action bug, `hasOnboarded` flag, onboarding on first frame, selector-aware system prompt |
| `apps/server/src/agents/tools.ts` | Refined `highlight_element` description for wrapper targeting |
| `apps/client-sdk/dist/ocula.js` | Rebuilt bundle (39.1kb) |

### Verification
- ✅ `tsc --noEmit` — 0 errors (both server and client-sdk)
- ✅ `pnpm --filter @ocula/client-sdk build` — 39.1kb bundle
- ✅ Server logs show correct selectors: `#sidebar-root`, `.search-bar`, `.stats-grid`, `.main-content`

====================================
