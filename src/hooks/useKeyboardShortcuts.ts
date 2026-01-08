/**
 * useKeyboardShortcuts Hook
 * Global keyboard shortcut handler for the application
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcuts {
  /** Create new session - Ctrl+T */
  onNewSession?: () => void;
  /** Close current tab - Ctrl+W */
  onCloseTab?: () => void;
  /** Switch to next tab - Ctrl+Tab */
  onNextTab?: () => void;
  /** Switch to previous tab - Ctrl+Shift+Tab */
  onPrevTab?: () => void;
  /** Open session browser - Ctrl+B */
  onOpenBrowser?: () => void;
  /** Toggle right panel - Ctrl+\\ */
  onToggleRightPanel?: () => void;
  /** Open settings - Ctrl+, */
  onOpenSettings?: () => void;
  /** Focus input - Ctrl+L */
  onFocusInput?: () => void;
  /** Cancel response - Escape */
  onCancel?: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in input/textarea
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Escape should always work (for canceling)
      if (e.key === 'Escape' && shortcuts.onCancel) {
        shortcuts.onCancel();
        return;
      }

      // Skip other shortcuts when input is focused (except specific ones)
      if (isInputFocused) {
        // Only allow Ctrl+Enter (send message) - handled by InputArea
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd + T - New session
      if (isMod && e.key === 't') {
        e.preventDefault();
        shortcuts.onNewSession?.();
        return;
      }

      // Ctrl/Cmd + W - Close tab
      if (isMod && e.key === 'w') {
        e.preventDefault();
        shortcuts.onCloseTab?.();
        return;
      }

      // Ctrl/Cmd + Tab - Next tab
      if (isMod && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        shortcuts.onNextTab?.();
        return;
      }

      // Ctrl/Cmd + Shift + Tab - Previous tab
      if (isMod && e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        shortcuts.onPrevTab?.();
        return;
      }

      // Ctrl/Cmd + B - Open browser
      if (isMod && e.key === 'b') {
        e.preventDefault();
        shortcuts.onOpenBrowser?.();
        return;
      }

      // Ctrl/Cmd + \ - Toggle right panel
      if (isMod && e.key === '\\') {
        e.preventDefault();
        shortcuts.onToggleRightPanel?.();
        return;
      }

      // Ctrl/Cmd + , - Open settings
      if (isMod && e.key === ',') {
        e.preventDefault();
        shortcuts.onOpenSettings?.();
        return;
      }

      // Ctrl/Cmd + L - Focus input
      if (isMod && e.key === 'l') {
        e.preventDefault();
        shortcuts.onFocusInput?.();
        return;
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
