/**
 * useFileWatcher Hook
 * Manages file watcher lifecycle for a session
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { activityService } from '@/services/activity';
import { useActivityStore } from '@/stores/activity';

interface UseFileWatcherOptions {
  /** Custom ignore patterns (defaults to common patterns) */
  ignorePatterns?: string[];
  /** Auto-start watching when directory is set */
  autoStart?: boolean;
}

interface UseFileWatcherResult {
  /** Whether the watcher is currently active */
  isWatching: boolean;
  /** Start watching the directory */
  start: () => Promise<void>;
  /** Stop watching */
  stop: () => Promise<void>;
  /** Error message if start/stop failed */
  error: string | null;
}

/** Default ignore patterns for file watching */
const DEFAULT_IGNORE_PATTERNS = [
  '.git',
  'node_modules',
  '.next',
  'target',
  'dist',
  'build',
  '.cache',
  '.turbo',
  '*.log',
];

/**
 * Hook to manage file watcher lifecycle
 * Automatically starts/stops watching based on session and directory
 */
export function useFileWatcher(
  sessionId: string | null,
  directory: string | null,
  options: UseFileWatcherOptions = {}
): UseFileWatcherResult {
  const { ignorePatterns = DEFAULT_IGNORE_PATTERNS, autoStart = true } = options;

  const [error, setError] = useState<string | null>(null);
  const isStartingRef = useRef(false);
  const currentSessionRef = useRef<string | null>(null);

  const setWatching = useActivityStore((state) => state.setWatching);
  const isWatching = useActivityStore((state) =>
    sessionId ? state.isWatching[sessionId] ?? false : false
  );

  // Start watching
  const start = useCallback(async () => {
    if (!sessionId || !directory) return;
    if (isStartingRef.current) return;

    isStartingRef.current = true;
    setError(null);

    try {
      await activityService.startWatcher(sessionId, directory, ignorePatterns);
      setWatching(sessionId, true);
      currentSessionRef.current = sessionId;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start file watcher';
      setError(message);
      console.error('Failed to start file watcher:', err);
      setWatching(sessionId, false);
    } finally {
      isStartingRef.current = false;
    }
  }, [sessionId, directory, ignorePatterns, setWatching]);

  // Stop watching
  const stop = useCallback(async () => {
    const sessionToStop = currentSessionRef.current;
    if (!sessionToStop) return;

    try {
      await activityService.stopWatcher(sessionToStop);
      setWatching(sessionToStop, false);
      currentSessionRef.current = null;
    } catch (err) {
      console.error('Failed to stop file watcher:', err);
      // Still mark as not watching on error
      setWatching(sessionToStop, false);
    }
  }, [setWatching]);

  // Auto-start/stop based on session and directory changes
  useEffect(() => {
    if (!autoStart) return;

    const shouldWatch = sessionId && directory;
    const isCurrentlyWatching = currentSessionRef.current !== null;

    // Session changed - stop old watcher first
    if (isCurrentlyWatching && currentSessionRef.current !== sessionId) {
      stop().then(() => {
        if (shouldWatch) {
          start();
        }
      });
      return;
    }

    // Start watching new session
    if (shouldWatch && !isCurrentlyWatching) {
      start();
    }

    // Stop if session cleared
    if (!shouldWatch && isCurrentlyWatching) {
      stop();
    }
  }, [sessionId, directory, autoStart, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentSessionRef.current) {
        activityService.stopWatcher(currentSessionRef.current).catch(() => {
          // Ignore cleanup errors
        });
      }
    };
  }, []);

  return {
    isWatching,
    start,
    stop,
    error,
  };
}
