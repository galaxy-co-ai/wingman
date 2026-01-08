/**
 * PreviewWebview
 * Iframe wrapper for displaying web preview
 */

import { memo, useRef, useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Icon } from '@/components/shared';
import { cn } from '@/utils';
import styles from './PreviewWebview.module.css';

export interface PreviewWebviewProps {
  url: string;
  refreshKey: number;
  onLoad: () => void;
  onError: (error: string) => void;
  className?: string;
}

/**
 * Iframe-based web preview component
 * Uses refreshKey to force reload when needed
 */
export const PreviewWebview = memo(function PreviewWebview({
  url,
  refreshKey,
  onLoad,
  onError,
  className,
}: PreviewWebviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle iframe load event
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad();
  }, [onLoad]);

  // Handle iframe error
  const handleError = useCallback(() => {
    setIsLoading(false);
    onError('Failed to load the page. Make sure the server is running.');
  }, [onError]);

  // Reset loading state when URL or refreshKey changes
  useEffect(() => {
    setIsLoading(true);
  }, [url, refreshKey]);

  // Construct URL with cache-busting parameter for refreshes
  const iframeSrc = refreshKey > 0
    ? `${url}${url.includes('?') ? '&' : '?'}_refresh=${refreshKey}`
    : url;

  return (
    <div className={cn(styles.webview, className)}>
      {isLoading && (
        <div className={styles.loading}>
          <Icon icon={Loader2} size="lg" className={styles.spinner} />
          <span>Loading preview...</span>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        className={cn(styles.iframe, { [styles.hidden]: isLoading })}
        onLoad={handleLoad}
        onError={handleError}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        title="Web Preview"
      />
    </div>
  );
});
