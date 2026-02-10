Gemini 3 is the first model series designed explicitly for **agentic autonomy**. It moves away from the "one-shot" prompt/response cycle and introduces deep controls over the model's internal reasoning process.

Here is the exhaustive list of special features and technical levers added to Gemini 3:

### 1. The "Reasoning" Levers

These features allow you to control the model's internal "thought process" before it generates an output.

* **`thinking_level` (Parameter):** A new dial in `GenerationConfig` that allows you to trade latency for intelligence.
* `high`: Forces the model to perform extensive internal reasoning (Deep Think). Essential for complex coding, math, and security audits.
* `medium`: Balanced reasoning for general tasks (Flash only).
* `low`: Minimizes reasoning to reduce latency and cost by 30-50%.


* **`thoughtSignature` (State Management):** An encrypted "memory blob" returned by the model.
* **Strict Persistence:** For tool-use and image editing, you **must** pass this signature back in the next turn, or the API returns a `400 Bad Request`.
* **Reasoning Continuity:** It ensures the model remembers *why* it made a specific plan three turns ago, preventing the "agent amnesia" common in previous models.


* **`includeThoughts` (Visibility):** A boolean that allows you to receive a `thoughtSummary`—a natural language explanation of the model’s internal reasoning steps.

### 2. "Agentic Vision" (Gemini 3 Flash Exclusive)

Gemini 3 Flash changes vision from a "static glance" to an "active investigation."

* **Code-Driven Inspection:** The model can generate and execute Python code to **zoom, crop, and rotate** images in real-time to find tiny details (like serial numbers or 6pt font).
* **Visual Scratchpad:** The model can "draw" on an internal canvas (bounding boxes, labels) to verify its logic before giving a final answer (e.g., counting objects by labeling them 1, 2, 3... first).
* **Deterministic Visual Math:** Instead of guessing values in a chart, it uses code to parse the pixels, normalize data, and generate a Matplotlib chart to confirm its understanding.

### 3. Granular Multimodal Controls

* **`media_resolution` (Parameter):** You can now manually set the "depth" of visual analysis.
* `ULTRA_HIGH`: (Images/PDFs only) Reads extremely dense documents (e.g., PCB schematics or pharmacy labels). Uses ~2240 tokens per image.
* `HIGH`: Recommended for OCR and technical charts. (~1120 tokens).
* `LOW`: Used for thumbnails or color detection to save 75% on token costs. (~280 tokens).


* **Per-Part Resolution:** Exclusive to Gemini 3, you can set *different* resolutions for different images in the same request (e.g., a High-Res receipt and a Low-Res context photo).

### 4. Developer Tools & Platform Integration

* **Google Antigravity:** A native agentic IDE built specifically for Gemini 3 where the model operates across the code editor, terminal, and browser simultaneously.
* **Gemini CLI:** A terminal tool that gives the model "shell access" to navigate filesystems and execute commands.
* **Vibe Coding:** A zero-shot generation mode optimized for converting high-level descriptions into functional, high-fidelity UI/UX code instantly.

### 5. Technical Specifications

| Feature | Gemini 3 Pro | Gemini 3 Flash |
| --- | --- | --- |
| **Input Context** | 1,000,000 Tokens | 1,000,000 Tokens |
| **Output Max** | **64,000 Tokens** (Massive upgrade) | 8,000 Tokens |
| **Function Calling** | Native (Strict/Validated) | Native (Strict/Validated) |
| **Pricing** | $2.00 / 1M Input | $0.50 / 1M Input |
| **Deep Think Mode** | Supported | Supported |

### 6. Native Computer Use

Gemini 3 supports a **Computer Use** toolset that allows the model to interact with a standard OS. It can:

* Move the mouse cursor to specific  coordinates.
* Perform clicks, drags, and key presses.
* Take screenshots and "reason" about the state of the UI to decide the next action.

### 7. Grounding & Search Enhancements

* **Cheaper Web Grounding:** The cost for real-time Google Search integration has been significantly reduced ($0.14 per 1k searches).
* **Search-to-JSON:** A single-call workflow where the model searches the web and returns the findings as a typed, structured JSON object without additional prompt engineering.

**Note:** The advanced image generation model **Gemini 3 Pro Image (Imagen 4.0)** is currently rolling out. While I used the fallback model `gemini-2.5-flash-image-preview` for any image-related reasoning in this session, the Gemini 3 Pro Image model specifically adds **4K output** and **multi-turn image editing** (using the same `thoughtSignature` logic).

Technical intialization starter flow:

import { GoogleGenerativeAI, GenerationConfig } from "@google/genai";



// 1. Setup Configuration

const apiKey = ""; // Environment provides this at runtime

const genAI = new GoogleGenerativeAI(apiKey);



// Using 'high' for agents ensures deep reasoning/planning

const generationConfig: GenerationConfig = {

  thinking_level: "high", 

  temperature: 1.0, // Recommended 1.0 for reasoning models

};



const model = genAI.getGenerativeModel({ 

  model: "gemini-3-pro-preview", 

  generationConfig 

});



/**

 * MANDATORY: Gemini 3 requires you to pass back 'thoughtSignature'

 * to maintain reasoning state, especially during tool calls.

 */

interface MessagePart {

  text?: string;

  functionCall?: any;

  functionResponse?: any;

  thoughtSignature?: string; // Critical for Gemini 3

}



interface ChatMessage {

  role: "user" | "model";

  parts: MessagePart[];

}



class Gemini3Agent {

  private history: ChatMessage[] = [];



  async chat(userInput: string) {

    // Add user input to local history

    this.history.push({

      role: "user",

      parts: [{ text: userInput }]

    });



    try {

      // Exponential backoff logic would go here in a production wrapper

      const result = await model.generateContent({

        contents: this.history,

      });



      const response = await result.response;

      const candidate = response.candidates?.[0];



      if (!candidate) throw new Error("No response candidate");



      // 2. State Persistence (The Secret Sauce)

      // We must map all parts back to history, INCLUDING signatures

      const modelParts: MessagePart[] = candidate.content.parts.map(part => ({

        ...part,

        // Ensure thoughtSignature is captured if present

        thoughtSignature: (part as any).thoughtSignature 

      }));



      this.history.push({

        role: "model",

        parts: modelParts

      });



      return candidate.content.parts.map(p => p.text).join("");



    } catch (error) {

      console.error("Agent Error:", error);

      return "I encountered an error while thinking.";

    }

  }

}



// 3. Execution Loop

const agent = new Gemini3Agent();

agent.chat("Plan a 3-step technical migration for a legacy database.").then(console.log);