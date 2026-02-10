# Audio Helper Libraries

> **Sources**: 
> - [npmjs.com/package/pcm-player](https://www.npmjs.com/package/pcm-player)
> - [npmjs.com/package/mic](https://www.npmjs.com/package/mic)

## Overview

When building voice applications with Gemini's Live API, you'll need to handle PCM audio capture and playback. These libraries simplify audio I/O in Node.js and browser environments.

---

## PCM Player

A lightweight library for playing raw PCM audio data in the browser.

### Installation

```bash
npm install pcm-player
```

### Basic Usage

```javascript
import PCMPlayer from 'pcm-player';

// Create player for Gemini Live API output (24kHz, 16-bit, mono)
const player = new PCMPlayer({
  inputCodec: 'Int16',
  channels: 1,
  sampleRate: 24000,
  flushTime: 50 // Buffer flush interval in ms
});

// Feed PCM data from Gemini response
function handleGeminiAudio(base64Audio) {
  const binaryString = atob(base64Audio);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Convert to Int16Array
  const int16Data = new Int16Array(bytes.buffer);
  player.feed(int16Data);
}

// Control playback
player.volume(0.8);  // Set volume (0-1)
player.pause();      // Pause playback
player.continue();   // Resume playback
player.destroy();    // Clean up
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `inputCodec` | string | 'Int16' | PCM format: 'Int16', 'Int8', 'Float32' |
| `channels` | number | 1 | Number of audio channels |
| `sampleRate` | number | 8000 | Sample rate in Hz |
| `flushTime` | number | 1000 | Buffer flush interval (ms) |

### Complete Example with Live API

```javascript
import PCMPlayer from 'pcm-player';
import { GoogleGenAI, Modality } from '@google/genai';

class VoiceAssistant {
  constructor(apiKey) {
    this.ai = new GoogleGenAI({ apiKey });
    
    // Player for Gemini output (24kHz)
    this.player = new PCMPlayer({
      inputCodec: 'Int16',
      channels: 1,
      sampleRate: 24000,
      flushTime: 50
    });
  }

  async connect() {
    this.session = await this.ai.live.connect({
      model: 'gemini-2.5-flash-preview-native-audio-dialog',
      config: {
        responseModalities: [Modality.AUDIO, Modality.TEXT]
      }
    });

    this.session.on('message', (message) => {
      if (message.serverContent?.modelTurn?.parts) {
        for (const part of message.serverContent.modelTurn.parts) {
          if (part.inlineData?.mimeType?.startsWith('audio/')) {
            this.playAudio(part.inlineData.data);
          }
        }
      }
    });
  }

  playAudio(base64Audio) {
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const int16Data = new Int16Array(bytes.buffer);
    this.player.feed(int16Data);
  }

  destroy() {
    this.player.destroy();
    this.session?.close();
  }
}
```

---

## Mic (Node.js Microphone)

Captures audio from the system microphone in Node.js.

### Installation

```bash
npm install mic
```

### System Requirements

- **macOS**: `brew install sox`
- **Linux**: `sudo apt-get install sox libsox-fmt-all`
- **Windows**: Download and install [SoX](http://sox.sourceforge.net/)

### Basic Usage

```javascript
const mic = require('mic');

// Create microphone instance for Gemini Live API input (16kHz)
const micInstance = mic({
  rate: '16000',
  channels: '1',
  bitwidth: '16',
  encoding: 'signed-integer',
  endian: 'little',
  device: 'default'
});

const micInputStream = micInstance.getAudioStream();

// Handle audio data
micInputStream.on('data', (data) => {
  // data is a Buffer containing PCM audio
  const base64Audio = data.toString('base64');
  sendToGemini(base64Audio);
});

micInputStream.on('error', (err) => {
  console.error('Microphone error:', err);
});

// Start/stop recording
micInstance.start();
// ... later
micInstance.stop();
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rate` | string | '16000' | Sample rate in Hz |
| `channels` | string | '1' | Number of channels |
| `bitwidth` | string | '16' | Bit depth |
| `encoding` | string | 'signed-integer' | Audio encoding |
| `endian` | string | 'little' | Byte order |
| `device` | string | 'default' | Input device |
| `fileType` | string | 'raw' | Output format |

### Complete Example with Live API

```javascript
const mic = require('mic');
const { GoogleGenAI, Modality } = require('@google/genai');

class NodeVoiceAssistant {
  constructor(apiKey) {
    this.ai = new GoogleGenAI({ apiKey });
    this.setupMicrophone();
  }

  setupMicrophone() {
    this.micInstance = mic({
      rate: '16000',
      channels: '1',
      bitwidth: '16',
      encoding: 'signed-integer',
      endian: 'little'
    });

    this.audioStream = this.micInstance.getAudioStream();
    
    // Buffer audio chunks for smoother transmission
    this.audioBuffer = [];
    this.bufferInterval = setInterval(() => {
      if (this.audioBuffer.length > 0 && this.session) {
        const combined = Buffer.concat(this.audioBuffer);
        this.audioBuffer = [];
        this.sendAudio(combined);
      }
    }, 100); // Send every 100ms
  }

  async connect() {
    this.session = await this.ai.live.connect({
      model: 'gemini-2.5-flash-preview-native-audio-dialog',
      config: {
        responseModalities: [Modality.AUDIO, Modality.TEXT]
      }
    });

    this.session.on('message', (message) => {
      this.handleResponse(message);
    });

    // Start capturing
    this.audioStream.on('data', (data) => {
      this.audioBuffer.push(data);
    });

    this.micInstance.start();
    console.log('Listening...');
  }

  sendAudio(buffer) {
    const base64Audio = buffer.toString('base64');
    this.session.sendRealtimeInput({
      media: {
        mimeType: 'audio/pcm;rate=16000',
        data: base64Audio
      }
    });
  }

  handleResponse(message) {
    if (message.serverContent?.modelTurn?.parts) {
      for (const part of message.serverContent.modelTurn.parts) {
        if (part.text) {
          console.log('Assistant:', part.text);
        }
        if (part.inlineData?.mimeType?.startsWith('audio/')) {
          // Play or process audio response
          this.playAudio(part.inlineData.data);
        }
      }
    }
  }

  playAudio(base64Audio) {
    // In Node.js, you might use speaker package or write to file
    const Speaker = require('speaker');
    const speaker = new Speaker({
      channels: 1,
      bitDepth: 16,
      sampleRate: 24000
    });

    const buffer = Buffer.from(base64Audio, 'base64');
    speaker.write(buffer);
  }

  stop() {
    clearInterval(this.bufferInterval);
    this.micInstance.stop();
    this.session?.close();
  }
}

// Usage
const assistant = new NodeVoiceAssistant(process.env.GEMINI_API_KEY);
await assistant.connect();

// Stop after 30 seconds
setTimeout(() => assistant.stop(), 30000);
```

---

## Browser Audio Capture

For browser environments, use the Web Audio API:

```javascript
class BrowserAudioCapture {
  constructor(targetSampleRate = 16000) {
    this.targetSampleRate = targetSampleRate;
  }

  async start(onAudioData) {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: this.targetSampleRate,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      }
    });

    this.audioContext = new AudioContext({ sampleRate: this.targetSampleRate });
    this.source = this.audioContext.createMediaStreamSource(stream);
    
    // Create processor for raw PCM access
    await this.audioContext.audioWorklet.addModule('pcm-processor.js');
    this.processor = new AudioWorkletNode(this.audioContext, 'pcm-processor');
    
    this.processor.port.onmessage = (event) => {
      const pcmData = event.data;
      const base64 = this.float32ToBase64Int16(pcmData);
      onAudioData(base64);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
    this.stream = stream;
  }

  float32ToBase64Int16(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  }

  stop() {
    this.source?.disconnect();
    this.processor?.disconnect();
    this.stream?.getTracks().forEach(track => track.stop());
    this.audioContext?.close();
  }
}

// pcm-processor.js (AudioWorklet)
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0];
      
      for (let i = 0; i < channelData.length; i++) {
        this.buffer[this.bufferIndex++] = channelData[i];
        
        if (this.bufferIndex >= this.bufferSize) {
          this.port.postMessage(this.buffer.slice());
          this.bufferIndex = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
```

---

## Audio Format Quick Reference

### Gemini Live API Requirements

| Direction | Format | Sample Rate | Bit Depth | Channels |
|-----------|--------|-------------|-----------|----------|
| Input (to Gemini) | PCM | 16,000 Hz | 16-bit | Mono |
| Output (from Gemini) | PCM | 24,000 Hz | 16-bit | Mono |

### Conversion Formula

```javascript
// Resample from source rate to target rate
function resample(audioBuffer, sourceSampleRate, targetSampleRate) {
  const ratio = sourceSampleRate / targetSampleRate;
  const newLength = Math.round(audioBuffer.length / ratio);
  const result = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, audioBuffer.length - 1);
    const t = srcIndex - srcIndexFloor;
    
    result[i] = audioBuffer[srcIndexFloor] * (1 - t) + audioBuffer[srcIndexCeil] * t;
  }
  
  return result;
}
```

## Related Documentation

- [Live API Guide](./03-live-api-guide.md)
- [Gemini 3 Overview](./01-gemini-3-overview.md)
