/**
 * Agent Streaming - Real-time feedback during agent execution
 * 
 * Uses LangGraph's stream() method to yield intermediate results
 * as the agent processes tool calls and generates responses.
 * This enables real-time UI updates (e.g., showing "Analyzing screen..."
 * while the inspect_screen tool runs).
 */

import { HumanMessage } from '@langchain/core/messages';
import { getOculaAgent } from './agent.js';

/** Stream event types */
export interface StreamEvent {
  type: 'text' | 'tool_call' | 'tool_result' | 'done';
  content?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
}

/**
 * Stream agent responses for real-time UI updates
 * 
 * Yields events as the agent processes:
 * 1. tool_call - Agent decided to call a tool
 * 2. text - Agent generated text content
 * 3. done - Agent finished processing
 * 
 * @param input.sessionId - Session ID for checkpointing
 * @param input.userMessage - User's question or request
 * @param input.screenBase64 - Current screen capture (base64 JPEG)
 */
export async function* streamOculaAgent(input: {
  sessionId: string;
  userMessage: string;
  screenBase64?: string;
}): AsyncGenerator<StreamEvent> {
  const agent = await getOculaAgent();

  try {
    const stream = await agent.stream(
      {
        messages: [new HumanMessage(input.userMessage)],
      },
      {
        configurable: { thread_id: input.sessionId },
        context: { screenBase64: input.screenBase64 },
        streamMode: 'values' as const,
      }
    );

    let lastMessageCount = 0;

    for await (const chunk of stream) {
      const messages = chunk.messages || [];
      
      // Only process new messages since last chunk
      if (messages.length > lastMessageCount) {
        const newMessages = messages.slice(lastMessageCount);
        
        for (const msg of newMessages) {
          // AI message with tool calls
          const msgAny = msg as any;
          if (msgAny.tool_calls && msgAny.tool_calls.length > 0) {
            for (const toolCall of msgAny.tool_calls) {
              yield {
                type: 'tool_call',
                toolName: toolCall.name,
                toolArgs: toolCall.args,
              };
            }
          }
          
          // AI message with text content
          if (typeof msg.content === 'string' && msg.content.length > 0) {
            yield {
              type: 'text',
              content: msg.content,
            };
          }
          
          // Tool result message
          if (msg.constructor?.name === 'ToolMessage') {
            yield {
              type: 'tool_result',
              content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
            };
          }
        }
        
        lastMessageCount = messages.length;
      }
    }

    yield { type: 'done' };
  } catch (error) {
    console.error('[Agent Stream] Error:', error);
    yield {
      type: 'text',
      content: `I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
    yield { type: 'done' };
  }
}
