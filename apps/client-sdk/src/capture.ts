/**
 * ScreenCapture - Captures user's screen using getDisplayMedia API
 * 
 * Captures browser tab/window at 1 FPS and converts frames to base64 JPEG.
 * Used for Gemini 3 Agentic Vision analysis.
 * 
 * Day 4: Added scroll offset tracking to solve overlay misalignment.
 * Each captured frame records scrollX/scrollY at capture time so the
 * overlay engine can adjust coordinates when rendering.
 */

/** Frame capture result with scroll context */
export interface CapturedFrame {
  base64: string;     // Base64 JPEG (no data URL prefix)
  scrollX: number;    // window.scrollX at capture time
  scrollY: number;    // window.scrollY at capture time
  viewportWidth: number;
  viewportHeight: number;
  timestamp: number;
}

export class ScreenCapture {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isCapturing: boolean = false;
  
  /** Last captured frame metadata (for scroll offset correction) */
  private lastFrameScroll: { scrollX: number; scrollY: number } = { scrollX: 0, scrollY: 0 };

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context');
    }
    this.ctx = ctx;
    
    this.video = document.createElement('video');
    this.video.playsInline = true;
    this.video.muted = true;
  }

  /**
   * Check if screen capture is supported in this browser
   */
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
  }

  /**
   * Start screen capture - prompts user to select screen/window/tab
   */
  async start(): Promise<void> {
    if (!ScreenCapture.isSupported()) {
      throw new Error('Screen capture not supported in this browser');
    }

    if (this.isCapturing) {
      console.warn('Screen capture already started');
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser', // Prefer browser tab
          frameRate: 1, // 1 FPS is sufficient for analysis
        },
        audio: false
      });

      // Handle user stopping share via browser UI
      this.stream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stop();
      });

      this.video.srcObject = this.stream;
      await this.video.play();
      this.isCapturing = true;

      console.log('[Ocula] Screen capture started');
    } catch (error) {
      this.stream = null;
      this.isCapturing = false;
      throw error;
    }
  }

  /**
   * Capture a single frame as base64 JPEG
   * @param quality - JPEG quality (0-1), default 0.7
   * @returns Base64 encoded JPEG string (without data URL prefix)
   */
  captureFrame(quality: number = 0.7): string {
    if (!this.stream || !this.isCapturing) {
      throw new Error('Stream not started. Call start() first.');
    }

    // Ensure video has dimensions
    if (this.video.videoWidth === 0 || this.video.videoHeight === 0) {
      throw new Error('Video stream not ready');
    }

    // Record scroll position at capture time
    this.lastFrameScroll = {
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    };

    // Set canvas to video dimensions
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;

    // Draw video frame to canvas
    this.ctx.drawImage(this.video, 0, 0);

    // Convert to base64 JPEG
    const dataUrl = this.canvas.toDataURL('image/jpeg', quality);
    
    // Return base64 without the data URL prefix
    return dataUrl.split(',')[1];
  }

  /**
   * Capture frame with full metadata (scroll position, viewport size)
   * Used for accurate overlay positioning.
   */
  captureFrameWithContext(quality: number = 0.7): CapturedFrame {
    const base64 = this.captureFrame(quality);
    return {
      base64,
      scrollX: this.lastFrameScroll.scrollX,
      scrollY: this.lastFrameScroll.scrollY,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      timestamp: Date.now(),
    };
  }

  /**
   * Get the scroll position from the last captured frame
   * Used by overlay engine to compensate for scroll delta
   */
  getLastFrameScroll(): { scrollX: number; scrollY: number } {
    return { ...this.lastFrameScroll };
  }

  /**
   * Get current capture dimensions
   */
  getDimensions(): { width: number; height: number } {
    return {
      width: this.video.videoWidth,
      height: this.video.videoHeight
    };
  }

  /**
   * Check if currently capturing
   */
  getIsCapturing(): boolean {
    return this.isCapturing;
  }

  /**
   * Stop screen capture and release resources
   */
  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.video.srcObject = null;
    this.isCapturing = false;
    
    console.log('[Ocula] Screen capture stopped');
  }

  /**
   * Destroy the instance and clean up
   */
  destroy(): void {
    this.stop();
    this.video.remove();
    this.canvas.remove();
  }
}

export default ScreenCapture;
