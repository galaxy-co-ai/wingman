/**
 * Settings Service
 * IPC commands for application settings
 */

import { invokeCommand } from './tauri';
import type { Settings } from '@/types';

export const settingsService = {
  /**
   * Get all settings
   */
  get: () => invokeCommand<Settings>('settings_get'),

  /**
   * Update settings (partial update)
   */
  update: (settings: Partial<Settings>) =>
    invokeCommand<Settings>('settings_update', { settings }),

  /**
   * Reset settings to defaults
   */
  reset: () => invokeCommand<Settings>('settings_reset'),
};
