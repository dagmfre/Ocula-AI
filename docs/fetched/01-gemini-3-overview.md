# Gemini 3 Developer Guide

> **Source**: [ai.google.dev/gemini-api/docs/gemini-3](https://ai.google.dev/gemini-api/docs/gemini-3)

## Overview

Gemini 3 is Google's latest generation of AI models, designed for advanced reasoning, multimodal understanding, and agentic capabilities. The family includes:

- **Gemini 3 Pro** - Most capable model for complex tasks
- **Gemini 3 Flash** - Fast, efficient model for real-time applications

## Available Models

| Model | Description | Use Cases |
|-------|-------------|-----------|
| `gemini-3-pro-preview` | Advanced reasoning with thinking | Complex analysis, code generation |
| `gemini-3-flash-preview` | Fast multimodal processing | Real-time applications, agentic vision |
| `gemini-3-pro-image-preview` | Image generation with thinking | High-quality image creation |

## Key Features

### 1. Thinking Capabilities

Gemini 3 models support configurable thinking depth:

```javascript
const response = await ai.models.generateContent({
  model: 'gemini-3-pro-preview',
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  config: {
    thinkingConfig: {
      thinkingLevel: 'HIGH' // HIGH, MEDIUM, LOW, MINIMAL
    }
  }
});
```

### 2. Thought Signatures

Enable stateful reasoning across multiple API calls:

```javascript
const response = await ai.models.generateContent({
  model: 'gemini-3-pro-preview',
  contents: messages,
  config: {
    thinkingConfig: {
      includeThoughtSignatures: true
    }
  }
});
```

### 3. Agentic Vision

Gemini 3 Flash introduces "Agentic Vision" - the ability to understand visual content and take autonomous actions:

- **Think**: Analyze screen content
- **Act**: Execute UI actions
- **Observe**: Verify results

### 4. Native Audio Output

Real-time voice conversations with emotion and natural speech:

```javascript
const model = 'gemini-2.5-flash-native-audio-preview-12-2025';
```

## Migration from Gemini 2.x

### Key Changes

1. **Thinking Configuration**
   - Old: `thinkingBudget` (deprecated)
   - New: `thinkingLevel` (HIGH/MEDIUM/LOW/MINIMAL)

2. **Thought Signatures**
   - Now required for function calling
   - Recommended for all multi-turn conversations

3. **Model Names**
   - Update from `gemini-2.5-*` to `gemini-3-*` variants

### Migration Checklist

- [ ] Update model names to Gemini 3 variants
- [ ] Replace `thinkingBudget` with `thinkingLevel`
- [ ] Enable `includeThoughtSignatures` for function calling
- [ ] Test stateful reasoning across conversation turns

## Best Practices

1. **Use appropriate thinking levels**
   - `HIGH`: Complex reasoning, code analysis
   - `MEDIUM`: General tasks with moderate complexity
   - `LOW`: Simple queries, fast responses
   - `MINIMAL`: Basic completions

2. **Always enable thought signatures for:**
   - Function calling workflows
   - Multi-turn conversations
   - Agentic applications

3. **Handle thinking parts in responses**
   ```javascript
   response.candidates[0].content.parts.forEach(part => {
     if (part.thought) {
       // Internal reasoning (may be hidden)
     } else if (part.text) {
       // Actual response to user
     }
   });
   ```

## Related Documentation

- [Thinking Configuration](./02-thinking-and-signatures.md)
- [Thought Signatures](./02-thinking-and-signatures.md)
- [Agentic Vision](./04-agentic-vision.md)
- [Live API](./03-live-api-guide.md)
