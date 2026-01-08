/**
 * ProgressBar
 * Reusable progress bar component
 */

import { memo } from 'react';
import { cn } from '@/utils';
import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar = memo(function ProgressBar({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn(styles.container, className)}>
      <div
        className={cn(styles.track, styles[size])}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(styles.fill, styles[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className={styles.label}>{Math.round(percentage)}%</span>
      )}
    </div>
  );
});
