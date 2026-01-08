/**
 * TabBar Component
 * Displays open session tabs with close button, new tab button, and drag reordering
 */

import { memo, useCallback, useState, useRef, type DragEvent, type KeyboardEvent } from 'react';
import { Icon, X, Plus, MessageSquare } from '@/components/shared';
import { cn } from '@/utils';
import type { Tab } from '@/types';
import styles from './TabBar.module.css';

export interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
  onTabReorder?: (fromIndex: number, toIndex: number) => void;
  className?: string;
}

export const TabBar = memo(function TabBar({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onNewTab,
  onTabReorder,
  className,
}: TabBarProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Handle tab click
  const handleTabClick = useCallback(
    (tabId: string) => {
      onTabSelect(tabId);
    },
    [onTabSelect]
  );

  // Handle close button click (prevent tab selection)
  const handleCloseClick = useCallback(
    (e: React.MouseEvent, tabId: string) => {
      e.stopPropagation();
      onTabClose(tabId);
    },
    [onTabClose]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent, tabId: string, index: number) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          onTabSelect(tabId);
          break;
        case 'Delete':
        case 'Backspace':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onTabClose(tabId);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (index > 0) {
            const prevTab = tabs[index - 1];
            onTabSelect(prevTab.id);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (index < tabs.length - 1) {
            const nextTab = tabs[index + 1];
            onTabSelect(nextTab.id);
          }
          break;
      }
    },
    [tabs, onTabSelect, onTabClose]
  );

  // Drag and drop handlers
  const handleDragStart = useCallback((e: DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragOver = useCallback((e: DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent, toIndex: number) => {
      e.preventDefault();
      const fromIndex = draggedIndex;
      setDraggedIndex(null);
      setDragOverIndex(null);

      if (fromIndex !== null && fromIndex !== toIndex && onTabReorder) {
        onTabReorder(fromIndex, toIndex);
      }
    },
    [draggedIndex, onTabReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  return (
    <div className={cn(styles.tabBar, className)} role="tablist" aria-label="Session tabs">
      <div className={styles.tabsContainer} ref={tabsContainerRef}>
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId;
          const isDragging = index === draggedIndex;
          const isDragOver = index === dragOverIndex;

          return (
            <div
              key={tab.id}
              className={cn(
                styles.tab,
                isActive && styles.active,
                isDragging && styles.dragging,
                isDragOver && styles.dragOver,
                tab.isDirty && styles.dirty
              )}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.sessionId}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleTabClick(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, tab.id, index)}
              draggable={onTabReorder !== undefined}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <Icon icon={MessageSquare} size="xs" className={styles.tabIcon} />
              <span className={styles.tabTitle} title={tab.title}>
                {tab.title}
              </span>
              {tab.isDirty && <span className={styles.dirtyIndicator} aria-label="Unsaved changes" />}
              <button
                className={styles.closeButton}
                onClick={(e) => handleCloseClick(e, tab.id)}
                aria-label={`Close ${tab.title}`}
                tabIndex={-1}
              >
                <Icon icon={X} size="xs" />
              </button>
            </div>
          );
        })}
      </div>

      <button
        className={styles.newTabButton}
        onClick={onNewTab}
        aria-label="New session"
        title="New session (Ctrl+T)"
      >
        <Icon icon={Plus} size="sm" />
      </button>
    </div>
  );
});
