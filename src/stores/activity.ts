/**
 * Activity Store
 * Manages file activity feed state and file watcher status
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ActivityEntry, FileOperation } from '@/types';

// Filter type for activity feed
export type ActivityFilter = 'all' | FileOperation;

// State interface
interface ActivityState {
  // Activity entries keyed by session ID
  entries: Record<string, ActivityEntry[]>;
  // Current filter
  filter: ActivityFilter;
  // Watching status by session ID
  isWatching: Record<string, boolean>;
}

// Actions interface
interface ActivityActions {
  // Entry management
  addEntry: (sessionId: string, entry: ActivityEntry) => void;
  setEntries: (sessionId: string, entries: ActivityEntry[]) => void;
  clearEntries: (sessionId: string) => void;

  // Filter
  setFilter: (filter: ActivityFilter) => void;

  // Watcher status
  setWatching: (sessionId: string, isWatching: boolean) => void;

  // Get filtered entries for a session
  getFilteredEntries: (sessionId: string) => ActivityEntry[];

  // Reset
  reset: () => void;
}

// Initial state
const initialState: ActivityState = {
  entries: {},
  filter: 'all',
  isWatching: {},
};

// Create the store
export const useActivityStore = create<ActivityState & ActivityActions>()(
  immer((set, get) => ({
    ...initialState,

    // Add a single entry
    addEntry: (sessionId, entry) => set((state) => {
      if (!state.entries[sessionId]) {
        state.entries[sessionId] = [];
      }
      // Add to beginning (newest first)
      state.entries[sessionId].unshift(entry);
      // Keep max 500 entries per session
      if (state.entries[sessionId].length > 500) {
        state.entries[sessionId] = state.entries[sessionId].slice(0, 500);
      }
    }),

    // Set all entries for a session (from database load)
    setEntries: (sessionId, entries) => set((state) => {
      state.entries[sessionId] = entries;
    }),

    // Clear entries for a session
    clearEntries: (sessionId) => set((state) => {
      state.entries[sessionId] = [];
    }),

    // Set filter
    setFilter: (filter) => set((state) => {
      state.filter = filter;
    }),

    // Set watching status
    setWatching: (sessionId, isWatching) => set((state) => {
      state.isWatching[sessionId] = isWatching;
    }),

    // Get filtered entries (not a mutation, uses get())
    getFilteredEntries: (sessionId) => {
      const state = get();
      const entries = state.entries[sessionId] ?? [];
      if (state.filter === 'all') {
        return entries;
      }
      return entries.filter(entry => entry.operation === state.filter);
    },

    // Reset
    reset: () => set(initialState),
  }))
);

// Selectors
export const selectEntriesForSession = (sessionId: string) => (state: ActivityState) =>
  state.entries[sessionId] ?? [];

export const selectFilter = (state: ActivityState) => state.filter;

export const selectIsWatching = (sessionId: string) => (state: ActivityState) =>
  state.isWatching[sessionId] ?? false;

export const selectFilteredEntries = (sessionId: string) => (state: ActivityState & ActivityActions) =>
  state.getFilteredEntries(sessionId);

// Helper to get entry count by source
export const selectEntryCounts = (sessionId: string) => (state: ActivityState) => {
  const entries = state.entries[sessionId] ?? [];
  return {
    total: entries.length,
    claude: entries.filter(e => e.source === 'claude').length,
    external: entries.filter(e => e.source === 'external').length,
    created: entries.filter(e => e.operation === 'created').length,
    modified: entries.filter(e => e.operation === 'modified').length,
    deleted: entries.filter(e => e.operation === 'deleted').length,
  };
};
