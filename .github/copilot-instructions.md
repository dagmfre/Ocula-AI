# Ocula AI - Copilot Instructions

## Project Overview
Ocula AI is a B2B embeddable widget providing real-time visual AI support. It uses **Gemini 3** to see user screens, speak guidance via voice, and highlight UI elements with **CSS class-based highlights** (pulsing glow, glassmorphism labels). Old SVG-based drawing tools (`draw_arrow`, `draw_highlight`, `draw_circle`) have been fully removed.

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
  tools: [inspectScreen, highlightElement, searchKnowledge, clearOverlays],
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
  /client-sdk          # Vanilla TS → single JS bundle (widget.js)
    capture.ts         # getDisplayMedia screen capture
    overlay.ts         # CSS class highlights + floating labels (no more SVG drawing)
    audio.ts           # PCM capture/playback
    connection.ts      # WebSocket to server
  /server              # Node.js + Fastify (port 3001)
    /agents            # ⭐ LangChain Agent System
      agent.ts         # createAgent() setup with middleware
      tools.ts         # Tool definitions: inspectScreen, highlightElement, searchKnowledge, clearOverlays
      state.ts         # Extended state schema (optional)
      stream.ts        # Streaming responses
      index.ts         # runOculaAgent() entry point
    /gemini            # Gemini API wrappers
      client.ts        # GoogleGenAI SDK wrapper
      live.ts          # Live API WebSocket proxy + function calling + UI_SELECTORS map + formatSelectorMap()
      vision.ts        # Agentic Vision calls
    /knowledge         # Demo knowledge base
      demo.md          # Hardcoded KB for MVP
    /config
      env.ts           # Zod-validated env (incl. LangSmith)
  /web                 # Next.js 15 App Router (port 3000)
    /src/app
      page.tsx         # Landing page (hero, features, how-it-works, tech-stack, CTA, footer)
      layout.tsx       # Root layout (Inter font, dark theme, globals.css)
      globals.css      # Tailwind v4 theme, CSS vars, glassmorphism, animations
      (auth)/
        layout.tsx     # Auth layout with gradient mesh background
        sign-in/       # Email + Google OAuth sign-in
        sign-up/       # Email + Google OAuth sign-up → redirect to /onboarding
      (dashboard)/
        layout.tsx     # Protected layout, platform check, dashboard navbar
        onboarding/    # 2-step KYC form (platform info → contact info)
        dashboard/     # Platform overview, embed script, knowledge base upload
      api/
        auth/[...all]/ # Better Auth catch-all API handler
        platform/      # GET/POST platform CRUD (SQLite)
        upload/        # POST: FormData → Cloudinary → DB record
        documents/     # GET: list docs, DELETE: remove from Cloudinary + DB
    /src/lib
      auth.ts          # Better Auth server config (SQLite, Google OAuth, 7d sessions)
      auth-client.ts   # Better Auth React client (signIn, signUp, signOut, useSession)
      db.ts            # SQLite helper: platform + platform_document tables + CRUD
      cloudinary.ts    # Cloudinary upload/delete helpers (10MB limit)
    /src/components/landing
      navbar.tsx       # Floating navbar with scroll progress, mobile menu
      hero-section.tsx # Animated code terminal, typewriter effect
      features-grid.tsx# Interactive vision/voice/auth demo tiles
      how-it-works.tsx # Scroll-driven animation, step cards (id="how-it-works")
      tech-stack.tsx   # Spotlight hover cards
      cta-section.tsx  # CTA with star dust background
      footer.tsx       # Footer with status indicator
    /src
      middleware.ts    # Route protection: /dashboard/*, /onboarding/*
  /mock-crm            # Static HTML/CSS/JS CRM demo (6 pages)
    index.html         # Dashboard: stats, revenue chart, activity feed, top deals
    contacts.html      # Contact list with search, import, add, filter
    deals.html         # Kanban pipeline board (6 stage columns)
    reports.html       # KPIs, revenue trend, pipeline breakdown, team activity
    billing.html       # Plan comparison (Free/Pro/Enterprise), invoices
    settings.html      # Account, notifications, team, integrations, danger zone
    styles.css         # Full dark theme CSS (~400 lines)
    mock-data.js       # Contacts, deals, activity, revenue, invoices
    components.js      # Shared sidebar + header renderer
    /knowledge         # Ocula AI knowledge documents for mock CRM
      acme-crm-knowledge.md  # Full CRM knowledge base (pages, tasks, FAQ)
      ui-element-map.md      # Precise UI element locations for visual grounding
      quick-start-guide.md   # User onboarding guide
/docs
  ocula-knowledge-base-template.md  # Template for platform owners to create knowledge docs
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
  | { type: 'assistant_response', text: string }  // AI transcription text
  | { type: 'draw', action: 'apply' | 'clear', selector: string, label?: string };  // CSS highlight
```

### CSS Highlighting System
The overlay engine injects `<style id="ocula-highlight-styles">` into the host DOM with:
- `ocula-hl-active` class: Pulsing glow, color-shifting border, fade-in animation
- `ocula-hl-label` div: Floating glassmorphism pill with `✦` icon
- Applied via `classList.add`/`remove` — won't be overridden by host CSS

### UI_SELECTORS Map (`live.ts`)
A static map of known platform elements injected into the system prompt:
```typescript
export const UI_SELECTORS: Record<string, string> = {
  'Sidebar': '#sidebar-root',
  'Search Bar': '.search-bar',
  'Stats Grid': '.stats-grid',
  'Main Content': '.main-content',
  // ... more elements
};
```
This ensures the model uses exact CSS selectors rather than guessing from visual analysis.

### Onboarding Tour
Triggered **once** on the first `frame` message per session (`hasOnboarded` flag on `SessionState`).
The server sends a text prompt instructing the model to welcome the user and sequentially highlight Sidebar → Search Bar → Stats Grid → Main Content using `clear_overlays` + `highlight_element` with descriptive labels.

### Removed Tools (Session 6)
The following SVG-based tools have been fully removed from the codebase:
- ❌ `draw_arrow` — replaced by `highlight_element`
- ❌ `draw_highlight` — replaced by `highlight_element`
- ❌ `draw_circle` — replaced by `highlight_element`
- ❌ `drawVisualGuide` — removed from `tools.ts` and `oculaTools` array

The current tool set is: `inspectScreen`, `highlightElement`, `searchKnowledge`, `clearOverlays`.

### SVG Overlay (Legacy)
SVG overlay system (`drawArrow`, `drawCircle`, `highlightElement` with coordinates) still exists in `overlay.ts` for backwards compatibility but is no longer invoked by any tool. All active highlighting uses CSS classes.

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

## MVP Constraints (Original — Phase 1-3)
- Knowledge base is hardcoded in `server/knowledge/demo.md`
- Use `MemorySaver` for checkpointing (in-memory, not persistent)
- Skip HITL (`interrupt()`) - defer to post-MVP
- Use `createAgent()` for ReAct loop (not manual StateGraph)

## Extended Scope (Phase 5-8) ✅ COMPLETE
After the core AI widget engine (Phases 1-4), the SaaS platform layer is fully implemented:

### Authentication (Better Auth + Next.js) ✅
- **Framework**: `better-auth` (TypeScript-first, framework-agnostic)
- **Server**: Next.js catch-all route at `/api/auth/[...all]` using `auth.handler()`
- **Database**: SQLite via `better-sqlite3` (shared `./sqlite.db` for auth + custom tables)
- **Auth Methods**: Email/password (min 8 chars) + Google OAuth
- **Client SDK**: `createAuthClient` from `better-auth/react` → `signIn`, `signUp`, `signOut`, `useSession`
- **CLI**: `npx @better-auth/cli migrate` to create tables
- **Sessions**: 7-day expiry, 24h refresh, 5-min cookie cache
- **Env vars**: `BETTER_AUTH_SECRET` (min 32 chars), `BETTER_AUTH_URL=http://localhost:3000`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### Web Dashboard (Next.js 15) ✅
- Landing page with 6 animated sections (hero, features, how-it-works, tech-stack, CTA, footer)
- Auth pages (sign-in, sign-up) with gradient mesh backgrounds
- 2-step KYC onboarding form (platform info → contact info)
- Dashboard with platform overview, embed script copy, knowledge base upload
- Drag-and-drop document upload UI with progress + document list
- Protected routes via `middleware.ts` session cookie check
- Tailwind CSS v4 with dark theme (`--background: #050505`)

### File Uploads (Cloudinary) ✅
- Upload endpoint: `POST /api/upload` (FormData → Cloudinary → DB)
- Document list: `GET /api/documents?platformId=...`
- Delete: `DELETE /api/documents?id=...&publicId=...` (Cloudinary + DB cleanup)
- Supported: PDF, PNG, JPG, WEBP, Markdown (max 10MB)
- Cloudinary SDK v2 (^2.9.0)
- Env vars: `CLOUDINARY_CLOUD_NAME=dr3cg1gim`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Mock CRM Demo ✅
- 6-page static CRM (dashboard, contacts, deals, reports, billing, settings)
- Dark theme matching Ocula brand, Inter font, CSS variables
- Realistic mock data (contacts, deals, activity, revenue, invoices)
- Ocula widget embedded on every page: `<script src="http://localhost:3000/widget.js" data-platform-id="mock-crm-demo" data-server="ws://localhost:3001/ws">`
- 3 knowledge documents for Ocula AI to digest (full KB, UI element map, quick-start guide)
- Customer template document: `docs/ocula-knowledge-base-template.md`

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

#### ISSUE 4: Ugly / Unprofessional Visual Overlays ✅ RESOLVED (Session 6)
**Severity**: ✅ RESOLVED
**Fix**: Replaced inline styles with CSS class-based system (`ocula-hl-active`) that injects `<style>` into host DOM with pulsing glow, glassmorphism labels, and animations. See Session 6 log.

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
2. **`highlight_element`** — Returns `{ command: 'draw', type: 'highlight_element', selector, label, action }` JSON for CSS highlighting
3. **`search_knowledge`** — Calls `lookupKnowledge(query)` from knowledge module
4. **`clear_overlays`** — Returns `{ command: 'clear' }` JSON

> **Note**: Old tools `draw_visual_guide` / `draw_arrow` / `draw_highlight` / `draw_circle` have been **completely removed** (Session 6).

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

## Session 3: Day 4 — Agentic Vision + Live API Tools ✅ COMPLETE

**Date**: Feb 7, 2026
**Scope**: Resolve all 4 critical issues from Phase 1, implement Live API function calling tools, and redesign overlay visuals.
**Result**: All 4 critical issues resolved, 0 TypeScript errors

### What Was Done

#### ISSUE 1 FIX: Silent Audio Keepalive
- `startSilentAudio()` sends 100ms silent PCM16 frames every 250ms when mic is off but screen share is active
- `stopSilentAudio()` called when real mic audio arrives
- Vision now works reliably without microphone

#### ISSUE 2 FIX: Scroll-Offset Tracking
- `CapturedFrame` interface with `scrollX`, `scrollY`, `viewportWidth`, `viewportHeight`
- Client sends scroll offsets with every frame
- Server tracks `lastScrollX`/`lastScrollY` per session, forwards with draw commands
- Overlay engine compensates for scroll delta between capture time and render time

#### ISSUE 3 FIX: Live API Function Calling (Zero Latency)
- 5 function declarations registered in Live API session: `highlight_element`, `clear_overlays`, `search_knowledge`
- **Removed**: `draw_arrow`, `draw_highlight`, `draw_circle` (replaced by CSS `highlight_element`)
- `handleLiveToolCall()` on server processes tool calls during voice conversation
- `sendToolResponse()` reports results back to Gemini
- Visual commands emitted in real-time alongside voice — no separate API call needed
- System prompt updated with overlay tool instructions

#### ISSUE 4 FIX: Overlay Redesign
- Brand purple (#7C5CFC) color scheme
- Pill-shaped labels with drop shadows
- Smooth CSS animations (fade-in, draw-line, pulse, ring-pulse)
- Smaller arrows with subtle glow
- Translucent highlight fills with breathing animation

### All Critical Issues Resolved
| Issue | Fix | Status |
|-------|-----|--------|
| Vision requires mic | Silent audio keepalive | ✅ |
| Scroll misalignment | Scroll context tracking | ✅ |
| ~50s overlay latency | Live API function calling | ✅ |
| Ugly overlays | Modern redesign | ✅ |

==================

## Session 4: Day 5 — Advanced Visual Overlay System ✅ COMPLETE

**Date**: Feb 8, 2026
**Scope**: Complete rewrite of `overlay.ts` with premium visual polish features.
**Result**: Full overlay engine v3, 0 TypeScript errors in both packages

### What Was Done

Complete rewrite of `apps/client-sdk/src/overlay.ts` (~460 lines) with all Day 5 features:

#### 1. AnnotationRecord Tracking
- Every annotation tracked in `Map<string, AnnotationRecord>` with id, type, coords, SVG group, anchored element, scroll context
- All draw methods now return a `string` annotation ID for targeted removal via `removeAnnotation(id)`

#### 2. DOM Anchoring
- `findAnchorElement(px, py)` hides overlay container, calls `document.elementFromPoint()` to find the real DOM element underneath
- Stores offset from element's top-left corner
- Annotations stick to their anchored element across scrolls/resizes

#### 3. requestAnimationFrame Repositioning Loop
- `startTrackingLoop()` runs every 2nd animation frame (~30 fps at 60 Hz)
- For each annotation: if anchored element is `.isConnected`, uses `getBoundingClientRect()` to reposition; otherwise falls back to scroll-delta correction
- Applies shift via single `transform="translate()"` on the SVG group

#### 4. Glassmorphism-Inspired SVG Labels
- New SVG filter `ocula-glass-blur` (feGaussianBlur + feComposite) approximating frosted glass
- Blurred glow rect behind each pill + inner top-highlight rect for depth
- Text measured accurately via hidden `SVGTextElement.getComputedTextLength()` (fallback: charWidth estimate)

#### 5. Double-Ring Ripple Pulsing
- Two concentric expanding/fading rings staggered by 0.9s on arrow targets and circles
- Creates organic "AI is thinking here" pulsing effect

#### 6. Fade-Out Exit Animations
- CSS keyframe `ocula-fade-out`: opacity 1→0, translateY 0→-8px, 250ms
- `clear()` applies class, waits for animation, then removes + clears annotation map
- Individual `removeAnnotation(id)` also supports fade-out

#### 7. Off-Screen Label Clamping
- Label pill positions clamped to viewport bounds with 8px padding on all edges

#### 8. Build Verification
- `tsc --noEmit` passes with 0 errors on both `client-sdk` and `server` packages
- No changes needed to `index.ts` — new overlay API is backward-compatible (methods return `string` instead of `void`, which is safe)

### Architecture Post-Day 5

| Component | Lines | Status |
|-----------|-------|--------|
| `overlay.ts` (v3) | ~460 | ✅ Rewritten |
| `index.ts` (client SDK) | 347 | ✅ No changes needed |
| `connection.ts` | 294 | ✅ Unchanged |
| `capture.ts` | ~200 | ✅ Unchanged |
| `audio.ts` | ~200 | ✅ Unchanged |

==================

## Session 5: Days 6-10 — SaaS Platform Layer ✅ COMPLETE

**Date**: February 8, 2026
**Scope**: Complete implementation of Phases 5-8 (Landing Page, Auth, Onboarding, Dashboard, File Uploads, Mock CRM)
**Result**: All SaaS platform features implemented, 0 TypeScript errors, 11 pages compiled

---

### Phase 5: Landing Page & Authentication ✅

**Created 17 files** in `apps/web/`:
- Landing page with 6 animated sections (navbar, hero, features, how-it-works, tech-stack, CTA, footer)
- Auth pages (sign-in, sign-up) with better-auth email + Google OAuth
- Root layout with Inter font, Tailwind CSS v4 dark theme
- Middleware for route protection (`/dashboard/*`, `/onboarding/*`)
- Better Auth server + client config (SQLite, 7-day sessions, cookie cache)

### Phase 6: Platform Onboarding & Dashboard ✅

**Created 5 files**:
- `db.ts` — SQLite helper with `platform` table + CRUD
- `platform/route.ts` — GET/POST API for platform data
- `onboarding/page.tsx` — 2-step KYC form (platform info → contact info)
- `dashboard/page.tsx` — Platform overview, embed script, knowledge base upload
- `(dashboard)/layout.tsx` — Protected layout with platform check

### Phase 7: Knowledge Pipeline & File Uploads ✅

**Created/modified 5 files**:
- `cloudinary.ts` — Upload/delete helpers, 10MB limit, file type detection
- `db.ts` (updated) — Added `platform_document` table + document CRUD
- `upload/route.ts` — POST: FormData → Cloudinary → DB
- `documents/route.ts` — GET: list docs, DELETE: Cloudinary + DB cleanup
- `dashboard/page.tsx` (updated) — Drag-and-drop upload UI, document list

### Phase 8: Mock CRM & Demo ✅

**Created 12 files** in `apps/mock-crm/`:
- 6 HTML pages (dashboard, contacts, deals, reports, billing, settings)
- Shared assets (styles.css, mock-data.js, components.js)
- 3 knowledge documents for Ocula AI (acme-crm-knowledge.md, ui-element-map.md, quick-start-guide.md)
- Customer template document: `docs/ocula-knowledge-base-template.md`

### Link Audit & Fixes

Comprehensive audit found and fixed 16+ broken links:
- Fixed `/login` → `/sign-in`, `/register` → `/sign-up` in navbar.tsx
- Removed dead routes (`/docs`, `/blog`, `#pricing`) from navbar
- Wired dead buttons in hero-section.tsx and cta-section.tsx to real routes
- Populated 8 placeholder `#` links in footer.tsx with real destinations
- Added `id="how-it-works"` anchor target to how-it-works.tsx
- Removed orphan `/settings/:path*` from middleware.ts matcher

### Environment Variables (Complete)
```bash
# Server (apps/server/.env)
GEMINI_API_KEY=...
LANGSMITH_TRACING_V2=false
LANGSMITH_API_KEY=...
LANGSMITH_PROJECT=ocula-ai-mvp

# Web (apps/web/.env)
BETTER_AUTH_SECRET=...       # min 32 chars
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
CLOUDINARY_CLOUD_NAME=dr3cg1gim
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

==================

## Session 6: Day 11 — Highlighting, Double Response & Onboarding ✅ COMPLETE

**Date**: Feb 10, 2026

### Changes
| File | Change |
|------|--------|
| `overlay.ts` | CSS class highlight system (`ocula-hl-active` + glassmorphism labels), replaced inline styles |
| `live.ts` | `UI_SELECTORS` map + `formatSelectorMap()`, removed duplicate `part.text` forwarding |
| `index.ts` | Fixed action bug (`'highlight_element'` → `action || 'apply'`), `hasOnboarded` flag, onboarding on first frame, selector-aware system prompt |
| `tools.ts` | Refined `highlight_element` description for wrapper targeting |

### Key Patterns
- **Highlight**: `classList.add('ocula-hl-active')` + injected `<style>` into host DOM
- **Floating Labels**: Pure HTML `<div class="ocula-hl-label">` with glassmorphism, positioned via `getBoundingClientRect()` + rAF tracking loop
- **Selectors**: `UI_SELECTORS` map injected into system prompt via `formatSelectorMap()`
- **No double text**: Only `outputTranscription.text` forwarded (not `part.text`) in AUDIO modality
- **Onboarding**: `hasOnboarded` flag on `SessionState`, triggered on first `frame` message
- **Tool removal**: `draw_arrow`, `draw_highlight`, `draw_circle`, `drawVisualGuide` all removed from server + client
- **Action fix**: `handleLiveToolCall` sends `action || 'apply'` instead of hardcoded `'highlight_element'`
- **Highlight description**: Updated to instruct model to target outermost container elements
- **Label support**: `highlight_element` now accepts optional `label` parameter, rendered as floating glassmorphism pill
- **VisualCommand interface**: Simplified to `type: 'highlight_element' | 'clear'` with `selector`, `label`, `action`


==================
