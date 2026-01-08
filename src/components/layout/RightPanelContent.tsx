/**
 * RightPanelContent
 * Renders content based on active right panel tab
 */

import { memo } from 'react';
import { ActivityFeed } from '@/components/activity/ActivityFeed';
import { PreviewPanel } from '@/components/preview';
import { Dashboard } from '@/components/dashboard';
import { useActivityFeed, useFileWatcher, usePreviewAutoRefresh } from '@/hooks';
import { systemService } from '@/services';
import type { RightPanelMode } from '@/types';

export interface RightPanelContentProps {
  activeTab: RightPanelMode;
  sessionId: string | null;
  workingDirectory: string | null;
  className?: string;
}

/**
 * Content switcher for the right panel
 * Manages hooks and renders appropriate content based on active tab
 */
export const RightPanelContent = memo(function RightPanelContent({
  activeTab,
  sessionId,
  workingDirectory,
  className,
}: RightPanelContentProps) {
  // Initialize hooks - these run regardless of active tab
  // so we don't lose state when switching tabs
  useActivityFeed(sessionId);
  useFileWatcher(sessionId, workingDirectory);
  usePreviewAutoRefresh(sessionId);

  // Handle path click - open file in default editor
  const handlePathClick = async (path: string) => {
    if (!workingDirectory) return;

    // Construct full path
    const fullPath = path.startsWith('/')
      ? path
      : `${workingDirectory}/${path}`;

    try {
      await systemService.openPath(fullPath);
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  };

  switch (activeTab) {
    case 'activity':
      return (
        <ActivityFeed
          sessionId={sessionId}
          onPathClick={handlePathClick}
          className={className}
        />
      );

    case 'preview':
      return (
        <PreviewPanel
          sessionId={sessionId}
          className={className}
        />
      );

    case 'dashboard':
      return <Dashboard className={className} />;

    default:
      return null;
  }
});
