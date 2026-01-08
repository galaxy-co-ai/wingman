/**
 * PreviewError
 * Displays error state when preview fails to load
 */

import { memo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Icon, Button } from '@/components/shared';
import { cn } from '@/utils';
import styles from './PreviewError.module.css';

export interface PreviewErrorProps {
  error: string;
  url: string;
  onRetry: () => void;
  className?: string;
}

/**
 * Error display component for preview panel
 */
export const PreviewError = memo(function PreviewError({
  error,
  url,
  onRetry,
  className,
}: PreviewErrorProps) {
  return (
    <div className={cn(styles.error, className)}>
      <Icon icon={AlertCircle} size="xl" className={styles.icon} />
      <h3 className={styles.title}>Failed to load preview</h3>
      <p className={styles.message}>{error}</p>
      <p className={styles.url}>
        Attempted to load: <code>{url}</code>
      </p>
      <Button variant="primary" size="sm" onClick={onRetry}>
        <Icon icon={RefreshCw} size="sm" />
        <span>Retry</span>
      </Button>
    </div>
  );
});
