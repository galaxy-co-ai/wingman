/**
 * UI Store
 * Manages transient UI state like modals, panels, and notifications
 */

import { create } from 'zustand';
import { nanoid } from 'nanoid';

// Modal types
export type ModalType =
  | 'new-session'
  | 'confirm-close'
  | 'cli-setup'
  | 'task-detail'
  | 'settings'
  | 'session-browser'
  | 'project-view'
  | null;

// Right panel tab types
export type RightPanelTab = 'preview' | 'activity' | 'dashboard';

// Notification interface
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  autoDismiss: boolean;
}

// State interface
interface UIState {
  // Modal state
  activeModal: ModalType;
  modalData: unknown;

  // Panel state
  leftPanelWidth: number;
  rightPanelTab: RightPanelTab;
  isRightPanelCollapsed: boolean;

  // Notifications
  notifications: Notification[];

  // View state
  currentView: 'main' | 'session-browser' | 'settings' | 'project';

  // Preview state
  previewUrl: string;
  autoRefresh: boolean;
  isPreviewLoading: boolean;
  previewError: string | null;
  refreshCounter: number; // Increment to force iframe refresh
}

// Actions interface
interface UIActions {
  // Modal
  openModal: (modal: ModalType, data?: unknown) => void;
  closeModal: () => void;

  // Panel
  setLeftPanelWidth: (width: number) => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
  toggleRightPanel: () => void;
  setRightPanelCollapsed: (collapsed: boolean) => void;

  // Notifications
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // View
  navigateTo: (view: UIState['currentView']) => void;

  // Preview
  setPreviewUrl: (url: string) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setPreviewLoading: (loading: boolean) => void;
  setPreviewError: (error: string | null) => void;
  triggerRefresh: () => void;
}

// Create the store
export const useUIStore = create<UIState & UIActions>()((set) => ({
  // Initial state
  activeModal: null,
  modalData: null,
  leftPanelWidth: 50,
  rightPanelTab: 'preview',
  isRightPanelCollapsed: false,
  notifications: [],
  currentView: 'main',

  // Preview initial state
  previewUrl: 'http://localhost:3000',
  autoRefresh: true,
  isPreviewLoading: false,
  previewError: null,
  refreshCounter: 0,

  // Modal actions
  openModal: (modal, data) => set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  // Panel actions
  setLeftPanelWidth: (width) => set({ leftPanelWidth: width }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  toggleRightPanel: () => set((state) => ({ isRightPanelCollapsed: !state.isRightPanelCollapsed })),
  setRightPanelCollapsed: (collapsed) => set({ isRightPanelCollapsed: collapsed }),

  // Notification actions
  addNotification: (notification) => set((state) => {
    const id = nanoid();
    const newNotification = { ...notification, id };

    // Auto-dismiss after 5 seconds
    if (notification.autoDismiss) {
      setTimeout(() => {
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        }));
      }, 5000);
    }

    return { notifications: [...state.notifications, newNotification] };
  }),

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),

  clearNotifications: () => set({ notifications: [] }),

  // View actions
  navigateTo: (view) => set({ currentView: view }),

  // Preview actions
  setPreviewUrl: (url) => set({ previewUrl: url, previewError: null }),
  setAutoRefresh: (enabled) => set({ autoRefresh: enabled }),
  setPreviewLoading: (loading) => set({ isPreviewLoading: loading }),
  setPreviewError: (error) => set({ previewError: error, isPreviewLoading: false }),
  triggerRefresh: () => set((state) => ({ refreshCounter: state.refreshCounter + 1 })),
}));

// Selectors
export const selectActiveModal = (state: UIState) => state.activeModal;
export const selectModalData = (state: UIState) => state.modalData;
export const selectNotifications = (state: UIState) => state.notifications;
export const selectPreviewUrl = (state: UIState) => state.previewUrl;
export const selectAutoRefresh = (state: UIState) => state.autoRefresh;
export const selectIsPreviewLoading = (state: UIState) => state.isPreviewLoading;
export const selectPreviewError = (state: UIState) => state.previewError;
export const selectRefreshCounter = (state: UIState) => state.refreshCounter;
