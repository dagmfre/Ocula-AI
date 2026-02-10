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
import { scanDOM, startDOMWatcher, stopDOMWatcher, SelectorMap } from './dom-scanner';

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
  private selectorMapSent = false;

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
    console.log('[Ocula] Drawing:', command.type, command.selector ? `on ${command.selector}` : '', command.label || '');

    // Set scroll context so the overlay engine can compensate
    if (scrollX !== undefined && scrollY !== undefined) {
      this.overlay.setScrollContext({
        captureScrollX: scrollX,
        captureScrollY: scrollY,
      });
    }

    try {
      switch (command.type) {

        case 'clear':
          this.overlay.clear();
          break;
        case 'highlight_element':
          if (command.selector) {
            this.overlay.highlightElementBySelector(command.selector, command.label, command.action || 'apply');
          } else {
             console.warn('[Ocula] Highlight element command missing selector');
          }
          break;
        case 'highlight_sequence':
          if (command.steps && command.steps.length > 0) {
            this.overlay.playHighlightSequence(command.steps);
          }
          break;
      }
    } catch (err) {
      console.error('[Ocula] Error rendering overlay:', err);
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

    // Perform initial DOM scan and send selector map to server
    if (!this.selectorMapSent) {
      this.selectorMapSent = true;
      setTimeout(() => {
        const map = scanDOM();
        this.connection.sendSelectorMap(map);
        console.log(`[Ocula] Initial selector map sent (${map.length} elements)`);
      }, 500); // Wait for DOM to stabilize after screen share dialog
    }

    // Start DOM watcher for re-scans on navigation or structural changes
    startDOMWatcher((map) => {
      this.connection.sendSelectorMap(map);
      console.log(`[Ocula] Updated selector map sent (${map.length} elements)`);
    });
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
    stopDOMWatcher();
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
export { scanDOM, startDOMWatcher, stopDOMWatcher } from './dom-scanner';
export type { SelectorMap, SelectorEntry } from './dom-scanner';

// Default export
export default Ocula;

// Auto-initialize if running in browser context
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const currentScript = document.currentScript as HTMLScriptElement;
  if (currentScript) {
    const serverUrl = currentScript.getAttribute('data-server');
    if (serverUrl) {
      console.log('[Ocula] Auto-initializing widget from script tag');

      // ── Inject widget styles ──────────────────────────────────────
      const style = document.createElement('style');
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        #ocula-widget * {
          box-sizing: border-box;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        #ocula-widget-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 1000000;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #7C5CFC, #4F46E5);
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(79, 70, 229, 0.4);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        #ocula-widget-btn:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 6px 24px rgba(79, 70, 229, 0.5);
        }

        #ocula-chat-card {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 1000001;
          width: 380px;
          height: 520px;
          background: rgba(10, 10, 10, 0.92);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,92,252,0.1);
          transform: translateY(20px);
          opacity: 0;
          pointer-events: none;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
        }
        #ocula-chat-card.ocula-open {
          transform: translateY(0);
          opacity: 1;
          pointer-events: auto;
        }

        .ocula-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
        }
        .ocula-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ocula-logo {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: linear-gradient(135deg, #7C5CFC, #4F46E5);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ocula-title {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }
        .ocula-live-badge {
          display: none;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 9999px;
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .ocula-live-badge.active {
          display: flex;
        }
        .ocula-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ef4444;
          animation: ocula-pulse-dot 1.5s ease-in-out infinite;
        }
        @keyframes ocula-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .ocula-header-actions {
          display: flex;
          gap: 4px;
        }
        .ocula-header-btn {
          width: 28px;
          height: 28px;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .ocula-header-btn:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.8);
        }

        .ocula-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .ocula-messages::-webkit-scrollbar { width: 4px; }
        .ocula-messages::-webkit-scrollbar-track { background: transparent; }
        .ocula-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        .ocula-msg {
          max-width: 85%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 13px;
          line-height: 1.5;
          word-break: break-word;
          animation: ocula-msg-in 0.2s ease;
        }
        @keyframes ocula-msg-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ocula-msg-user {
          align-self: flex-end;
          background: #4F46E5;
          color: #fff;
          border-bottom-right-radius: 4px;
        }
        .ocula-msg-ai {
          align-self: flex-start;
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.9);
          border-bottom-left-radius: 4px;
        }
        .ocula-msg-system {
          align-self: center;
          background: transparent;
          color: rgba(255,255,255,0.3);
          font-size: 11px;
          padding: 4px 8px;
        }

        .ocula-input-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
        }
        .ocula-text-input {
          flex: 1;
          height: 40px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 0 14px;
          color: #fff;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }
        .ocula-text-input::placeholder { color: rgba(255,255,255,0.25); }
        .ocula-text-input:focus { border-color: rgba(124,92,252,0.5); }

        .ocula-send-btn, .ocula-live-btn {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .ocula-send-btn {
          background: #4F46E5;
          color: #fff;
        }
        .ocula-send-btn:hover { background: #6366F1; }
        .ocula-send-btn:disabled { opacity: 0.4; cursor: default; }

        .ocula-live-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.5);
        }
        .ocula-live-btn:hover {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.8);
        }
        .ocula-live-btn.active {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239,68,68,0.3);
          color: #ef4444;
        }

        .ocula-welcome {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          gap: 12px;
          color: rgba(255,255,255,0.3);
          text-align: center;
          padding: 24px;
        }
        .ocula-welcome-icon {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(124,92,252,0.2), rgba(79,70,229,0.1));
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7C5CFC;
        }
        .ocula-welcome h3 {
          font-size: 15px;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
          margin: 0;
        }
        .ocula-welcome p {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          margin: 0;
          max-width: 240px;
          line-height: 1.5;
        }
      `;
      document.head.appendChild(style);

      // ── Create Ocula instance ─────────────────────────────────────
      const ocula = new Ocula({
        serverUrl,
        autoConnect: true,
        // NOTE: onResponse NOT set here — we override connection handlers
        // below to handle both text display and visual commands in one place.
      });
      (window as any).ocula = ocula;

      // Track state
      let isOpen = false;
      let isLive = false;
      let hasMessages = false;

      // Wire up onText for Live API transcriptions
      // (onResponse already handles agent text via constructor)

      // ── Create widget container ───────────────────────────────────
      const widget = document.createElement('div');
      widget.id = 'ocula-widget';

      // ── Floating launcher button ──────────────────────────────────
      const launcherBtn = document.createElement('button');
      launcherBtn.id = 'ocula-widget-btn';
      launcherBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
      launcherBtn.onclick = () => toggleChat();

      // ── Chat card ─────────────────────────────────────────────────
      const chatCard = document.createElement('div');
      chatCard.id = 'ocula-chat-card';

      // Header
      const header = document.createElement('div');
      header.className = 'ocula-header';
      header.innerHTML = `
        <div class="ocula-header-left">
          <div class="ocula-logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>
          </div>
          <span class="ocula-title">Ocula AI</span>
          <div class="ocula-live-badge" id="ocula-live-badge">
            <div class="ocula-live-dot"></div>
            LIVE
          </div>
        </div>
        <div class="ocula-header-actions">
          <button class="ocula-header-btn" id="ocula-minimize-btn" title="Minimize">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      `;

      // Messages area
      const messagesArea = document.createElement('div');
      messagesArea.className = 'ocula-messages';
      messagesArea.id = 'ocula-messages';

      // Welcome state
      const welcome = document.createElement('div');
      welcome.className = 'ocula-welcome';
      welcome.id = 'ocula-welcome';
      welcome.innerHTML = `
        <div class="ocula-welcome-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>
        </div>
        <h3>Hi! I'm Ocula AI</h3>
        <p>Ask me anything or go live to share your screen and get visual guidance.</p>
      `;
      messagesArea.appendChild(welcome);

      // Input row
      const inputRow = document.createElement('div');
      inputRow.className = 'ocula-input-row';

      const textInput = document.createElement('input');
      textInput.className = 'ocula-text-input';
      textInput.type = 'text';
      textInput.placeholder = 'Ask a question...';

      const sendBtn = document.createElement('button');
      sendBtn.className = 'ocula-send-btn';
      sendBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;

      const liveBtn = document.createElement('button');
      liveBtn.className = 'ocula-live-btn';
      liveBtn.title = 'Go Live — share screen + voice';
      liveBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`;

      inputRow.appendChild(textInput);
      inputRow.appendChild(liveBtn);
      inputRow.appendChild(sendBtn);

      // Assemble card
      chatCard.appendChild(header);
      chatCard.appendChild(messagesArea);
      chatCard.appendChild(inputRow);

      // Assemble widget
      widget.appendChild(launcherBtn);
      widget.appendChild(chatCard);
      document.body.appendChild(widget);

      // ── Event handlers ────────────────────────────────────────────

      function toggleChat() {
        isOpen = !isOpen;
        if (isOpen) {
          chatCard.classList.add('ocula-open');
          launcherBtn.style.display = 'none';
          textInput.focus();
        } else {
          chatCard.classList.remove('ocula-open');
          launcherBtn.style.display = 'flex';
        }
      }

      // Minimize button
      header.querySelector('#ocula-minimize-btn')!.addEventListener('click', () => {
        toggleChat();
      });

      // Send text message
      function sendText() {
        const text = textInput.value.trim();
        if (!text) return;

        appendMessage('user', text);
        textInput.value = '';

        // Send via Live API text if live mode, otherwise via agent query
        if (isLive) {
          ocula.sendMessage(text);
        } else {
          ocula.sendQuery(text);
        }
      }

      sendBtn.onclick = sendText;
      textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendText();
        }
      });

      // Go Live toggle
      liveBtn.onclick = async () => {
        const liveBadge = document.getElementById('ocula-live-badge');
        if (!isLive) {
          try {
            appendMessage('system', 'Starting screen share + voice...');
            await ocula.startCapture();
            await ocula.startAudio();
            ocula.startFrameStream();
            isLive = true;
            liveBtn.classList.add('active');
            if (liveBadge) liveBadge.classList.add('active');
            appendMessage('system', '🟢 Live — screen sharing and voice active');
          } catch (err) {
            console.error('[Ocula] Failed to go live:', err);
            appendMessage('system', '❌ Could not start live mode. Allow screen sharing permissions.');
          }
        } else {
          ocula.stopCapture();
          ocula.stopAudio();
          isLive = false;
          liveBtn.classList.remove('active');
          if (liveBadge) liveBadge.classList.remove('active');
          appendMessage('system', '⬛ Live mode stopped');
        }
      };

      // ── Message helpers ───────────────────────────────────────────
      // Accumulator for streaming AI text fragments
      let aiStreamBuffer = '';
      let aiStreamEl: HTMLDivElement | null = null;

      function appendMessage(role: 'user' | 'ai' | 'system', text: string) {
        // Hide welcome on first real message
        if (!hasMessages && role !== 'system') {
          hasMessages = true;
          const w = document.getElementById('ocula-welcome');
          if (w) w.style.display = 'none';
        }

        // For AI role, handle streaming accumulation
        if (role === 'ai') {
          // If we already have a streaming AI bubble, append to it
          if (aiStreamEl) {
            aiStreamBuffer += text;
            aiStreamEl.textContent = aiStreamBuffer;
            messagesArea.scrollTop = messagesArea.scrollHeight;
            return;
          }
          // Start a new AI bubble
          aiStreamBuffer = text;
          const el = document.createElement('div');
          el.className = 'ocula-msg ocula-msg-ai';
          el.textContent = text;
          messagesArea.appendChild(el);
          aiStreamEl = el;
          messagesArea.scrollTop = messagesArea.scrollHeight;
          return;
        }

        // For user messages, finalize any streaming AI bubble
        if (role === 'user') {
          finalizeAiStream();
        }

        const el = document.createElement('div');
        el.className = `ocula-msg ocula-msg-${role}`;
        el.textContent = text;
        messagesArea.appendChild(el);
        messagesArea.scrollTop = messagesArea.scrollHeight;
      }

      function finalizeAiStream() {
        aiStreamEl = null;
        aiStreamBuffer = '';
      }

      // ── Wire connection handlers for chat display ────────────────
      const origConn = ocula['connection'] as any;
      if (origConn.handlers) {
        origConn.handlers.onResponse = (text: string, visualCommands?: VisualCommand[], scrollX?: number, scrollY?: number) => {
          // Show text in chat (agent responses)
          if (text) {
            appendMessage('ai', text);
          }
          // Handle visual commands
          if (visualCommands) {
            visualCommands.forEach((cmd: VisualCommand) => {
              ocula['handleVisualCommand'](cmd, scrollX, scrollY);
            });
            if (visualCommands.some((c: VisualCommand) => c.type !== 'clear')) {
              finalizeAiStream();
              appendMessage('system', '✨ Visual guide shown on screen');
            }
          }
        };

        // Hook onDraw for Live API tool calls
        origConn.handlers.onDraw = (command: VisualCommand, scrollX?: number, scrollY?: number) => {
          ocula['handleVisualCommand'](command, scrollX, scrollY);
          if (command.type !== 'clear') {
            finalizeAiStream();
            appendMessage('system', '✨ Visual guide shown on screen');
          }
        };
      }

      // Persist collapsed/expanded state
      const savedState = localStorage.getItem('ocula-widget-open');
      if (savedState === 'true') {
        toggleChat();
      }

      // Watch for state changes (save after toggle)
      new MutationObserver(() => {
        localStorage.setItem('ocula-widget-open', isOpen ? 'true' : 'false');
      }).observe(chatCard, { attributes: true, attributeFilter: ['class'] });
    }
  }
}
