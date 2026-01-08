/**
 * Settings Types
 */

/** Application theme */
export type Theme = 'dark' | 'light' | 'system';

/** Update check frequency */
export type UpdateFrequency = 'startup' | 'daily' | 'weekly' | 'never';

/** User settings */
export interface Settings {
  // Appearance
  theme: Theme;
  fontSize: number;
  fontFamily: string;

  // Editor
  tabSize: number;
  wordWrap: boolean;

  // Preview
  defaultPreviewUrl: string;
  autoRefresh: boolean;
  autoRefreshDelay: number;

  // Claude CLI
  claudeCliPath?: string;

  // Updates
  checkForUpdates: UpdateFrequency;
  autoDownloadUpdates: boolean;
  includePreReleases: boolean;

  // File watching
  watchedExtensions: string[];
  ignoredPatterns: string[];
}

/** Default settings values */
export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  fontSize: 14,
  fontFamily: 'JetBrains Mono',

  tabSize: 2,
  wordWrap: true,

  defaultPreviewUrl: 'http://localhost:3000',
  autoRefresh: true,
  autoRefreshDelay: 500,

  claudeCliPath: undefined,

  checkForUpdates: 'startup',
  autoDownloadUpdates: false,
  includePreReleases: false,

  watchedExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'css',
    'scss',
    'html',
    'json',
    'md',
    'vue',
    'svelte',
  ],
  ignoredPatterns: ['node_modules', '.git', 'dist', 'build', '.next', 'target'],
};
