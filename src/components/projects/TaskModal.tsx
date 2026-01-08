/**
 * TaskModal
 * Modal for creating and editing tasks
 */

import { memo, useState, useEffect } from 'react';
import { Modal } from '@/components/modals/Modal';
import { Input, Button } from '@/components/shared';
import type { Task, TaskStatus, TaskPriority, SprintWithProgress } from '@/types';
import styles from './TaskModal.module.css';

export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TaskFormData) => void;
  task?: Task | null;
  sprints: SprintWithProgress[];
  defaultSprintId?: string | null;
}

export interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  sprintId: string | null;
  estimatedHours: number | null;
}

const initialFormData: TaskFormData = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  sprintId: null,
  estimatedHours: null,
};

export const TaskModal = memo(function TaskModal({
  isOpen,
  onClose,
  onSave,
  task,
  sprints,
  defaultSprintId,
}: TaskModalProps) {
  const [formData, setFormData] = useState<TaskFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!task;

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        setFormData({
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority,
          sprintId: task.sprintId || null,
          estimatedHours: task.estimatedHours || null,
        });
      } else {
        setFormData({
          ...initialFormData,
          sprintId: defaultSprintId ?? null,
        });
      }
      setErrors({});
    }
  }, [isOpen, task, defaultSprintId]);

  const handleChange = (
    field: keyof TaskFormData,
    value: string | number | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'New Task'}
      size="md"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="title" className={styles.label}>
            Title *
          </label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Enter task title"
            error={errors.title}
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="description" className={styles.label}>
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Add more details about this task"
            className={styles.textarea}
            rows={3}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="status" className={styles.label}>
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value as TaskStatus)}
              className={styles.select}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="priority" className={styles.label}>
              Priority
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value as TaskPriority)}
              className={styles.select}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="sprint" className={styles.label}>
              Sprint
            </label>
            <select
              id="sprint"
              value={formData.sprintId || ''}
              onChange={(e) => handleChange('sprintId', e.target.value || null)}
              className={styles.select}
            >
              <option value="">Backlog</option>
              {sprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="estimate" className={styles.label}>
              Estimate (hours)
            </label>
            <Input
              id="estimate"
              type="number"
              min="0"
              step="0.5"
              value={formData.estimatedHours?.toString() || ''}
              onChange={(e) =>
                handleChange(
                  'estimatedHours',
                  e.target.value ? parseFloat(e.target.value) : null
                )
              }
              placeholder="0"
            />
          </div>
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {isEditing ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
});
