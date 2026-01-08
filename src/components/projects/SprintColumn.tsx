/**
 * SprintColumn
 * Column in the sprint board showing tasks for a sprint or backlog
 */

import { memo } from 'react';
import { Plus } from 'lucide-react';
import { Icon, Button, Badge } from '@/components/shared';
import { cn } from '@/utils';
import type { SprintWithProgress, Task, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';
import { ProgressBar } from '@/components/dashboard';
import styles from './SprintColumn.module.css';

export interface SprintColumnProps {
  sprint: SprintWithProgress | null; // null for backlog
  tasks: Task[];
  onAddTask?: (sprintId: string | null) => void;
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void;
  onEditTask?: (task: Task) => void;
  className?: string;
}

export const SprintColumn = memo(function SprintColumn({
  sprint,
  tasks,
  onAddTask,
  onTaskStatusChange,
  onEditTask,
  className,
}: SprintColumnProps) {
  const isBacklog = !sprint;
  const title = isBacklog ? 'Backlog' : sprint.name;
  const taskCount = tasks.length;

  return (
    <div className={cn(styles.column, className)}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h3 className={styles.title}>{title}</h3>
          <Badge variant="default" size="sm">
            {taskCount}
          </Badge>
        </div>

        {sprint && (
          <div className={styles.progress}>
            <ProgressBar
              value={sprint.progress}
              size="sm"
              variant={sprint.progress >= 100 ? 'success' : 'default'}
            />
            <span className={styles.progressText}>
              {sprint.completedCount}/{sprint.taskCount}
            </span>
          </div>
        )}

        {sprint?.status && (
          <Badge
            variant={
              sprint.status === 'active'
                ? 'info'
                : sprint.status === 'completed'
                ? 'success'
                : 'default'
            }
            size="sm"
            className={styles.statusBadge}
          >
            {sprint.status}
          </Badge>
        )}
      </div>

      <div className={styles.tasks}>
        {tasks.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>No tasks</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={onTaskStatusChange}
              onEdit={onEditTask}
            />
          ))
        )}
      </div>

      <div className={styles.footer}>
        <Button
          variant="ghost"
          size="sm"
          icon={<Icon icon={Plus} size="sm" />}
          onClick={() => onAddTask?.(sprint?.id ?? null)}
          className={styles.addButton}
        >
          Add Task
        </Button>
      </div>
    </div>
  );
});
