/**
 * PreviewToolbar
 * URL input, refresh controls, and auto-refresh toggle
 */

import { memo, useState, useCallback, useEffect, type KeyboardEvent } from 'react';
import { RefreshCw, Home, Zap, ZapOff } from 'lucide-react';
import { Icon, Button } from '@/components/shared';
import { cn } from '@/utils';
import styles from './PreviewToolbar.module.css';

export interface PreviewToolbarProps {
  url: string;
  autoRefresh: boolean;
  isLoading: boolean;
  isRefreshing?: boolean;
  onUrlChange: (url: string) => void;
  onRefresh: () => void;
  onAutoRefreshToggle: (enabled: boolean) => void;
  onHome: () => void;
  className?: string;
}

const DEFAULT_URL = 'http://localhost:3000';

/**
 * Toolbar for preview panel with URL input and controls
 */
export const PreviewToolbar = memo(function PreviewToolbar({
  url,
  autoRefresh,
  isLoading,
  isRefreshing = false,
  onUrlChange,
  onRefresh,
  onAutoRefreshToggle,
  onHome,
  className,
}: PreviewToolbarProps) {
  // Local state for URL input to allow editing without immediate updates
  const [inputValue, setInputValue] = useState(url);

  // Sync input value when URL prop changes
  useEffect(() => {
    setInputValue(url);
  }, [url]);

  // Handle URL submission
  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed && trimmed !== url) {
      // Add protocol if missing
      const finalUrl = /^https?:\/\//i.test(trimmed)
        ? trimmed
        : `http://${trimmed}`;
      onUrlChange(finalUrl);
    }
  }, [inputValue, url, onUrlChange]);

  // Handle Enter key
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }, [handleSubmit]);

  // Handle home button
  const handleHome = useCallback(() => {
    setInputValue(DEFAULT_URL);
    onHome();
  }, [onHome]);

  return (
    <div className={cn(styles.toolbar, className)}>
      {/* URL Input */}
      <div className={styles.urlContainer}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          placeholder="Enter URL..."
          className={styles.urlInput}
          spellCheck={false}
        />
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        {/* Home button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleHome}
          title={`Reset to ${DEFAULT_URL}`}
          className={styles.controlButton}
        >
          <Icon icon={Home} size="sm" />
        </Button>

        {/* Refresh button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh preview"
          className={styles.controlButton}
        >
          <Icon
            icon={RefreshCw}
            size="sm"
            className={cn({ [styles.spinning]: isLoading || isRefreshing })}
          />
        </Button>

        {/* Auto-refresh toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAutoRefreshToggle(!autoRefresh)}
          title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
          className={cn(styles.controlButton, { [styles.active]: autoRefresh })}
        >
          <Icon icon={autoRefresh ? Zap : ZapOff} size="sm" />
        </Button>
      </div>
    </div>
  );
});
