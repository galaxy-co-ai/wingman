import { memo, useCallback } from 'react';
import { Activity } from 'lucide-react';
import { Icon } from '@/components/shared';
import { useActivityStore, selectFilter, selectIsWatching } from '@/stores';
import { activityService } from '@/services/activity';
import { cn } from '@/utils';
import type { ActivityFilter } from '@/stores/activity';
import { ActivityHeader } from './ActivityHeader';
import { ActivityEntry } from './ActivityEntry';
import styles from './ActivityFeed.module.css';

export interface ActivityFeedProps {
  sessionId: string | null;
  onPathClick?: (path: string) => void;
  className?: string;
}

/**
 * Activity feed showing file changes with filtering
 */
export const ActivityFeed = memo(function ActivityFeed({
  sessionId,
  onPathClick,
  className,
}: ActivityFeedProps) {
  const filter = useActivityStore(selectFilter);
  const isWatching = useActivityStore(selectIsWatching(sessionId ?? ''));
  const setFilter = useActivityStore((state) => state.setFilter);
  const clearEntries = useActivityStore((state) => state.clearEntries);
  const getFilteredEntries = useActivityStore((state) => state.getFilteredEntries);

  // Get filtered entries for this session
  const entries = sessionId ? getFilteredEntries(sessionId) : [];

  const handleFilterChange = useCallback((newFilter: ActivityFilter) => {
    setFilter(newFilter);
  }, [setFilter]);

  const handleClear = useCallback(async () => {
    if (sessionId) {
      try {
        await activityService.clearActivityLog(sessionId);
        clearEntries(sessionId);
      } catch (err) {
        console.error('Failed to clear activity:', err);
      }
    }
  }, [sessionId, clearEntries]);

  if (!sessionId) {
    return (
      <div className={cn(styles.feed, className)}>
        <div className={styles.empty}>
          <Icon icon={Activity} size="lg" className={styles.emptyIcon} />
          <p className={styles.emptyText}>No active session</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(styles.feed, className)}>
      <ActivityHeader
        filter={filter}
        onFilterChange={handleFilterChange}
        onClear={handleClear}
        entryCount={entries.length}
        isWatching={isWatching}
      />

      <div className={styles.list}>
        {entries.length === 0 ? (
          <div className={styles.empty}>
            <Icon icon={Activity} size="lg" className={styles.emptyIcon} />
            <p className={styles.emptyText}>
              {filter === 'all'
                ? 'No file changes yet'
                : `No ${filter} files`}
            </p>
            <p className={styles.emptyHint}>
              Changes will appear here as files are modified
            </p>
          </div>
        ) : (
          entries.map((entry) => (
            <ActivityEntry
              key={entry.id}
              entry={entry}
              onPathClick={onPathClick}
            />
          ))
        )}
      </div>
    </div>
  );
});
