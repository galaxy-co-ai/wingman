/**
 * PreviewPanel
 * Container component for web preview with toolbar and webview
 */

import { memo, useCallback } from 'react';
import { Eye } from 'lucide-react';
import { Icon } from '@/components/shared';
import {
  useUIStore,
  selectPreviewUrl,
  selectAutoRefresh,
  selectIsPreviewLoading,
  selectPreviewError,
  selectRefreshCounter,
} from '@/stores';
import { cn } from '@/utils';
import { PreviewToolbar } from './PreviewToolbar';
import { PreviewWebview } from './PreviewWebview';
import { PreviewError } from './PreviewError';
import styles from './PreviewPanel.module.css';

export interface PreviewPanelProps {
  sessionId: string | null;
  className?: string;
}

const DEFAULT_URL = 'http://localhost:3000';

/**
 * Main preview panel with toolbar, webview, and error handling
 */
export const PreviewPanel = memo(function PreviewPanel({
  sessionId,
  className,
}: PreviewPanelProps) {
  const url = useUIStore(selectPreviewUrl);
  const autoRefresh = useUIStore(selectAutoRefresh);
  const isLoading = useUIStore(selectIsPreviewLoading);
  const error = useUIStore(selectPreviewError);
  const refreshCounter = useUIStore(selectRefreshCounter);

  const setPreviewUrl = useUIStore((state) => state.setPreviewUrl);
  const setAutoRefresh = useUIStore((state) => state.setAutoRefresh);
  const setPreviewLoading = useUIStore((state) => state.setPreviewLoading);
  const setPreviewError = useUIStore((state) => state.setPreviewError);
  const triggerRefresh = useUIStore((state) => state.triggerRefresh);

  // Handle URL change from toolbar
  const handleUrlChange = useCallback((newUrl: string) => {
    setPreviewUrl(newUrl);
    setPreviewLoading(true);
    setPreviewError(null);
  }, [setPreviewUrl, setPreviewLoading, setPreviewError]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    setPreviewLoading(true);
    setPreviewError(null);
    triggerRefresh();
  }, [setPreviewLoading, setPreviewError, triggerRefresh]);

  // Handle auto-refresh toggle
  const handleAutoRefreshToggle = useCallback((enabled: boolean) => {
    setAutoRefresh(enabled);
  }, [setAutoRefresh]);

  // Handle home button (reset to default URL)
  const handleHome = useCallback(() => {
    setPreviewUrl(DEFAULT_URL);
    setPreviewLoading(true);
    setPreviewError(null);
  }, [setPreviewUrl, setPreviewLoading, setPreviewError]);

  // Handle webview load complete
  const handleLoad = useCallback(() => {
    setPreviewLoading(false);
    setPreviewError(null);
  }, [setPreviewLoading, setPreviewError]);

  // Handle webview error
  const handleError = useCallback((errorMessage: string) => {
    setPreviewError(errorMessage);
  }, [setPreviewError]);

  // Handle retry after error
  const handleRetry = useCallback(() => {
    setPreviewError(null);
    setPreviewLoading(true);
    triggerRefresh();
  }, [setPreviewError, setPreviewLoading, triggerRefresh]);

  // Show placeholder when no session
  if (!sessionId) {
    return (
      <div className={cn(styles.panel, className)}>
        <div className={styles.placeholder}>
          <Icon icon={Eye} size="lg" className={styles.placeholderIcon} />
          <p className={styles.placeholderText}>No active session</p>
          <p className={styles.placeholderHint}>
            Start a session to use web preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(styles.panel, className)}>
      <PreviewToolbar
        url={url}
        autoRefresh={autoRefresh}
        isLoading={isLoading}
        onUrlChange={handleUrlChange}
        onRefresh={handleRefresh}
        onAutoRefreshToggle={handleAutoRefreshToggle}
        onHome={handleHome}
      />

      {error ? (
        <PreviewError
          error={error}
          url={url}
          onRetry={handleRetry}
        />
      ) : (
        <PreviewWebview
          url={url}
          refreshKey={refreshCounter}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
});
