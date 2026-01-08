/**
 * MilestoneWidget
 * Shows next milestone in the dashboard
 */

import { memo } from 'react';
import { Flag, Calendar } from 'lucide-react';
import { Icon, Badge } from '@/components/shared';
import { cn } from '@/utils';
import type { Milestone } from '@/types';
import styles from './MilestoneWidget.module.css';

export interface MilestoneWidgetProps {
  milestone: Milestone | null;
  className?: string;
}

export const MilestoneWidget = memo(function MilestoneWidget({
  milestone,
  className,
}: MilestoneWidgetProps) {
  if (!milestone) {
    return (
      <div className={cn(styles.widget, styles.empty, className)}>
        <Icon icon={Flag} size="md" className={styles.emptyIcon} />
        <p className={styles.emptyText}>No upcoming milestones</p>
      </div>
    );
  }

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  };

  const getDaysUntil = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    try {
      const target = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);
      const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff;
    } catch {
      return null;
    }
  };

  const targetDate = formatDate(milestone.targetDate);
  const daysUntil = getDaysUntil(milestone.targetDate);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ');
  };

  return (
    <div className={cn(styles.widget, className)}>
      <div className={styles.header}>
        <Icon icon={Flag} size="sm" className={styles.icon} />
        <span className={styles.label}>Next Milestone</span>
      </div>

      <div className={styles.content}>
        <h4 className={styles.title}>{milestone.name}</h4>
        {milestone.description && (
          <p className={styles.description}>{milestone.description}</p>
        )}
      </div>

      <div className={styles.footer}>
        <Badge variant={getStatusVariant(milestone.status)} size="sm">
          {formatStatus(milestone.status)}
        </Badge>

        {targetDate && (
          <div className={styles.date}>
            <Icon icon={Calendar} size="xs" className={styles.dateIcon} />
            <span className={styles.dateText}>{targetDate}</span>
            {daysUntil !== null && daysUntil >= 0 && (
              <span className={styles.daysUntil}>
                ({daysUntil} day{daysUntil !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
