/**
 * Overlay Engine v4 — Production-Ready CSS Highlight System
 *
 * A premium "AI-native" overlay engine that renders visual highlights
 * on top of any host SaaS page using CSS-based techniques.
 *
 * Features:
 * - CSS class-based element highlighting with pulsing glow
 * - Glassmorphism-inspired floating labels
 * - Smooth crossfade transitions between highlights
 * - Multi-element highlight sequences with auto-pacing
 * - Animated fadeout on clear
 * - Auto-timeout for stale highlights (15s)
 * - Abortable sequences
 * - Zero layout shift (outline only, no border changes)
 */

// ─── Types & Interfaces ─────────────────────────────────────────────

/** Visual command types */
export type OverlayType = 'arrow' | 'highlight' | 'circle' | 'clear';

/** Overlay configuration */
export interface OverlayConfig {
  arrowColor?: string;
  highlightColor?: string;
  highlightBorderColor?: string;
  circleColor?: string;
  labelBackground?: string;
  labelBorder?: string;
  labelColor?: string;
  glowEnabled?: boolean;
  animationsEnabled?: boolean;
  /** Auto-clear highlights after this many ms of inactivity (default: 15000) */
  autoTimeoutMs?: number;
}

/** Scroll context from the frame capture */
export interface ScrollContext {
  captureScrollX: number;
  captureScrollY: number;
}

// ─── Defaults ────────────────────────────────────────────────────────

const DEFAULT_CONFIG: Required<OverlayConfig> = {
  arrowColor: '#7C5CFC',
  highlightColor: 'rgba(124, 92, 252, 0.10)',
  highlightBorderColor: 'rgba(124, 92, 252, 0.6)',
  circleColor: '#7C5CFC',
  labelBackground: 'rgba(15, 10, 40, 0.78)',
  labelBorder: 'rgba(124, 92, 252, 0.35)',
  labelColor: '#FFFFFF',
  glowEnabled: true,
  animationsEnabled: true,
  autoTimeoutMs: 15000,
};

// ─── Constants ───────────────────────────────────────────────────────

const FADEOUT_MS = 300;      // exit animation duration

// ─── OverlayEngine ──────────────────────────────────────────────────

/**
 * OverlayEngine v4 — CSS-based visual highlights with smooth transitions
 */
export class OverlayEngine {
  private container!: HTMLDivElement;
  private config: Required<OverlayConfig>;
  private isInitialized = false;
  private scrollContext: ScrollContext = { captureScrollX: 0, captureScrollY: 0 };
  private nextId = 1;

  /** Tracked CSS highlights */
  private activeHighlights = new Map<string, {
    element: HTMLElement;
    originalBorder: string;
    originalScroll: string;
    originalBoxShadow: string;
    labelId?: string;
  }>();

  /** Active highlight sequence state */
  private sequenceAbortController: AbortController | null = null;

  /** Auto-timeout timer for stale highlights */
  private autoTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: OverlayConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ── Lifecycle ──────────────────────────────────────────────────────

  /**
   * Initialize the overlay system.
   */
  init(): void {
    if (this.isInitialized) return;

    // Container — minimal fixed element (labels are appended to body directly)
    this.container = document.createElement('div');
    this.container.id = 'ocula-overlay';
    this.container.style.cssText =
      'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:999999;overflow:visible;';
    document.body.appendChild(this.container);
    this.isInitialized = true;

    console.log('[Ocula] Overlay engine v4 initialized');
  }

  /**
   * Set the scroll context from the last captured frame.
   */
  setScrollContext(ctx: ScrollContext): void {
    this.scrollContext = ctx;
  }

  /**
   * Clear all highlights with fade-out animation.
   */
  clear(): void {
    if (!this.isInitialized) return;

    // Cancel any active highlight sequence
    this.cancelSequence();
    this.clearAutoTimeout();

    // Clear CSS highlights with fadeout animation
    if (this.activeHighlights.size > 0) {
      const selectors = Array.from(this.activeHighlights.keys());
      selectors.forEach(sel => this.clearHighlight(sel));
    }

    console.log('[Ocula] Overlays cleared');
  }

  /**
   * Tear down the entire overlay system.
   */
  destroy(): void {
    this.cancelSequence();
    this.clearAutoTimeout();
    if (this.isInitialized) {
      // Clean up all active highlights immediately
      this.activeHighlights.forEach(({ element, originalBorder, originalScroll, originalBoxShadow, labelId }) => {
        element.classList.remove('ocula-hl-active', 'ocula-hl-exiting');
        element.style.outline = originalBorder;
        element.style.scrollMargin = originalScroll;
        element.style.boxShadow = originalBoxShadow;
        if (labelId) {
          const el = document.getElementById(labelId);
          if (el) el.remove();
        }
      });
      this.activeHighlights.clear();
      this.container.remove();
      document.getElementById('ocula-highlight-styles')?.remove();
      this.isInitialized = false;
    }
    console.log('[Ocula] Overlay engine destroyed');
  }

  // ── Auto-Timeout ──────────────────────────────────────────────────

  /**
   * Reset the auto-timeout timer. If no new highlight arrives within
   * autoTimeoutMs, all highlights auto-clear with fadeout.
   */
  private resetAutoTimeout(): void {
    this.clearAutoTimeout();
    if (this.config.autoTimeoutMs > 0) {
      this.autoTimeoutTimer = setTimeout(() => {
        if (this.activeHighlights.size > 0) {
          console.log('[Ocula] Auto-clearing stale highlights (timeout)');
          this.clearAllHighlightsAnimated();
        }
      }, this.config.autoTimeoutMs);
    }
  }

  private clearAutoTimeout(): void {
    if (this.autoTimeoutTimer) {
      clearTimeout(this.autoTimeoutTimer);
      this.autoTimeoutTimer = null;
    }
  }

  // ── Drawing Methods ───────────────────────────────────────────────



  /**
   * Inject the highlight CSS stylesheet into the host page's DOM.
   * Called once, on first highlight usage.
   */
  private highlightStylesInjected = false;
  private injectHighlightStyles(): void {
    if (this.highlightStylesInjected) return;
    this.highlightStylesInjected = true;

    const style = document.createElement('style');
    style.id = 'ocula-highlight-styles';
    style.textContent = `
      /* ─── Ocula AI Highlight System v2 ─── Smooth & Professional ─── */

      @keyframes ocula-hl-pulse {
        0%, 100% {
          box-shadow:
            0 0 0 2px rgba(124, 92, 252, 0.55),
            0 0 0 4px rgba(124, 92, 252, 0.2),
            0 0 12px rgba(124, 92, 252, 0.18),
            0 0 25px rgba(124, 92, 252, 0.08);
        }
        50% {
          box-shadow:
            0 0 0 2.5px rgba(124, 92, 252, 0.7),
            0 0 0 5px rgba(124, 92, 252, 0.28),
            0 0 18px rgba(124, 92, 252, 0.25),
            0 0 35px rgba(124, 92, 252, 0.1);
        }
      }

      @keyframes ocula-hl-border-flow {
        0%   { outline-color: rgba(124, 92, 252, 0.6); }
        33%  { outline-color: rgba(99, 102, 241, 0.65); }
        66%  { outline-color: rgba(139, 92, 246, 0.65); }
        100% { outline-color: rgba(124, 92, 252, 0.6); }
      }

      @keyframes ocula-hl-label-float {
        0%, 100% { transform: translateX(-50%) translateY(0); }
        50% { transform: translateX(-50%) translateY(-2px); }
      }

      @keyframes ocula-hl-fadein {
        from { opacity: 0; transform: scale(0.97); }
        to   { opacity: 1; transform: scale(1); }
      }

      @keyframes ocula-hl-fadeout {
        from { opacity: 1; transform: scale(1); }
        to   { opacity: 0; transform: scale(0.98); }
      }

      @keyframes ocula-label-fadein {
        from { opacity: 0; transform: translateX(-50%) translateY(6px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }

      @keyframes ocula-label-fadeout {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to   { opacity: 0; transform: translateX(-50%) translateY(-6px); }
      }

      .ocula-hl-active {
        outline: 2px solid rgba(124, 92, 252, 0.6) !important;
        outline-offset: 3px !important;
        border-radius: inherit;
        animation:
          ocula-hl-pulse 2.5s ease-in-out infinite,
          ocula-hl-border-flow 4s linear infinite,
          ocula-hl-fadein 0.4s cubic-bezier(0.22, 1, 0.36, 1) both !important;
        position: relative;
        z-index: 10 !important;
        transition: none !important;
      }

      .ocula-hl-exiting {
        animation: ocula-hl-fadeout 0.3s ease-out forwards !important;
        pointer-events: none;
      }

      .ocula-hl-label {
        position: fixed;
        z-index: 1000000;
        pointer-events: none;
        transform: translateX(-50%);
        animation: ocula-label-fadein 0.35s cubic-bezier(0.22, 1, 0.36, 1) both,
                   ocula-hl-label-float 3s ease-in-out 0.35s infinite;
        /* Glassmorphism pill */
        padding: 6px 16px 6px 14px;
        border-radius: 20px;
        background: rgba(10, 8, 30, 0.88);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(124, 92, 252, 0.3);
        box-shadow:
          0 4px 24px rgba(0, 0, 0, 0.35),
          0 0 12px rgba(124, 92, 252, 0.12),
          inset 0 1px 0 rgba(255, 255, 255, 0.05);
        /* Text */
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.3px;
        color: #fff;
        white-space: nowrap;
      }
      .ocula-hl-label::before {
        content: '◆ ';
        font-size: 8px;
        vertical-align: middle;
        color: rgba(124, 92, 252, 0.8);
        margin-right: 2px;
      }
      .ocula-hl-label.ocula-label-exiting {
        animation: ocula-label-fadeout 0.3s ease-out forwards !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Highlight an element using CSS classes + floating label.
   * Injects a premium stylesheet with pulsing glow, animated border,
   * and glassmorphism label on the first call.
   */
  highlightElementBySelector(selector: string, label?: string, action: 'apply' | 'clear' = 'apply'): void {
    if (!this.isInitialized) this.init();

    if (action === 'clear') {
      this.clearHighlight(selector);
      return;
    }

    // Inject CSS on first use
    this.injectHighlightStyles();

    // Reset auto-timeout on every new highlight
    this.resetAutoTimeout();

    try {
      const element = document.querySelector(selector) as HTMLElement;
      if (!element) {
        console.warn(`[Ocula] Could not find element to highlight: ${selector}`);
        return;
      }

      // If already highlighted, skip
      if (this.activeHighlights.has(selector)) return;

      // Save original state
      const originalBorder = element.style.outline;
      const originalScroll = element.style.scrollMargin;
      const originalBoxShadow = element.style.boxShadow;

      // Apply the highlight CSS class
      element.classList.add('ocula-hl-active');
      element.style.scrollMargin = '100px';

      // Scroll into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

      // Create floating label if text provided
      let labelId: string | undefined;
      if (label) {
        labelId = `ocula-label-${this.nextId++}`;
        const labelEl = document.createElement('div');
        labelEl.id = labelId;
        labelEl.className = 'ocula-hl-label';
        labelEl.textContent = label;
        document.body.appendChild(labelEl);

        // Position label above element after scroll settles
        const positionLabel = () => {
          const rect = element.getBoundingClientRect();
          labelEl.style.left = `${rect.left + rect.width / 2}px`;
          labelEl.style.top = `${rect.top - 40}px`;
        };
        // Initial position + reposition on next frame after scroll
        positionLabel();
        setTimeout(positionLabel, 400);

        // Keep repositioning label with rAF so it tracks scroll/resize
        const trackLabel = () => {
          if (!document.getElementById(labelId!)) return;
          positionLabel();
          requestAnimationFrame(trackLabel);
        };
        requestAnimationFrame(trackLabel);
      }

      this.activeHighlights.set(selector, {
        element,
        originalBorder,
        originalScroll,
        originalBoxShadow,
        labelId,
      });

      console.log(`[Ocula] Highlighted ${selector}`);
    } catch (err) {
      console.error(`[Ocula] Error highlighting ${selector}:`, err);
    }
  }

  private clearHighlight(selector: string): void {
    const data = this.activeHighlights.get(selector);
    if (!data) return;

    const { element, originalBorder, originalScroll, originalBoxShadow, labelId } = data;

    // Animated fadeout: add exiting class, then clean up after animation
    element.classList.remove('ocula-hl-active');
    element.classList.add('ocula-hl-exiting');

    // Fade out the label
    if (labelId) {
      const labelEl = document.getElementById(labelId);
      if (labelEl) {
        labelEl.classList.add('ocula-label-exiting');
      }
    }

    // Clean up after fadeout animation completes (300ms)
    setTimeout(() => {
      element.classList.remove('ocula-hl-exiting');
      
      // Remove floating label
      if (labelId) {
        const labelEl = document.getElementById(labelId);
        if (labelEl) labelEl.remove();
      }

      // Restore original styles
      element.style.outline = originalBorder;
      element.style.scrollMargin = originalScroll;
      element.style.boxShadow = originalBoxShadow;
    }, 320);

    this.activeHighlights.delete(selector);
  }

  /**
   * Smoothly clear all highlights with fadeout animation.
   * Returns a promise that resolves after all fadeouts complete.
   */
  clearAllHighlightsAnimated(): Promise<void> {
    if (this.activeHighlights.size === 0) return Promise.resolve();

    const selectors = Array.from(this.activeHighlights.keys());
    selectors.forEach(sel => this.clearHighlight(sel));

    // Wait for fadeout animation to complete
    return new Promise(resolve => setTimeout(resolve, 350));
  }

  /**
   * Cancel any running highlight sequence.
   */
  cancelSequence(): void {
    if (this.sequenceAbortController) {
      this.sequenceAbortController.abort();
      this.sequenceAbortController = null;
    }
  }

  /**
   * Play a sequence of highlights one-by-one with smooth crossfade transitions.
   *
   * Each step:
   * 1. Fade out the previous highlight (300ms)
   * 2. Wait a brief gap (100ms)
   * 3. Fade in the new highlight (400ms)
   * 4. Hold for delay_ms (default 3000ms) before moving to the next step
   *
   * The sequence auto-cancels on new user input or when cancelSequence() is called.
   */
  async playHighlightSequence(
    steps: Array<{ selector: string; label: string; delay_ms?: number }>,
    onStepStart?: (stepIndex: number) => void
  ): Promise<void> {
    // Cancel any running sequence
    this.cancelSequence();
    this.clearAutoTimeout();

    const controller = new AbortController();
    this.sequenceAbortController = controller;

    // Inject styles on first use
    this.injectHighlightStyles();

    if (!this.isInitialized) this.init();

    console.log(`[Ocula] Starting highlight sequence with ${steps.length} steps`);

    for (let i = 0; i < steps.length; i++) {
      // Check if aborted
      if (controller.signal.aborted) {
        console.log('[Ocula] Highlight sequence cancelled');
        return;
      }

      const step = steps[i];
      onStepStart?.(i);

      // Fade out previous highlight(s) smoothly
      await this.clearAllHighlightsAnimated();

      // Check abort again after async wait
      if (controller.signal.aborted) return;

      // Brief pause between fadeout and fadein for visual breathing room
      await this.sleep(100, controller.signal);
      if (controller.signal.aborted) return;

      // Apply the new highlight
      this.highlightElementBySelector(step.selector, step.label, 'apply');

      // Hold this highlight for the specified duration
      const holdDuration = step.delay_ms ?? 3000;
      await this.sleep(holdDuration, controller.signal);
    }

    // Sequence complete — leave the last highlight active, start auto-timeout
    if (!controller.signal.aborted) {
      this.resetAutoTimeout();
    }

    // Clean up the controller if it's still ours
    if (this.sequenceAbortController === controller) {
      this.sequenceAbortController = null;
    }

    console.log('[Ocula] Highlight sequence completed');
  }

  /** Sleep with abort support */
  private sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      if (signal?.aborted) { resolve(); return; }
      const timer = setTimeout(resolve, ms);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
    });
  }

}

export default OverlayEngine;
