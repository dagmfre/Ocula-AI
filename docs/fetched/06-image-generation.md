# Image Generation - Nano Banana & Imagen

> **Sources**: 
> - [ai.google.dev/gemini-api/docs/image-generation](https://ai.google.dev/gemini-api/docs/image-generation) (Nano Banana)
> - [ai.google.dev/gemini-api/docs/imagen](https://ai.google.dev/gemini-api/docs/imagen) (Imagen 4)

## Overview

Google offers two primary approaches to image generation:

| Technology | Models | Best For |
|------------|--------|----------|
| **Nano Banana** | `gemini-2.5-flash-image`, `gemini-3-pro-image-preview` | Conversational image creation, editing, multi-turn workflows |
| **Imagen 4** | `imagen-4.0-generate-001`, `imagen-4.0-ultra-generate-001` | High-quality standalone image generation |

---

## Nano Banana (Gemini Image Generation)

### Available Models

| Model | Description | Features |
|-------|-------------|----------|
| `gemini-2.5-flash-image` | Fast image generation | Quick iterations |
| `gemini-3-pro-image-preview` | Advanced with thinking | 4K resolution, 14 reference images, thought signatures |

### Basic Text-to-Image

```javascript
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash-image',
  contents: [{
    role: 'user',
    parts: [{ text: 'Generate an image of a sunset over mountains' }]
  }],
  config: {
    responseModalities: ['IMAGE', 'TEXT']
  }
});

// Extract and save image
for (const part of response.candidates[0].content.parts) {
  if (part.inlineData) {
    const imageData = Buffer.from(part.inlineData.data, 'base64');
    fs.writeFileSync('sunset.png', imageData);
    console.log('Image saved!');
  }
}
```

### Image Editing

```javascript
// Load existing image
const imageData = fs.readFileSync('original.png');
const base64Image = imageData.toString('base64');

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash-image',
  contents: [{
    role: 'user',
    parts: [
      { inlineData: { mimeType: 'image/png', data: base64Image } },
      { text: 'Add a rainbow to this image' }
    ]
  }],
  config: {
    responseModalities: ['IMAGE', 'TEXT']
  }
});
```

### Multi-Turn Image Conversation

```javascript
class ImageConversation {
  constructor(ai) {
    this.ai = ai;
    this.history = [];
    this.currentImage = null;
  }

  async chat(userMessage, inputImage = null) {
    const parts = [];
    
    // Include input image if provided
    if (inputImage) {
      parts.push({ 
        inlineData: { mimeType: 'image/png', data: inputImage } 
      });
    }
    
    parts.push({ text: userMessage });
    
    this.history.push({ role: 'user', parts });

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: this.history,
      config: {
        responseModalities: ['IMAGE', 'TEXT']
      }
    });

    const assistantContent = response.candidates[0].content;
    this.history.push(assistantContent);

    // Extract results
    let text = '';
    let image = null;
    
    for (const part of assistantContent.parts) {
      if (part.text) text += part.text;
      if (part.inlineData) {
        image = part.inlineData.data;
        this.currentImage = image;
      }
    }

    return { text, image };
  }
}

// Usage
const convo = new ImageConversation(ai);
const result1 = await convo.chat('Create a cartoon cat');
const result2 = await convo.chat('Make it wear a hat'); // Edits previous image
const result3 = await convo.chat('Change the background to space');
```

### Gemini 3 Pro Image Features

```javascript
// 4K resolution with thinking
const response = await ai.models.generateContent({
  model: 'gemini-3-pro-image-preview',
  contents: [{
    role: 'user',
    parts: [{ text: 'Create a detailed architectural rendering of a modern house' }]
  }],
  config: {
    responseModalities: ['IMAGE', 'TEXT'],
    thinkingConfig: {
      thinkingLevel: 'HIGH',
      includeThoughtSignatures: true
    }
  }
});
```

### Using Reference Images (up to 14)

```javascript
const referenceImages = [
  fs.readFileSync('style1.png').toString('base64'),
  fs.readFileSync('style2.png').toString('base64'),
  fs.readFileSync('subject.png').toString('base64')
];

const parts = referenceImages.map(img => ({
  inlineData: { mimeType: 'image/png', data: img }
}));

parts.push({ 
  text: 'Combine the style of the first two images with the subject of the third' 
});

const response = await ai.models.generateContent({
  model: 'gemini-3-pro-image-preview',
  contents: [{ role: 'user', parts }],
  config: {
    responseModalities: ['IMAGE', 'TEXT']
  }
});
```

### Google Search Grounding for Images

```javascript
const response = await ai.models.generateContent({
  model: 'gemini-3-pro-image-preview',
  contents: [{
    role: 'user',
    parts: [{ text: 'Generate an image of the Eiffel Tower at sunset' }]
  }],
  tools: [{
    googleSearch: {}
  }],
  config: {
    responseModalities: ['IMAGE', 'TEXT']
  }
});
```

---

## Imagen 4

### Available Models

| Model | Description | Use Case |
|-------|-------------|----------|
| `imagen-4.0-generate-001` | Standard quality | Fast generation |
| `imagen-4.0-ultra-generate-001` | Highest quality | Premium outputs |

### Basic Generation

```javascript
const response = await ai.models.generateImages({
  model: 'imagen-4.0-generate-001',
  prompt: 'A serene Japanese garden with cherry blossoms',
  config: {
    numberOfImages: 4,
    aspectRatio: '16:9',
    outputOptions: {
      mimeType: 'image/png'
    }
  }
});

// Save all generated images
response.generatedImages.forEach((img, i) => {
  const buffer = Buffer.from(img.image.imageBytes, 'base64');
  fs.writeFileSync(`garden_${i}.png`, buffer);
});
```

### Aspect Ratios

| Ratio | Dimensions | Use Case |
|-------|------------|----------|
| `1:1` | Square | Profile pictures, icons |
| `16:9` | Landscape | Desktop wallpapers, presentations |
| `9:16` | Portrait | Mobile wallpapers, stories |
| `4:3` | Classic | General purpose |
| `3:4` | Portrait classic | Portraits |

### Prompt Engineering Guide

#### Photography Style Modifiers

```javascript
const photographyPrompts = [
  // Camera types
  "DSLR photo of...",
  "Polaroid snapshot of...",
  "35mm film photo of...",
  "Medium format photograph of...",
  
  // Lighting
  "Golden hour lighting...",
  "Studio lighting with softbox...",
  "Natural window light...",
  "Dramatic chiaroscuro lighting...",
  
  // Techniques
  "Shallow depth of field...",
  "Long exposure...",
  "Macro close-up of...",
  "Wide angle shot of..."
];
```

#### Art Style Modifiers

```javascript
const artStyles = [
  "Oil painting in the style of...",
  "Watercolor illustration of...",
  "Digital art concept of...",
  "Pencil sketch of...",
  "Anime-style illustration of...",
  "Pixel art of...",
  "3D render of...",
  "Vector illustration of..."
];
```

#### Quality Modifiers

```javascript
const qualityModifiers = [
  "highly detailed",
  "8K resolution",
  "photorealistic",
  "professional quality",
  "award-winning",
  "masterpiece"
];
```

### Advanced Configuration

```javascript
const response = await ai.models.generateImages({
  model: 'imagen-4.0-ultra-generate-001',
  prompt: `
    Professional product photography of a luxury watch,
    studio lighting with subtle reflections,
    black background, highly detailed,
    8K resolution, commercial quality
  `,
  config: {
    numberOfImages: 2,
    aspectRatio: '1:1',
    negativePrompt: 'blurry, low quality, distorted, watermark',
    outputOptions: {
      mimeType: 'image/png',
      compressionQuality: 95
    },
    safetyFilterLevel: 'BLOCK_MEDIUM_AND_ABOVE'
  }
});
```

### Safety Settings

| Level | Description |
|-------|-------------|
| `BLOCK_NONE` | No filtering |
| `BLOCK_LOW_AND_ABOVE` | Block low+ risk content |
| `BLOCK_MEDIUM_AND_ABOVE` | Block medium+ risk content |
| `BLOCK_HIGH_AND_ABOVE` | Block only high risk content |

---

## Comparison: Nano Banana vs Imagen

| Feature | Nano Banana | Imagen 4 |
|---------|-------------|----------|
| Multi-turn editing | ✅ Yes | ❌ No |
| Text understanding | ✅ Excellent | ✅ Good |
| Reference images | ✅ Up to 14 | ❌ No |
| Thinking process | ✅ Gemini 3 Pro | ❌ No |
| 4K resolution | ✅ Gemini 3 Pro | ✅ Ultra model |
| Batch generation | ❌ One at a time | ✅ Up to 4 |
| Negative prompts | ❌ No | ✅ Yes |
| Best for | Iterative creation | One-shot generation |

---

## Complete Example: Visual Guide Generator

```javascript
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

class VisualGuideGenerator {
  constructor(apiKey) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateStepByStepGuide(task, numberOfSteps = 5) {
    const guide = [];
    
    // First, get step descriptions
    const planResponse = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{
        role: 'user',
        parts: [{ 
          text: `Break down "${task}" into ${numberOfSteps} visual steps. 
                 For each step, provide a detailed image prompt.
                 Return as JSON array: [{ "step": 1, "title": "...", "imagePrompt": "..." }]`
        }]
      }],
      config: {
        thinkingConfig: { thinkingLevel: 'HIGH' }
      }
    });

    const steps = JSON.parse(planResponse.text);

    // Generate image for each step
    for (const step of steps) {
      console.log(`Generating step ${step.step}: ${step.title}`);
      
      const imageResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{
          role: 'user',
          parts: [{ text: step.imagePrompt }]
        }],
        config: {
          responseModalities: ['IMAGE', 'TEXT']
        }
      });

      let imageData = null;
      for (const part of imageResponse.candidates[0].content.parts) {
        if (part.inlineData) {
          imageData = part.inlineData.data;
        }
      }

      guide.push({
        ...step,
        image: imageData
      });
    }

    return guide;
  }

  async saveGuide(guide, outputDir) {
    fs.mkdirSync(outputDir, { recursive: true });
    
    for (const step of guide) {
      // Save image
      if (step.image) {
        const imagePath = `${outputDir}/step_${step.step}.png`;
        fs.writeFileSync(imagePath, Buffer.from(step.image, 'base64'));
      }
    }

    // Save markdown guide
    let markdown = '# Visual Guide\n\n';
    for (const step of guide) {
      markdown += `## Step ${step.step}: ${step.title}\n\n`;
      markdown += `![Step ${step.step}](./step_${step.step}.png)\n\n`;
    }
    
    fs.writeFileSync(`${outputDir}/README.md`, markdown);
  }
}

// Usage
const generator = new VisualGuideGenerator(process.env.GEMINI_API_KEY);
const guide = await generator.generateStepByStepGuide('How to make coffee with a French press');
await generator.saveGuide(guide, './coffee-guide');
```

---

## Best Practices

1. **Prompt Structure**
   ```
   [Subject] + [Style] + [Lighting] + [Composition] + [Quality modifiers]
   ```

2. **Be Specific**
   - Bad: "A dog"
   - Good: "A golden retriever puppy playing in autumn leaves, soft natural lighting, shallow depth of field"

3. **Use Negative Prompts (Imagen)**
   - Exclude unwanted elements: "blurry, low quality, distorted"

4. **Iterate with Nano Banana**
   - Start with basic prompt
   - Refine in follow-up turns

5. **Handle Rate Limits**
   ```javascript
   async function generateWithRetry(prompt, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await ai.models.generateContent({ ... });
       } catch (error) {
         if (error.status === 429) {
           await new Promise(r => setTimeout(r, 2000 * (i + 1)));
         } else {
           throw error;
         }
       }
     }
   }
   ```

## Related Documentation

- [Gemini 3 Overview](./01-gemini-3-overview.md)
- [Agentic Vision](./04-agentic-vision.md)
- [Thinking & Signatures](./02-thinking-and-signatures.md)
