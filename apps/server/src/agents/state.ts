/**
 * Agent State - Extended state schema for Ocula AI
 * 
 * Extends the default message state with session-specific context.
 * This schema is used by createAgent() via stateSchema to track
 * additional data alongside the conversation history.
 * 
 * Fields:
 * - messages: Conversation history (required by createAgent)
 * - sessionId: Unique session identifier for checkpointing
 * - screenBase64: Current screen capture (injected via runtime context)
 * - thoughtSignature: Gemini 3 thought signature for stateful reasoning
 * - visualCommands: Queue of visual commands to send to client
 */

import { z } from 'zod';
import { Annotation, MessagesAnnotation } from '@langchain/langgraph';

/**
 * Visual command schema
 */
const VisualCommandSchema = z.object({
  type: z.enum(['arrow', 'highlight', 'circle', 'clear']),
  point: z.tuple([z.number(), z.number()]).optional(),
  label: z.string().optional(),
});

export type VisualCommand = z.infer<typeof VisualCommandSchema>;

/**
 * Extended agent state for Ocula AI
 * 
 * Uses LangGraph's Annotation system for state management.
 * MessagesAnnotation provides the standard messages field
 * with proper message deduplication and ordering.
 */
export const OculaAgentState = Annotation.Root({
  // Inherit standard messages from MessagesAnnotation
  ...MessagesAnnotation.spec,

  // Session identity
  sessionId: Annotation<string | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),

  // Screen capture (passed via runtime context, not stored in state)
  screenBase64: Annotation<string | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),

  // Gemini 3 thought signature for multi-turn continuity
  thoughtSignature: Annotation<string | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),

  // Visual commands accumulated during agent execution
  visualCommands: Annotation<VisualCommand[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
});

export type OculaAgentStateType = typeof OculaAgentState.State;
