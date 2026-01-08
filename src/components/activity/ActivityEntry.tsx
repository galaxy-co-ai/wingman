import { memo, useCallback } from 'react';
import { FilePlus, FileEdit, FileX } from 'lucide-react';
import { Icon, Badge } from '@/components/shared';
import { cn, formatRelativeTime, getFileName, getDirectory } from '@/utils';
import type { ActivityEntry as ActivityEntryType } from '@/types';
import styles from './ActivityEntry.module.css';

export interface ActivityEntryProps {
  entry: ActivityEntryType;
  onPathClick?: (path: string) => void;
  className?: string;
}

/**
 * Get icon for operation type
 */
function getOperationIcon(operation: string) {
  switch (operation) {
    case 'created':
      return FilePlus;
    case 'modified':
      return FileEdit;
    case 'deleted':
      return FileX;
    default:
      return FileEdit;
  }
}

/**
 * Individual activity entry showing a file change
 */
export const ActivityEntry = memo(function ActivityEntry({
  entry,
  onPathClick,
  className,
}: ActivityEntryProps) {
  const OperationIcon = getOperationIcon(entry.operation);

  const handleClick = useCallback(() => {
    if (onPathClick) {
      onPathClick(entry.path);
    }
  }, [onPathClick, entry.path]);

  const fileName = getFileName(entry.path);
  const directory = getDirectory(entry.path);

  return (
    <div
      className={cn(styles.entry, className, { [styles.clickable]: !!onPathClick })}
      onClick={handleClick}
      role={onPathClick ? 'button' : undefined}
      tabIndex={onPathClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onPathClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Operation icon */}
      <div className={cn(styles.icon, styles[entry.operation])}>
        <Icon icon={OperationIcon} size="sm" />
      </div>

      {/* File info */}
      <div className={styles.content}>
        <div className={styles.fileName}>{fileName}</div>
        <div className={styles.directory} title={entry.path}>
          {directory || '.'}
        </div>
      </div>

      {/* Metadata */}
      <div className={styles.meta}>
        {/* Source badge */}
        <Badge
          variant={entry.source === 'claude' ? 'accent' : 'default'}
          size="sm"
          className={styles.sourceBadge}
        >
          {entry.source === 'claude' ? 'Claude' : 'External'}
        </Badge>

        {/* Timestamp */}
        <span className={styles.timestamp} title={entry.timestamp}>
          {formatRelativeTime(entry.timestamp)}
        </span>
      </div>
    </div>
  );
});
