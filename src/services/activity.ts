/**
 * Activity Service
 * IPC commands for file watching and activity feed operations
 */

import { invokeCommand } from './tauri';
import type { ActivityEntry, FileOperation, ActivitySource } from '@/types/activity.types';

export const activityService = {
  /**
   * Start watching a directory for file changes
   */
  startWatcher: (sessionId: string, directory: string, ignorePatterns?: string[]) =>
    invokeCommand<void>('file_watcher_start', {
      sessionId,
      path: directory,
      ignorePatterns,
    }),

  /**
   * Stop watching a directory
   */
  stopWatcher: (sessionId: string) =>
    invokeCommand<void>('file_watcher_stop', { sessionId }),

  /**
   * Get activity entries for a session
   * @param sessionId - The session ID
   * @param filter - Optional filter: 'all', 'created', 'modified', or 'deleted'
   * @param limit - Max entries to return (default 100)
   * @param offset - Offset for pagination (default 0)
   */
  getActivityLog: (
    sessionId: string,
    filter?: 'all' | FileOperation,
    limit?: number,
    offset?: number
  ) =>
    invokeCommand<ActivityEntry[]>('activity_get', {
      sessionId,
      filter,
      limit,
      offset,
    }),

  /**
   * Clear all activity entries for a session
   */
  clearActivityLog: (sessionId: string) =>
    invokeCommand<void>('activity_clear', { sessionId }),

  /**
   * Save an activity entry to the database
   * Used for manual entries or when the file watcher is not running
   */
  saveActivityEntry: (
    sessionId: string,
    path: string,
    operation: FileOperation,
    source: ActivitySource
  ) =>
    invokeCommand<string>('activity_save', {
      sessionId,
      path,
      operation,
      source,
    }),

  /**
   * Record that Claude wrote to a file (for source attribution)
   * Call this when Claude uses a file-writing tool (Write, Edit, etc.)
   */
  recordClaudeWrite: (sessionId: string, path: string) =>
    invokeCommand<void>('file_watcher_record_claude_write', {
      sessionId,
      path,
    }),
};
