/**
 * Default Values and Constants
 */

/** Default preview URL */
export const DEFAULT_PREVIEW_URL = 'http://localhost:3000';

/** Auto-save interval in milliseconds */
export const AUTO_SAVE_INTERVAL = 30000;

/** Debounce delay for file watching in milliseconds */
export const FILE_WATCH_DEBOUNCE = 100;

/** Auto-refresh delay after file change in milliseconds */
export const AUTO_REFRESH_DELAY = 500;

/** Maximum messages to include in handoff */
export const HANDOFF_MAX_MESSAGES = 20;

/** Maximum characters per message in handoff */
export const HANDOFF_MAX_CHARS = 500;

/** Maximum tool usages to include in handoff */
export const HANDOFF_MAX_TOOLS = 50;

/** Session list page size */
export const SESSION_PAGE_SIZE = 50;

/** Activity feed page size */
export const ACTIVITY_PAGE_SIZE = 100;

/** Maximum notification duration in milliseconds */
export const NOTIFICATION_DURATION = 5000;

/** Panel resize constraints */
export const PANEL_MIN_WIDTH = 300;
export const PANEL_MAX_WIDTH = 800;
export const PANEL_DEFAULT_SPLIT = 50;

/** Animation durations in milliseconds */
export const ANIMATION = {
  instant: 50,
  fast: 100,
  normal: 200,
  slow: 300,
  slower: 500,
} as const;

/** Z-index layers */
export const Z_INDEX = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  popover: 500,
  tooltip: 600,
  toast: 700,
} as const;

/** File extensions to watch by default */
export const DEFAULT_WATCHED_EXTENSIONS = [
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
];

/** Patterns to ignore when watching files */
export const DEFAULT_IGNORED_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'target',
  '.cache',
  'coverage',
];
