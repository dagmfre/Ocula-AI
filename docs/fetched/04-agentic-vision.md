# Agentic Vision & Image Understanding

> **Sources**: 
> - [blog.google/agentic-vision-gemini-3-flash](https://blog.google/innovation-and-ai/technology/developers-tools/agentic-vision-gemini-3-flash/)
> - [ai.google.dev/gemini-api/docs/image-understanding](https://ai.google.dev/gemini-api/docs/image-understanding)
> - [deepmind.google/models/gemini/flash](https://deepmind.google/models/gemini/flash/)

## Overview

Agentic Vision is a breakthrough capability in Gemini 3 Flash that enables the model to understand visual content and take autonomous actions. It introduces the **Think-Act-Observe** loop for UI automation.

## Agentic Vision Capabilities

### Think-Act-Observe Loop

```
┌─────────────────────────────────────────┐
│                 THINK                    │
│   Analyze screen, understand context     │
│   Plan actions to achieve goal           │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│                  ACT                     │
│   Execute UI action (click, type, etc)   │
│   Interact with application              │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│                OBSERVE                   │
│   Capture new screen state               │
│   Verify action result                   │
│   Determine if goal achieved             │
└────────────────────┬────────────────────┘
                     │
         ┌───────────┴───────────┐
         │ Goal achieved?        │
         └───────────┬───────────┘
              No     │     Yes
              │      │      │
              ▼      │      ▼
         [Continue]  │   [Done]
              │      │
              └──────┘
```

### Supported Actions

| Action | Description | Parameters |
|--------|-------------|------------|
| `click` | Click at coordinates | `x`, `y` |
| `type` | Type text | `text` |
| `scroll` | Scroll in direction | `direction`, `amount` |
| `drag` | Drag from A to B | `startX`, `startY`, `endX`, `endY` |
| `wait` | Wait for element | `duration` |
| `screenshot` | Capture screen | - |

## Image Understanding

### Basic Image Analysis

```javascript
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// From file
const imageData = fs.readFileSync('screenshot.png');
const base64Image = imageData.toString('base64');

const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: [{
    role: 'user',
    parts: [
      { inlineData: { mimeType: 'image/png', data: base64Image } },
      { text: 'Describe what you see in this screenshot' }
    ]
  }]
});

console.log(response.text);
```

### Screen Analysis for UI Automation

```javascript
async function analyzeScreen(base64Image) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: 'image/png', data: base64Image } },
        { text: `Analyze this screen and identify:
1. All interactive elements (buttons, links, inputs)
2. Their approximate coordinates
3. Any visible text
4. The current application state

Return as JSON:
{
  "elements": [
    { "type": "button", "text": "...", "x": 100, "y": 200 }
  ],
  "state": "description of current state"
}` }
      ]
    }],
    config: {
      thinkingConfig: { thinkingLevel: 'HIGH' }
    }
  });

  return JSON.parse(response.text);
}
```

### Grounding with Bounding Boxes

```javascript
const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: [{
    role: 'user',
    parts: [
      { inlineData: { mimeType: 'image/png', data: base64Image } },
      { text: 'Find and locate the "Submit" button. Return bounding box coordinates.' }
    ]
  }]
});

// Response includes bounding box: [x1, y1, x2, y2]
```

## Building an Agentic Vision System

### Agent Architecture

```javascript
class ScreenAgent {
  constructor(ai, executor) {
    this.ai = ai;
    this.executor = executor; // Handles actual UI actions
    this.history = [];
    this.maxIterations = 10;
  }

  async execute(goal) {
    for (let i = 0; i < this.maxIterations; i++) {
      // 1. OBSERVE - Capture current screen
      const screenshot = await this.executor.captureScreen();
      
      // 2. THINK - Analyze and plan
      const analysis = await this.analyzeAndPlan(screenshot, goal);
      
      if (analysis.goalAchieved) {
        return { success: true, iterations: i + 1 };
      }
      
      if (!analysis.nextAction) {
        return { success: false, reason: 'No action determined' };
      }
      
      // 3. ACT - Execute the action
      await this.executor.executeAction(analysis.nextAction);
      
      // Store in history for context
      this.history.push({
        screenshot: screenshot.substring(0, 100) + '...', // Truncated
        action: analysis.nextAction,
        reasoning: analysis.reasoning
      });
      
      // Small delay for UI to update
      await this.delay(500);
    }
    
    return { success: false, reason: 'Max iterations reached' };
  }

  async analyzeAndPlan(screenshot, goal) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/png', data: screenshot } },
          { text: `Goal: ${goal}

Previous actions: ${JSON.stringify(this.history.slice(-3))}

Analyze the current screen state and determine:
1. Is the goal achieved? (boolean)
2. What is the current state?
3. What action should be taken next?

Respond in JSON:
{
  "goalAchieved": boolean,
  "currentState": "description",
  "reasoning": "step by step reasoning",
  "nextAction": {
    "type": "click|type|scroll|wait",
    "params": { ... }
  } | null
}` }
        ]
      }],
      config: {
        thinkingConfig: {
          thinkingLevel: 'HIGH',
          includeThoughtSignatures: true
        }
      }
    });

    return JSON.parse(response.text);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Action Executor (Puppeteer Example)

```javascript
const puppeteer = require('puppeteer');

class PuppeteerExecutor {
  constructor(page) {
    this.page = page;
  }

  async captureScreen() {
    const screenshot = await this.page.screenshot({ encoding: 'base64' });
    return screenshot;
  }

  async executeAction(action) {
    switch (action.type) {
      case 'click':
        await this.page.mouse.click(action.params.x, action.params.y);
        break;
        
      case 'type':
        await this.page.keyboard.type(action.params.text);
        break;
        
      case 'scroll':
        await this.page.mouse.wheel({
          deltaY: action.params.direction === 'down' ? 100 : -100
        });
        break;
        
      case 'wait':
        await new Promise(r => setTimeout(r, action.params.duration));
        break;
    }
  }
}

// Usage
const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();
await page.goto('https://example.com');

const executor = new PuppeteerExecutor(page);
const agent = new ScreenAgent(ai, executor);

const result = await agent.execute('Fill out the contact form with name "John Doe"');
console.log('Result:', result);
```

## Visual Thinking with Code Execution

Gemini 3 can generate and execute code to analyze visual data:

```javascript
const response = await ai.models.generateContent({
  model: 'gemini-3-pro-preview',
  contents: [{
    role: 'user',
    parts: [
      { inlineData: { mimeType: 'image/png', data: chartImage } },
      { text: 'Extract the data from this chart and calculate the trend' }
    ]
  }],
  tools: [{
    codeExecution: {}
  }],
  config: {
    thinkingConfig: { thinkingLevel: 'HIGH' }
  }
});

// Model may execute Python code to analyze the chart data
```

## Multi-Image Analysis

```javascript
const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: [{
    role: 'user',
    parts: [
      { inlineData: { mimeType: 'image/png', data: beforeImage } },
      { inlineData: { mimeType: 'image/png', data: afterImage } },
      { text: 'Compare these two screenshots and describe what changed' }
    ]
  }]
});
```

## Document Understanding

```javascript
// Analyze PDF pages as images
const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: [{
    role: 'user',
    parts: [
      { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
      { text: 'Extract all tables and their data from this document' }
    ]
  }]
});
```

## Best Practices

### 1. Image Quality
- Use PNG for screenshots (lossless)
- JPEG for photos (smaller size)
- Optimal resolution: 1024x1024 to 2048x2048

### 2. Prompting for Vision
```javascript
// Good: Specific, structured request
"Identify all form fields in this screenshot. For each field, provide:
- Field label
- Field type (text, dropdown, checkbox)
- Current value if any
- Bounding box coordinates [x, y, width, height]"

// Bad: Vague request
"What's in this image?"
```

### 3. Coordinate System
- Origin (0,0) is top-left
- X increases to the right
- Y increases downward
- Use normalized coordinates (0-1) when possible

### 4. Error Handling
```javascript
async function robustAnalysis(image, prompt, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [
          { inlineData: { mimeType: 'image/png', data: image } },
          { text: prompt }
        ]}]
      });
      
      // Validate JSON response
      const parsed = JSON.parse(response.text);
      return parsed;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

## Supported Image Formats

| Format | MIME Type | Max Size |
|--------|-----------|----------|
| PNG | image/png | 20MB |
| JPEG | image/jpeg | 20MB |
| WebP | image/webp | 20MB |
| GIF | image/gif | 20MB |
| PDF | application/pdf | 20MB |

## Related Documentation

- [Gemini 3 Overview](./01-gemini-3-overview.md)
- [Live API for Real-time Vision](./03-live-api-guide.md)
- [Image Generation](./06-image-generation.md)
