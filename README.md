# 🔮 Ocula AI

> **AI that sees, understands, and guides in real-time**

Ocula AI is a B2B embeddable widget that provides AI-powered visual support for any SaaS platform. Using Gemini 3's capabilities, it can see user screens, speak guidance through voice, and draw visual overlays pointing to UI elements.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HOST SAAS (e.g., Acme CRM)                                             │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  <script src="https://ocula.ai/widget.js"></script>               │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  OCULA CLIENT SDK (JavaScript Bundle)                                  │
│  • Screen capture via getDisplayMedia                                  │
│  • Audio capture/playback (PCM 16kHz/24kHz)                           │
│  • SVG overlay engine for visual annotations                           │
│  • WebSocket connection management                                     │
└────────────────────────────────────────────────────────────────────────┘
                                    │ WebSocket
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  OCULA SERVER (Node.js + Fastify)                                      │
│  • WebSocket server for real-time communication                        │
│  • Gemini Live API proxy for voice I/O                                │
│  • Agentic Vision for screen analysis                                  │
│  • LangGraph agent for orchestration (Phase 2)                        │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  GEMINI 3 APIs                                                         │
│  • Live API: Real-time voice conversation                              │
│  • Agentic Vision: Screen analysis with coordinates                    │
│  • Image Generation: Visual annotations (future)                       │
└────────────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
/ocula-ai
├── /apps
│   ├── /client-sdk           # Vanilla TypeScript → Single JS bundle
│   │   ├── src/
│   │   │   ├── index.ts      # Entry point, main Ocula class
│   │   │   ├── capture.ts    # Screen capture (getDisplayMedia)
│   │   │   ├── overlay.ts    # SVG drawing (arrows, highlights)
│   │   │   ├── audio.ts      # PCM audio capture/playback
│   │   │   └── connection.ts # WebSocket wrapper
│   │   └── package.json
│   │
│   └── /server               # Node.js + Fastify + WebSocket
│       ├── src/
│       │   ├── index.ts      # Server entry, WebSocket handling
│       │   ├── /config
│       │   │   └── env.ts    # Environment config
│       │   └── /gemini
│       │       ├── client.ts # Google GenAI SDK wrapper
│       │       ├── live.ts   # Live API WebSocket handler
│       │       └── vision.ts # Agentic Vision (screen analysis)
│       └── package.json
│
├── /test                     # Test HTML pages
├── package.json              # Monorepo root (pnpm workspaces)
├── pnpm-workspace.yaml
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/ocula-ai.git
cd ocula-ai

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Add your Gemini API key to .env
```

### Configuration

Edit `.env` with your settings:

```bash
# Required
GEMINI_API_KEY=your-gemini-api-key

# Optional
PORT=3001
HOST=0.0.0.0
LANGSMITH_TRACING_V2=true
LANGSMITH_API_KEY=your-langsmith-key
```

### Running

```bash
# Start both server and client dev builds
pnpm dev

# Or run individually:
pnpm dev:server   # Start server on port 3001
pnpm dev:client   # Build client SDK in watch mode
```

### Testing

1. Start the server: `pnpm dev:server`
2. Build the client: `pnpm dev:client`
3. Open `test/index.html` in a browser
4. Click "Connect to Server"
5. Start screen share
6. Type a query like "Find the settings button"

## 📦 Packages

### @ocula/client-sdk

Browser-side SDK for screen capture, audio, and visual overlays.

```javascript
// Usage
const ocula = new OculaSDK.Ocula({
  serverUrl: 'wss://api.ocula.ai/ws',
  onResponse: (text) => console.log('AI:', text),
});

await ocula.start(); // Start capture, audio, and frame streaming
ocula.sendQuery('Where is the billing section?');
```

### @ocula/server

Fastify server with WebSocket support and Gemini API integration.

```bash
# Development
pnpm --filter @ocula/server dev

# Production
pnpm --filter @ocula/server build
pnpm --filter @ocula/server start
```

## 🔧 Technical Details

### Audio Formats

| Direction | Format | Sample Rate |
|-----------|--------|-------------|
| To Gemini | PCM 16-bit mono | 16 kHz |
| From Gemini | PCM 16-bit mono | 24 kHz |

### Screen Capture

- Uses `getDisplayMedia` API
- Captures at 1 FPS (configurable)
- Outputs base64 JPEG at 70% quality
- Prefers browser tab capture

### Coordinate System

Gemini returns UI element coordinates in **normalized 0-1000 space**:
- `[0, 0]` = top-left corner
- `[1000, 1000]` = bottom-right corner
- Format: `[y, x]` (vertical, horizontal)

Convert to pixels:
```javascript
const pixelX = (normalizedX / 1000) * window.innerWidth;
const pixelY = (normalizedY / 1000) * window.innerHeight;
```

## 📅 Development Phases

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 1** | Foundation & Connectivity | ✅ Complete |
| **Phase 2** | Agentic Vision & Reasoning | 🚧 Next |
| **Phase 3** | Visual Overlay System | Planned |
| **Phase 4** | Polish & Demo | Planned |

## 📄 License

MIT License - see LICENSE for details.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.
