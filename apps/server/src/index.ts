/**
 * Ocula AI Server - Main Entry Point
 * 
 * Fastify server with WebSocket support for real-time communication
 * with the client SDK and Gemini Live API.
 * 
 * Day 4: Agentic Vision integration
 * - Live API function calling for real-time visual overlays
 * - Silent audio keepalive for vision-only mode
 * - Scroll offset tracking for accurate overlay positioning
 */

import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { env, corsOrigins } from './config/env.js';
import { createLiveSession, LiveAPIProxy, LIVE_OVERLAY_TOOLS, formatSelectorMap } from './gemini/live.js';
import { analyzeScreenWithGemini } from './gemini/vision.js';
import { runOculaAgent } from './agents/index.js';
import { lookupKnowledge } from './knowledge/index.js';

/** Message types from client */
interface ClientMessage {
  type: 'frame' | 'audio' | 'text' | 'user_query' | 'ping' | 'selector_map';
  data?: string;
  text?: string;
  frame?: string;
  sessionId?: string;
  /** Scroll context from the client at capture time */
  scrollX?: number;
  scrollY?: number;
  /** Dynamic selector map from client DOM scanner */
  selectors?: Array<{ selector: string; label: string; category: string }>;
}

/** Message types to client */
interface ServerMessage {
  type: 'assistant_response' | 'audio' | 'draw' | 'clear' | 'highlight_sequence' | 'error' | 'connected' | 'pong';
  text?: string;
  data?: string;
  action?: string;
  selector?: string;
  point?: [number, number];
  label?: string;
  width?: number;
  height?: number;
  error?: string;
  sessionId?: string;
  visualCommands?: VisualCommand[];
  /** Highlight sequence steps */
  steps?: Array<{ selector: string; label: string; delay_ms?: number }>;
  /** Scroll context from the frame that generated these overlays */
  scrollX?: number;
  scrollY?: number;
}

/** Visual command structure */
interface VisualCommand {
  type: 'highlight_element' | 'highlight_sequence' | 'clear';
  selector?: string;
  label?: string;
  action?: 'apply' | 'clear';
  steps?: Array<{ selector: string; label: string; delay_ms?: number }>;
}

/** Session state */
interface SessionState {
  sessionId: string;
  liveSession: LiveAPIProxy | null;
  lastFrame: string | null;
  thoughtSignature: string | null;
  /** Whether the user has an active microphone stream */
  hasMicAudio: boolean;
  /** Whether the user has an active screen share */
  hasScreenShare: boolean;
  /** Last known scroll position from client */
  lastScrollX: number;
  lastScrollY: number;
  /** Whether the onboarding tour has already been sent */
  hasOnboarded: boolean;
  /** Dynamic selector map from client-side DOM scanner */
  currentSelectors: Array<{ selector: string; label: string; category: string }>;
}

// Active sessions
const sessions = new Map<WebSocket, SessionState>();

/**
 * Format dynamic selectors from the client-side DOM scanner
 * into a prompt-friendly string grouped by category.
 */
function formatDynamicSelectors(selectors: Array<{ selector: string; label: string; category: string }>): string {
  if (selectors.length === 0) return '(No selectors available yet — ask the user to share their screen)';

  // Group by category
  const grouped = new Map<string, Array<{ selector: string; label: string }>>();
  for (const entry of selectors) {
    const group = grouped.get(entry.category) || [];
    group.push({ selector: entry.selector, label: entry.label });
    grouped.set(entry.category, group);
  }

  const lines: string[] = [];
  for (const [category, entries] of grouped) {
    lines.push(`[${category}]`);
    for (const { selector, label } of entries) {
      lines.push(`  - ${label}: "${selector}"`);
    }
  }
  return lines.join('\n');
}

/**
 * Safety-net text filter — strips meta-commentary and knowledge-base references
 * that the model may leak despite system prompt instructions.
 *
 * Returns the cleaned text, or empty string if entirely problematic.
 */
const BLACKLISTED_PHRASES: RegExp[] = [
  /according to (the |our )?(documentation|knowledge base|records|system|docs)/gi,
  /the knowledge base (says|shows|indicates|mentions)/gi,
  /based on (the |our )?(system|documentation|records)/gi,
  /our (records|documentation|system) (show|indicate|say|mention)/gi,
  /I'?m (now )?(highlighting|pointing|showing|drawing)/gi,
  /let me (highlight|point|show|draw)/gi,
  /I'?ve (highlighted|pointed|shown|drawn)/gi,
  /as you can see,? I'?m pointing/gi,
  /I'?ll highlight/gi,
  /I'?m going to highlight/gi,
];

function filterResponseText(text: string): string {
  let filtered = text;
  for (const pattern of BLACKLISTED_PHRASES) {
    filtered = filtered.replace(pattern, '');
  }
  // Collapse multiple spaces / leading commas left by removals
  filtered = filtered.replace(/\s{2,}/g, ' ').replace(/^\s*[,;]\s*/g, '').trim();
  return filtered;
}

/**
 * Create and configure Fastify server
 */
async function createServer() {
  const server = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // Register CORS
  await server.register(fastifyCors, {
    origin: corsOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  // Register WebSocket
  await server.register(fastifyWebsocket, {
    options: {
      maxPayload: 10 * 1024 * 1024, // 10MB max payload for frames
    },
  });

  // Serve client-sdk widget bundle
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const clientSdkDist = join(__dirname, '..', '..', 'client-sdk', 'dist');

  await server.register(fastifyStatic, {
    root: clientSdkDist,
    prefix: '/',
  });

  // Serve /widget.js as an alias for /ocula.js
  server.get('/widget.js', async (request, reply) => {
    return reply.sendFile('ocula.js');
  });

  // Health check endpoint
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API info endpoint
  server.get('/', async () => {
    return {
      name: 'Ocula AI Server',
      version: '0.1.0',
      endpoints: {
        ws: '/ws',
        health: '/health',
      },
    };
  });

  // WebSocket endpoint
  server.get('/ws', { websocket: true }, (socket, req) => {
    const sessionId = randomUUID();
    
    // Initialize session state
    const sessionState: SessionState = {
      sessionId,
      liveSession: null,
      lastFrame: null,
      thoughtSignature: null,
      hasMicAudio: false,
      hasScreenShare: false,
      lastScrollX: 0,
      lastScrollY: 0,
      hasOnboarded: false,
      currentSelectors: [],
    };
    sessions.set(socket, sessionState);

    server.log.info(`[WS] Client connected: ${sessionId}`);

    // Send connection confirmation
    sendMessage(socket, {
      type: 'connected',
      sessionId,
    });

    // Initialize Live API session for this client
    initializeLiveSession(socket, sessionState);

    // Handle incoming messages
    socket.on('message', async (data: Buffer) => {
      try {
        const message: ClientMessage = JSON.parse(data.toString());
        await handleClientMessage(socket, sessionState, message);
      } catch (error) {
        server.log.error({ err: error }, '[WS] Failed to process message');
        sendMessage(socket, {
          type: 'error',
          error: 'Failed to process message',
        });
      }
    });

    // Handle disconnect
    socket.on('close', () => {
      server.log.info(`[WS] Client disconnected: ${sessionId}`);
      cleanupSession(sessionState);
      sessions.delete(socket);
    });

    // Handle errors
    socket.on('error', (error) => {
      server.log.error({ err: error }, `[WS] Socket error for ${sessionId}`);
    });
  });

  return server;
}

/**
 * Initialize Gemini Live API session for a client
 * 
 * Day 4: Enhanced with function calling tools for real-time visual overlays.
 * The Live API can now call draw_arrow, draw_highlight, draw_circle,
 * clear_overlays, and search_knowledge during voice conversation.
 * clear_overlays is handled as a legacy fallback but is no longer advertised.
 */
async function initializeLiveSession(socket: WebSocket, state: SessionState): Promise<void> {
  const selectorList = state.currentSelectors.length > 0
    ? formatDynamicSelectors(state.currentSelectors)
    : formatSelectorMap(); // fallback to static selectors on initial connect

  const systemPrompt = `You are Ocula AI, a visual support assistant that helps users navigate software interfaces in real-time.

CAPABILITIES:
1. SEE the user's screen through captured frames (when shared)
2. SPEAK guidance through voice
3. DRAW visual overlays using function calling tools

AVAILABLE TOOLS:
- highlight_element(selector, label, action): Highlight a single element with a glowing border
- highlight_sequence(steps): Walk through multiple elements one-by-one with smooth transitions — use this for walkthroughs and process explanations
- search_knowledge(query): Search help documentation

AVAILABLE UI SELECTORS (use ONLY these exact selectors):
${selectorList}

VISUAL GUIDANCE RULES:
- Call highlight_element or highlight_sequence and speak your guidance simultaneously.
- NEVER say "I'm highlighting", "let me show you", "I've highlighted", "as you can see I'm pointing to", or any variation. The user already sees the visual. Just describe the element and what to do with it.
- NEVER mention tools, selectors, overlays, clearing, or any internal mechanism.
- Speak as if the user is naturally looking at a glowing element — describe what IT is and what to do, not that you are showing it.
- NEVER describe what you see verbatim from any provided documentation. Speak naturally about what's on the screen.
- When asked about a process or workflow (e.g. "What's the billing process?", "How do I create a deal?"), use highlight_sequence to walk through each relevant element while explaining each one.
- Use the EXACT CSS selectors from the list above. Do NOT invent or guess selectors.
- Target the outermost container element, NOT inner children.

SCREEN RULES:
- You can ONLY see the screen when the user shares it (you receive image frames).
- If no frames received, say "I don't see your screen yet. Please share your screen."
- Do NOT fabricate what you see.

VOICE STYLE:
- Speak naturally, like a knowledgeable colleague sitting next to the user.
- One concept per highlight. Move to the next element when the user is ready.
- Do NOT enumerate steps out loud ("Step 1, Step 2...") — just guide fluidly.
- Be concise — keep responses under 2 sentences per element.
- NEVER reference "documentation", "knowledge base", "our records", or "according to the system". Everything you say should sound like personal expertise.
- NEVER repeat yourself. Say things once.`;

  try {
    state.liveSession = createLiveSession({
      systemPrompt,
      voiceName: 'Kore',
      tools: LIVE_OVERLAY_TOOLS,
      onAudio: (base64Audio) => {
        if (process.env.DEBUG === 'true') console.log('[Server] Sending audio to client, length:', base64Audio.length);
        sendMessage(socket, {
          type: 'audio',
          data: base64Audio,
        });
      },
      onText: (text) => {
        // Safety-net filter: strip meta-commentary and knowledge-base references
        const filtered = filterResponseText(text);
        if (!filtered) return; // entirely filtered out
        if (process.env.DEBUG === 'true') console.log('[Server] Sending text to client:', filtered.slice(0, 80));
        sendMessage(socket, {
          type: 'assistant_response',
          text: filtered,
        });
      },
      onToolCall: async (toolCall) => {
        // Handle Live API tool calls for real-time visual overlays
        await handleLiveToolCall(socket, state, toolCall);
      },
      onError: (error) => {
        console.error('[LiveAPI] Error:', error);
        sendMessage(socket, {
          type: 'error',
          error: 'Voice session error',
        });
      },
      onClose: () => {
        console.log('[LiveAPI] Session closed for', state.sessionId);
        // Attempt to reconnect the Live API session after unexpected close
        state.liveSession = null;
        setTimeout(async () => {
          console.log('[LiveAPI] Attempting reconnection for', state.sessionId);
          try {
            // Only reconnect if the client WS is still open
            if (socket.readyState === WebSocket.OPEN) {
              await initializeLiveSession(socket, state);
              console.log('[LiveAPI] Reconnected for', state.sessionId);
            }
          } catch (err) {
            console.error('[LiveAPI] Reconnection failed:', err);
          }
        }, 2000);
      },
    });

    await state.liveSession.connect();
    console.log('[LiveAPI] Session initialized for', state.sessionId);

  } catch (error) {
    console.error('[LiveAPI] Failed to initialize:', error);
    // Continue without live session - text mode still works
  }
}

/**
 * Handle incoming client message
 * 
 * Day 4: Enhanced with scroll offset tracking, silent audio management,
 * and screen share state tracking.
 */
async function handleClientMessage(
  socket: WebSocket,
  state: SessionState,
  message: ClientMessage
): Promise<void> {
  switch (message.type) {
    case 'frame':
      // Store latest frame and send to Live API for real-time vision
      if (message.data) {
        state.lastFrame = message.data;
        state.hasScreenShare = true;

        // Track scroll offset if provided
        if (message.scrollX !== undefined) state.lastScrollX = message.scrollX;
        if (message.scrollY !== undefined) state.lastScrollY = message.scrollY;

        if (process.env.DEBUG === 'true') console.log(`[WS] Received frame for session ${state.sessionId}, scroll: (${state.lastScrollX}, ${state.lastScrollY})`);
        
        // Forward frame to Live API so the model can actually SEE the screen
        if (state.liveSession?.getIsConnected()) {
          state.liveSession.sendFrame(message.data);

          // Onboarding: trigger ONCE on the very first frame received
          // so the model can actually see the UI before highlighting
          if (!state.hasOnboarded) {
            state.hasOnboarded = true;
            state.liveSession.sendText(
              'The user has just started sharing their screen. ' +
              'Welcome them warmly in one short sentence, then use highlight_sequence to give a quick visual tour ' +
              'of the key areas you can see on the page. Pick 3-5 important elements from the available selectors. ' +
              'As each element highlights, describe what it is and how they can use it — keep it natural and concise.'
            );
            console.log('[Server] Onboarding tour triggered for', state.sessionId);
          }

          // Start silent audio keepalive if no mic is active
          // This solves ISSUE 1: vision requires active microphone
          if (!state.hasMicAudio && !state.liveSession.isSilentAudioActive()) {
            state.liveSession.startSilentAudio();
            console.log('[Server] Started silent audio keepalive (no mic detected)');
          }
        }
      }
      break;

    case 'audio':
      // Forward audio to Live API
      if (message.data && state.liveSession?.getIsConnected()) {
        // Mark that we have real mic audio
        if (!state.hasMicAudio) {
          state.hasMicAudio = true;
          // Stop silent audio since we have real audio now
          if (state.liveSession.isSilentAudioActive()) {
            state.liveSession.stopSilentAudio();
            console.log('[Server] Stopped silent audio (real mic audio detected)');
          }
        }
        state.liveSession.sendAudio(message.data);
      }
      break;

    case 'text':
      // Forward text to Live API
      if (message.text && state.liveSession?.getIsConnected()) {
        state.liveSession.sendText(message.text);
      }
      break;

    case 'user_query':
      // Handle user query (with optional frame analysis)
      await handleUserQuery(socket, state, message);
      break;

    case 'ping':
      sendMessage(socket, { type: 'pong' });
      break;

    case 'selector_map':
      // Receive dynamic selector map from client-side DOM scanner
      if (message.selectors && Array.isArray(message.selectors)) {
        state.currentSelectors = message.selectors;
        console.log(`[WS] Received selector map with ${message.selectors.length} selectors for ${state.sessionId}`);

        // Send updated selector context to the Live API so the model knows about new elements
        if (state.liveSession?.getIsConnected()) {
          const selectorContext = formatDynamicSelectors(state.currentSelectors);
          state.liveSession.sendText(
            `[SYSTEM] The page has changed. Here are the UPDATED available UI elements you can highlight:\n${selectorContext}\nUse ONLY these exact selectors when calling highlight_element or highlight_sequence.`
          );
        }
      }
      break;

    default:
      console.warn('[WS] Unknown message type:', message.type);
  }
}

/**
 * Handle user query with LangChain agent
 * 
 * Routes user queries through the ReAct agent (createAgent)
 * which orchestrates tool calls (inspect_screen, draw_visual_guide,
 * search_knowledge) and returns a structured response.
 */
async function handleUserQuery(
  socket: WebSocket,
  state: SessionState,
  message: ClientMessage
): Promise<void> {
  const query = message.text || '';
  const frame = message.frame || state.lastFrame;

  console.log(`[Query] "${query}" with frame: ${!!frame}`);

  if (!query) {
    sendMessage(socket, {
      type: 'assistant_response',
      text: 'I didn\'t receive a question. Could you please try again?',
    });
    return;
  }

  try {
    // Run the LangChain ReAct agent with session context
    const result = await runOculaAgent({
      sessionId: state.sessionId,
      userMessage: query,
      screenBase64: frame || undefined,
    });

    // Send the agent's text response with visual commands
    sendMessage(socket, {
      type: 'assistant_response',
      text: result.response,
      visualCommands: result.visualCommands as VisualCommand[],
      scrollX: state.lastScrollX,
      scrollY: state.lastScrollY,
    });

    // Visual commands are already included in assistant_response.visualCommands
    // The client iterates them via onResponse handler — no need to send separately

  } catch (error) {
    console.error('[Query] Agent execution failed:', error);
    sendMessage(socket, {
      type: 'error',
      error: 'Failed to process your request. Please try again.',
    });
  }
}

/**
 * Handle tool calls from the Live API during real-time voice conversation
 * 
 * Day 4: This is the critical handler that turns Live API function calls
 * into visual overlay commands on the client. This solves ISSUE 2 (50s overlay latency)
 * by executing draw commands during the voice stream — no separate Vision API round-trip.
 * 
 * The Live API sends a toolCall message with functionCalls array.
 * We execute each tool, send the visual command to the client,
 * and report the result back to the Live API so the model knows it succeeded.
 */
async function handleLiveToolCall(
  socket: WebSocket,
  state: SessionState,
  toolCall: any
): Promise<void> {
  try {
  const functionCalls = toolCall?.functionCalls || [];
  const responses: Array<{ id: string; name: string; response: Record<string, unknown> }> = [];

  for (const call of functionCalls) {
    const { name, args, id } = call;
    console.log(`[LiveToolCall] ${name}(${JSON.stringify(args)})`);

    try {
      switch (name) {
        case 'highlight_element': {
          const { selector, label, action } = args;
          // Auto-clear previous highlights before applying new one
          if (action !== 'clear') {
            sendMessage(socket, { type: 'clear' });
          }
          sendMessage(socket, {
            type: 'draw',
            action: action || 'apply',
            selector,
            label,
          });
          responses.push({
            id,
            name,
            response: { success: true, message: `Highlighted element ${selector}` },
          });
          break;
        }

        case 'highlight_sequence': {
          const { steps } = args;
          if (steps && Array.isArray(steps) && steps.length > 0) {
            // Send clear first, then the full sequence to the client
            sendMessage(socket, { type: 'clear' });
            sendMessage(socket, {
              type: 'highlight_sequence',
              steps: steps,
            });
            responses.push({
              id,
              name,
              response: { success: true, message: `Highlighting sequence of ${steps.length} elements` },
            });
          } else {
            responses.push({
              id,
              name,
              response: { success: false, error: 'No steps provided for highlight_sequence' },
            });
          }
          break;
        }

        case 'clear_overlays': {
          sendMessage(socket, { type: 'clear' });
          responses.push({
            id,
            name,
            response: { success: true, message: 'All overlays cleared' },
          });
          break;
        }

        case 'search_knowledge': {
          const { query } = args;
          let knowledgeResult = 'No relevant documentation found.';
          try {
            const result = await lookupKnowledge(query);
            knowledgeResult = result.summary || result.sections.map(s => s.content).join('\n\n') || knowledgeResult;
          } catch (err) {
            console.error('[LiveToolCall] Knowledge search error:', err);
          }
          // Prepend suppression header so the model never reveals the source
          const suppressedResult = `[INTERNAL CONTEXT — Do NOT quote, cite, or reference this source. ` +
            `Use this information to guide the user naturally without revealing where it comes from. ` +
            `Never say "according to documentation", "the knowledge base says", or similar phrases.]\n\n` +
            knowledgeResult;
          responses.push({
            id,
            name,
            response: { success: true, result: suppressedResult },
          });
          break;
        }

        default:
          console.warn('[LiveToolCall] Unknown tool:', name);
          responses.push({
            id,
            name: name || 'unknown',
            response: { success: false, error: `Unknown tool: ${name}` },
          });
      }
    } catch (error) {
      console.error(`[LiveToolCall] Error executing ${name}:`, error);
      responses.push({
        id,
        name: name || 'unknown',
        response: { success: false, error: String(error) },
      });
    }
  }

  // Send all tool responses back to the Live API
  // so the model knows the tools executed successfully
  if (state.liveSession?.getIsConnected() && responses.length > 0) {
    for (const resp of responses) {
      state.liveSession.sendToolResponse(resp.id, resp.name, resp.response);
    }
    console.log(`[LiveToolCall] Sent ${responses.length} tool response(s) back to Live API`);
  }
  } catch (outerError) {
    console.error('[LiveToolCall] Fatal error in tool call handler:', outerError);
  }
}

/**
 * Send message to client
 */
function sendMessage(socket: WebSocket, message: ServerMessage): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

/**
 * Cleanup session resources
 */
function cleanupSession(state: SessionState): void {
  if (state.liveSession) {
    state.liveSession.close();
    state.liveSession = null;
  }
}

/**
 * Start the server
 */
async function main() {
  try {
    const server = await createServer();
    
    await server.listen({
      host: env.HOST,
      port: env.PORT,
    });

    console.log(`
╔═══════════════════════════════════════════════╗
║           🔮 Ocula AI Server                 ║
║                                               ║
║   HTTP:  http://${env.HOST}:${env.PORT}              ║
║   WS:    ws://${env.HOST}:${env.PORT}/ws              ║
║                                               ║
║   Status: Ready                               ║
╚═══════════════════════════════════════════════╝
`);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  // Cleanup all sessions
  for (const [socket, state] of sessions) {
    cleanupSession(state);
    socket.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

// Start server
main();
