/**
 * Audio - PCM audio capture and playback for Gemini Live API
 * 
 * Input: Captures microphone at 16kHz PCM 16-bit mono
 * Output: Plays received audio at 24kHz PCM 16-bit mono
 */

/** Audio configuration constants */
export const AUDIO_CONFIG = {
  INPUT_SAMPLE_RATE: 16000,   // 16kHz for input to Gemini
  OUTPUT_SAMPLE_RATE: 24000,  // 24kHz for output from Gemini
  CHANNELS: 1,                // Mono
  BIT_DEPTH: 16,              // 16-bit signed PCM
  CHUNK_SIZE: 4096,           // Samples per chunk
} as const;

/** Callback type for audio data */
export type AudioDataCallback = (base64Audio: string) => void;

/**
 * AudioCapture - Captures microphone audio as PCM 16kHz
 */
export class AudioCapture {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private onAudioData: AudioDataCallback | null = null;
  private isCapturing: boolean = false;

  /**
   * Check if audio capture is supported
   */
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Start capturing microphone audio
   * @param onAudioData - Callback receiving base64 PCM chunks
   */
  async start(onAudioData: AudioDataCallback): Promise<void> {
    if (!AudioCapture.isSupported()) {
      throw new Error('Audio capture not supported in this browser');
    }

    if (this.isCapturing) {
      console.warn('Audio capture already started');
      return;
    }

    this.onAudioData = onAudioData;

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: AUDIO_CONFIG.INPUT_SAMPLE_RATE,
          channelCount: AUDIO_CONFIG.CHANNELS,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      // Create audio context at target sample rate
      this.audioContext = new AudioContext({
        sampleRate: AUDIO_CONFIG.INPUT_SAMPLE_RATE
      });

      // Create source from microphone
      this.source = this.audioContext.createMediaStreamSource(this.stream);

      // Create processor for capturing audio data
      // Note: ScriptProcessorNode is deprecated but widely supported
      // AudioWorklet is the modern replacement but requires more setup
      this.processor = this.audioContext.createScriptProcessor(
        AUDIO_CONFIG.CHUNK_SIZE,
        AUDIO_CONFIG.CHANNELS,
        AUDIO_CONFIG.CHANNELS
      );

      this.processor.onaudioprocess = (event) => {
        if (!this.onAudioData) return;

        const inputData = event.inputBuffer.getChannelData(0);
        const pcmData = this.floatTo16BitPCM(inputData);
        const base64 = this.arrayBufferToBase64(pcmData);
        
        this.onAudioData(base64);
      };

      // Connect: source -> processor -> destination
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.isCapturing = true;
      console.log('[Ocula] Audio capture started at', AUDIO_CONFIG.INPUT_SAMPLE_RATE, 'Hz');

    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  /**
   * Convert float32 audio samples to 16-bit PCM
   */
  private floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < float32Array.length; i++) {
      // Clamp to [-1, 1] and convert to 16-bit
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return buffer;
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Check if currently capturing
   */
  getIsCapturing(): boolean {
    return this.isCapturing;
  }

  /**
   * Stop audio capture
   */
  stop(): void {
    this.cleanup();
    console.log('[Ocula] Audio capture stopped');
  }

  private cleanup(): void {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.onAudioData = null;
    this.isCapturing = false;
  }
}

/**
 * AudioPlayback - Plays PCM audio received from Gemini
 */
export class AudioPlayback {
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying: boolean = false;
  private nextPlayTime: number = 0;

  /**
   * Initialize audio playback context
   */
  async init(): Promise<void> {
    if (this.audioContext) return;

    this.audioContext = new AudioContext({
      sampleRate: AUDIO_CONFIG.OUTPUT_SAMPLE_RATE
    });

    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    console.log('[Ocula] Audio playback initialized at', AUDIO_CONFIG.OUTPUT_SAMPLE_RATE, 'Hz');
  }

  /**
   * Play base64 PCM audio chunk
   * @param base64Audio - Base64 encoded PCM 16-bit mono at 24kHz
   */
  async play(base64Audio: string): Promise<void> {
    if (!this.audioContext) {
      await this.init();
    }

    const pcmData = this.base64ToArrayBuffer(base64Audio);
    const float32 = this.pcm16ToFloat32(pcmData);

    // Create audio buffer
    const audioBuffer = this.audioContext!.createBuffer(
      AUDIO_CONFIG.CHANNELS,
      float32.length,
      AUDIO_CONFIG.OUTPUT_SAMPLE_RATE
    );
    audioBuffer.getChannelData(0).set(float32);

    // Schedule playback
    this.schedulePlayback(audioBuffer);
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Convert 16-bit PCM to float32
   */
  private pcm16ToFloat32(pcmBuffer: ArrayBuffer): Float32Array {
    const view = new DataView(pcmBuffer);
    const float32 = new Float32Array(pcmBuffer.byteLength / 2);

    for (let i = 0; i < float32.length; i++) {
      const int16 = view.getInt16(i * 2, true);
      float32[i] = int16 / (int16 < 0 ? 0x8000 : 0x7FFF);
    }

    return float32;
  }

  /**
   * Schedule audio buffer for seamless playback
   */
  private schedulePlayback(audioBuffer: AudioBuffer): void {
    if (!this.audioContext) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);

    const currentTime = this.audioContext.currentTime;
    const startTime = Math.max(currentTime, this.nextPlayTime);
    
    source.start(startTime);
    this.nextPlayTime = startTime + audioBuffer.duration;
    
    this.isPlaying = true;
    source.onended = () => {
      if (this.audioContext && this.audioContext.currentTime >= this.nextPlayTime) {
        this.isPlaying = false;
      }
    };
  }

  /**
   * Check if audio is currently playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Stop playback and clear queue
   */
  stop(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.audioQueue = [];
    this.isPlaying = false;
    this.nextPlayTime = 0;
    console.log('[Ocula] Audio playback stopped');
  }
}

export default { AudioCapture, AudioPlayback, AUDIO_CONFIG };
