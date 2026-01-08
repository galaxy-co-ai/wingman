/**
 * Session and Message Types
 */

/** Claude CLI process status */
export type ClaudeStatus = 'starting' | 'ready' | 'busy' | 'stopped' | 'error';

/** Message role */
export type MessageRole = 'user' | 'assistant';

/** Tool usage information embedded in a message */
export interface ToolUsage {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
  status: 'pending' | 'running' | 'completed' | 'error';
}

/** Individual chat message */
export interface Message {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  toolUsage?: ToolUsage[];
  isStreaming?: boolean;
  createdAt: string;
}

/** Chat session */
export interface Session {
  id: string;
  title: string;
  workingDirectory: string;
  projectId?: string;
  claudeStatus: ClaudeStatus;
  createdAt: string;
  updatedAt: string;
}

/** Session with messages (for loading) */
export interface SessionWithMessages {
  session: Session;
  messages: Message[];
}

/** Summary of a session (for listing) */
export interface SessionSummary {
  id: string;
  title: string;
  workingDirectory: string;
  projectId?: string;
  projectName?: string;
  messageCount: number;
  lastMessage?: string;
  createdAt: string;
  updatedAt: string;
}

/** Tab representing an open session */
export interface Tab {
  id: string;
  sessionId: string;
  title: string;
  isActive: boolean;
  isDirty: boolean;
}

/** Request to create a new session */
export interface SessionCreateRequest {
  workingDirectory: string;
  projectId?: string;
  title?: string;
}
