# 17 - Code Patterns

This document provides copy-paste ready patterns for all common code scenarios in Wingman. Reference this when implementing features.

---

## Table of Contents

1. [Component Patterns](#component-patterns)
2. [Hook Patterns](#hook-patterns)
3. [Store Patterns](#store-patterns)
4. [Service Patterns](#service-patterns)
5. [IPC Patterns](#ipc-patterns)
6. [CSS Module Patterns](#css-module-patterns)
7. [Rust Backend Patterns](#rust-backend-patterns)
8. [Testing Patterns](#testing-patterns)
9. [Error Handling Patterns](#error-handling-patterns)
10. [Anti-Patterns](#anti-patterns)

---

## Component Patterns

### Standard Component with CSS Modules

```typescript
// src/components/chat/ChatMessage.tsx
import { memo, useCallback, useState } from 'react';
import { cn } from '@/utils/classnames';
import { formatDate } from '@/utils/format-date';
import { Icon } from '@/components/shared';
import { CodeBlock } from './CodeBlock';
import { ToolUsageChip } from './ToolUsageChip';
import styles from './ChatMessage.module.css';
import type { Message, ToolUsage } from '@/types';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onFileClick?: (path: string) => void;
  onRetry?: () => void;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  isStreaming = false,
  onFileClick,
  onRetry,
}: ChatMessageProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const isUser = message.role === 'user';
  const isLong = message.content.length > 500;
  const shouldTruncate = isLong && !isExpanded;

  const handleCopyCode = useCallback(async (code: string, index: number) => {
    await navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  const displayContent = shouldTruncate
    ? message.content.slice(0, 500) + '...'
    : message.content;

  return (
    <article
      className={cn(
        styles.container,
        isUser && styles.user,
        message.role === 'assistant' && styles.assistant,
        message.role === 'system' && styles.system,
        isStreaming && styles.streaming
      )}
      aria-label={`${message.role} message from ${formatDate(message.timestamp)}`}
    >
      <header className={styles.header}>
        <span className={styles.role}>
          {isUser ? 'You' : message.role === 'system' ? 'System' : 'Claude'}
        </span>
        <time className={styles.timestamp} dateTime={message.timestamp}>
          {formatDate(message.timestamp)}
        </time>
      </header>

      <div className={styles.content}>
        {displayContent}
        {isStreaming && <span className={styles.cursor} />}
      </div>

      {isLong && (
        <button
          className={styles.expandToggle}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}

      {message.codeBlocks?.map((block, index) => (
        <CodeBlock
          key={index}
          code={block.code}
          language={block.language}
          fileName={block.fileName}
          onCopy={() => handleCopyCode(block.code, index)}
          isCopied={copiedIndex === index}
        />
      ))}

      {message.toolUsages && message.toolUsages.length > 0 && (
        <div className={styles.toolUsages} role="list" aria-label="File changes">
          {message.toolUsages.map((usage, index) => (
            <ToolUsageChip
              key={index}
              usage={usage}
              onClick={() => onFileClick?.(usage.filePath)}
            />
          ))}
        </div>
      )}

      {message.isError && onRetry && (
        <button className={styles.retryButton} onClick={onRetry}>
          <Icon name="refresh-cw" size="sm" />
          Retry
        </button>
      )}
    </article>
  );
});
```

---

### Accessible Interactive Component

```typescript
// src/components/chat/TabBar.tsx
import { memo, useCallback, useRef, useState, KeyboardEvent } from 'react';
import { cn } from '@/utils/classnames';
import { Icon } from '@/components/shared';
import styles from './TabBar.module.css';
import type { Tab } from '@/types';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onTabReorder: (fromIndex: number, toIndex: number) => void;
  onNewTab: () => void;
}

export const TabBar = memo(function TabBar({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onTabReorder,
  onNewTab,
}: TabBarProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent, index: number) => {
    const tabCount = tabs.length;

    switch (e.key) {
      case 'ArrowLeft': {
        e.preventDefault();
        const prevIndex = (index - 1 + tabCount) % tabCount;
        const prevTab = tabs[prevIndex];
        tabRefs.current.get(prevTab.id)?.focus();
        onTabSelect(prevTab.id);
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        const nextIndex = (index + 1) % tabCount;
        const nextTab = tabs[nextIndex];
        tabRefs.current.get(nextTab.id)?.focus();
        onTabSelect(nextTab.id);
        break;
      }
      case 'Home': {
        e.preventDefault();
        const firstTab = tabs[0];
        tabRefs.current.get(firstTab.id)?.focus();
        onTabSelect(firstTab.id);
        break;
      }
      case 'End': {
        e.preventDefault();
        const lastTab = tabs[tabCount - 1];
        tabRefs.current.get(lastTab.id)?.focus();
        onTabSelect(lastTab.id);
        break;
      }
      case 'Delete': {
        e.preventDefault();
        onTabClose(tabs[index].id);
        break;
      }
    }
  }, [tabs, onTabSelect, onTabClose]);

  // Middle-click to close
  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    if (e.button === 1) { // Middle click
      e.preventDefault();
      onTabClose(id);
    }
  }, [onTabClose]);

  // Drag and drop
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onTabReorder(draggedIndex, index);
      setDraggedIndex(index);
    }
  }, [draggedIndex, onTabReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  return (
    <div className={styles.container}>
      <div
        className={styles.tabList}
        role="tablist"
        aria-label="Chat sessions"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.id, el);
              else tabRefs.current.delete(tab.id);
            }}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={tab.id === activeTabId}
            aria-controls={`panel-${tab.id}`}
            tabIndex={tab.id === activeTabId ? 0 : -1}
            className={cn(
              styles.tab,
              tab.id === activeTabId && styles.active,
              tab.isModified && styles.modified,
              draggedIndex === index && styles.dragging
            )}
            onClick={() => onTabSelect(tab.id)}
            onMouseDown={(e) => handleMouseDown(e, tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            <span className={styles.tabTitle}>{tab.title}</span>
            {tab.isModified && (
              <span className={styles.modifiedDot} aria-label="Unsaved changes" />
            )}
            {tab.isLoading && (
              <Icon name="loader" size="xs" className={styles.spinner} />
            )}
            <button
              className={styles.closeButton}
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              aria-label={`Close ${tab.title}`}
              tabIndex={-1}
            >
              <Icon name="x" size="xs" />
            </button>
          </button>
        ))}
      </div>

      <button
        className={styles.newTabButton}
        onClick={onNewTab}
        aria-label="New session"
      >
        <Icon name="plus" size="sm" />
      </button>
    </div>
  );
});
```

---

### Component with Streaming State

```typescript
// src/components/chat/MessageList.tsx
import { memo, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChatMessage } from './ChatMessage';
import { Skeleton } from '@/components/shared';
import { Icon } from '@/components/shared';
import styles from './MessageList.module.css';
import type { Message } from '@/types';

interface MessageListProps {
  messages: Message[];
  streamingMessageId: string | null;
  isLoading: boolean;
  onFileClick: (path: string) => void;
  onRetry: (messageId: string) => void;
}

export const MessageList = memo(function MessageList({
  messages,
  streamingMessageId,
  isLoading,
  onFileClick,
  onRetry,
}: MessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  // Virtual list for performance
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated row height
    overscan: 5,
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (shouldAutoScroll.current && parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  }, [messages.length, streamingMessageId]);

  // Detect user scroll to disable auto-scroll
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    shouldAutoScroll.current = isAtBottom;
  }, []);

  const scrollToBottom = useCallback(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
      shouldAutoScroll.current = true;
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <Skeleton className={styles.skeleton} count={3} />
      </div>
    );
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Icon name="message-circle" size="lg" className={styles.emptyIcon} />
        <h3>Start a conversation</h3>
        <p>Send a message to begin working with Claude</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div
        ref={parentRef}
        className={styles.container}
        onScroll={handleScroll}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const message = messages[virtualRow.index];
            return (
              <div
                key={message.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <ChatMessage
                  message={message}
                  isStreaming={message.id === streamingMessageId}
                  onFileClick={onFileClick}
                  onRetry={() => onRetry(message.id)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {!shouldAutoScroll.current && (
        <button
          className={styles.scrollButton}
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
        >
          <Icon name="chevron-down" size="sm" />
        </button>
      )}
    </div>
  );
});
```

---

### Modal Component

```typescript
// src/components/modals/Modal.tsx
import { memo, useEffect, useRef, useCallback, ReactNode, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/shared';
import { cn } from '@/utils/classnames';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  footer?: ReactNode;
}

export const Modal = memo(function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  footer,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Store previously focused element and focus modal
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else {
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  // Trap focus inside modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key !== 'Tab' || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={cn(styles.modal, styles[size])}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <header className={styles.header}>
          <h2 id="modal-title" className={styles.title}>{title}</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            <Icon name="x" size="md" />
          </button>
        </header>

        <div className={styles.content}>
          {children}
        </div>

        {footer && (
          <footer className={styles.footer}>
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
});
```

---

## Hook Patterns

### Tauri Event Subscription

```typescript
// src/hooks/use-tauri-events.ts
import { useEffect, useRef, useCallback } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

/**
 * Subscribe to Tauri backend events with automatic cleanup.
 * Handler reference is stable - updates without resubscribing.
 */
export function useTauriEvent<T>(
  eventName: string,
  handler: (payload: T) => void
): void {
  const handlerRef = useRef(handler);

  // Update ref on every render (no re-subscription needed)
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    let mounted = true;

    const subscribe = async () => {
      unlisten = await listen<T>(eventName, (event) => {
        if (mounted) {
          handlerRef.current(event.payload);
        }
      });
    };

    subscribe();

    return () => {
      mounted = false;
      unlisten?.();
    };
  }, [eventName]);
}

/**
 * Subscribe to multiple events with the same handler type.
 */
export function useTauriEvents<T>(
  eventNames: string[],
  handler: (eventName: string, payload: T) => void
): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const unlisteners: UnlistenFn[] = [];
    let mounted = true;

    const subscribe = async () => {
      for (const eventName of eventNames) {
        const unlisten = await listen<T>(eventName, (event) => {
          if (mounted) {
            handlerRef.current(eventName, event.payload);
          }
        });
        unlisteners.push(unlisten);
      }
    };

    subscribe();

    return () => {
      mounted = false;
      unlisteners.forEach(unlisten => unlisten());
    };
  }, [eventNames.join(',')]); // Stringify for stable dependency
}
```

---

### Claude Session Management Hook

```typescript
// src/hooks/use-claude-session.ts
import { useCallback, useEffect } from 'react';
import { useSessionsStore } from '@/stores';
import { sessionsService } from '@/services';
import { useTauriEvent } from './use-tauri-events';
import type {
  ClaudeOutputPayload,
  ClaudeStatusPayload,
  ClaudeErrorPayload,
} from '@/types';

interface UseClaudeSessionOptions {
  autoConnect?: boolean;
  resume?: boolean;
}

export function useClaudeSession(
  sessionId: string | null,
  options: UseClaudeSessionOptions = {}
) {
  const { autoConnect = true, resume = true } = options;

  const {
    updateStreamingMessage,
    completeMessage,
    setSessionStatus,
    addErrorMessage,
  } = useSessionsStore();

  // Handle streaming output
  useTauriEvent<ClaudeOutputPayload>('claude_output', (payload) => {
    if (payload.sessionId !== sessionId) return;

    if (payload.isComplete) {
      completeMessage(payload.messageId);
    } else {
      updateStreamingMessage(payload.messageId, payload.chunk, payload.toolUse);
    }
  });

  // Handle status changes
  useTauriEvent<ClaudeStatusPayload>('claude_status', (payload) => {
    if (payload.sessionId !== sessionId) return;
    setSessionStatus(sessionId, payload.status);
  });

  // Handle errors
  useTauriEvent<ClaudeErrorPayload>('claude_error', (payload) => {
    if (payload.sessionId !== sessionId) return;
    addErrorMessage(sessionId, payload.error, payload.recoverable);
  });

  // Auto-connect on mount
  useEffect(() => {
    if (!sessionId || !autoConnect) return;

    sessionsService.startCli(sessionId, resume).catch((error) => {
      console.error('Failed to start CLI:', error);
    });

    return () => {
      sessionsService.stopCli(sessionId).catch(() => {
        // Ignore cleanup errors
      });
    };
  }, [sessionId, autoConnect, resume]);

  // Actions
  const sendMessage = useCallback(async (content: string) => {
    if (!sessionId || !content.trim()) return;
    await sessionsService.sendMessage(sessionId, content);
  }, [sessionId]);

  const cancelResponse = useCallback(async () => {
    if (!sessionId) return;
    await sessionsService.cancelResponse(sessionId);
  }, [sessionId]);

  const reconnect = useCallback(async () => {
    if (!sessionId) return;
    await sessionsService.stopCli(sessionId);
    await sessionsService.startCli(sessionId, resume);
  }, [sessionId, resume]);

  return {
    sendMessage,
    cancelResponse,
    reconnect,
  };
}
```

---

### File Watcher Hook

```typescript
// src/hooks/use-file-watcher.ts
import { useEffect, useCallback } from 'react';
import { useActivityStore } from '@/stores';
import { systemService } from '@/services';
import { useTauriEvent } from './use-tauri-events';
import type { FileChangedPayload } from '@/types';

interface UseFileWatcherOptions {
  recursive?: boolean;
  ignorePatterns?: string[];
}

export function useFileWatcher(
  sessionId: string | null,
  watchPath: string | null,
  options: UseFileWatcherOptions = {}
) {
  const { recursive = true, ignorePatterns = ['node_modules', '.git', 'dist'] } = options;
  const { addEntry, clearEntries } = useActivityStore();

  // Handle file change events
  useTauriEvent<FileChangedPayload>('file_changed', (payload) => {
    if (payload.sessionId !== sessionId) return;

    addEntry({
      id: `${payload.timestamp}-${payload.path}`,
      type: payload.type,
      filePath: payload.path,
      relativePath: payload.relativePath,
      timestamp: payload.timestamp,
      source: payload.source,
    });
  });

  // Start/stop watcher
  useEffect(() => {
    if (!sessionId || !watchPath) return;

    systemService.startFileWatcher(sessionId, watchPath, {
      recursive,
      ignorePatterns,
    }).catch((error) => {
      console.error('Failed to start file watcher:', error);
    });

    return () => {
      systemService.stopFileWatcher(sessionId).catch(() => {
        // Ignore cleanup errors
      });
    };
  }, [sessionId, watchPath, recursive, ignorePatterns.join(',')]);

  // Actions
  const clear = useCallback(() => {
    if (!sessionId) return;
    clearEntries(sessionId);
  }, [sessionId, clearEntries]);

  return { clear };
}
```

---

### Debounce Hook

```typescript
// src/hooks/use-debounce.ts
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Debounce a value - returns the value after it stops changing.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce a callback - returns a stable debounced function.
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    callbackRef.current = callback;
  });

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return debouncedCallback;
}
```

---

### Panel Resize Hook

```typescript
// src/hooks/use-panel-resize.ts
import { useState, useCallback, useRef, useEffect } from 'react';

interface UsePanelResizeOptions {
  minLeft: number;
  minRight: number;
  snapPoints?: number[];
  snapThreshold?: number;
  defaultPosition?: number;
}

export function usePanelResize(
  containerRef: React.RefObject<HTMLElement>,
  options: UsePanelResizeOptions
) {
  const {
    minLeft,
    minRight,
    snapPoints = [30, 50, 70],
    snapThreshold = 20,
    defaultPosition = 50,
  } = options;

  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startPosition = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startX.current = e.clientX;
    startPosition.current = position;
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const deltaX = e.clientX - startX.current;
    const deltaPercent = (deltaX / containerWidth) * 100;
    let newPosition = startPosition.current + deltaPercent;

    // Enforce minimum widths
    const minLeftPercent = (minLeft / containerWidth) * 100;
    const minRightPercent = (minRight / containerWidth) * 100;
    newPosition = Math.max(minLeftPercent, Math.min(100 - minRightPercent, newPosition));

    // Snap to points
    for (const snap of snapPoints) {
      if (Math.abs(newPosition - snap) < (snapThreshold / containerWidth) * 100) {
        newPosition = snap;
        break;
      }
    }

    setPosition(newPosition);
  }, [isDragging, containerRef, minLeft, minRight, snapPoints, snapThreshold]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDoubleClick = useCallback(() => {
    setPosition(50); // Reset to 50/50
  }, []);

  // Global mouse events during drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return {
    position,
    isDragging,
    dividerProps: {
      onMouseDown: handleMouseDown,
      onDoubleClick: handleDoubleClick,
    },
  };
}
```

---

## Store Patterns

### Sessions Store (Complete Example)

```typescript
// src/stores/sessions.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Session, Message, Tab, ToolUsage, ClaudeStatus } from '@/types';

interface SessionsState {
  // Data
  sessions: Record<string, Session>;
  messages: Record<string, Message[]>;
  tabs: Tab[];
  activeTabId: string | null;
  sessionStatuses: Record<string, ClaudeStatus>;

  // Derived (computed via selectors, not stored)
}

interface SessionsActions {
  // Session management
  addSession: (session: Session) => void;
  removeSession: (id: string) => void;
  updateSession: (id: string, updates: Partial<Session>) => void;

  // Message management
  addMessage: (sessionId: string, message: Message) => void;
  updateStreamingMessage: (messageId: string, chunk: string, toolUse?: ToolUsage) => void;
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

const initialState: SessionsState = {
  sessions: {},
  messages: {},
  tabs: [],
  activeTabId: null,
  sessionStatuses: {},
};

export const useSessionsStore = create<SessionsState & SessionsActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      // Session management
      addSession: (session) => set((state) => {
        state.sessions[session.id] = session;
        state.messages[session.id] = [];
      }),

      removeSession: (id) => set((state) => {
        delete state.sessions[id];
        delete state.messages[id];
        delete state.sessionStatuses[id];

        // Remove associated tab
        const tabIndex = state.tabs.findIndex(t => t.sessionId === id);
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
      }),

      updateStreamingMessage: (messageId, chunk, toolUse) => set((state) => {
        for (const messages of Object.values(state.messages)) {
          const message = messages.find(m => m.id === messageId);
          if (message) {
            message.content += chunk;
            if (toolUse) {
              message.toolUsages = message.toolUsages ?? [];
              message.toolUsages.push(toolUse);
            }
            break;
          }
        }
      }),

      completeMessage: (messageId) => set((state) => {
        for (const messages of Object.values(state.messages)) {
          const message = messages.find(m => m.id === messageId);
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
        state.messages[sessionId].push({
          id: `error-${Date.now()}`,
          sessionId,
          role: 'system',
          content: error,
          timestamp: new Date().toISOString(),
          isError: true,
          isRecoverable: recoverable,
        });
      }),

      // Tab management
      addTab: (tab) => set((state) => {
        state.tabs.push(tab);
        state.activeTabId = tab.id;
      }),

      removeTab: (tabId) => set((state) => {
        const index = state.tabs.findIndex(t => t.id === tabId);
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
      }),

      reorderTabs: (fromIndex, toIndex) => set((state) => {
        const [tab] = state.tabs.splice(fromIndex, 1);
        state.tabs.splice(toIndex, 0, tab);
      }),

      updateTab: (tabId, updates) => set((state) => {
        const tab = state.tabs.find(t => t.id === tabId);
        if (tab) {
          Object.assign(tab, updates);
        }
      }),

      // Status management
      setSessionStatus: (sessionId, status) => set((state) => {
        state.sessionStatuses[sessionId] = status;
      }),

      // Bulk operations
      loadSessionWithMessages: (session, messages) => set((state) => {
        state.sessions[session.id] = session;
        state.messages[session.id] = messages;
      }),

      reset: () => set(initialState),
    })),
    {
      name: 'wingman-sessions',
      storage: createJSONStorage(() => localStorage),
      // Only persist UI state, not data (data is in SQLite)
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
  Object.values(state.sessionStatuses).some(s => s === 'busy');
```

---

### UI Store

```typescript
// src/stores/ui.ts
import { create } from 'zustand';

type ModalType = 'new-session' | 'confirm' | 'cli-setup' | 'task' | null;
type RightPanelTab = 'preview' | 'activity' | 'dashboard';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  autoDismiss: boolean;
}

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
}

interface UIActions {
  // Modal
  openModal: (modal: ModalType, data?: unknown) => void;
  closeModal: () => void;

  // Panel
  setLeftPanelWidth: (width: number) => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
  toggleRightPanel: () => void;

  // Notifications
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;

  // View
  navigateTo: (view: UIState['currentView']) => void;
}

export const useUIStore = create<UIState & UIActions>()((set) => ({
  // Initial state
  activeModal: null,
  modalData: null,
  leftPanelWidth: 50,
  rightPanelTab: 'preview',
  isRightPanelCollapsed: false,
  notifications: [],
  currentView: 'main',

  // Modal actions
  openModal: (modal, data) => set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  // Panel actions
  setLeftPanelWidth: (width) => set({ leftPanelWidth: width }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  toggleRightPanel: () => set((s) => ({ isRightPanelCollapsed: !s.isRightPanelCollapsed })),

  // Notification actions
  addNotification: (notification) => set((state) => {
    const id = `notif-${Date.now()}`;
    const newNotification = { ...notification, id };

    // Auto-dismiss after 5 seconds
    if (notification.autoDismiss) {
      setTimeout(() => {
        set((s) => ({
          notifications: s.notifications.filter(n => n.id !== id),
        }));
      }, 5000);
    }

    return { notifications: [...state.notifications, newNotification] };
  }),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id),
  })),

  // View actions
  navigateTo: (view) => set({ currentView: view }),
}));
```

---

## Service Patterns

### Complete Service with Error Handling

```typescript
// src/services/sessions.ts
import { invokeCommand } from './tauri';
import type {
  Session,
  SessionSummary,
  SessionWithMessages,
  SessionCreateRequest,
  AppError,
} from '@/types';

class SessionsServiceError extends Error {
  constructor(public code: string, message: string, public details?: unknown) {
    super(message);
    this.name = 'SessionsServiceError';
  }
}

export const sessionsService = {
  /**
   * Create a new chat session
   */
  async create(request: SessionCreateRequest): Promise<string> {
    return invokeCommand<string>('session_create', request);
  },

  /**
   * Load a session with all messages and activity
   */
  async load(sessionId: string): Promise<SessionWithMessages> {
    return invokeCommand<SessionWithMessages>('session_load', { sessionId });
  },

  /**
   * Delete a session permanently
   */
  async delete(sessionId: string): Promise<void> {
    return invokeCommand<void>('session_delete', { sessionId });
  },

  /**
   * Rename a session
   */
  async rename(sessionId: string, title: string): Promise<void> {
    if (!title.trim()) {
      throw new SessionsServiceError('INVALID_INPUT', 'Title cannot be empty');
    }
    if (title.length > 100) {
      throw new SessionsServiceError('INVALID_INPUT', 'Title must be 100 characters or less');
    }
    return invokeCommand<void>('session_rename', { sessionId, title: title.trim() });
  },

  /**
   * List all sessions with optional filtering
   */
  async list(options: {
    projectId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<SessionSummary[]> {
    return invokeCommand<SessionSummary[]>('session_list', {
      projectId: options.projectId,
      limit: options.limit ?? 50,
      offset: options.offset ?? 0,
    });
  },

  /**
   * Start Claude CLI for a session
   */
  async startCli(sessionId: string, resume = false): Promise<void> {
    return invokeCommand<void>('session_start_cli', { sessionId, resume });
  },

  /**
   * Stop Claude CLI for a session
   */
  async stopCli(sessionId: string): Promise<void> {
    return invokeCommand<void>('session_stop_cli', { sessionId });
  },

  /**
   * Send a message to Claude
   */
  async sendMessage(sessionId: string, content: string): Promise<string> {
    if (!content.trim()) {
      throw new SessionsServiceError('INVALID_INPUT', 'Message cannot be empty');
    }
    return invokeCommand<string>('session_send_message', {
      sessionId,
      content: content.trim(),
    });
  },

  /**
   * Cancel an in-progress response
   */
  async cancelResponse(sessionId: string): Promise<void> {
    return invokeCommand<void>('session_cancel_response', { sessionId });
  },
};
```

---

### Base Tauri Service

```typescript
// src/services/tauri.ts
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import type { AppError } from '@/types';

/**
 * Typed wrapper for Tauri invoke
 */
export async function invokeCommand<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    // Error is already typed from Rust
    throw error as AppError;
  }
}

/**
 * Subscribe to a Tauri event
 */
export async function subscribeToEvent<T>(
  event: string,
  handler: (payload: T) => void
): Promise<UnlistenFn> {
  return listen<T>(event, (e) => handler(e.payload));
}

/**
 * Check if an error is a specific error type
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
```

---

## IPC Patterns

### Frontend IPC Call with Error Handling

```typescript
// Example: Creating a new session with full error handling
import { sessionsService } from '@/services';
import { useSessionsStore, useUIStore } from '@/stores';
import type { AppError } from '@/types';

async function createNewSession(workingDirectory: string, projectId?: string) {
  const { addSession, addTab, setActiveTab } = useSessionsStore.getState();
  const { addNotification, openModal } = useUIStore.getState();

  try {
    // Create session
    const sessionId = await sessionsService.create({
      workingDirectory,
      projectId,
    });

    // Load full session data
    const { session, messages } = await sessionsService.load(sessionId);

    // Update stores
    addSession(session);
    addTab({
      id: sessionId,
      sessionId,
      title: session.title,
      projectName: session.projectName,
      isModified: false,
      isLoading: false,
    });
    setActiveTab(sessionId);

    return sessionId;
  } catch (error) {
    const appError = error as AppError;

    switch (appError.code) {
      case 'INVALID_INPUT':
        addNotification({
          type: 'error',
          message: appError.message,
          autoDismiss: true,
        });
        break;

      case 'FILE_SYSTEM_ERROR':
        addNotification({
          type: 'error',
          message: `Directory not found: ${workingDirectory}`,
          autoDismiss: false,
        });
        break;

      case 'CLAUDE_CLI_NOT_FOUND':
        openModal('cli-setup');
        break;

      default:
        addNotification({
          type: 'error',
          message: 'Failed to create session. Please try again.',
          autoDismiss: true,
        });
        console.error('Session creation error:', appError);
    }

    throw error;
  }
}
```

---

## CSS Module Patterns

### Component Styles with Tokens

```css
/* src/components/chat/ChatMessage.module.css */

/* Container with role-based variants */
.container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  max-width: 85%;
  transition: background-color var(--animation-fast);
}

/* Role variants */
.user {
  align-self: flex-end;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
}

.assistant {
  align-self: flex-start;
  background: var(--color-surface);
}

.system {
  align-self: center;
  background: var(--color-surface-inset);
  border: 1px dashed var(--color-border);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

/* Streaming state */
.streaming {
  border-color: var(--color-accent);
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.role {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.timestamp {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* Content */
.content {
  font-size: var(--font-size-md);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

/* Streaming cursor */
.cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--color-accent);
  margin-left: 2px;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

/* Expand toggle */
.expandToggle {
  align-self: flex-start;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-accent);
  background: none;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background-color var(--animation-fast);
}

.expandToggle:hover {
  background: var(--color-surface-hover);
}

.expandToggle:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Tool usages */
.toolUsages {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
}

/* Retry button */
.retryButton {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--animation-fast);
}

.retryButton:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

/* Responsive */
@media (max-width: 600px) {
  .container {
    max-width: 95%;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
}
```

---

### CSS Classname Utility

```typescript
// src/utils/classnames.ts

type ClassValue = string | boolean | undefined | null | ClassValue[];

/**
 * Merge CSS class names, filtering out falsy values.
 * Similar to clsx but minimal.
 */
export function cn(...classes: ClassValue[]): string {
  return classes
    .flat()
    .filter((c): c is string => typeof c === 'string' && c.length > 0)
    .join(' ');
}

// Usage:
// cn(styles.button, isActive && styles.active, size === 'lg' && styles.large)
// => "button active large" (if conditions are true)
```

---

## Rust Backend Patterns

### Command with Validation

```rust
// src-tauri/src/commands/session.rs
use crate::db;
use crate::error::AppError;
use crate::state::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionCreateRequest {
    pub working_directory: String,
    pub project_id: Option<String>,
    pub title: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionResponse {
    pub id: String,
    pub title: String,
    pub working_directory: String,
    pub project_id: Option<String>,
    pub created_at: String,
}

#[tauri::command]
pub async fn session_create(
    request: SessionCreateRequest,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    // Validate input
    if request.working_directory.is_empty() {
        return Err(AppError::invalid_input("Working directory is required"));
    }

    // Check if path is absolute
    let path = std::path::Path::new(&request.working_directory);
    if !path.is_absolute() {
        return Err(AppError::invalid_input("Working directory must be an absolute path"));
    }

    // Check if directory exists
    if !path.exists() {
        return Err(AppError::file_system(format!(
            "Directory does not exist: {}",
            request.working_directory
        )));
    }

    if !path.is_dir() {
        return Err(AppError::file_system(format!(
            "Path is not a directory: {}",
            request.working_directory
        )));
    }

    // Validate title if provided
    let title = request.title.as_deref().unwrap_or("New Session");
    if title.len() > 100 {
        return Err(AppError::invalid_input("Title must be 100 characters or less"));
    }

    // Create session in database
    let session_id = db::sessions::create(
        &state.db,
        &request.working_directory,
        request.project_id.as_deref(),
        Some(title),
    )
    .await?;

    Ok(session_id)
}

#[tauri::command]
pub async fn session_load(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<SessionWithMessages, AppError> {
    // Get session
    let session = db::sessions::get_by_id(&state.db, &session_id)
        .await?
        .ok_or_else(|| AppError::not_found("Session", &session_id))?;

    // Get messages
    let messages = db::messages::get_by_session(&state.db, &session_id).await?;

    // Get activity
    let activity = db::activity::get_by_session(&state.db, &session_id).await?;

    Ok(SessionWithMessages {
        session,
        messages,
        activity,
    })
}
```

---

### Database Connection Setup

SQLite foreign keys must be enabled per-connection. This pattern ensures they're always enabled:

```rust
// src-tauri/src/db/mod.rs
use sqlx::{Pool, Sqlite, sqlite::SqlitePoolOptions};
use std::path::Path;

/// Create a connection pool with foreign keys enabled
pub async fn create_pool(db_path: &Path) -> Result<Pool<Sqlite>, sqlx::Error> {
    let database_url = format!("sqlite:{}?mode=rwc", db_path.display());

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .after_connect(|conn, _meta| {
            Box::pin(async move {
                // Enable foreign keys for this connection
                sqlx::query("PRAGMA foreign_keys = ON")
                    .execute(conn)
                    .await?;
                Ok(())
            })
        })
        .connect(&database_url)
        .await?;

    // Run migrations
    sqlx::migrate!("./migrations").run(&pool).await?;

    Ok(pool)
}

/// Initialize the database in the app data directory
pub async fn init(app_handle: &tauri::AppHandle) -> Result<Pool<Sqlite>, crate::error::AppError> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| crate::error::AppError::database(e))?;

    // Create directory if it doesn't exist
    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| crate::error::AppError::file_system(e.to_string()))?;

    let db_path = app_data_dir.join("wingman.db");

    create_pool(&db_path)
        .await
        .map_err(|e| crate::error::AppError::database(e))
}
```

---

### AppError Implementation

```rust
// src-tauri/src/error.rs
use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppError {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

impl AppError {
    pub fn not_found(entity: &str, id: &str) -> Self {
        Self {
            code: "NOT_FOUND".into(),
            message: format!("{} '{}' not found", entity, id),
            details: None,
        }
    }

    pub fn already_exists(entity: &str, identifier: &str) -> Self {
        Self {
            code: "ALREADY_EXISTS".into(),
            message: format!("{} '{}' already exists", entity, identifier),
            details: None,
        }
    }

    pub fn invalid_input(message: &str) -> Self {
        Self {
            code: "INVALID_INPUT".into(),
            message: message.into(),
            details: None,
        }
    }

    pub fn database(err: impl std::fmt::Display) -> Self {
        Self {
            code: "DATABASE_ERROR".into(),
            message: "Database operation failed".into(),
            details: Some(serde_json::json!({ "error": err.to_string() })),
        }
    }

    pub fn file_system(message: impl Into<String>) -> Self {
        Self {
            code: "FILE_SYSTEM_ERROR".into(),
            message: message.into(),
            details: None,
        }
    }

    pub fn claude_cli_not_found() -> Self {
        Self {
            code: "CLAUDE_CLI_NOT_FOUND".into(),
            message: "Claude CLI not found. Please install it and ensure it's in your PATH.".into(),
            details: None,
        }
    }

    pub fn claude_cli_error(message: impl Into<String>) -> Self {
        Self {
            code: "CLAUDE_CLI_ERROR".into(),
            message: message.into(),
            details: None,
        }
    }

    pub fn internal(message: impl Into<String>) -> Self {
        Self {
            code: "INTERNAL_ERROR".into(),
            message: message.into(),
            details: None,
        }
    }
}

// Implement std::error::Error for compatibility
impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "[{}] {}", self.code, self.message)
    }
}

impl std::error::Error for AppError {}

// Convert from rusqlite errors
impl From<rusqlite::Error> for AppError {
    fn from(err: rusqlite::Error) -> Self {
        AppError::database(err)
    }
}

// Convert from IO errors
impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::file_system(err.to_string())
    }
}
```

---

### Event Emission

```rust
// src-tauri/src/events/emitter.rs
use serde::Serialize;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeOutputPayload {
    pub session_id: String,
    pub message_id: String,
    pub chunk: String,
    pub is_complete: bool,
    pub tool_use: Option<ToolUseEvent>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolUseEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub file_path: String,
    pub details: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileChangedPayload {
    pub session_id: String,
    #[serde(rename = "type")]
    pub change_type: String,
    pub path: String,
    pub relative_path: String,
    pub timestamp: String,
    pub source: String,
}

pub fn emit_claude_output(app: &AppHandle, payload: ClaudeOutputPayload) {
    let _ = app.emit("claude_output", payload);
}

pub fn emit_claude_status(app: &AppHandle, session_id: &str, status: &str) {
    let _ = app.emit("claude_status", serde_json::json!({
        "sessionId": session_id,
        "status": status
    }));
}

pub fn emit_claude_error(
    app: &AppHandle,
    session_id: &str,
    error: &str,
    recoverable: bool
) {
    let _ = app.emit("claude_error", serde_json::json!({
        "sessionId": session_id,
        "error": error,
        "recoverable": recoverable
    }));
}

pub fn emit_file_changed(app: &AppHandle, payload: FileChangedPayload) {
    let _ = app.emit("file_changed", payload);
}
```

---

### Claude CLI Process Management

```rust
// src-tauri/src/claude/process.rs
use crate::error::AppError;
use crate::events::emitter::{emit_claude_output, emit_claude_status, ClaudeOutputPayload};
use std::collections::HashMap;
use std::process::Stdio;
use std::sync::Arc;
use tauri::AppHandle;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::RwLock;

pub struct CliManager {
    processes: Arc<RwLock<HashMap<String, Child>>>,
}

impl CliManager {
    pub fn new() -> Self {
        Self {
            processes: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn start_session(
        &self,
        app: AppHandle,
        session_id: String,
        working_dir: String,
        resume_context: Option<String>,
    ) -> Result<(), AppError> {
        // Check if already running
        {
            let processes = self.processes.read().await;
            if processes.contains_key(&session_id) {
                return Ok(()); // Already running
            }
        }

        // Find Claude CLI
        let claude_path = which::which("claude")
            .map_err(|_| AppError::claude_cli_not_found())?;

        // Spawn process
        let mut cmd = Command::new(claude_path);
        cmd.arg("--print")
            .current_dir(&working_dir)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        let mut child = cmd.spawn()
            .map_err(|e| AppError::claude_cli_error(e.to_string()))?;

        // Send resume context if provided
        if let Some(context) = resume_context {
            if let Some(stdin) = child.stdin.as_mut() {
                use tokio::io::AsyncWriteExt;
                stdin.write_all(context.as_bytes()).await
                    .map_err(|e| AppError::claude_cli_error(e.to_string()))?;
            }
        }

        // Store process
        {
            let mut processes = self.processes.write().await;
            processes.insert(session_id.clone(), child);
        }

        emit_claude_status(&app, &session_id, "ready");

        // Start output streaming in background
        let session_id_clone = session_id.clone();
        let app_clone = app.clone();
        let processes = self.processes.clone();

        tokio::spawn(async move {
            Self::stream_output(app_clone, session_id_clone, processes).await;
        });

        Ok(())
    }

    async fn stream_output(
        app: AppHandle,
        session_id: String,
        processes: Arc<RwLock<HashMap<String, Child>>>,
    ) {
        let stdout = {
            let mut procs = processes.write().await;
            if let Some(child) = procs.get_mut(&session_id) {
                child.stdout.take()
            } else {
                return;
            }
        };

        let Some(stdout) = stdout else { return };
        let reader = BufReader::new(stdout);
        let mut lines = reader.lines();

        let message_id = format!("msg-{}", uuid::Uuid::new_v4());

        while let Ok(Some(line)) = lines.next_line().await {
            // Parse JSON output from Claude CLI
            if let Ok(event) = serde_json::from_str::<serde_json::Value>(&line) {
                let event_type = event.get("type").and_then(|t| t.as_str()).unwrap_or("");

                match event_type {
                    "text" => {
                        let text = event.get("text").and_then(|t| t.as_str()).unwrap_or("");
                        emit_claude_output(&app, ClaudeOutputPayload {
                            session_id: session_id.clone(),
                            message_id: message_id.clone(),
                            chunk: text.to_string(),
                            is_complete: false,
                            tool_use: None,
                        });
                    }
                    "tool_use" => {
                        // Handle tool use events
                    }
                    _ => {}
                }
            }
        }

        // Mark complete
        emit_claude_output(&app, ClaudeOutputPayload {
            session_id: session_id.clone(),
            message_id,
            chunk: String::new(),
            is_complete: true,
            tool_use: None,
        });

        emit_claude_status(&app, &session_id, "ready");
    }

    pub async fn stop_session(&self, session_id: &str) -> Result<(), AppError> {
        let mut processes = self.processes.write().await;
        if let Some(mut child) = processes.remove(session_id) {
            let _ = child.kill().await;
        }
        Ok(())
    }

    pub async fn send_message(&self, session_id: &str, content: &str) -> Result<(), AppError> {
        let mut processes = self.processes.write().await;
        if let Some(child) = processes.get_mut(session_id) {
            if let Some(stdin) = child.stdin.as_mut() {
                use tokio::io::AsyncWriteExt;
                stdin.write_all(content.as_bytes()).await
                    .map_err(|e| AppError::claude_cli_error(e.to_string()))?;
                stdin.write_all(b"\n").await
                    .map_err(|e| AppError::claude_cli_error(e.to_string()))?;
            }
            Ok(())
        } else {
            Err(AppError::claude_cli_error("CLI not running for session"))
        }
    }
}
```

---

## Testing Patterns

### Component Test

```typescript
// src/components/chat/ChatMessage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChatMessage } from './ChatMessage';
import type { Message } from '@/types';

const mockMessage: Message = {
  id: 'msg-1',
  sessionId: 'sess-1',
  role: 'assistant',
  content: 'Hello, how can I help you?',
  timestamp: '2025-01-07T10:00:00Z',
  isStreaming: false,
};

describe('ChatMessage', () => {
  it('renders message content', () => {
    render(<ChatMessage message={mockMessage} />);
    expect(screen.getByText('Hello, how can I help you?')).toBeInTheDocument();
  });

  it('applies correct role styling', () => {
    const { rerender } = render(<ChatMessage message={mockMessage} />);
    expect(screen.getByRole('article')).toHaveClass('assistant');

    rerender(<ChatMessage message={{ ...mockMessage, role: 'user' }} />);
    expect(screen.getByRole('article')).toHaveClass('user');
  });

  it('shows streaming cursor when isStreaming is true', () => {
    render(<ChatMessage message={mockMessage} isStreaming />);
    expect(document.querySelector('.cursor')).toBeInTheDocument();
  });

  it('truncates long messages and shows expand button', () => {
    const longContent = 'A'.repeat(600);
    render(<ChatMessage message={{ ...mockMessage, content: longContent }} />);

    expect(screen.getByText(/Show more/)).toBeInTheDocument();
    expect(screen.getByText(/A{500}\.\.\./)).toBeInTheDocument();
  });

  it('expands truncated message on button click', () => {
    const longContent = 'A'.repeat(600);
    render(<ChatMessage message={{ ...mockMessage, content: longContent }} />);

    fireEvent.click(screen.getByText('Show more'));

    expect(screen.getByText('Show less')).toBeInTheDocument();
    expect(screen.getByText(longContent)).toBeInTheDocument();
  });

  it('calls onFileClick when file chip is clicked', () => {
    const onFileClick = vi.fn();
    const messageWithTools: Message = {
      ...mockMessage,
      toolUsages: [{ type: 'modified', filePath: '/src/app.ts', timestamp: '' }],
    };

    render(<ChatMessage message={messageWithTools} onFileClick={onFileClick} />);
    fireEvent.click(screen.getByText(/app\.ts/));

    expect(onFileClick).toHaveBeenCalledWith('/src/app.ts');
  });

  it('has correct accessibility attributes', () => {
    render(<ChatMessage message={mockMessage} />);

    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-label');
    expect(article.getAttribute('aria-label')).toContain('assistant');
  });
});
```

---

### Hook Test

```typescript
// src/hooks/use-debounce.test.ts
import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useDebounce, useDebouncedCallback } from './use-debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 500));
    expect(result.current).toBe('hello');
  });

  it('updates value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'hello' } }
    );

    rerender({ value: 'world' });
    expect(result.current).toBe('hello'); // Still old value

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('world'); // Now updated
  });

  it('resets timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'b' });
    act(() => vi.advanceTimersByTime(300));

    rerender({ value: 'c' });
    act(() => vi.advanceTimersByTime(300));

    expect(result.current).toBe('a'); // Still waiting

    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe('c'); // Final value
  });
});

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces callback execution', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    result.current('arg1');
    result.current('arg2');
    result.current('arg3');

    expect(callback).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(500));

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('arg3');
  });
});
```

---

### Store Test

```typescript
// src/stores/sessions.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionsStore } from './sessions';
import type { Session, Message } from '@/types';

const mockSession: Session = {
  id: 'sess-1',
  title: 'Test Session',
  workingDirectory: '/test/path',
  createdAt: '2025-01-07T10:00:00Z',
  updatedAt: '2025-01-07T10:00:00Z',
};

const mockMessage: Message = {
  id: 'msg-1',
  sessionId: 'sess-1',
  role: 'user',
  content: 'Hello',
  timestamp: '2025-01-07T10:00:00Z',
};

describe('useSessionsStore', () => {
  beforeEach(() => {
    // Reset store between tests
    useSessionsStore.getState().reset();
  });

  describe('session management', () => {
    it('adds a session', () => {
      const { addSession, sessions } = useSessionsStore.getState();

      addSession(mockSession);

      expect(useSessionsStore.getState().sessions['sess-1']).toEqual(mockSession);
    });

    it('removes a session and associated data', () => {
      const store = useSessionsStore.getState();
      store.addSession(mockSession);
      store.addMessage('sess-1', mockMessage);
      store.addTab({ id: 'sess-1', sessionId: 'sess-1', title: 'Test' });

      store.removeSession('sess-1');

      const state = useSessionsStore.getState();
      expect(state.sessions['sess-1']).toBeUndefined();
      expect(state.messages['sess-1']).toBeUndefined();
      expect(state.tabs.find(t => t.id === 'sess-1')).toBeUndefined();
    });
  });

  describe('message management', () => {
    it('adds messages to a session', () => {
      const store = useSessionsStore.getState();
      store.addSession(mockSession);
      store.addMessage('sess-1', mockMessage);

      expect(useSessionsStore.getState().messages['sess-1']).toHaveLength(1);
      expect(useSessionsStore.getState().messages['sess-1'][0]).toEqual(mockMessage);
    });

    it('updates streaming message content', () => {
      const store = useSessionsStore.getState();
      store.addSession(mockSession);
      store.addMessage('sess-1', { ...mockMessage, content: '', isStreaming: true });

      store.updateStreamingMessage('msg-1', 'Hello ');
      store.updateStreamingMessage('msg-1', 'world!');

      const messages = useSessionsStore.getState().messages['sess-1'];
      expect(messages[0].content).toBe('Hello world!');
    });
  });

  describe('tab management', () => {
    it('reorders tabs', () => {
      const store = useSessionsStore.getState();
      store.addTab({ id: 'tab-1', sessionId: 'sess-1', title: 'Tab 1' });
      store.addTab({ id: 'tab-2', sessionId: 'sess-2', title: 'Tab 2' });
      store.addTab({ id: 'tab-3', sessionId: 'sess-3', title: 'Tab 3' });

      store.reorderTabs(0, 2);

      const tabs = useSessionsStore.getState().tabs;
      expect(tabs.map(t => t.id)).toEqual(['tab-2', 'tab-3', 'tab-1']);
    });
  });
});
```

---

## Error Handling Patterns

### Error Boundary with Recovery

```typescript
// src/components/shared/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });

    // Could send to error reporting service here
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles.container} role="alert">
          <h2 className={styles.title}>Something went wrong</h2>
          <p className={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <pre className={styles.stack}>
              {this.state.errorInfo.componentStack}
            </pre>
          )}
          <Button onClick={this.handleReset}>Try again</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

### Async Error Handler Hook

```typescript
// src/hooks/use-async.ts
import { useState, useCallback } from 'react';
import { useUIStore } from '@/stores';
import { getErrorMessage } from '@/services/tauri';

interface UseAsyncOptions {
  showNotification?: boolean;
  notificationType?: 'error' | 'warning';
}

export function useAsync<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  options: UseAsyncOptions = {}
) {
  const { showNotification = true, notificationType = 'error' } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { addNotification } = useUIStore();

  const execute = useCallback(async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFn(...args);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);

      if (showNotification) {
        addNotification({
          type: notificationType,
          message: getErrorMessage(err),
          autoDismiss: true,
        });
      }

      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [asyncFn, showNotification, notificationType, addNotification]) as T;

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { execute, isLoading, error, reset };
}

// Usage:
// const { execute: createSession, isLoading, error } = useAsync(sessionsService.create);
// await createSession({ workingDirectory: '/path' });
```

---

## Anti-Patterns

### Don't: Inline Complex Logic in JSX

```typescript
// Bad
<div>
  {items.filter(i => i.active && i.visible).map(i => (
    <Item key={i.id} {...i} />
  ))}
</div>

// Good
const visibleItems = useMemo(
  () => items.filter(i => i.active && i.visible),
  [items]
);

<div>
  {visibleItems.map(i => <Item key={i.id} {...i} />)}
</div>
```

### Don't: Forget Cleanup in Effects

```typescript
// Bad
useEffect(() => {
  const unlisten = listen('event', handler);
  // Missing cleanup!
}, []);

// Good
useEffect(() => {
  let unlisten: UnlistenFn;
  listen('event', handler).then(fn => { unlisten = fn; });
  return () => unlisten?.();
}, []);
```

### Don't: Mutate State Directly

```typescript
// Bad
const addItem = (item) => {
  state.items.push(item); // Mutation!
  setState({ items: state.items });
};

// Good (with immer)
const addItem = (item) => set((state) => {
  state.items.push(item); // Immer handles immutability
});

// Good (without immer)
const addItem = (item) => set((state) => ({
  items: [...state.items, item]
}));
```

### Don't: Subscribe to Store Without Selector

```typescript
// Bad - rerenders on ANY store change
const store = useSessionsStore();

// Good - rerenders only when activeTabId changes
const activeTabId = useSessionsStore(state => state.activeTabId);
```

### Don't: Create Objects in Render

```typescript
// Bad - new object every render breaks memoization
<Component style={{ color: 'red' }} options={{ sort: true }} />

// Good - stable references
const style = useMemo(() => ({ color: 'red' }), []);
const options = useMemo(() => ({ sort: true }), []);
<Component style={style} options={options} />
```

### Don't: Use Index as Key for Dynamic Lists

```typescript
// Bad - breaks when items reorder
{items.map((item, index) => <Item key={index} {...item} />)}

// Good - stable unique identifier
{items.map(item => <Item key={item.id} {...item} />)}
```

### Don't: Hardcode Magic Values

```typescript
// Bad
if (messages.length > 100) { ... }
setTimeout(fn, 5000);

// Good
const MAX_VISIBLE_MESSAGES = 100;
const AUTO_DISMISS_DELAY = 5000;

if (messages.length > MAX_VISIBLE_MESSAGES) { ... }
setTimeout(fn, AUTO_DISMISS_DELAY);
```

### Don't: Ignore TypeScript Errors

```typescript
// Bad
const data = response as any;
// @ts-ignore

// Good
interface ResponseData { ... }
const data = response as ResponseData;
// Or better: let TypeScript infer from properly typed functions
```

---

## Quick Reference

| Pattern | File | Use When |
|---------|------|----------|
| Standard Component | `ChatMessage.tsx` | Any presentational component |
| Accessible Component | `TabBar.tsx` | Interactive components with keyboard nav |
| Streaming Component | `MessageList.tsx` | Real-time updating content |
| Modal | `Modal.tsx` | Dialog overlays |
| Event Hook | `use-tauri-events.ts` | Backend event subscriptions |
| Session Hook | `use-claude-session.ts` | Managing Claude CLI |
| Debounce Hook | `use-debounce.ts` | Delayed updates |
| Main Store | `sessions.ts` | Complex state with persistence |
| UI Store | `ui.ts` | Simple transient UI state |
| Service | `sessions.ts` | IPC command wrappers |
| Rust Command | `session.rs` | Backend handlers |
| Error Type | `error.rs` | Consistent error responses |
| Event Emission | `emitter.rs` | Backend → Frontend communication |
