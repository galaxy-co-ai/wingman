import { memo, type ReactNode } from 'react';
import { cn } from '@/utils';
import styles from './StatusBar.module.css';

export interface StatusBarProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export const StatusBar = memo(function StatusBar({
  left,
  center,
  right,
  className,
}: StatusBarProps) {
  return (
    <footer className={cn(styles.statusBar, className)}>
      <div className={styles.left}>{left}</div>
      <div className={styles.center}>{center}</div>
      <div className={styles.right}>{right}</div>
    </footer>
  );
});

/** Status indicator component */
export interface StatusIndicatorProps {
  status: 'ready' | 'busy' | 'error' | 'offline';
  label?: string;
}

export const StatusIndicator = memo(function StatusIndicator({
  status,
  label,
}: StatusIndicatorProps) {
  const statusLabels = {
    ready: 'Ready',
    busy: 'Working...',
    error: 'Error',
    offline: 'Offline',
  };

  return (
    <div className={styles.indicator}>
      <span className={cn(styles.dot, styles[status])} />
      <span className={styles.label}>{label || statusLabels[status]}</span>
    </div>
  );
});
