/**
 * TodayWidget
 * Shows tasks completed today
 */

import { memo } from 'react';
import { CheckCircle2, Trophy } from 'lucide-react';
import { Icon } from '@/components/shared';
import { cn } from '@/utils';
import styles from './TodayWidget.module.css';

export interface TodayWidgetProps {
  completedToday: number;
  totalTasks: number;
  completedTasks: number;
  className?: string;
}

export const TodayWidget = memo(function TodayWidget({
  completedToday,
  totalTasks,
  completedTasks,
  className,
}: TodayWidgetProps) {
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className={cn(styles.widget, className)}>
      <div className={styles.today}>
        <div className={styles.todayHeader}>
          <Icon icon={CheckCircle2} size="sm" className={styles.icon} />
          <span className={styles.label}>Completed Today</span>
        </div>
        <div className={styles.todayValue}>
          <span className={styles.count}>{completedToday}</span>
          <span className={styles.unit}>task{completedToday !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.overall}>
        <div className={styles.overallHeader}>
          <Icon icon={Trophy} size="sm" className={styles.iconMuted} />
          <span className={styles.labelMuted}>Overall Progress</span>
        </div>
        <div className={styles.overallStats}>
          <span className={styles.fraction}>
            {completedTasks}/{totalTasks}
          </span>
          <span className={styles.percent}>{overallProgress}%</span>
        </div>
      </div>
    </div>
  );
});
