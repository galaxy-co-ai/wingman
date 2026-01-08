/**
 * Sessions Service
 * IPC commands for chat session management
 */

import { invokeCommand } from './tauri';
import type {
  Session,
  SessionWithMessages,
  SessionSummary,
  SessionCreateRequest,
} from '@/types';

export const sessionsService = {
  /**
   * Create a new session
   */
  create: (request: SessionCreateRequest) =>
    invokeCommand<string>('session_create', request),

  /**
   * Load a session with all messages
   */
  load: (sessionId: string) =>
    invokeCommand<SessionWithMessages>('session_load', { sessionId }),

  /**
   * Delete a session and its messages
   */
  delete: (sessionId: string) => invokeCommand<void>('session_delete', { sessionId }),

  /**
   * Rename a session
   */
  rename: (sessionId: string, title: string) =>
    invokeCommand<void>('session_rename', { sessionId, title }),

  /**
   * List sessions with summaries
   */
  list: (projectId?: string, limit = 50, offset = 0) =>
    invokeCommand<SessionSummary[]>('session_list', { projectId, limit, offset }),

  /**
   * Start the Claude CLI process for a session
   */
  startCli: (sessionId: string, resume = false) =>
    invokeCommand<void>('session_start_cli', { sessionId, resume }),

  /**
   * Stop the Claude CLI process for a session
   */
  stopCli: (sessionId: string) => invokeCommand<void>('session_stop_cli', { sessionId }),

  /**
   * Send a message to Claude
   */
  sendMessage: (sessionId: string, content: string) =>
    invokeCommand<string>('session_send_message', { sessionId, content }),

  /**
   * Cancel the current response
   */
  cancelResponse: (sessionId: string) =>
    invokeCommand<void>('session_cancel_response', { sessionId }),

  /**
   * Get a single session by ID
   */
  get: (sessionId: string) => invokeCommand<Session>('session_get', { sessionId }),

  /**
   * Save a message to the database
   */
  saveMessage: (
    sessionId: string,
    messageId: string,
    role: 'user' | 'assistant',
    content: string,
    toolUsage?: unknown[]
  ) =>
    invokeCommand<void>('session_save_message', {
      sessionId,
      messageId,
      role,
      content,
      toolUsage: toolUsage ? JSON.stringify(toolUsage) : null,
    }),
};
