# Gemini 3 Ecosystem Documentation

> Comprehensive documentation extracted and organized from official Google AI sources for the Ocula AI Hackathon project.

## 📚 Documentation Index

| # | Document | Description |
|---|----------|-------------|
| 1 | [Gemini 3 Overview](./01-gemini-3-overview.md) | Core models, features, and migration guide |
| 2 | [Thinking & Signatures](./02-thinking-and-signatures.md) | Thinking levels, thought signatures, stateful reasoning |
| 3 | [Live API Guide](./03-live-api-guide.md) | Real-time voice/video, WebSockets, session management |
| 4 | [Agentic Vision](./04-agentic-vision.md) | Think-Act-Observe loop, UI automation, image understanding |
| 5 | [Audio Helpers](./05-audio-helpers.md) | PCM player, microphone capture, audio conversion |
| 6 | [Image Generation](./06-image-generation.md) | Nano Banana, Imagen 4, visual guide creation |

---

## 🚀 Quick Start

### Installation

```bash
npm install @google/genai
```

### Basic Setup

```javascript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
```

---

## 🎯 Ocula AI Phase Mapping

| Phase | Documentation | Key APIs |
|-------|---------------|----------|
| **Phase 1: Foundation** | [01-gemini-3-overview](./01-gemini-3-overview.md) | `gemini-3-pro-preview`, `gemini-3-flash-preview` |
| **Phase 2: Agentic Vision** | [04-agentic-vision](./04-agentic-vision.md) | Image understanding, bounding boxes, screen analysis |
| **Phase 3: Live Voice** | [03-live-api-guide](./03-live-api-guide.md), [05-audio-helpers](./05-audio-helpers.md) | Live API, WebSockets, PCM audio |
| **Phase 4: Visual Guides** | [06-image-generation](./06-image-generation.md) | Nano Banana, Imagen 4 |
| **Phase 5: Integration** | All documentation | Combined workflows |

---

## 📋 Model Quick Reference

### Text & Reasoning

| Model | Use Case |
|-------|----------|
| `gemini-3-pro-preview` | Complex reasoning, code analysis |
| `gemini-3-flash-preview` | Fast responses, agentic vision |

### Voice & Real-time

| Model | Use Case |
|-------|----------|
| `gemini-2.5-flash-preview-native-audio-dialog` | Voice conversations |
| `gemini-2.5-flash-native-audio-preview-12-2025` | Native audio output |

### Image Generation

| Model | Use Case |
|-------|----------|
| `gemini-2.5-flash-image` | Fast image generation |
| `gemini-3-pro-image-preview` | 4K with thinking |
| `imagen-4.0-generate-001` | High-quality standalone |
| `imagen-4.0-ultra-generate-001` | Premium quality |

---

## 🔗 Original Sources

### Core Documentation
- [Gemini 3 Docs](https://ai.google.dev/gemini-api/docs/gemini-3)
- [Thinking](https://ai.google.dev/gemini-api/docs/thinking)
- [Thought Signatures](https://ai.google.dev/gemini-api/docs/thought-signatures)

### Live API
- [Live API](https://ai.google.dev/gemini-api/docs/live)
- [Live Guide](https://ai.google.dev/gemini-api/docs/live-guide)
- [Live Tools](https://ai.google.dev/gemini-api/docs/live-tools)
- [Session Management](https://ai.google.dev/gemini-api/docs/live-session)
- [Ephemeral Tokens](https://ai.google.dev/gemini-api/docs/ephemeral-tokens)

### Vision & Images
- [Image Understanding](https://ai.google.dev/gemini-api/docs/image-understanding)
- [Image Generation](https://ai.google.dev/gemini-api/docs/image-generation)
- [Imagen](https://ai.google.dev/gemini-api/docs/imagen)
- [Agentic Vision Blog](https://blog.google/innovation-and-ai/technology/developers-tools/agentic-vision-gemini-3-flash/)

### Vertex AI
- [Live API SDK](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/live-api/get-started-sdk)
- [Live API WebSocket](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/live-api/get-started-websocket)

### NPM Packages
- [pcm-player](https://www.npmjs.com/package/pcm-player)
- [mic](https://www.npmjs.com/package/mic)

### SDK
- [generative-ai-js](https://github.com/google-gemini/generative-ai-js)

---

## 📅 Last Updated

Documentation fetched and organized: **January 2025**

---

*Generated for the Google AI Hackathon - Ocula AI Project*
