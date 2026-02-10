# Thinking & Thought Signatures Guide

> **Sources**: 
> - [ai.google.dev/gemini-api/docs/thinking](https://ai.google.dev/gemini-api/docs/thinking)
> - [ai.google.dev/gemini-api/docs/thought-signatures](https://ai.google.dev/gemini-api/docs/thought-signatures)
> - [Medium: Migrating to Gemini 3](https://medium.com/google-cloud/migrating-to-gemini-3-implementing-stateful-reasoning-with-thought-signatures-4f11b625a8c9)

## Overview

Gemini's thinking capabilities allow models to engage in internal reasoning before generating responses. Combined with thought signatures, this enables stateful reasoning across multiple API calls.

## Thinking Configuration

### Thinking Levels

| Level | Description | Token Budget | Use Case |
|-------|-------------|--------------|----------|
| `HIGH` | Deep reasoning | ~16K tokens | Complex analysis, coding |
| `MEDIUM` | Balanced | ~8K tokens | General multi-step tasks |
| `LOW` | Light reasoning | ~4K tokens | Simple queries |
| `MINIMAL` | Quick responses | ~1K tokens | Basic completions |

### Basic Usage

```javascript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: 'gemini-3-pro-preview',
  contents: [{ role: 'user', parts: [{ text: 'Explain quantum entanglement' }] }],
  config: {
    thinkingConfig: {
      thinkingLevel: 'HIGH'
    }
  }
});
```

### Accessing Thinking Output

```javascript
const response = await ai.models.generateContent({
  model: 'gemini-3-pro-preview',
  contents: messages,
  config: {
    thinkingConfig: {
      thinkingLevel: 'MEDIUM',
      includeThoughts: true // Include thinking in response
    }
  }
});

// Parse response parts
response.candidates[0].content.parts.forEach(part => {
  if (part.thought === true) {
    console.log('Thinking:', part.text);
  } else {
    console.log('Response:', part.text);
  }
});
```

## Thought Signatures

### What Are Thought Signatures?

Thought signatures are **encrypted tokens** that capture the model's reasoning state. They allow:

- **Stateful reasoning** across multiple API calls
- **Continuity** in multi-turn conversations
- **Consistent function calling** behavior

### Why Use Thought Signatures?

1. **Required for Function Calling** - Gemini 3 requires thought signatures for reliable function execution
2. **Improved Reasoning** - Maintains context and reasoning state between turns
3. **Cost Efficient** - Reduces redundant reasoning by preserving thought state
4. **Better Consistency** - Ensures coherent responses in complex workflows

### Enabling Thought Signatures

```javascript
const response = await ai.models.generateContent({
  model: 'gemini-3-pro-preview',
  contents: conversationHistory,
  config: {
    thinkingConfig: {
      thinkingLevel: 'HIGH',
      includeThoughtSignatures: true
    }
  }
});
```

### Extracting & Using Signatures

```javascript
// Extract thought signature from response
function extractThoughtSignature(response) {
  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.thoughtSignature) {
      return part.thoughtSignature;
    }
  }
  return null;
}

// Include signature in next request
function buildMessageWithSignature(text, signature) {
  const parts = [{ text }];
  if (signature) {
    parts.unshift({ thoughtSignature: signature });
  }
  return { role: 'user', parts };
}
```

### Complete Multi-Turn Example

```javascript
import { GoogleGenAI } from '@google/genai';

class StatefulConversation {
  constructor(apiKey) {
    this.ai = new GoogleGenAI({ apiKey });
    this.history = [];
    this.lastSignature = null;
  }

  async sendMessage(userMessage) {
    // Build message with thought signature if available
    const userContent = {
      role: 'user',
      parts: this.lastSignature 
        ? [{ thoughtSignature: this.lastSignature }, { text: userMessage }]
        : [{ text: userMessage }]
    };

    this.history.push(userContent);

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: this.history,
      config: {
        thinkingConfig: {
          thinkingLevel: 'HIGH',
          includeThoughtSignatures: true
        }
      }
    });

    // Extract new thought signature
    const assistantContent = response.candidates[0].content;
    this.lastSignature = this.extractSignature(assistantContent);
    
    // Add to history (without internal thoughts)
    this.history.push(this.cleanContentForHistory(assistantContent));

    return this.extractTextResponse(assistantContent);
  }

  extractSignature(content) {
    for (const part of content.parts) {
      if (part.thoughtSignature) return part.thoughtSignature;
    }
    return null;
  }

  extractTextResponse(content) {
    return content.parts
      .filter(part => part.text && !part.thought)
      .map(part => part.text)
      .join('');
  }

  cleanContentForHistory(content) {
    return {
      role: content.role,
      parts: content.parts.filter(part => !part.thought || part.thoughtSignature)
    };
  }
}

// Usage
const conversation = new StatefulConversation(process.env.GEMINI_API_KEY);
const response1 = await conversation.sendMessage("What's the capital of France?");
const response2 = await conversation.sendMessage("What's its population?"); // Maintains context
```

## Function Calling with Thought Signatures

### Mandatory for Gemini 3

```javascript
const tools = [{
  functionDeclarations: [{
    name: 'get_weather',
    description: 'Get current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name' }
      },
      required: ['location']
    }
  }]
}];

const response = await ai.models.generateContent({
  model: 'gemini-3-pro-preview',
  contents: messages,
  tools,
  config: {
    thinkingConfig: {
      thinkingLevel: 'MEDIUM',
      includeThoughtSignatures: true // REQUIRED for function calling
    }
  }
});

// Handle function call
if (response.candidates[0].content.parts[0].functionCall) {
  const functionCall = response.candidates[0].content.parts[0].functionCall;
  const signature = extractThoughtSignature(response);
  
  // Execute function and send result back with signature
  const result = await executeFunction(functionCall);
  
  const followUp = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      ...messages,
      response.candidates[0].content,
      {
        role: 'user',
        parts: [
          { thoughtSignature: signature },
          { functionResponse: { name: functionCall.name, response: result } }
        ]
      }
    ],
    tools,
    config: {
      thinkingConfig: {
        thinkingLevel: 'MEDIUM',
        includeThoughtSignatures: true
      }
    }
  });
}
```

## Response Structure

### Parts Breakdown

```javascript
{
  "candidates": [{
    "content": {
      "role": "model",
      "parts": [
        {
          "thought": true,
          "text": "Let me analyze this step by step..."
        },
        {
          "thoughtSignature": "encrypted_base64_signature_token..."
        },
        {
          "text": "The answer to your question is..."
        }
      ]
    }
  }]
}
```

### Part Types

| Part Type | Description | Include in History |
|-----------|-------------|-------------------|
| `thought: true` | Internal reasoning (optional visibility) | No |
| `thoughtSignature` | Encrypted state token | Yes |
| `text` (no thought flag) | Actual response | Yes |
| `functionCall` | Tool invocation request | Yes |

## Best Practices

1. **Always enable for function calling** - Required for reliable execution
2. **Preserve signatures in history** - Don't strip them between turns
3. **Don't expose raw thoughts to users** - Filter `thought: true` parts
4. **Match thinking level to task complexity**
5. **Handle missing signatures gracefully** - First turn won't have one

## Migration Notes

### From thinkingBudget to thinkingLevel

```javascript
// OLD (deprecated)
config: {
  thinkingConfig: {
    thinkingBudget: 8192
  }
}

// NEW (Gemini 3)
config: {
  thinkingConfig: {
    thinkingLevel: 'HIGH' // or MEDIUM, LOW, MINIMAL
  }
}
```

## Related Documentation

- [Gemini 3 Overview](./01-gemini-3-overview.md)
- [Live API Guide](./03-live-api-guide.md)
- [Function Calling Best Practices](./03-live-api-guide.md#tools)
