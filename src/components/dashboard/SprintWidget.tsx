/**
 * SprintWidget
 * Shows current sprint progress in the dashboard
 */

import { memo } from 'react';
import { Target, Calendar } from 'lucide-react';
import { Icon } from '@/components/shared';
import { cn } from '@/utils';
import type { SprintWithProgress } from '@/types';
import { ProgressBar } from './ProgressBar';
import styles from './SprintWidget.module.css';

export interface SprintWidgetProps {
  sprint: SprintWithProgress | null;
  className?: string;
}

export const SprintWidget = memo(function SprintWidget({
  sprint,
  className,
}: SprintWidgetProps) {
  if (!sprint) {
    return (
      <div className={cn(styles.widget, styles.empty, className)}>
        <Icon icon={Target} size="md" className={styles.emptyIcon} />
        <p className={styles.emptyText}>No active sprint</p>
      </div>
    );
  }

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return null;
    }
  };

  const endDate = formatDate(sprint.endDate);

  return (
    <div className={cn(styles.widget, className)}>
      <div className={styles.header}>
        <Icon icon={Target} size="sm" className={styles.icon} />
        <span className={styles.title}>{sprint.name}</span>
      </div>

      <div className={styles.progress}>
        <ProgressBar
          value={sprint.progress}
          size="md"
          variant={sprint.progress >= 100 ? 'success' : 'default'}
        />
        <div className={styles.stats}>
          <span className={styles.count}>
            {sprint.completedCount}/{sprint.taskCount} tasks
          </span>
          <span className={styles.percentage}>{Math.round(sprint.progress)}%</span>
        </div>
      </div>

      {endDate && (
        <div className={styles.meta}>
          <Icon icon={Calendar} size="xs" className={styles.metaIcon} />
          <span className={styles.metaText}>Ends {endDate}</span>
        </div>
      )}
    </div>
  );
});
