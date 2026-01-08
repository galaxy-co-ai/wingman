import { memo, useCallback } from 'react';
import { Trash2, FilePlus, FileEdit, FileX } from 'lucide-react';
import { Button, Icon } from '@/components/shared';
import { cn } from '@/utils';
import type { ActivityFilter } from '@/stores/activity';
import styles from './ActivityHeader.module.css';

export interface ActivityHeaderProps {
  filter: ActivityFilter;
  onFilterChange: (filter: ActivityFilter) => void;
  onClear: () => void;
  entryCount: number;
  isWatching: boolean;
  className?: string;
}

const FILTER_OPTIONS: { value: ActivityFilter; label: string; icon: typeof FilePlus }[] = [
  { value: 'all', label: 'All', icon: FileEdit },
  { value: 'created', label: 'Created', icon: FilePlus },
  { value: 'modified', label: 'Modified', icon: FileEdit },
  { value: 'deleted', label: 'Deleted', icon: FileX },
];

/**
 * Activity feed header with filter controls and clear button
 */
export const ActivityHeader = memo(function ActivityHeader({
  filter,
  onFilterChange,
  onClear,
  entryCount,
  isWatching,
  className,
}: ActivityHeaderProps) {
  const handleClear = useCallback(() => {
    onClear();
  }, [onClear]);

  return (
    <div className={cn(styles.header, className)}>
      {/* Watcher status indicator */}
      <div className={styles.status}>
        <span
          className={cn(styles.dot, { [styles.active]: isWatching })}
          title={isWatching ? 'Watching for changes' : 'Not watching'}
        />
        <span className={styles.count}>{entryCount} changes</span>
      </div>

      {/* Filter buttons */}
      <div className={styles.filters} role="group" aria-label="Filter activity">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={cn(styles.filterButton, { [styles.active]: filter === option.value })}
            onClick={() => onFilterChange(option.value)}
            title={`Show ${option.label.toLowerCase()} files`}
          >
            <Icon icon={option.icon} size="xs" />
            <span className={styles.filterLabel}>{option.label}</span>
          </button>
        ))}
      </div>

      {/* Clear button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClear}
        disabled={entryCount === 0}
        className={styles.clearButton}
        title="Clear activity"
      >
        <Icon icon={Trash2} size="xs" />
      </Button>
    </div>
  );
});
