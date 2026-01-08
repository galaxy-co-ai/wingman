/**
 * Keyboard Shortcut Definitions
 */

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
}

/** Platform detection */
export const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

/** Modifier key display name */
export const modKey = isMac ? '⌘' : 'Ctrl';

/** Keyboard shortcuts organized by category */
export const SHORTCUTS = {
  // Session management
  NEW_SESSION: {
    key: 'n',
    ctrl: !isMac,
    meta: isMac,
    description: 'New session',
  },
  CLOSE_TAB: {
    key: 'w',
    ctrl: !isMac,
    meta: isMac,
    description: 'Close current tab',
  },
  NEXT_TAB: {
    key: 'Tab',
    ctrl: true,
    description: 'Next tab',
  },
  PREV_TAB: {
    key: 'Tab',
    ctrl: true,
    shift: true,
    description: 'Previous tab',
  },

  // Chat
  SEND_MESSAGE: {
    key: 'Enter',
    ctrl: !isMac,
    meta: isMac,
    description: 'Send message',
  },
  CANCEL_RESPONSE: {
    key: 'Escape',
    description: 'Cancel response',
  },

  // Navigation
  COMMAND_PALETTE: {
    key: 'k',
    ctrl: !isMac,
    meta: isMac,
    description: 'Open command palette',
  },
  SETTINGS: {
    key: ',',
    ctrl: !isMac,
    meta: isMac,
    description: 'Open settings',
  },
  SESSION_BROWSER: {
    key: 'e',
    ctrl: !isMac,
    meta: isMac,
    description: 'Open session browser',
  },

  // Panels
  TOGGLE_PREVIEW: {
    key: 'p',
    ctrl: !isMac,
    meta: isMac,
    shift: true,
    description: 'Toggle preview panel',
  },
  REFRESH_PREVIEW: {
    key: 'r',
    ctrl: !isMac,
    meta: isMac,
    description: 'Refresh preview',
  },

  // Focus
  FOCUS_INPUT: {
    key: '/',
    description: 'Focus chat input',
  },
} as const satisfies Record<string, KeyboardShortcut>;

/**
 * Check if a keyboard event matches a shortcut
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
  const matchesCtrl = !!shortcut.ctrl === event.ctrlKey;
  const matchesShift = !!shortcut.shift === event.shiftKey;
  const matchesAlt = !!shortcut.alt === event.altKey;
  const matchesMeta = !!shortcut.meta === event.metaKey;

  return matchesKey && matchesCtrl && matchesShift && matchesAlt && matchesMeta;
}

/**
 * Format a shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push(isMac ? '⌃' : 'Ctrl');
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');
  if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift');
  if (shortcut.meta) parts.push(isMac ? '⌘' : 'Win');

  // Format key name
  let keyName = shortcut.key;
  if (keyName === ' ') keyName = 'Space';
  if (keyName === 'ArrowUp') keyName = '↑';
  if (keyName === 'ArrowDown') keyName = '↓';
  if (keyName === 'ArrowLeft') keyName = '←';
  if (keyName === 'ArrowRight') keyName = '→';
  if (keyName === 'Enter') keyName = '↵';
  if (keyName === 'Escape') keyName = 'Esc';
  if (keyName === 'Tab') keyName = '⇥';

  parts.push(keyName.length === 1 ? keyName.toUpperCase() : keyName);

  return parts.join(isMac ? '' : '+');
}
