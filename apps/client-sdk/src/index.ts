/**
 * Ocula AI Client SDK
 * 
 * Main entry point that combines all modules into a unified API.
 * This is bundled into a single JS file for script injection.
 * 
 * @example
 * ```html
 * <script src="https://ocula.ai/widget.js"></script>
 * <script>
 *   const ocula = new OculaSDK.Ocula({ serverUrl: 'wss://api.ocula.ai/ws' });
 *   ocula.start();
 * </script>
 * ```
 */

import { ScreenCapture } from './capture';
import { AudioCapture, AudioPlayback, AUDIO_CONFIG } from './audio';
import { OculaConnection, ConnectionEventHandlers, VisualCommand } from './connection';
import { OverlayEngine, OverlayConfig, ScrollContext } from './overlay';

/** Ocula SDK configuration */
export interface OculaConfig {
  serverUrl: string;
  autoConnect?: boolean;
  autoCapture?: boolean;
  overlayConfig?: OverlayConfig;
  onReady?: () => void;
  onError?: (error: Error) => void;
  onResponse?: (text: string) => void;
}

/** Ocula SDK state */
export interface OculaState {
  isConnected: boolean;
  isCapturing: boolean;
  isRecordingAudio: boolean;
  isPlayingAudio: boolean;
}

/**
 * Ocula - Main SDK class
 */
export class Ocula {
  private config: Required<Omit<OculaConfig, 'overlayConfig' | 'onReady' | 'onError' | 'onResponse'>> & 
                  Pick<OculaConfig, 'overlayConfig' | 'onReady' | 'onError' | 'onResponse'>;
  
  private connection: OculaConnection;
  private capture: ScreenCapture;
  private audioCapture: AudioCapture;
  private audioPlayback: AudioPlayback;
  private overlay: OverlayEngine;
  
  private frameInterval: number | null = null;

  constructor(config: OculaConfig) {
    this.config = {
      serverUrl: config.serverUrl,
      autoConnect: config.autoConnect ?? true,
      autoCapture: config.autoCapture ?? false,
      overlayConfig: config.overlayConfig,
      onReady: config.onReady,
      onError: config.onError,
      onResponse: config.onResponse,
    };

    // Initialize components
    this.capture = new ScreenCapture();
    this.audioCapture = new AudioCapture();
    this.audioPlayback = new AudioPlayback();
    this.overlay = new OverlayEngine(this.config.overlayConfig);

    // Initialize connection with handlers
    const handlers: ConnectionEventHandlers = {
      onOpen: () => {
        console.log('[Ocula] Connected to server');
        this.config.onReady?.();
      },
      onClose: () => {
        console.log('[Ocula] Disconnected from server');
      },
      onError: (error) => {
        console.error('[Ocula] Connection error:', error);
        this.config.onError?.(new Error('Connection error'));
      },
      onAudio: (base64Audio) => {
        console.log('[Ocula SDK] Received audio from server, length:', base64Audio.length);
        this.audioPlayback.play(base64Audio).catch(console.error);
      },
      onDraw: (command, scrollX, scrollY) => {
        this.handleVisualCommand(command, scrollX, scrollY);
      },
      onResponse: (text, visualCommands, scrollX, scrollY) => {
        this.config.onResponse?.(text);
        if (visualCommands) {
          visualCommands.forEach(cmd => this.handleVisualCommand(cmd, scrollX, scrollY));
        }
      },
    };

    this.connection = new OculaConnection(
      { url: this.config.serverUrl },
      handlers
    );

    // Auto-connect if configured
    if (this.config.autoConnect) {
      this.connect().catch(console.error);
    }
  }

  /**
   * Handle visual command from server
   * 
   * Day 4: Scroll-context-aware — the server sends the scroll offsets
   * from when the frame was captured, and the overlay engine uses this
   * to compensate for any scroll that happened since.
   */
  private handleVisualCommand(command: VisualCommand, scrollX?: number, scrollY?: number): void {
    // Set scroll context so the overlay engine can compensate
    if (scrollX !== undefined && scrollY !== undefined) {
      this.overlay.setScrollContext({
        captureScrollX: scrollX,
        captureScrollY: scrollY,
      });
    }

    switch (command.type) {
      case 'arrow':
        if (command.point) {
          this.overlay.drawArrow(command.point[0], command.point[1], command.label);
        }
        break;
      case 'highlight':
        if (command.point) {
          this.overlay.highlightElement(
            command.point[0],
            command.point[1],
            command.width || 100,
            command.height || 50,
            command.label
          );
        }
        break;
      case 'circle':
        if (command.point) {
          this.overlay.drawCircle(command.point[0], command.point[1], 24, command.label);
        }
        break;
      case 'clear':
        this.overlay.clear();
        break;
    }
  }

  /**
   * Connect to server
   */
  async connect(): Promise<void> {
    await this.connection.connect();
    this.overlay.init();
  }

  /**
   * Start screen capture
   */
  async startCapture(): Promise<void> {
    await this.capture.start();
  }

  /**
   * Capture and send a single frame with scroll context
   */
  captureAndSendFrame(): void {
    if (!this.capture.getIsCapturing()) {
      console.warn('[Ocula] Screen capture not started');
      return;
    }

    const frame = this.capture.captureFrame();
    const scroll = this.capture.getLastFrameScroll();
    this.connection.sendFrame(frame, scroll.scrollX, scroll.scrollY);
  }

  /**
   * Start continuous frame capture (1 FPS)
   */
  startFrameStream(intervalMs: number = 1000): void {
    if (this.frameInterval) {
      console.warn('[Ocula] Frame stream already running');
      return;
    }

    this.frameInterval = window.setInterval(() => {
      if (this.capture.getIsCapturing()) {
        this.captureAndSendFrame();
      }
    }, intervalMs);

    console.log('[Ocula] Frame stream started');
  }

  /**
   * Stop frame stream
   */
  stopFrameStream(): void {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
      console.log('[Ocula] Frame stream stopped');
    }
  }

  /**
   * Stop screen capture
   */
  stopCapture(): void {
    this.stopFrameStream();
    this.capture.stop();
  }

  /**
   * Start microphone recording
   */
  async startAudio(): Promise<void> {
    await this.audioCapture.start((base64Audio) => {
      this.connection.sendAudio(base64Audio);
    });
    await this.audioPlayback.init();
  }

  /**
   * Stop microphone recording
   */
  stopAudio(): void {
    this.audioCapture.stop();
    this.audioPlayback.stop();
  }

  /**
   * Send a text message
   */
  sendMessage(text: string): void {
    this.connection.sendText(text);
  }

  /**
   * Send a query with current screen frame
   */
  sendQuery(text: string): void {
    let frame: string | undefined;
    
    if (this.capture.getIsCapturing()) {
      try {
        frame = this.capture.captureFrame();
      } catch (e) {
        console.warn('[Ocula] Could not capture frame for query');
      }
    }

    this.connection.sendQuery(text, frame);
  }

  /**
   * Draw arrow overlay (scroll-aware)
   */
  drawArrow(y: number, x: number, label?: string): void {
    this.overlay.drawArrow(y, x, label);
  }

  /**
   * Draw highlight overlay
   */
  drawHighlight(y: number, x: number, width: number, height: number, label?: string): void {
    this.overlay.highlightElement(y, x, width, height, label);
  }

  /**
   * Clear all overlays
   */
  clearOverlays(): void {
    this.overlay.clear();
  }

  /**
   * Get current state
   */
  getState(): OculaState {
    return {
      isConnected: this.connection.getIsConnected(),
      isCapturing: this.capture.getIsCapturing(),
      isRecordingAudio: this.audioCapture.getIsCapturing(),
      isPlayingAudio: this.audioPlayback.getIsPlaying(),
    };
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.connection.getSessionId();
  }

  /**
   * Full start - capture, audio, and frame stream
   */
  async start(): Promise<void> {
    if (!this.connection.getIsConnected()) {
      await this.connect();
    }
    await this.startCapture();
    await this.startAudio();
    this.startFrameStream();
  }

  /**
   * Full stop - everything
   */
  stop(): void {
    this.stopCapture();
    this.stopAudio();
    this.clearOverlays();
  }

  /**
   * Disconnect and cleanup
   */
  destroy(): void {
    this.stop();
    this.connection.disconnect();
    this.capture.destroy();
    this.overlay.destroy();
    console.log('[Ocula] SDK destroyed');
  }
}

// Export all modules for advanced usage
export { ScreenCapture } from './capture';
export { AudioCapture, AudioPlayback, AUDIO_CONFIG } from './audio';
export { OculaConnection } from './connection';
export type { ConnectionEventHandlers, ClientMessage, ServerMessage, VisualCommand } from './connection';
export { OverlayEngine } from './overlay';
export type { OverlayConfig, OverlayType, ScrollContext } from './overlay';

// Default export
export default Ocula;
