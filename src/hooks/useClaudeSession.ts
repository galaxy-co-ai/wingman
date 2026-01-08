/**
 * useClaudeSession Hook
 * Manages the connection to Claude CLI for a session
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import { invokeCommand, subscribeToEvent } from '@/services/tauri';
import { sessionsService } from '@/services/sessions';
import { activityService } from '@/services/activity';
import { useSessionsStore, useUIStore } from '@/stores';
import { EVENTS } from '@/types/events.types';
import type {
  Session,
  Message,
  ClaudeStatus,
  ClaudeOutputPayload,
  ClaudeStatusPayload,
  ClaudeErrorPayload,
} from '@/types';

/** Tool names that write to files */
const FILE_WRITE_TOOLS = ['Write', 'Edit', 'write_file', 'edit_file', 'str_replace_editor'];

/** Extract file path from tool input */
function getFilePathFromToolInput(input: Record<string, unknown>): string | null {
  // Common keys for file paths in tool inputs
  const pathKeys = ['file_path', 'path', 'filePath', 'file'];
  for (const key of pathKeys) {
    if (typeof input[key] === 'string') {
      return input[key] as string;
    }
  }
  return null;
}

interface SessionCreateRequest {
  workingDirectory: string;
  projectId?: string;
  title?: string;
}

interface SessionWithMessagesResponse {
  session: Session;
  messages: Message[];
}

export interface UseClaudeSessionResult {
  // State
  session: Session | null;
  messages: Message[];
  status: ClaudeStatus;
  streamingMessageId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  createSession: (request: SessionCreateRequest) => Promise<Session>;
  loadSession: (sessionId: string) => Promise<void>;
  startCli: (resume?: boolean) => Promise<void>;
  stopCli: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  cancelResponse: () => Promise<void>;
}

export function useClaudeSession(sessionId?: string): UseClaudeSessionResult {
  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);

  // Store state and actions
  const {
    sessions,
    messages: allMessages,
    sessionStatuses,
    addSession,
    loadSessionWithMessages,
    addMessage,
    updateStreamingMessage,
    completeMessage,
    addErrorMessage,
    setSessionStatus,
  } = useSessionsStore();

  const { addNotification } = useUIStore();

  // Get current session data
  const session = sessionId ? sessions[sessionId] ?? null : null;
  const messages = sessionId ? allMessages[sessionId] ?? [] : [];
  const status = sessionId ? sessionStatuses[sessionId] ?? 'stopped' : 'stopped';

  // Update ref when sessionId changes
  useEffect(() => {
    currentSessionIdRef.current = sessionId ?? null;
  }, [sessionId]);

  // Subscribe to Claude events
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribes: Array<() => void> = [];

    // Subscribe to output events
    subscribeToEvent<ClaudeOutputPayload>(EVENTS.CLAUDE_OUTPUT, async (payload) => {
      if (payload.sessionId !== currentSessionIdRef.current) return;

      if (payload.chunk) {
        updateStreamingMessage(payload.messageId, payload.chunk, payload.toolUsage);
        setStreamingMessageId(payload.messageId);
      }

      // Record file writes for source attribution when tool usage is detected
      if (payload.toolUsage) {
        const toolName = payload.toolUsage.name;
        if (FILE_WRITE_TOOLS.includes(toolName)) {
          const filePath = getFilePathFromToolInput(payload.toolUsage.input);
          if (filePath) {
            activityService.recordClaudeWrite(payload.sessionId, filePath).catch((err) => {
              console.error('Failed to record Claude write:', err);
            });
          }
        }
      }

      if (payload.isComplete) {
        completeMessage(payload.messageId);
        setStreamingMessageId(null);

        // Save the completed assistant message to the database
        const sessionMessages = useSessionsStore.getState().messages[payload.sessionId];
        const completedMessage = sessionMessages?.find((m) => m.id === payload.messageId);
        if (completedMessage) {
          try {
            await sessionsService.saveMessage(
              payload.sessionId,
              completedMessage.id,
              'assistant',
              completedMessage.content,
              completedMessage.toolUsage
            );
          } catch (err) {
            console.error('Failed to save assistant message:', err);
          }
        }
      }
    }).then((unsub) => unsubscribes.push(unsub));

    // Subscribe to status events
    subscribeToEvent<ClaudeStatusPayload>(EVENTS.CLAUDE_STATUS, (payload) => {
      if (payload.sessionId !== currentSessionIdRef.current) return;
      setSessionStatus(payload.sessionId, payload.status as ClaudeStatus);
    }).then((unsub) => unsubscribes.push(unsub));

    // Subscribe to error events
    subscribeToEvent<ClaudeErrorPayload>(EVENTS.CLAUDE_ERROR, (payload) => {
      if (payload.sessionId !== currentSessionIdRef.current) return;

      addErrorMessage(payload.sessionId, payload.error, payload.recoverable);

      addNotification({
        type: payload.recoverable ? 'warning' : 'error',
        message: payload.error,
        autoDismiss: payload.recoverable,
      });
    }).then((unsub) => unsubscribes.push(unsub));

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [
    sessionId,
    updateStreamingMessage,
    completeMessage,
    setSessionStatus,
    addErrorMessage,
    addNotification,
  ]);

  // Create a new session
  const createSession = useCallback(
    async (request: SessionCreateRequest): Promise<Session> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await invokeCommand<Session>('session_create', request);
        addSession(response);
        return response;
      } catch (err) {
        const errorMessage = (err as Error).message ?? 'Failed to create session';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [addSession]
  );

  // Load an existing session
  const loadSession = useCallback(
    async (id: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await invokeCommand<SessionWithMessagesResponse>('session_load', {
          sessionId: id,
        });
        loadSessionWithMessages(response.session, response.messages);
      } catch (err) {
        const errorMessage = (err as Error).message ?? 'Failed to load session';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [loadSessionWithMessages]
  );

  // Start the CLI for the current session
  const startCli = useCallback(
    async (resume = true): Promise<void> => {
      if (!sessionId) {
        throw new Error('No session ID');
      }

      setError(null);

      try {
        await invokeCommand('session_start_cli', {
          sessionId,
          resume,
        });
      } catch (err) {
        const errorMessage = (err as Error).message ?? 'Failed to start CLI';
        setError(errorMessage);
        addNotification({
          type: 'error',
          message: errorMessage,
          autoDismiss: false,
        });
        throw err;
      }
    },
    [sessionId, addNotification]
  );

  // Stop the CLI for the current session
  const stopCli = useCallback(async (): Promise<void> => {
    if (!sessionId) return;

    try {
      await invokeCommand('session_stop_cli', { sessionId });
    } catch (err) {
      console.error('Failed to stop CLI:', err);
    }
  }, [sessionId]);

  // Send a message
  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      if (!sessionId) {
        throw new Error('No session ID');
      }

      setError(null);

      try {
        // Add user message to store first (optimistic update)
        const userMessage: Message = {
          id: `msg-${Date.now()}`,
          sessionId,
          role: 'user',
          content,
          createdAt: new Date().toISOString(),
          isStreaming: false,
        };
        addMessage(sessionId, userMessage);

        // Create placeholder for assistant response
        const assistantMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          sessionId,
          role: 'assistant',
          content: '',
          createdAt: new Date().toISOString(),
          isStreaming: true,
        };
        addMessage(sessionId, assistantMessage);
        setStreamingMessageId(assistantMessage.id);

        // Send to backend (this will update the message ID via events)
        await invokeCommand('session_send_message', {
          sessionId,
          content,
        });
      } catch (err) {
        const errorMessage = (err as Error).message ?? 'Failed to send message';
        setError(errorMessage);
        addNotification({
          type: 'error',
          message: errorMessage,
          autoDismiss: true,
        });
        throw err;
      }
    },
    [sessionId, addMessage, addNotification]
  );

  // Cancel the current response
  const cancelResponse = useCallback(async (): Promise<void> => {
    if (!sessionId) return;

    try {
      await invokeCommand('session_cancel_response', { sessionId });
      setStreamingMessageId(null);
    } catch (err) {
      console.error('Failed to cancel response:', err);
    }
  }, [sessionId]);

  return {
    // State
    session,
    messages,
    status,
    streamingMessageId,
    isLoading,
    error,

    // Actions
    createSession,
    loadSession,
    startCli,
    stopCli,
    sendMessage,
    cancelResponse,
  };
}
