/**
 * Sessions Store
 * Manages chat sessions, messages, tabs, and Claude CLI status
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  Session,
  Message,
  Tab,
  ToolUsage,
  ClaudeStatus,
} from '@/types';

// State interface
interface SessionsState {
  // Data
  sessions: Record<string, Session>;
  messages: Record<string, Message[]>;
  tabs: Tab[];
  activeTabId: string | null;
  sessionStatuses: Record<string, ClaudeStatus>;
}

// Actions interface
interface SessionsActions {
  // Session management
  addSession: (session: Session) => void;
  removeSession: (id: string) => void;
  updateSession: (id: string, updates: Partial<Session>) => void;

  // Message management
  addMessage: (sessionId: string, message: Message) => void;
  updateStreamingMessage: (messageId: string, chunk: string, toolUsage?: ToolUsage) => void;
  completeMessage: (messageId: string) => void;
  addErrorMessage: (sessionId: string, error: string, recoverable: boolean) => void;

  // Tab management
  addTab: (tab: Tab) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string | null) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;

  // Status management
  setSessionStatus: (sessionId: string, status: ClaudeStatus) => void;

  // Bulk operations
  loadSessionWithMessages: (session: Session, messages: Message[]) => void;
  reset: () => void;
}

// Initial state
const initialState: SessionsState = {
  sessions: {},
  messages: {},
  tabs: [],
  activeTabId: null,
  sessionStatuses: {},
};

// Create the store
export const useSessionsStore = create<SessionsState & SessionsActions>()(
  persist(
    immer((set, _get) => ({
      ...initialState,

      // Session management
      addSession: (session) => set((state) => {
        state.sessions[session.id] = session;
        state.messages[session.id] = [];
        state.sessionStatuses[session.id] = 'stopped';
      }),

      removeSession: (id) => set((state) => {
        delete state.sessions[id];
        delete state.messages[id];
        delete state.sessionStatuses[id];

        // Remove associated tab
        const tabIndex = state.tabs.findIndex((t) => t.sessionId === id);
        if (tabIndex !== -1) {
          state.tabs.splice(tabIndex, 1);
          if (state.activeTabId === id) {
            state.activeTabId = state.tabs[0]?.id ?? null;
          }
        }
      }),

      updateSession: (id, updates) => set((state) => {
        if (state.sessions[id]) {
          Object.assign(state.sessions[id], updates);
        }
      }),

      // Message management
      addMessage: (sessionId, message) => set((state) => {
        if (!state.messages[sessionId]) {
          state.messages[sessionId] = [];
        }
        state.messages[sessionId].push(message);

        // Update session's last message time
        if (state.sessions[sessionId]) {
          state.sessions[sessionId].updatedAt = message.createdAt;
        }
      }),

      updateStreamingMessage: (messageId, chunk, toolUsage) => set((state) => {
        for (const messages of Object.values(state.messages)) {
          const message = messages.find((m) => m.id === messageId);
          if (message) {
            message.content += chunk;
            if (toolUsage) {
              if (!message.toolUsage) {
                message.toolUsage = [];
              }
              message.toolUsage.push(toolUsage);
            }
            break;
          }
        }
      }),

      completeMessage: (messageId) => set((state) => {
        for (const messages of Object.values(state.messages)) {
          const message = messages.find((m) => m.id === messageId);
          if (message) {
            message.isStreaming = false;
            break;
          }
        }
      }),

      addErrorMessage: (sessionId, error, recoverable) => set((state) => {
        if (!state.messages[sessionId]) {
          state.messages[sessionId] = [];
        }
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          sessionId,
          role: 'assistant',
          content: error,
          createdAt: new Date().toISOString(),
          isStreaming: false,
        };
        state.messages[sessionId].push(errorMessage);

        // If not recoverable, mark session status as error
        if (!recoverable) {
          state.sessionStatuses[sessionId] = 'error';
        }
      }),

      // Tab management
      addTab: (tab) => set((state) => {
        // Check if tab already exists
        const existingTab = state.tabs.find((t) => t.sessionId === tab.sessionId);
        if (!existingTab) {
          state.tabs.push(tab);
        }
        state.activeTabId = tab.id;
      }),

      removeTab: (tabId) => set((state) => {
        const index = state.tabs.findIndex((t) => t.id === tabId);
        if (index !== -1) {
          state.tabs.splice(index, 1);
          if (state.activeTabId === tabId) {
            // Activate adjacent tab
            const newIndex = Math.min(index, state.tabs.length - 1);
            state.activeTabId = state.tabs[newIndex]?.id ?? null;
          }
        }
      }),

      setActiveTab: (tabId) => set((state) => {
        state.activeTabId = tabId;
        // Update tab's isActive state
        state.tabs.forEach((tab) => {
          tab.isActive = tab.id === tabId;
        });
      }),

      reorderTabs: (fromIndex, toIndex) => set((state) => {
        const [tab] = state.tabs.splice(fromIndex, 1);
        state.tabs.splice(toIndex, 0, tab);
      }),

      updateTab: (tabId, updates) => set((state) => {
        const tab = state.tabs.find((t) => t.id === tabId);
        if (tab) {
          Object.assign(tab, updates);
        }
      }),

      // Status management
      setSessionStatus: (sessionId, status) => set((state) => {
        state.sessionStatuses[sessionId] = status;
        if (state.sessions[sessionId]) {
          state.sessions[sessionId].claudeStatus = status;
        }
      }),

      // Bulk operations
      loadSessionWithMessages: (session, messages) => set((state) => {
        state.sessions[session.id] = session;
        state.messages[session.id] = messages;
        state.sessionStatuses[session.id] = session.claudeStatus;
      }),

      reset: () => set(initialState),
    })),
    {
      name: 'wingman-sessions',
      storage: createJSONStorage(() => localStorage),
      // Only persist UI state, not session data (that's in SQLite)
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
      }),
    }
  )
);

// Selectors (outside store for performance)
export const selectActiveSession = (state: SessionsState) =>
  state.activeTabId ? state.sessions[state.activeTabId] : null;

export const selectActiveMessages = (state: SessionsState) =>
  state.activeTabId ? state.messages[state.activeTabId] ?? [] : [];

export const selectSessionStatus = (sessionId: string) => (state: SessionsState) =>
  state.sessionStatuses[sessionId] ?? 'stopped';

export const selectIsAnySessionBusy = (state: SessionsState) =>
  Object.values(state.sessionStatuses).some((s) => s === 'busy');

export const selectActiveTab = (state: SessionsState) =>
  state.tabs.find((t) => t.id === state.activeTabId) ?? null;
