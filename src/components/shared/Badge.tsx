import { memo, type ReactNode } from 'react';
import { cn } from '@/utils';
import styles from './Badge.module.css';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  className?: string;
}

export const Badge = memo(function Badge({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className,
}: BadgeProps) {
  return (
    <span className={cn(styles.badge, styles[variant], styles[size], className)}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </span>
  );
});
