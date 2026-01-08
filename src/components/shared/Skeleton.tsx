import { memo } from 'react';
import { cn } from '@/utils';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
}

export const Skeleton = memo(function Skeleton({
  width,
  height,
  circle = false,
  className,
}: SkeletonProps) {
  return (
    <div
      className={cn(styles.skeleton, { [styles.circle]: circle }, className)}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      aria-hidden="true"
    />
  );
});

/** Skeleton for text lines */
export const SkeletonText = memo(function SkeletonText({
  lines = 1,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn(styles.textWrapper, className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          width={i === lines - 1 && lines > 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  );
});
