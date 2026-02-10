# Live API - Real-Time Multimodal Guide

> **Sources**: 
> - [ai.google.dev/gemini-api/docs/live](https://ai.google.dev/gemini-api/docs/live)
> - [ai.google.dev/gemini-api/docs/live-guide](https://ai.google.dev/gemini-api/docs/live-guide)
> - [ai.google.dev/gemini-api/docs/live-tools](https://ai.google.dev/gemini-api/docs/live-tools)
> - [ai.google.dev/gemini-api/docs/live-session](https://ai.google.dev/gemini-api/docs/live-session)
> - [ai.google.dev/gemini-api/docs/ephemeral-tokens](https://ai.google.dev/gemini-api/docs/ephemeral-tokens)
> - [Vertex AI Live API SDK](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/live-api/get-started-sdk)
> - [Vertex AI Live API WebSocket](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/live-api/get-started-websocket)

## Overview

The Live API enables real-time, bidirectional communication with Gemini for voice and video interactions via WebSockets. Key capabilities:

- **Real-time voice conversations** with natural speech
- **Video/screen streaming** for visual analysis
- **Function calling** during live sessions
- **Session management** with context preservation

## Supported Models

| Model | Use Case | Features |
|-------|----------|----------|
| `gemini-2.5-flash-preview-native-audio-dialog` | Voice conversations | Natural audio output |
| `gemini-2.5-flash-native-audio-preview-12-2025` | Native audio | Emotional speech |
| `gemini-2.0-flash-live-001` | General live | Text + audio output |

## Quick Start

### JavaScript SDK

```javascript
import { GoogleGenAI, Modality } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Create live session
const session = await ai.live.connect({
  model: 'gemini-2.5-flash-preview-native-audio-dialog',
  config: {
    responseModalities: [Modality.AUDIO, Modality.TEXT],
    systemInstruction: {
      parts: [{ text: 'You are a helpful voice assistant.' }]
    }
  }
});

// Handle responses
session.on('message', (message) => {
  if (message.serverContent) {
    const { modelTurn, turnComplete } = message.serverContent;
    
    if (modelTurn?.parts) {
      for (const part of modelTurn.parts) {
        if (part.text) {
          console.log('Text:', part.text);
        }
        if (part.inlineData?.mimeType?.startsWith('audio/')) {
          // Play audio data
          playAudio(part.inlineData.data);
        }
      }
    }
    
    if (turnComplete) {
      console.log('Turn complete');
    }
  }
});

// Send audio
session.sendRealtimeInput({
  media: {
    mimeType: 'audio/pcm;rate=16000',
    data: base64AudioData
  }
});

// Send text
session.sendClientContent({
  turns: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
  turnComplete: true
});

// Close session
session.close();
```

### WebSocket Direct Connection

```javascript
const WebSocket = require('ws');

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash-preview-native-audio-dialog';
const WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  // Send setup message
  ws.send(JSON.stringify({
    setup: {
      model: `models/${MODEL}`,
      generationConfig: {
        responseModalities: ['AUDIO', 'TEXT']
      },
      systemInstruction: {
        parts: [{ text: 'You are a helpful assistant.' }]
      }
    }
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  
  if (message.setupComplete) {
    console.log('Session ready');
  }
  
  if (message.serverContent) {
    handleServerContent(message.serverContent);
  }
});

// Send audio chunk
function sendAudio(base64Audio) {
  ws.send(JSON.stringify({
    realtimeInput: {
      mediaChunks: [{
        mimeType: 'audio/pcm;rate=16000',
        data: base64Audio
      }]
    }
  }));
}

// Send text
function sendText(text) {
  ws.send(JSON.stringify({
    clientContent: {
      turns: [{ role: 'user', parts: [{ text }] }],
      turnComplete: true
    }
  }));
}
```

## Audio Configuration

### Input Format

| Property | Value |
|----------|-------|
| Format | PCM (raw audio) |
| Bit Depth | 16-bit signed |
| Sample Rate | 16,000 Hz |
| Channels | Mono (1 channel) |
| Encoding | Little-endian |

### Output Format

| Property | Value |
|----------|-------|
| Format | PCM |
| Bit Depth | 16-bit signed |
| Sample Rate | 24,000 Hz |
| Channels | Mono |

### Converting Audio

```javascript
// Browser: Capture microphone at 16kHz
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    sampleRate: 16000,
    channelCount: 1,
    echoCancellation: true
  }
});

// Node.js: Use 'mic' package
const mic = require('mic');
const micInstance = mic({
  rate: '16000',
  channels: '1',
  bitwidth: '16',
  encoding: 'signed-integer'
});
```

## Session Management

### Session Configuration

```javascript
const session = await ai.live.connect({
  model: 'gemini-2.5-flash-preview-native-audio-dialog',
  config: {
    responseModalities: [Modality.AUDIO, Modality.TEXT],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: 'Kore' // Available: Puck, Charon, Kore, Fenrir, Aoede
        }
      }
    },
    systemInstruction: {
      parts: [{ text: 'System prompt here' }]
    },
    contextWindowCompression: {
      triggerTokens: 25000,
      slidingWindow: {
        targetTokens: 12000
      }
    }
  }
});
```

### Session Resumption

```javascript
// Get resumption token before disconnecting
const resumptionToken = session.getResumptionToken();

// Resume later
const resumedSession = await ai.live.connect({
  model: 'gemini-2.5-flash-preview-native-audio-dialog',
  config: {
    sessionResumption: {
      token: resumptionToken
    }
  }
});
```

### Context Window Compression

Automatically compress context when approaching limits:

```javascript
config: {
  contextWindowCompression: {
    triggerTokens: 25000,        // When to trigger compression
    slidingWindow: {
      targetTokens: 12000        // Target size after compression
    }
  }
}
```

## Function Calling in Live Sessions

### Define Tools

```javascript
const tools = [{
  functionDeclarations: [{
    name: 'get_weather',
    description: 'Get weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string' }
      },
      required: ['location']
    }
  }, {
    name: 'control_light',
    description: 'Control smart lights',
    parameters: {
      type: 'object',
      properties: {
        room: { type: 'string' },
        action: { type: 'string', enum: ['on', 'off', 'dim'] }
      },
      required: ['room', 'action']
    }
  }]
}];

const session = await ai.live.connect({
  model: 'gemini-2.5-flash-preview-native-audio-dialog',
  tools,
  config: {
    responseModalities: [Modality.AUDIO, Modality.TEXT]
  }
});
```

### Handle Function Calls

```javascript
session.on('message', async (message) => {
  if (message.toolCall) {
    const { functionCalls } = message.toolCall;
    
    const responses = await Promise.all(
      functionCalls.map(async (call) => {
        const result = await executeFunction(call.name, call.args);
        return {
          id: call.id,
          name: call.name,
          response: result
        };
      })
    );
    
    session.sendToolResponse({ functionResponses: responses });
  }
});

async function executeFunction(name, args) {
  switch (name) {
    case 'get_weather':
      return { temperature: 72, condition: 'sunny' };
    case 'control_light':
      return { success: true, room: args.room, state: args.action };
    default:
      return { error: 'Unknown function' };
  }
}
```

## Video/Screen Streaming

### Send Video Frames

```javascript
// Capture screen or camera frame
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.drawImage(videoElement, 0, 0);
const base64Frame = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

// Send to Live API
session.sendRealtimeInput({
  media: {
    mimeType: 'image/jpeg',
    data: base64Frame
  }
});
```

### Continuous Screen Capture

```javascript
async function startScreenCapture(session, fps = 1) {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: fps }
  });
  
  const video = document.createElement('video');
  video.srcObject = stream;
  await video.play();
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const interval = setInterval(() => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
    session.sendRealtimeInput({
      media: { mimeType: 'image/jpeg', data: base64 }
    });
  }, 1000 / fps);
  
  return () => {
    clearInterval(interval);
    stream.getTracks().forEach(t => t.stop());
  };
}
```

## Ephemeral Tokens (Browser Security)

For browser applications, use ephemeral tokens instead of exposing API keys:

### Server-Side Token Generation

```javascript
// server.js
import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/token', async (req, res) => {
  const token = await ai.live.createEphemeralToken({
    model: 'gemini-2.5-flash-preview-native-audio-dialog',
    config: {
      responseModalities: ['AUDIO', 'TEXT']
    }
  });
  
  res.json({ token: token.token, expiresAt: token.expiresAt });
});
```

### Client-Side Usage

```javascript
// client.js
async function connectWithEphemeralToken() {
  // Get token from your server
  const { token } = await fetch('/api/token', { method: 'POST' }).then(r => r.json());
  
  // Connect using token
  const ws = new WebSocket(
    `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent`
  );
  
  ws.on('open', () => {
    ws.send(JSON.stringify({
      setup: {
        ephemeralToken: token,
        model: 'models/gemini-2.5-flash-preview-native-audio-dialog'
      }
    }));
  });
}
```

## Available Voices

| Voice Name | Description |
|------------|-------------|
| `Puck` | Playful, energetic |
| `Charon` | Deep, calm |
| `Kore` | Clear, professional |
| `Fenrir` | Strong, confident |
| `Aoede` | Warm, friendly |

## Error Handling

```javascript
session.on('error', (error) => {
  console.error('Session error:', error);
  // Attempt reconnection
});

session.on('close', (event) => {
  console.log('Session closed:', event.code, event.reason);
  if (event.code !== 1000) {
    // Abnormal closure, attempt to resume
    reconnectWithToken(resumptionToken);
  }
});
```

## Best Practices

1. **Audio Processing**
   - Buffer audio chunks (100-200ms) before sending
   - Handle VAD (Voice Activity Detection) on client
   - Use proper sample rate conversion

2. **Session Management**
   - Always save resumption tokens
   - Implement reconnection logic
   - Use context compression for long sessions

3. **Performance**
   - Limit video frame rate (1-2 FPS usually sufficient)
   - Compress images before sending
   - Use ephemeral tokens in browser

4. **Error Handling**
   - Implement exponential backoff for reconnection
   - Handle network interruptions gracefully
   - Log session events for debugging

## Related Documentation

- [Gemini 3 Overview](./01-gemini-3-overview.md)
- [Thinking & Signatures](./02-thinking-and-signatures.md)
- [Audio Helpers](./05-audio-helpers.md)
