/**
 * UI State Types
 */

/** Right panel mode */
export type RightPanelMode = 'preview' | 'activity' | 'dashboard';

/** Modal types */
export type ModalType =
  | 'new-session'
  | 'confirm-delete'
  | 'task-edit'
  | 'cli-setup'
  | 'settings'
  | null;

/** Notification type */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/** Notification */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
}

/** UI state */
export interface UIState {
  // Panels
  leftPanelWidth: number;
  rightPanelMode: RightPanelMode;
  rightPanelCollapsed: boolean;

  // Modal
  activeModal: ModalType;
  modalData?: Record<string, unknown>;

  // Notifications
  notifications: Notification[];

  // Preview
  previewUrl: string;
  isPreviewLoading: boolean;
  previewError?: string;

  // Misc
  isCommandPaletteOpen: boolean;
  isSidebarCollapsed: boolean;
}

/** Default UI state */
export const DEFAULT_UI_STATE: UIState = {
  leftPanelWidth: 50,
  rightPanelMode: 'preview',
  rightPanelCollapsed: false,

  activeModal: null,
  modalData: undefined,

  notifications: [],

  previewUrl: 'http://localhost:3000',
  isPreviewLoading: false,
  previewError: undefined,

  isCommandPaletteOpen: false,
  isSidebarCollapsed: false,
};
