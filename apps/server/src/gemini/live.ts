/**
 * Live API Proxy - Real-time voice I/O with Gemini
 * 
 * Manages bidirectional WebSocket connection to Gemini Live API
 * for real-time audio conversation with function calling support.
 * 
 * Audio Formats:
 * - Input (to Gemini): PCM 16-bit mono @ 16kHz
 * - Output (from Gemini): PCM 16-bit mono @ 24kHz
 * 
 * Day 4 Additions:
 * - Function calling (tools) for real-time visual overlay commands
 * - Silent audio keepalive for vision-only mode
 * - Automatic tool response handling
 */

import { GoogleGenAI, Modality, LiveServerMessage, Part } from '@google/genai';
import { getGeminiClient, GeminiModels } from './client.js';

/** Enable with DEBUG=true env var for verbose per-message logging */
const DEBUG = process.env.DEBUG === 'true';

/**
 * Known UI element selectors for the host platform (Acme CRM).
 * Injected into the system prompt so the model uses exact selectors
 * instead of guessing from visual analysis.
 */
export const UI_SELECTORS: Record<string, string> = {
  'Sidebar':            '#sidebar-root',
  'Main Content':       '.main-content',
  'Top Header':         '.top-header',
  'Search Bar':         '.search-bar',
  'New Deal Button':    '.btn-primary',
  'Stats Grid':         '.stats-grid',
  'Revenue Chart Card': '#revenue-chart',
  'Activity Feed':      '#activity-feed',
  'Deals Table':        '#deals-table',
  'Page Content':       '.page-content',
};

/** Format UI_SELECTORS as a prompt-friendly string */
export function formatSelectorMap(): string {
  return Object.entries(UI_SELECTORS)
    .map(([name, sel]) => `- ${name}: "${sel}"`)
    .join('\n');
}

/** Live API tool declaration for function calling */
export interface LiveToolDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, LiveToolProperty>;
    required?: string[];
  };
}

/** JSON-schema-like property for tool declarations (supports nested objects/arrays) */
export interface LiveToolProperty {
  type: string;
  description: string;
  enum?: string[];
  items?: {
    type: string;
    properties?: Record<string, LiveToolProperty>;
    required?: string[];
  };
}

/** Live API session configuration */
export interface LiveSessionConfig {
  systemPrompt: string;
  voiceName?: string;
  tools?: LiveToolDeclaration[];
  onAudio?: (base64Audio: string) => void;
  onText?: (text: string) => void;
  onToolCall?: (toolCall: any) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

/** Live API message handler callback types */
export interface LiveMessageHandlers {
  onAudio?: (base64Audio: string) => void;
  onText?: (text: string) => void;
  onToolCall?: (toolCall: any) => void;
  onInterrupted?: () => void;
  onTurnComplete?: () => void;
}

/**
 * Live API tool declarations for visual overlay commands
 * 
 * These tools allow the model to emit draw/clear commands
 * during real-time voice conversation — no separate Vision API call needed.
 */
export const LIVE_OVERLAY_TOOLS: LiveToolDeclaration[] = [
  {
    name: 'highlight_element',
    description: 'Highlight a UI element with a glowing border. ALWAYS use the EXACT CSS selectors from the UI_SELECTORS list provided in the system prompt. Target the outermost container (e.g. ".search-bar" not "input"). It behaves like a laser pointer.',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector for the element. Use the EXACT selector from the UI_SELECTORS list (e.g. ".search-bar", "#sidebar-root", ".stats-grid"). Do NOT guess selectors.' },
        label: { type: 'string', description: 'Short label to show next to the highlight (e.g. "Click Here", "Revenue Info")' },
        action: { type: 'string', enum: ['apply', 'clear'], description: 'Action to perform' },
      },
      required: ['selector', 'action', 'label'],
    },
  },
  {
    name: 'highlight_sequence',
    description: 'Walk through multiple UI elements one-by-one with smooth transitions. Use this for walkthroughs, process explanations, or when the user asks about a workflow. Each step highlights one element with a label while the previous fades out smoothly. ALWAYS use the EXACT CSS selectors from the available selectors list.',
    parameters: {
      type: 'object',
      properties: {
        steps: {
          type: 'array',
          description: 'Ordered list of elements to highlight one-by-one. Each step has a selector and label.',
          items: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector from the available selectors list' },
              label: { type: 'string', description: 'Short descriptive label for this element' },
              delay_ms: { type: 'number', description: 'Optional delay in ms before moving to next step (default: 3000)' },
            },
            required: ['selector', 'label'],
          },
        },
      },
      required: ['steps'],
    },
  },
  {
    name: 'search_knowledge',
    description: 'Search documentation.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to search for (e.g. "how to export report", "billing settings")' },
      },
      required: ['query'],
    },
  },
];

/**
 * LiveAPIProxy - Manages Gemini Live API WebSocket session
 */
export class LiveAPIProxy {
  private client: GoogleGenAI;
  private session: any = null;
  private config: LiveSessionConfig;
  private isConnected: boolean = false;
  private handlers: LiveMessageHandlers = {};
  private silentAudioInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: LiveSessionConfig) {
    this.client = getGeminiClient();
    this.config = config;
    this.handlers = {
      onAudio: config.onAudio,
      onText: config.onText,
      onToolCall: config.onToolCall,
    };
  }

  /**
   * Connect to Gemini Live API
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.warn('[LiveAPI] Already connected');
      return;
    }

    try {
      // Build tool declarations for the Live API session
      const tools = this.config.tools || LIVE_OVERLAY_TOOLS;
      const functionDeclarations = tools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      }));

      // Connect with callbacks inline - SDK uses callback-based API
      // IMPORTANT: SDK uses lowercase callback names: onmessage, onerror, onclose
      // IMPORTANT: Can only use ONE response modality per session (either TEXT or AUDIO, not both)
      this.session = await this.client.live.connect({
        model: GeminiModels.LIVE_AUDIO,
        config: {
          responseModalities: [Modality.AUDIO],  // Only AUDIO for native audio models
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: this.config.voiceName || 'Kore'
              }
            }
          },
          systemInstruction: {
            parts: [{ text: this.config.systemPrompt }]
          },
          // Reduce thinking for low-latency real-time voice responses
          thinkingConfig: {
            thinkingLevel: 'LOW'
          },
          // Enable audio transcription so we can get text from audio responses
          outputAudioTranscription: {},
          // Compress context to prevent session death on long conversations
          contextWindowCompression: {
            triggerTokens: 25000,
            slidingWindow: {
              targetTokens: 12000
            }
          },
          // Register tools for function calling during live conversation
          tools: [{ functionDeclarations }],
        },
        callbacks: {
          onopen: () => {
            console.log('[LiveAPI] WebSocket opened');
          },
          onmessage: (message: LiveServerMessage) => {
            if (DEBUG) console.log('[LiveAPI] onmessage received:', JSON.stringify(message).slice(0, 200));
            this.handleMessage(message);
          },
          onerror: (error: any) => {
            console.error('[LiveAPI] Error:', error);
            this.config.onError?.(new Error(error?.message || 'Live API error'));
          },
          onclose: (event: any) => {
            console.log('[LiveAPI] Session closed, code:', event?.code, 'reason:', event?.reason);
            this.isConnected = false;
            this.stopSilentAudio();
            this.config.onClose?.();
          }
        }
      } as any); // Type assertion for SDK compatibility

      this.isConnected = true;
      console.log('[LiveAPI] Connected to', GeminiModels.LIVE_AUDIO, 'with', functionDeclarations.length, 'tools');

    } catch (error) {
      console.error('[LiveAPI] Failed to connect:', error);
      throw error;
    }
  }

  /**
   * Handle incoming message from Gemini
   */
  private handleMessage(message: LiveServerMessage): void {
    // Handle model turn (audio/text response)
    if (message.serverContent?.modelTurn?.parts) {
      for (const part of message.serverContent.modelTurn.parts) {
        // Handle audio response
        if (part.inlineData?.mimeType?.startsWith('audio/')) {
          const audioData = part.inlineData.data;
          if (audioData) {
            if (DEBUG) console.log('[LiveAPI] Received audio chunk, length:', audioData.length);
            if (this.handlers.onAudio) {
              this.handlers.onAudio(audioData);
            }
          }
        }

        // NOTE: We intentionally do NOT forward part.text here.
        // In AUDIO modality with outputAudioTranscription enabled,
        // text arrives via outputTranscription (below). Forwarding
        // part.text as well would cause duplicate messages.
      }
    }

    // Handle audio output transcription (for native audio models)
    const serverContent = message.serverContent as any;
    if (serverContent?.outputTranscription?.text) {
      if (DEBUG) console.log('[LiveAPI] Received transcription:', serverContent.outputTranscription.text);
      if (this.handlers.onText) {
        this.handlers.onText(serverContent.outputTranscription.text);
      }
    }

    // Handle turn complete
    if (message.serverContent?.turnComplete) {
      if (DEBUG) console.log('[LiveAPI] Turn complete');
      this.handlers.onTurnComplete?.();
    }

    // Handle interruption
    if (message.serverContent?.interrupted) {
      if (DEBUG) console.log('[LiveAPI] Interrupted');
      this.handlers.onInterrupted?.();
    }

    // Handle tool calls
    if (message.toolCall) {
      console.log('[LiveAPI] Tool call:', JSON.stringify(message.toolCall).slice(0, 300));
      this.handlers.onToolCall?.(message.toolCall);
    }
  }

  /**
   * Send audio input (PCM 16kHz)
   * @param base64Audio - Base64 encoded PCM 16-bit mono at 16kHz
   */
  sendAudio(base64Audio: string): void {
    if (!this.session || !this.isConnected) {
      console.warn('[LiveAPI] Cannot send audio - not connected');
      return;
    }

    this.session.sendRealtimeInput({
      media: {
        mimeType: 'audio/pcm;rate=16000',
        data: base64Audio
      }
    });
  }

  /**
   * Send video/image frame (JPEG)
   * @param base64Frame - Base64 encoded JPEG image
   */
  sendFrame(base64Frame: string): void {
    if (!this.session || !this.isConnected) {
      console.warn('[LiveAPI] Cannot send frame - not connected');
      return;
    }

    if (DEBUG) console.log('[LiveAPI] Sending frame to Gemini, length:', base64Frame.length);
    this.session.sendRealtimeInput({
      media: {
        mimeType: 'image/jpeg',
        data: base64Frame
      }
    });
  }

  /**
   * Send text input
   * @param text - Text message to send
   */
  sendText(text: string): void {
    if (!this.session || !this.isConnected) {
      console.warn('[LiveAPI] Cannot send text - not connected');
      return;
    }

    this.session.sendClientContent({
      turns: [{
        role: 'user',
        parts: [{ text }]
      }],
      turnComplete: true
    });
  }

  /**
   * Send tool response
   * @param toolCallId - ID of the tool call
   * @param toolName - Name of the tool (required by @google/genai SDK)
   * @param result - Result of the tool execution
   */
  sendToolResponse(toolCallId: string, toolName: string, result: Record<string, unknown>): void {
    if (!this.session || !this.isConnected) {
      console.warn('[LiveAPI] Cannot send tool response - not connected');
      return;
    }

    try {
      this.session.sendToolResponse({
        functionResponses: [{
          id: toolCallId,
          name: toolName,
          response: result
        }]
      });
    } catch (error) {
      console.error('[LiveAPI] Failed to send tool response:', error);
    }
  }

  /**
   * Start sending silent audio frames to keep the session active
   * when the user has screen share but no microphone.
   * 
   * This solves ISSUE 1: Screen Vision requires active microphone.
   * The Live API processes image frames more reliably when
   * audio is also flowing (even silence).
   */
  startSilentAudio(): void {
    if (this.silentAudioInterval) return;

    // Generate 100ms of silent PCM16 at 16kHz = 1600 samples = 3200 bytes
    const silentSamples = 1600;
    const buffer = new ArrayBuffer(silentSamples * 2);
    // All zeros = silence in PCM16
    const silentBase64 = Buffer.from(buffer).toString('base64');

    // Send silence every 1000ms to keep the session engaged (reduced from 250ms)
    this.silentAudioInterval = setInterval(() => {
      if (this.session && this.isConnected) {
        this.session.sendRealtimeInput({
          media: {
            mimeType: 'audio/pcm;rate=16000',
            data: silentBase64
          }
        });
      }
    }, 1000);

    console.log('[LiveAPI] Silent audio keepalive started');
  }

  /**
   * Stop sending silent audio
   */
  stopSilentAudio(): void {
    if (this.silentAudioInterval) {
      clearInterval(this.silentAudioInterval);
      this.silentAudioInterval = null;
      console.log('[LiveAPI] Silent audio keepalive stopped');
    }
  }

  /**
   * Check if silent audio is active
   */
  isSilentAudioActive(): boolean {
    return this.silentAudioInterval !== null;
  }

  /**
   * Update message handlers
   */
  setHandlers(handlers: LiveMessageHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Check if connected
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Close the session
   */
  close(): void {
    this.stopSilentAudio();
    if (this.session) {
      this.session.close();
      this.session = null;
    }
    this.isConnected = false;
    console.log('[LiveAPI] Disconnected');
  }
}

/**
 * Create a new Live API session
 */
export function createLiveSession(config: LiveSessionConfig): LiveAPIProxy {
  return new LiveAPIProxy(config);
}

export { LIVE_OVERLAY_TOOLS as liveOverlayTools };
export default LiveAPIProxy;
