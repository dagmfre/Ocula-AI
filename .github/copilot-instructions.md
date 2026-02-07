# Ocula AI - Copilot Instructions

## Project Overview
Ocula AI is a B2B embeddable widget providing real-time visual AI support. It uses **Gemini 3** to see user screens, speak guidance via voice, and draw SVG overlays pointing to UI elements.

**Architecture**: Script-injected widget → WebSocket → Node.js/Fastify server → LangGraph Agent → Gemini 3 APIs

## Tech Stack
| Layer | Technology |
|-------|------------|
| Client SDK | Vanilla TypeScript, esbuild |
| Server | Node.js, Fastify, WebSocket (ws) |
| Agent Orchestration | **LangChain** `createAgent()` + **LangGraph** (ReAct pattern) |
| LLM | **LangChain** (@langchain/core, @langchain/google-genai) |
| Observability | **LangSmith** (auto-tracing) |
| AI APIs | Gemini 3 (Vision, Live API) |

## Critical Gemini 3 Patterns

### Thinking Configuration (MANDATORY)
```typescript
// ✅ CORRECT - Use thinkingLevel
config: {
  thinkingConfig: {
    thinkingLevel: 'HIGH' // HIGH | MEDIUM | LOW | MINIMAL
  }
}

// ❌ WRONG - thinkingBudget is DEPRECATED
config: { thinkingConfig: { thinkingBudget: 8192 } }
```

### Thought Signatures (REQUIRED for multi-turn)
Every response with a `thoughtSignature` MUST be preserved and included in the next request:
```typescript
// Extract from response
const signature = response.candidates?.[0]?.content?.parts?.find(p => p.thoughtSignature)?.thoughtSignature;

// Include in next request (MUST be first part)
const parts = [];
if (signature) parts.push({ thoughtSignature: signature });
parts.push({ text: userMessage });
```
**Failure to pass signatures causes 400 Bad Request or context loss.**

### Audio Formats
| Direction | Sample Rate | Format |
|-----------|-------------|--------|
| Input (to Gemini) | 16,000 Hz | PCM 16-bit mono |
| Output (from Gemini) | 24,000 Hz | PCM 16-bit mono |

## Key Models
| Model | Purpose |
|-------|---------|
| `gemini-3-flash-preview` | Screen analysis (Agentic Vision) |
| `gemini-2.5-flash-native-audio-preview-12-2025` | Real-time voice (Live API) — native audio |
| `gemini-2.5-flash-image` | Visual annotation generation |

## LangChain Agent Architecture

### Tool Definitions (Zod Schemas)
```typescript
import * as z from 'zod';
import { tool } from 'langchain';

// Define tools with Zod schemas for type safety
export const inspectScreen = tool(
  async ({ target, screenBase64 }) => { /* ... */ },
  {
    name: 'inspect_screen',
    description: 'Analyze screen to find UI elements',
    schema: z.object({
      target: z.string().describe('What to look for'),
      screenBase64: z.string().describe('Base64 JPEG of screen'),
    }),
  }
);
```

### Agent Creation with `createAgent()`
```typescript
import { createAgent, createMiddleware } from 'langchain';
import { MemorySaver } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

const agent = createAgent({
  model: new ChatGoogleGenerativeAI({ model: 'gemini-2.0-flash' }),
  tools: [inspectScreen, drawVisualGuide, searchKnowledge, clearOverlays],
  systemPrompt: 'You are Ocula AI, a visual support assistant...',
  middleware: [toolErrorHandler, screenContextMiddleware],
  checkpointer: new MemorySaver(),
});
```

### Agent Invocation
```typescript
// ✅ ALWAYS pass thread_id for session checkpointing
const result = await agent.invoke(
  { messages: [new HumanMessage(userMessage)] },
  {
    configurable: { thread_id: sessionId },
    context: { screenBase64 },  // Injected into tools via middleware
    tags: [`session:${sessionId}`],  // LangSmith tracing
  }
);
```

### Middleware Patterns
```typescript
// Tool error handling
const toolErrorHandler = createMiddleware({
  name: 'ToolErrorHandler',
  wrapToolCall: async (request, handler) => {
    try {
      return await handler(request);
    } catch (error) {
      return new ToolMessage({
        content: `Error: ${error.message}`,
        tool_call_id: request.toolCall.id!,
      });
    }
  },
});

// Screen context injection
const screenContextMiddleware = createMiddleware({
  name: 'ScreenContextInjection',
  wrapToolCall: async (request, handler) => {
    if (request.toolCall.name === 'inspect_screen') {
      request.toolCall.args.screenBase64 = request.runtime?.context?.screenBase64;
    }
    return handler(request);
  },
});
```

### LangSmith (Auto-Tracing)
Set environment variables - no code changes needed:
```bash
LANGSMITH_TRACING_V2=true
LANGSMITH_API_KEY=your-key
LANGSMITH_PROJECT=ocula-ai-mvp
```

## Coordinate System
Gemini returns normalized coordinates (0-1000). Convert to pixels:
```typescript
const pixelX = (normalizedX / 1000) * window.innerWidth;
const pixelY = (normalizedY / 1000) * window.innerHeight;
```

## Project Structure
```
/apps
  /client-sdk        # Vanilla TS → single JS bundle (widget.js)
    capture.ts       # getDisplayMedia screen capture
    overlay.ts       # SVG arrows/highlights
    audio.ts         # PCM capture/playback
    connection.ts    # WebSocket to server
  /server            # Node.js + Fastify
    /agents          # ⭐ LangChain Agent System
      agent.ts       # createAgent() setup with middleware
      tools.ts       # Tool definitions (Zod schemas)
      state.ts       # Extended state schema (optional)
      stream.ts      # Streaming responses
      index.ts       # runOculaAgent() entry point
    /gemini          # Gemini API wrappers
      client.ts      # GoogleGenAI SDK wrapper
      live.ts        # Live API WebSocket proxy
      vision.ts      # Agentic Vision calls
    /knowledge       # Demo knowledge base
      demo.md        # Hardcoded KB for MVP
    /config
      env.ts         # Zod-validated env (incl. LangSmith)
```

## Development Commands
```bash
pnpm install                        # Install all workspace dependencies
pnpm --filter client-sdk build      # Build widget bundle
pnpm --filter server dev            # Run server with hot reload
```

## Implementation Patterns

### Screen Capture
Use `getDisplayMedia` with `displaySurface: 'browser'` and `frameRate: 1`:
```typescript
const stream = await navigator.mediaDevices.getDisplayMedia({
  video: { displaySurface: 'browser', frameRate: 1 },
  audio: false
});
```

### WebSocket Message Types
```typescript
// Client → Server
type ClientMsg = 
  | { type: 'audio', data: string }      // Base64 PCM 16kHz
  | { type: 'text', text: string }
  | { type: 'frame', data: string };     // Base64 JPEG

// Server → Client
type ServerMsg =
  | { type: 'audio', data: string }      // Base64 PCM 24kHz
  | { type: 'text', text: string }
  | { type: 'draw', action: 'arrow' | 'highlight', point: [y, x], label?: string };
```

### SVG Overlay
All overlays use `pointer-events: none` and `z-index: 999999`. Annotations have class `ocula-annotation` for batch clearing.

## Reference Documentation
See `docs/fetched/` for comprehensive Gemini 3 API docs:
- `01-gemini-3-overview.md` - Models, migration guide
- `02-thinking-and-signatures.md` - Thought signatures (critical)
- `03-live-api-guide.md` - Voice WebSocket setup
- `04-agentic-vision.md` - Screen analysis patterns
- `06-image-generation.md` - Nano Banana Pro

See `docs/Ocula_AI_MVP_Specification.md` for:
- LangGraph Agent Architecture (full implementation)
- Phase-by-phase implementation guide with checklists
- Success criteria and guardrails

**LangChain Documentation:**
- https://docs.langchain.com/llms.txt - Documentation index
- https://docs.langchain.com/oss/javascript/langchain/agents - `createAgent()` API
- https://docs.langchain.com/oss/javascript/langchain/tools - Tool definitions
- https://docs.langchain.com/oss/javascript/langchain/middleware - Middleware patterns

## MVP Constraints
- No auth/billing - anonymous sessions only
- Knowledge base is hardcoded in `server/knowledge/demo.md`
- Single-tenant (no platform dashboard yet)
- Use `MemorySaver` for checkpointing (in-memory, not persistent)
- Skip HITL (`interrupt()`) - defer to post-MVP
- Use `createAgent()` for ReAct loop (not manual StateGraph)

---

## Session Log & Implementation Progress (Feb 5–6, 2026)

### Phase 1 Status: ✅ COMPLETE (with known issues)

All Phase 1 foundation features are implemented and functional:

| Feature | Status | Notes |
|---------|--------|-------|
| Monorepo setup (pnpm workspaces) | ✅ Done | `apps/client-sdk`, `apps/server` |
| Screen capture (`getDisplayMedia`) | ✅ Done | `capture.ts`, 1 FPS JPEG frames |
| WebSocket server (Fastify + ws) | ✅ Done | `server/src/index.ts`, `/ws` endpoint |
| Live API connection | ✅ Done | `live.ts`, bidirectional audio/text |
| Audio capture & playback | ✅ Done | `audio.ts`, PCM 16kHz in / 24kHz out |
| Text querying with vision | ✅ Done | `vision.ts`, Gemini analyzes screenshots |
| SVG overlay system | ✅ Done | `overlay.ts`, arrows/highlights/circles |
| Frame forwarding to Live API | ✅ Done | Server sends JPEG frames via `sendRealtimeInput` |
| Test page | ✅ Done | `test/index.html` with full controls |

### Bugs Fixed During Session

#### 1. Live API Not Receiving Responses
**Root cause**: The `@google/genai` SDK uses **lowercase** callback names (`onmessage`, `onerror`, `onclose`, `onopen`) but our code used camelCase (`onMessage`, `onError`, `onClose`).

**Fix applied in `live.ts`**:
```typescript
// ❌ WRONG (camelCase)
callbacks: { onMessage: ..., onError: ..., onClose: ... }

// ✅ CORRECT (lowercase)
callbacks: { onmessage: ..., onerror: ..., onclose: ..., onopen: ... }
```

#### 2. Wrong Model Name for Live API
**Root cause**: Used incorrect/outdated model identifiers.

**Fix**: The correct model for native audio Live API is:
```typescript
// ✅ CORRECT Live API model
LIVE_AUDIO: 'gemini-2.5-flash-native-audio-preview-12-2025'
```

**Updated Key Models table**:
| Model | Purpose |
|-------|---------|
| `gemini-3-flash-preview` | Screen analysis (Agentic Vision) |
| `gemini-2.5-flash-native-audio-preview-12-2025` | Real-time voice (Live API) — CORRECT model |
| `gemini-2.5-flash-image` | Visual annotation generation |

#### 3. Dual Response Modalities Not Allowed
**Root cause**: Native audio models only allow **ONE** response modality per session (TEXT or AUDIO, not both).

**Fix in `live.ts`**:
```typescript
// ❌ WRONG — causes errors with native audio models
responseModalities: [Modality.AUDIO, Modality.TEXT]

// ✅ CORRECT — use AUDIO only + enable transcription for text
responseModalities: [Modality.AUDIO],
outputAudioTranscription: {}  // Get text transcription from audio responses
```

#### 4. Model Hallucinating Screen Content
**Root cause**: Screen frames were captured by the client and stored on the server, but **never forwarded to the Gemini Live API**. The model had no visual input and hallucinated based on the system prompt.

**Fix — two changes**:

**(a) Added `sendFrame()` method to `LiveAPIProxy` in `live.ts`**:
```typescript
sendFrame(base64Frame: string): void {
  this.session.sendRealtimeInput({
    media: {
      mimeType: 'image/jpeg',
      data: base64Frame
    }
  });
}
```

**(b) Server now forwards frames to Live API in `index.ts`**:
```typescript
case 'frame':
  state.lastFrame = message.data;
  // Forward frame to Live API so the model can actually SEE the screen
  if (state.liveSession?.getIsConnected()) {
    state.liveSession.sendFrame(message.data);
  }
  break;
```

**(c) Updated system prompt** to explicitly tell the model it can ONLY see the screen when frames are received, and must not fabricate if no screen is shared.

---

### 🚨 Known Critical Issues (To Resolve Next)

#### ISSUE 1: Screen Vision Only Works With Microphone Active
**Severity**: 🔴 CRITICAL  
**Symptom**: When the user shares their screen but does NOT start their microphone, the AI hallucinates about screen content — sometimes claiming it can't see the screen, sometimes fabricating what it sees. Screen vision works correctly only when microphone audio is also active.  
**Likely cause**: The Gemini Live API may require an active audio stream (even silence) to properly process video/image frames sent via `sendRealtimeInput`. Without audio, the session may not be fully "engaged" and frames may be ignored or not processed by the model.  
**Action required**: Investigate whether sending silent audio frames keeps the session active. Alternatively, explore sending frames via `sendClientContent` with inline image data instead of `sendRealtimeInput`.

#### ISSUE 2: Scroll-Offset Misalignment of Visual Overlays
**Severity**: 🔴 CRITICAL  
**Symptom**: If the user scrolls after sending a query, the AI places arrows/annotations in the wrong position because coordinates are based on the viewport at the time of the original screen capture, not the current scroll position.  
**Root cause**: The overlay system converts Gemini's normalized 0-1000 coordinates to viewport pixels using `window.innerWidth/Height`, but does not account for `window.scrollX/Y` or the scroll delta between capture time and render time.  
**Action required**:
1. Capture `scrollX/scrollY` at the moment the frame is taken
2. When rendering overlays, adjust coordinates based on the current scroll position minus the captured scroll position
3. Alternatively, capture at the moment of rendering using the latest frame

#### ISSUE 3: ~50 Second Latency for Visual Overlays
**Severity**: 🔴 CRITICAL  
**Symptom**: After clicking "Send Query", it takes ~50 seconds for visual annotations to appear. This is because the flow currently is: capture frame → send to Vision API → wait for full analysis → parse JSON → render overlays. This is a separate API call from the Live API voice flow.  
**Root cause**: The `user_query` path uses a separate `analyzeScreenWithGemini()` call to the Vision API, which is slow and disconnected from the Live API voice stream.  
**Action required**: 
1. **Unify vision + voice**: The Live API already receives frames via `sendRealtimeInput`. Instead of a separate Vision API call, use **function calling/tools within the Live API session** so the model can emit draw commands in real-time while talking
2. **Stream visual commands**: As the model talks during the live interaction, it should emit visual overlay commands simultaneously — no separate "send query" step needed
3. **Zero delay goal**: Audio guidance and visual annotations must appear at the same time during the live conversation

#### ISSUE 4: Ugly / Unprofessional Visual Overlays
**Severity**: 🟡 HIGH  
**Symptom**: The current SVG arrows are too large, use harsh red colors (#FF4444), and the overall look is not polished or professional.  
**Action required**:
1. Redesign arrows to be smaller, sleeker, with modern aesthetics
2. Use a refined color palette (e.g., brand purples/blues with subtle glow effects instead of harsh red)
3. Add smooth entry animations (fade-in, slide-in)
4. Use rounded, pill-shaped label backgrounds instead of plain rectangles
5. Add subtle drop shadows for depth
6. Consider pulsing/breathing animations on target points to draw attention without being garish
7. Ensure highlights use softer, translucent fills with clean borders

---

### Architecture Decisions Confirmed During Session

| Decision | Value | Reason |
|----------|-------|--------|
| Live API model | `gemini-2.5-flash-native-audio-preview-12-2025` | Only working native audio model |
| SDK callback style | Lowercase (`onmessage`, `onerror`, etc.) | `@google/genai` SDK requirement |
| Response modality | `AUDIO` only + `outputAudioTranscription` | Native audio models reject dual modalities |
| Frame delivery | `sendRealtimeInput({ media: { mimeType: 'image/jpeg' } })` | Standard Live API image input |
| Frame rate | 1 FPS continuous when screen sharing | Balance between freshness and bandwidth |
| Voice name | `Kore` | Default Gemini voice |
| SDK version | `@google/genai` v1.39.0+ | Required for Live API support |

==================

## Session 2: Phase 2 Day 3 — LangChain Agent Integration ✅ COMPLETE

**Date**: Session following Phase 1 completion  
**Scope**: Full implementation of Phase 2 Day 3 success checklist items  
**Result**: All 13 checklist items completed, 0 TypeScript errors, server starts cleanly

---

### What Was Done

#### 1. Package Installation
Installed 5 new dependencies in `apps/server/`:
```
langchain ^1.2.18
@langchain/langgraph ^1.1.3
@langchain/core ^1.1.19
@langchain/google-genai ^2.1.15
langsmith ^0.4.12
```
(`zod` was already installed from Phase 1.)

#### 2. Files Created (7 new files)

| File | Purpose | Lines |
|------|---------|-------|
| `apps/server/src/agents/tools.ts` | 4 LangChain tools with Zod schemas | ~124 |
| `apps/server/src/agents/agent.ts` | `createAgent()` singleton with middleware + checkpointer | ~134 |
| `apps/server/src/agents/state.ts` | Extended agent state using LangGraph Annotations | ~67 |
| `apps/server/src/agents/stream.ts` | Async generator for streaming agent events | ~107 |
| `apps/server/src/agents/index.ts` | `runOculaAgent()` entry point + re-exports | ~138 |
| `apps/server/src/knowledge/demo.md` | Acme CRM knowledge base (hardcoded demo content) | ~180 |
| `apps/server/src/knowledge/index.ts` | Keyword-based knowledge search over demo.md | ~182 |

#### 3. Files Modified (2 existing files)

| File | Change |
|------|--------|
| `apps/server/src/config/env.ts` | `LANGSMITH_TRACING_V2` default changed from optional to `'false'` so server starts without LangSmith key |
| `apps/server/src/index.ts` | Added import for `runOculaAgent`, replaced `handleUserQuery()` body to use the LangChain agent instead of direct `analyzeScreenWithGemini()` |

---

### Implementation Details

#### Agent Architecture
- **Pattern**: ReAct agent via `createAgent()` from `langchain` — auto tool-calling loop
- **Model**: `ChatGoogleGenerativeAI({ model: 'gemini-2.0-flash', temperature: 0.3 })` — for tool calling (NOT the native audio model)
- **Checkpointer**: `MemorySaver` from `@langchain/langgraph` — in-memory multi-turn context per `thread_id`
- **Singleton**: `getOculaAgent()` creates once, reuses across requests

#### Tools Defined (`agents/tools.ts`)
1. **`inspect_screen`** — Calls `analyzeScreenWithGemini()` to analyze screen content; accepts `query` and `screenBase64`
2. **`draw_visual_guide`** — Returns `{ command: 'draw', ... }` JSON for client overlay rendering
3. **`search_knowledge`** — Calls `lookupKnowledge(query)` from knowledge module
4. **`clear_overlays`** — Returns `{ command: 'clear' }` JSON

All tools use `tool()` helper from `langchain` with Zod schemas and `.describe()` on every field.

#### Middleware (`agents/agent.ts`)
1. **`toolErrorHandler`** — Wraps all tool calls in try/catch, returns `ToolMessage` with error info on failure
2. **`screenContextMiddleware`** — Injects `screenBase64` from `request.runtime?.context?.screenBase64` into `inspect_screen` tool args automatically

#### State Schema (`agents/state.ts`)
- Uses `Annotation.Root()` and `MessagesAnnotation` from `@langchain/langgraph` (the **real** API)
- **NOT** `StateSchema`/`MessagesValue` as the spec originally suggested (those are outdated/non-existent)
- Fields: `messages` (from MessagesAnnotation), `sessionId`, `screenBase64`, `thoughtSignature`, `visualCommands`

#### Streaming (`agents/stream.ts`)
- `streamOculaAgent()` is an async generator yielding `StreamEvent` objects
- Event types: `text`, `tool_call`, `tool_result`, `done`

#### Entry Point (`agents/index.ts`)
- `runOculaAgent({ sessionId, userMessage, screenBase64 })` → invokes agent with `configurable: { thread_id: sessionId }` and `context: { screenBase64 }`
- `extractVisualCommands()` parses `ToolMessage` JSON content for `{ command: 'draw' }` and `{ command: 'clear' }` objects
- Returns `{ responseText, visualCommands }`

#### Knowledge Base (`knowledge/`)
- `demo.md` contains Acme CRM knowledge (contacts, deals, reports, settings, billing, shortcuts, troubleshooting)
- `lookupKnowledge(query)` loads/caches markdown, parses sections by `##`/`###` headings, scores by keyword overlap (title 3x, keyword 2x, content 1x), returns top 3

#### WebSocket Handler Update (`index.ts`)
- `handleUserQuery()` now calls `runOculaAgent()` instead of direct Gemini Vision
- Maps `result.visualCommands` to individual `draw`/`clear` WebSocket messages to the client

---

### Issues Encountered & Fixes

#### TypeScript Error in `stream.ts`
**Error**: `Property 'tool_calls' does not exist on type 'BaseMessage<...>'`  
**Fix**: Cast message to `any` before accessing `.tool_calls`:
```typescript
const msgAny = msg as any;
if (msgAny.tool_calls && msgAny.tool_calls.length > 0) { ... }
```

#### Spec vs Reality: State Schema API
**Spec said**: Use `StateSchema`, `MessagesValue` from `@langchain/langgraph`  
**Reality**: These don't exist. The correct API is `Annotation.Root()` with `MessagesAnnotation`  
**Action**: Implemented using the real API, not the spec's outdated references

#### Spec vs Reality: Knowledge Module Path
**Spec said**: Import `lookupKnowledge` from `'../knowledge/demo'`  
**Reality**: Created `knowledge/index.ts` as the proper module entry point  
**Action**: Import from `'../knowledge/index.js'` instead

---

### Verification Results
- ✅ `tsc --noEmit` — 0 errors
- ✅ `pnpm dev:server` — Starts cleanly, prints "Status: Ready"
- ✅ All 13 Phase 2 Day 3 checklist items satisfied

---

### 🔜 Next Up: Phase 2 Day 4 — Agentic Vision

**Status**: Partially pre-built from Phase 1 (`gemini/vision.ts` already exists with `AgenticVision` class, `analyzeScreenWithGemini()`, `findElement()`, thought signature extraction). Day 4 checklist items need formal verification and any gaps filled.

==================
