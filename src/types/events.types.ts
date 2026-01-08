/**
 * Backend Event Types
 * These are emitted from the Rust backend via Tauri events
 */

import type { ClaudeStatus, ToolUsage } from './session.types';
import type { FileOperation, ActivitySource } from './activity.types';

/** Claude output event payload */
export interface ClaudeOutputPayload {
  sessionId: string;
  messageId: string;
  chunk: string;
  isComplete: boolean;
  toolUsage?: ToolUsage;
}

/** Claude status change event payload */
export interface ClaudeStatusPayload {
  sessionId: string;
  status: ClaudeStatus;
  error?: string;
}

/** Claude error event payload */
export interface ClaudeErrorPayload {
  sessionId: string;
  error: string;
  recoverable: boolean;
}

/** File changed event payload */
export interface FileChangedPayload {
  sessionId: string;
  path: string;
  operation: FileOperation;
  source: ActivitySource;
  timestamp: string;
}

/** Session saved event payload */
export interface SessionSavedPayload {
  sessionId: string;
  timestamp: string;
}

/** Theme changed event payload */
export interface ThemeChangedPayload {
  theme: 'dark' | 'light';
}

/** Update available event payload */
export interface UpdateAvailablePayload {
  version: string;
  releaseNotes: string;
  downloadUrl: string;
}

/** Update progress event payload */
export interface UpdateProgressPayload {
  downloaded: number;
  total: number;
  percent: number;
}

/** Event name constants */
export const EVENTS = {
  CLAUDE_OUTPUT: 'claude_output',
  CLAUDE_STATUS: 'claude_status',
  CLAUDE_ERROR: 'claude_error',
  FILE_CHANGED: 'file_changed',
  SESSION_SAVED: 'session_saved',
  THEME_CHANGED: 'theme_changed',
  UPDATE_AVAILABLE: 'update_available',
  UPDATE_PROGRESS: 'update_progress',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
