/**
 * Agentic Vision - Screen analysis with Gemini 3
 * 
 * Analyzes screen captures to find UI elements and return
 * coordinates for visual grounding.
 * 
 * Day 4 Enhancements:
 * - Multi-image comparison (before/after screenshots)
 * - Bounding box detection for element highlighting
 * - Improved structured prompting for UI analysis
 * - Robust retry logic for transient failures
 * - Screen state change detection
 */

import { getGeminiClient, GeminiModels, ThinkingLevel } from './client.js';
import type { ThinkingLevelType } from './client.js';

/** Vision analysis request */
export interface VisionRequest {
  frame: string;           // Base64 JPEG image
  query: string;           // What to look for
  thinkingLevel?: ThinkingLevelType;
  thoughtSignature?: string; // For multi-turn continuity
}

/** Multi-image comparison request */
export interface CompareRequest {
  frameBefore: string;     // Base64 JPEG - previous screen state
  frameAfter: string;      // Base64 JPEG - current screen state
  query?: string;          // Optional query about the change
  thinkingLevel?: ThinkingLevelType;
}

/** UI element found in screen */
export interface UIElement {
  type: string;            // 'button' | 'link' | 'input' | 'menu' etc.
  label: string;           // Text on the element
  point: [number, number]; // [y, x] in 0-1000 normalized coordinates
  confidence: number;      // 0.0 - 1.0
  boundingBox?: [number, number, number, number]; // [y1, x1, y2, x2] normalized 0-1000
}

/** Vision analysis response */
export interface VisionResponse {
  found: boolean;
  elements: UIElement[];
  currentPage: string;     // Description of current screen state
  suggestedAction: string; // What user should do next
  thoughtSignature?: string; // For next request
}

/** Screen comparison response */
export interface CompareResponse {
  changed: boolean;
  changes: string[];       // List of detected changes
  currentPage: string;
  previousPage: string;
}

/**
 * AgenticVision - Screen analysis using Gemini 3
 * 
 * Implements the "Think-Act-Observe" pattern from Agentic Vision:
 * - THINK: Analyze the screen to understand current state
 * - ACT: Return coordinates and actions for visual guidance
 * - OBSERVE: Compare before/after screenshots to verify changes
 */
export class AgenticVision {
  private client: ReturnType<typeof getGeminiClient>;

  constructor() {
    this.client = getGeminiClient();
  }

  /**
   * Analyze screen to find UI elements
   * Supports retries for transient failures
   */
  async analyzeScreen(request: VisionRequest, retries: number = 2): Promise<VisionResponse> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this._analyzeScreenOnce(request);
      } catch (error) {
        if (attempt === retries) {
          console.error('[Vision] All retries failed:', error);
          return {
            found: false,
            elements: [],
            currentPage: 'Unable to analyze screen',
            suggestedAction: 'Please try again',
          };
        }
        console.warn(`[Vision] Attempt ${attempt + 1} failed, retrying...`);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    // Should never reach here, but satisfy TypeScript
    return {
      found: false,
      elements: [],
      currentPage: 'Unable to analyze screen',
      suggestedAction: 'Please try again',
    };
  }

  /**
   * Single analysis attempt
   */
  private async _analyzeScreenOnce(request: VisionRequest): Promise<VisionResponse> {
    const parts: any[] = [];

    // Include thought signature for multi-turn continuity
    if (request.thoughtSignature) {
      parts.push({ thoughtSignature: request.thoughtSignature });
    }

    // Add image and query
    parts.push(
      { inlineData: { mimeType: 'image/jpeg', data: request.frame } },
      { text: this.buildAnalysisPrompt(request.query) }
    );

    const response = await this.client.models.generateContent({
      model: GeminiModels.VISION,
      contents: [{ role: 'user', parts }],
      config: {
        thinkingConfig: {
          thinkingLevel: (request.thinkingLevel || ThinkingLevel.MEDIUM) as any
        }
      }
    });

    return this.parseResponse(response);
  }

  /**
   * Compare two screenshots to detect changes (Think-Act-Observe pattern)
   * 
   * Used after the user follows guidance to verify they completed the action.
   */
  async compareScreens(request: CompareRequest): Promise<CompareResponse> {
    const query = request.query || 'Compare these two screenshots and describe what changed between them.';

    try {
      const response = await this.client.models.generateContent({
        model: GeminiModels.VISION,
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: request.frameBefore } },
            { inlineData: { mimeType: 'image/jpeg', data: request.frameAfter } },
            {
              text: `${query}

Analyze both screenshots and respond in JSON format:
{
  "changed": boolean,
  "changes": ["description of each change detected"],
  "currentPage": "description of the current (second) screen state",
  "previousPage": "description of the previous (first) screen state"
}

Focus on:
- Navigation changes (different page/section)
- Modal/dialog appearances
- Form field state changes
- Menu/dropdown state changes
- Error/success messages`
            }
          ]
        }],
        config: {
          thinkingConfig: {
            thinkingLevel: (request.thinkingLevel || ThinkingLevel.MEDIUM) as any
          }
        }
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      const textPart = parts.find((p: any) => p.text && !p.thought);
      if (!textPart?.text) {
        return { changed: false, changes: [], currentPage: 'Unknown', previousPage: 'Unknown' };
      }

      const jsonMatch = textPart.text.match(/```json\n?([\s\S]*?)\n?```/) ||
                         textPart.text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : textPart.text;
      const result = JSON.parse(jsonStr);

      return {
        changed: result.changed ?? false,
        changes: result.changes || [],
        currentPage: result.currentPage || 'Unknown',
        previousPage: result.previousPage || 'Unknown',
      };

    } catch (error) {
      console.error('[Vision] Screen comparison failed:', error);
      return { changed: false, changes: [], currentPage: 'Error', previousPage: 'Error' };
    }
  }

  /**
   * Find all interactive elements on screen (comprehensive scan)
   */
  async scanInteractiveElements(frame: string): Promise<UIElement[]> {
    const result = await this.analyzeScreen({
      frame,
      query: `Identify ALL interactive elements on this screen:
- Buttons (with their labels)
- Links (navigation, action links)
- Input fields (text boxes, dropdowns, checkboxes)
- Menu items
- Tabs
- Icons that are clickable

Be thorough and include every visible interactive element.`,
      thinkingLevel: ThinkingLevel.HIGH,
    });

    return result.elements;
  }

  /**
   * Build the analysis prompt
   */
  private buildAnalysisPrompt(query: string): string {
    return `${query}

Analyze the screen and respond in JSON format:
{
  "found": boolean,
  "elements": [
    {
      "type": "button|link|input|menu|icon|text|image|tab|dropdown",
      "label": "text on or describing the element",
      "point": [y, x],
      "confidence": 0.0-1.0,
      "boundingBox": [y1, x1, y2, x2]
    }
  ],
  "currentPage": "description of current screen state",
  "suggestedAction": "what the user should do next"
}

IMPORTANT:
- Coordinates are in 0-1000 normalized space
- point[0] is Y (vertical), point[1] is X (horizontal)
- 0,0 is top-left, 1000,1000 is bottom-right
- boundingBox is [topY, leftX, bottomY, rightX] in 0-1000 space
- Be precise with coordinates - they will be used to draw visual overlays
- If element not found, set found=false and explain in suggestedAction
- Return confidence levels: 1.0 = certain, 0.5 = likely, < 0.5 = uncertain`;
  }

  /**
   * Parse Gemini response
   */
  private parseResponse(response: any): VisionResponse {
    const candidates = response.candidates || [];
    if (candidates.length === 0) {
      return {
        found: false,
        elements: [],
        currentPage: 'No response from model',
        suggestedAction: 'Please try again',
      };
    }

    const parts = candidates[0]?.content?.parts || [];
    let thoughtSignature: string | undefined;
    let analysisText: string | undefined;

    for (const part of parts) {
      if (part.thoughtSignature) {
        thoughtSignature = part.thoughtSignature;
      }
      // Get text that's not a thought (thinking content)
      if (part.text && !part.thought) {
        analysisText = part.text;
      }
    }

    if (!analysisText) {
      return {
        found: false,
        elements: [],
        currentPage: 'No analysis in response',
        suggestedAction: 'Please try again',
        thoughtSignature,
      };
    }

    try {
      // Extract JSON from response (may have markdown code blocks)
      const jsonMatch = analysisText.match(/```json\n?([\s\S]*?)\n?```/) ||
                        analysisText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : analysisText;
      const analysis = JSON.parse(jsonStr);

      return {
        found: analysis.found ?? false,
        elements: (analysis.elements || []).map((el: any) => ({
          type: el.type || 'unknown',
          label: el.label || '',
          point: el.point || [0, 0],
          confidence: el.confidence ?? 0.5,
          boundingBox: el.boundingBox,
        })),
        currentPage: analysis.currentPage || 'Unknown',
        suggestedAction: analysis.suggestedAction || '',
        thoughtSignature,
      };

    } catch (parseError) {
      console.error('[Vision] Failed to parse JSON:', parseError);
      return {
        found: false,
        elements: [],
        currentPage: analysisText,
        suggestedAction: 'Analysis format error',
        thoughtSignature,
      };
    }
  }

  /**
   * Find a specific UI element
   */
  async findElement(
    frame: string,
    elementDescription: string
  ): Promise<{ point: [number, number]; label: string; boundingBox?: [number, number, number, number] } | null> {
    const result = await this.analyzeScreen({
      frame,
      query: `Find the UI element: "${elementDescription}". Return its exact location and bounding box.`,
      thinkingLevel: ThinkingLevel.MEDIUM,
    });

    if (result.found && result.elements.length > 0) {
      const element = result.elements[0];
      return {
        point: element.point,
        label: element.label,
        boundingBox: element.boundingBox,
      };
    }

    return null;
  }
}

/**
 * Singleton instance
 */
let visionInstance: AgenticVision | null = null;

export function getAgenticVision(): AgenticVision {
  if (!visionInstance) {
    visionInstance = new AgenticVision();
  }
  return visionInstance;
}

/**
 * Convenience function for screen analysis
 */
export async function analyzeScreenWithGemini(request: VisionRequest): Promise<VisionResponse> {
  return getAgenticVision().analyzeScreen(request);
}

/**
 * Convenience function for screen comparison
 */
export async function compareScreensWithGemini(request: CompareRequest): Promise<CompareResponse> {
  return getAgenticVision().compareScreens(request);
}

export default AgenticVision;
