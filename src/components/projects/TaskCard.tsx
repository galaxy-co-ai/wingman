/**
 * TaskCard
 * Displays a task with status, priority, and actions
 */

import { memo } from 'react';
import { GripVertical, MoreVertical, Clock } from 'lucide-react';
import { Icon, Badge, Button } from '@/components/shared';
import { cn } from '@/utils';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import styles from './TaskCard.module.css';

export interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  draggable?: boolean;
  className?: string;
}

const priorityConfig: Record<TaskPriority, { label: string; variant: 'default' | 'warning' | 'error' }> = {
  low: { label: 'Low', variant: 'default' },
  medium: { label: 'Medium', variant: 'warning' },
  high: { label: 'High', variant: 'error' },
};

const statusConfig: Record<TaskStatus, { label: string; variant: 'default' | 'info' | 'success' }> = {
  todo: { label: 'To Do', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'info' },
  done: { label: 'Done', variant: 'success' },
};

export const TaskCard = memo(function TaskCard({
  task,
  onStatusChange,
  onEdit,
  draggable = false,
  className,
}: TaskCardProps) {
  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];

  const handleStatusClick = () => {
    if (!onStatusChange) return;
    // Cycle through statuses
    const statuses: TaskStatus[] = ['todo', 'in_progress', 'done'];
    const currentIndex = statuses.indexOf(task.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    onStatusChange(task.id, nextStatus);
  };

  return (
    <div className={cn(styles.card, styles[task.status], className)}>
      {draggable && (
        <div className={styles.dragHandle}>
          <Icon icon={GripVertical} size="sm" />
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.header}>
          <h4 className={styles.title}>{task.title}</h4>
          <Button
            variant="ghost"
            size="sm"
            className={styles.menuButton}
            onClick={() => onEdit?.(task)}
          >
            <Icon icon={MoreVertical} size="xs" />
          </Button>
        </div>

        {task.description && (
          <p className={styles.description}>{task.description}</p>
        )}

        <div className={styles.footer}>
          <div className={styles.badges}>
            <span onClick={handleStatusClick} className={styles.statusBadge}>
              <Badge variant={status.variant} size="sm">
                {status.label}
              </Badge>
            </span>
            <Badge variant={priority.variant} size="sm">
              {priority.label}
            </Badge>
          </div>

          {task.estimatedHours && (
            <div className={styles.estimate}>
              <Icon icon={Clock} size="xs" className={styles.estimateIcon} />
              <span>{task.estimatedHours}h</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
