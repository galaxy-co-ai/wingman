/**
 * usePreviewAutoRefresh Hook
 * Subscribes to file change events and triggers preview refresh with debouncing
 */

import { useEffect, useRef, useCallback } from 'react';
import { subscribeToEvent } from '@/services/tauri';
import { useUIStore, selectAutoRefresh } from '@/stores';
import { EVENTS, type FileChangedPayload } from '@/types/events.types';

/** Default debounce delay in milliseconds */
const DEBOUNCE_DELAY = 500;

/** File extensions that should trigger auto-refresh */
const WATCHED_EXTENSIONS = new Set([
  // Web files
  '.html', '.htm', '.css', '.scss', '.sass', '.less',
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.json', '.xml', '.svg',
  // Template files
  '.vue', '.svelte', '.astro',
  // Other common web assets
  '.md', '.mdx',
]);

/**
 * Check if a file path has an extension that should trigger refresh
 */
function shouldRefreshForFile(path: string): boolean {
  const ext = path.toLowerCase().match(/\.[^.]+$/)?.[0];
  return ext ? WATCHED_EXTENSIONS.has(ext) : false;
}

/**
 * Hook to manage auto-refresh of preview on file changes
 * Subscribes to FILE_CHANGED events and debounces refresh triggers
 */
export function usePreviewAutoRefresh(sessionId: string | null): void {
  const autoRefresh = useUIStore(selectAutoRefresh);
  const triggerRefresh = useUIStore((state) => state.triggerRefresh);

  // Track debounce timeout
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced refresh function
  const debouncedRefresh = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      triggerRefresh();
      timeoutRef.current = null;
    }, DEBOUNCE_DELAY);
  }, [triggerRefresh]);

  // Subscribe to FILE_CHANGED events
  useEffect(() => {
    // Don't subscribe if no session or auto-refresh is disabled
    if (!sessionId || !autoRefresh) {
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      unsubscribe = await subscribeToEvent<FileChangedPayload>(
        EVENTS.FILE_CHANGED,
        (payload) => {
          // Only handle events for this session
          if (payload.sessionId !== sessionId) return;

          // Only refresh for watched file types
          if (!shouldRefreshForFile(payload.path)) return;

          // Trigger debounced refresh
          debouncedRefresh();
        }
      );
    };

    setupSubscription().catch((err) => {
      console.error('Failed to subscribe to file change events for auto-refresh:', err);
    });

    // Cleanup subscription and timeout on unmount or when deps change
    return () => {
      unsubscribe?.();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [sessionId, autoRefresh, debouncedRefresh]);
}
