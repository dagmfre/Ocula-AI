/**
 * Connection - WebSocket wrapper for Ocula server communication
 * 
 * Handles bidirectional communication with the Ocula server,
 * including message framing, reconnection, and event handling.
 */

/** Message types sent to server */
export interface ClientMessage {
  type: 'frame' | 'audio' | 'text' | 'user_query' | 'ping';
  data?: string;      // Base64 data for frame/audio
  text?: string;      // Text content for text/user_query
  frame?: string;     // Screen frame for user_query
  sessionId?: string; // Session identifier
  scrollX?: number;   // Scroll offset X at capture time
  scrollY?: number;   // Scroll offset Y at capture time
}

/** Message types received from server */
export interface ServerMessage {
  type: 'assistant_response' | 'audio' | 'draw' | 'clear' | 'error' | 'connected' | 'pong';
  text?: string;
  data?: string;            // Base64 audio data
  visualCommands?: VisualCommand[];
  action?: string;          // For draw commands
  point?: [number, number]; // Normalized coordinates [y, x]
  label?: string;
  width?: number;           // For highlight commands
  height?: number;          // For highlight commands
  error?: string;
  sessionId?: string;
  /** Scroll context at the time the frame was captured */
  scrollX?: number;
  scrollY?: number;
}

/** Visual command structure */
export interface VisualCommand {
  type: 'arrow' | 'highlight' | 'circle' | 'clear';
  point?: [number, number];
  label?: string;
  width?: number;
  height?: number;
}

/** Connection event handlers */
export interface ConnectionEventHandlers {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  onMessage?: (message: ServerMessage) => void;
  onAudio?: (base64Audio: string) => void;
  onDraw?: (command: VisualCommand, scrollX?: number, scrollY?: number) => void;
  onResponse?: (text: string, visualCommands?: VisualCommand[], scrollX?: number, scrollY?: number) => void;
}

/** Connection configuration */
export interface ConnectionConfig {
  url: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

/**
 * OculaConnection - WebSocket connection manager
 */
export class OculaConnection {
  private ws: WebSocket | null = null;
  private config: Required<ConnectionConfig>;
  private handlers: ConnectionEventHandlers;
  private reconnectAttempts: number = 0;
  private reconnectTimer: number | null = null;
  private sessionId: string;
  private isConnected: boolean = false;

  constructor(config: ConnectionConfig, handlers: ConnectionEventHandlers = {}) {
    this.config = {
      url: config.url,
      reconnect: config.reconnect ?? true,
      reconnectInterval: config.reconnectInterval ?? 3000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 5,
    };
    this.handlers = handlers;
    this.sessionId = this.generateSessionId();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `ocula-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Connect to Ocula server
   */
  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn('[Ocula] Already connected');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          console.log('[Ocula] WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.handlers.onOpen?.();
          resolve();
        };

        this.ws.onclose = (event) => {
          console.log('[Ocula] WebSocket closed:', event.code, event.reason);
          this.isConnected = false;
          this.handlers.onClose?.(event);
          
          if (this.config.reconnect && !event.wasClean) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('[Ocula] WebSocket error:', error);
          this.handlers.onError?.(error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: string): void {
    try {
      const message: ServerMessage = JSON.parse(data);
      
      console.log('[Ocula WS] Received message type:', message.type);
      
      // General message handler
      this.handlers.onMessage?.(message);

      // Type-specific handlers
      switch (message.type) {
        case 'audio':
          console.log('[Ocula WS] Audio data received, length:', message.data?.length);
          if (message.data) {
            this.handlers.onAudio?.(message.data);
          }
          break;

        case 'draw':
          if (message.action && message.point) {
            this.handlers.onDraw?.({
              type: message.action as VisualCommand['type'],
              point: message.point,
              label: message.label,
              width: message.width,
              height: message.height,
            }, message.scrollX, message.scrollY);
          }
          break;

        case 'clear':
          this.handlers.onDraw?.({ type: 'clear' });
          break;

        case 'assistant_response':
          this.handlers.onResponse?.(
            message.text || '',
            message.visualCommands,
            message.scrollX,
            message.scrollY
          );
          break;

        case 'connected':
          console.log('[Ocula] Session established:', message.sessionId);
          break;

        case 'error':
          console.error('[Ocula] Server error:', message.error);
          break;

        case 'pong':
          // Heartbeat response
          break;
      }

    } catch (error) {
      console.error('[Ocula] Failed to parse message:', error);
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('[Ocula] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[Ocula] Reconnecting in ${this.config.reconnectInterval}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

    this.reconnectTimer = window.setTimeout(() => {
      this.connect().catch(console.error);
    }, this.config.reconnectInterval);
  }

  /**
   * Send message to server
   */
  send(message: ClientMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[Ocula] Cannot send - not connected');
      return;
    }

    message.sessionId = this.sessionId;
    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send screen frame with optional scroll context
   */
  sendFrame(base64Frame: string, scrollX?: number, scrollY?: number): void {
    this.send({ type: 'frame', data: base64Frame, scrollX, scrollY });
  }

  /**
   * Send audio chunk
   */
  sendAudio(base64Audio: string): void {
    this.send({ type: 'audio', data: base64Audio });
  }

  /**
   * Send text message
   */
  sendText(text: string): void {
    this.send({ type: 'text', text });
  }

  /**
   * Send user query with optional screen frame
   */
  sendQuery(text: string, frame?: string): void {
    this.send({ type: 'user_query', text, frame });
  }

  /**
   * Send ping for keepalive
   */
  ping(): void {
    this.send({ type: 'ping' });
  }

  /**
   * Check if connected
   */
  getIsConnected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.isConnected = false;
    console.log('[Ocula] Disconnected');
  }
}

export default OculaConnection;
