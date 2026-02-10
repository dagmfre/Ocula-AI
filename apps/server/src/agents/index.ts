/**
 * Agent Entry Point - runOculaAgent() for WebSocket integration
 * 
 * Main interface between the WebSocket handler and the LangChain agent.
 * Invokes the agent with user message + screen context and returns
 * a structured response with text and visual commands.
 */

import { HumanMessage } from '@langchain/core/messages';
import { getOculaAgent } from './agent.js';

/** Visual command extracted from agent tool calls */
export interface AgentVisualCommand {
  type: 'arrow' | 'highlight' | 'circle' | 'clear';
  point?: [number, number];
  label?: string;
}

/** Result from running the agent */
export interface AgentResult {
  response: string;
  visualCommands: AgentVisualCommand[];
}

/**
 * Execute the Ocula agent for a user session
 * 
 * This is the primary entry point called by the WebSocket handler.
 * It invokes the ReAct agent which may:
 * 1. Call inspect_screen to analyze the user's screen
 * 2. Call draw_visual_guide to create visual annotations
 * 3. Call search_knowledge to find documentation
 * 4. Call clear_overlays to remove previous annotations
 * 5. Return a natural language response
 * 
 * @param input.sessionId - Unique session ID (used as thread_id for checkpointing)
 * @param input.userMessage - The user's question or request
 * @param input.screenBase64 - Current screen capture as base64 JPEG (optional)
 * @returns Agent response text and array of visual commands
 */
export async function runOculaAgent(input: {
  sessionId: string;
  userMessage: string;
  screenBase64?: string;
}): Promise<AgentResult> {
  const agent = await getOculaAgent();

  console.log(`[Agent] Running for session ${input.sessionId}: "${input.userMessage}" (screen: ${!!input.screenBase64})`);

  try {
    // Invoke the agent with session context
    const result = await agent.invoke(
      {
        messages: [new HumanMessage(input.userMessage)],
      },
      {
        // Session-based checkpointing: same thread_id = same conversation
        configurable: { thread_id: input.sessionId },
        // Inject screen capture into runtime context for middleware
        context: { screenBase64: input.screenBase64 },
        // LangSmith tracing tags
        tags: [`session:${input.sessionId}`],
        metadata: { userMessage: input.userMessage },
      }
    );

    // Extract the final response text from the last AI message
    const lastMessage = result.messages?.at(-1);
    const response = typeof lastMessage?.content === 'string'
      ? lastMessage.content
      : 'I analyzed your screen. Let me know if you need more help.';

    // Parse visual commands from tool result messages
    const visualCommands = extractVisualCommands(result.messages || []);

    console.log(`[Agent] Response: "${response.slice(0, 100)}..." | Visual commands: ${visualCommands.length}`);

    return { response, visualCommands };

  } catch (error) {
    console.error('[Agent] Execution failed:', error);
    return {
      response: `I'm having trouble processing your request. ${error instanceof Error ? error.message : 'Please try again.'}`,
      visualCommands: [],
    };
  }
}

/**
 * Extract visual commands from agent message history
 * 
 * Scans through all messages looking for ToolMessage results
 * from draw_visual_guide and clear_overlays tools.
 * Parses their JSON content to extract draw/clear commands.
 */
function extractVisualCommands(messages: unknown[]): AgentVisualCommand[] {
  const commands: AgentVisualCommand[] = [];

  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') continue;

    // Check for ToolMessage content (tool results contain our commands)
    const msgObj = msg as Record<string, any>;
    
    // Only process tool result messages
    if (msgObj.constructor?.name !== 'ToolMessage' && !('tool_call_id' in msgObj)) {
      continue;
    }

    try {
      const content = typeof msgObj.content === 'string'
        ? JSON.parse(msgObj.content)
        : msgObj.content;

      if (content?.command === 'draw') {
        commands.push({
          type: content.type as AgentVisualCommand['type'],
          point: content.point,
          label: content.label,
        });
      } else if (content?.command === 'clear') {
        commands.push({ type: 'clear' });
      }
    } catch {
      // Non-JSON content (e.g., inspect_screen results, knowledge results) — skip
    }
  }

  return commands;
}

// Re-export for convenience
export { getOculaAgent } from './agent.js';
export { oculaTools } from './tools.js';
export { streamOculaAgent } from './stream.js';
export type { StreamEvent } from './stream.js';
export type { VisualCommand } from './state.js';
