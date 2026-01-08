/**
 * useActivityFeed Hook
 * Subscribes to file change events and manages activity feed state
 */

import { useEffect, useCallback, useState } from 'react';
import { subscribeToEvent } from '@/services/tauri';
import { activityService } from '@/services/activity';
import { useActivityStore } from '@/stores/activity';
import { EVENTS, type FileChangedPayload } from '@/types/events.types';
import type { ActivityEntry } from '@/types/activity.types';

interface UseActivityFeedOptions {
  /** Maximum entries to load initially */
  initialLoadLimit?: number;
  /** Whether to auto-load activity on mount */
  autoLoad?: boolean;
}

interface UseActivityFeedResult {
  /** Whether initial load is in progress */
  isLoading: boolean;
  /** Error message if load failed */
  error: string | null;
  /** Reload activity from database */
  reload: () => Promise<void>;
  /** Clear all activity entries */
  clear: () => Promise<void>;
}

/**
 * Hook to manage activity feed subscription and state
 * Subscribes to FILE_CHANGED events and updates the activity store
 */
export function useActivityFeed(
  sessionId: string | null,
  options: UseActivityFeedOptions = {}
): UseActivityFeedResult {
  const { initialLoadLimit = 100, autoLoad = true } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addEntry = useActivityStore((state) => state.addEntry);
  const setEntries = useActivityStore((state) => state.setEntries);
  const clearEntries = useActivityStore((state) => state.clearEntries);

  // Load activity from database
  const reload = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const entries = await activityService.getActivityLog(
        sessionId,
        'all',
        initialLoadLimit
      );
      setEntries(sessionId, entries);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load activity';
      setError(message);
      console.error('Failed to load activity:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, initialLoadLimit, setEntries]);

  // Clear activity (both store and database)
  const clear = useCallback(async () => {
    if (!sessionId) return;

    try {
      await activityService.clearActivityLog(sessionId);
      clearEntries(sessionId);
    } catch (err) {
      console.error('Failed to clear activity:', err);
      throw err;
    }
  }, [sessionId, clearEntries]);

  // Subscribe to FILE_CHANGED events
  useEffect(() => {
    if (!sessionId) return;

    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      unsubscribe = await subscribeToEvent<FileChangedPayload>(
        EVENTS.FILE_CHANGED,
        (payload) => {
          // Only handle events for this session
          if (payload.sessionId !== sessionId) return;

          // Convert payload to ActivityEntry
          const entry: ActivityEntry = {
            id: `${payload.timestamp}-${payload.path}`,
            sessionId: payload.sessionId,
            path: payload.path,
            operation: payload.operation,
            source: payload.source,
            timestamp: payload.timestamp,
          };

          addEntry(sessionId, entry);
        }
      );
    };

    setupSubscription().catch((err) => {
      console.error('Failed to subscribe to file change events:', err);
    });

    return () => {
      unsubscribe?.();
    };
  }, [sessionId, addEntry]);

  // Auto-load activity on mount/session change
  useEffect(() => {
    if (autoLoad && sessionId) {
      reload();
    }
  }, [autoLoad, sessionId, reload]);

  return {
    isLoading,
    error,
    reload,
    clear,
  };
}
