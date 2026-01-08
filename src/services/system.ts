/**
 * System Service
 * IPC commands for system operations
 */

import { invokeCommand } from './tauri';

export interface AppInfo {
  version: string;
  name: string;
  tauriVersion: string;
}

export interface CliStatus {
  installed: boolean;
  version?: string;
  path?: string;
  error?: string;
}

export const systemService = {
  /**
   * Check if Claude CLI is installed and get version
   */
  checkCli: () => invokeCommand<CliStatus>('system_check_cli'),

  /**
   * Open a URL in the default browser
   */
  openExternal: (url: string) => invokeCommand<void>('system_open_external', { url }),

  /**
   * Open a file or folder in the system file manager
   */
  openPath: (path: string) => invokeCommand<void>('system_open_path', { path }),

  /**
   * Open a directory picker dialog
   */
  selectDirectory: (title?: string) =>
    invokeCommand<string | null>('system_select_directory', { title }),

  /**
   * Get application info
   */
  getAppInfo: () => invokeCommand<AppInfo>('system_get_app_info'),

  /**
   * Start watching a directory for file changes
   */
  startFileWatcher: (sessionId: string, directory: string) =>
    invokeCommand<void>('file_watcher_start', { sessionId, directory }),

  /**
   * Stop watching a directory
   */
  stopFileWatcher: (sessionId: string) =>
    invokeCommand<void>('file_watcher_stop', { sessionId }),
};
