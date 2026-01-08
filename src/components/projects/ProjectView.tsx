/**
 * ProjectView
 * Main view for managing project sprints and tasks
 */

import { memo, useState, useEffect, useCallback } from 'react';
import { FolderKanban, Plus, RefreshCw } from 'lucide-react';
import { Icon, Button } from '@/components/shared';
import {
  useProjectsStore,
  selectActiveProject,
  selectProjectSprints,
  selectSprintTasks,
} from '@/stores';
import { projectsService } from '@/services';
import { cn } from '@/utils';
import type { Task, TaskStatus } from '@/types';
import { SprintColumn } from './SprintColumn';
import { TaskModal, type TaskFormData } from './TaskModal';
import styles from './ProjectView.module.css';

export interface ProjectViewProps {
  className?: string;
}

export const ProjectView = memo(function ProjectView({ className }: ProjectViewProps) {
  const activeProject = useProjectsStore(selectActiveProject);
  const activeProjectId = useProjectsStore((state) => state.activeProjectId);
  const sprints = useProjectsStore(selectProjectSprints(activeProjectId ?? ''));
  const backlogTasks = useProjectsStore(selectSprintTasks(null));
  const setSprints = useProjectsStore((state) => state.setSprints);
  const setTasks = useProjectsStore((state) => state.setTasks);
  const addTask = useProjectsStore((state) => state.addTask);
  const updateTask = useProjectsStore((state) => state.updateTask);

  const [isLoading, setIsLoading] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultSprintId, setDefaultSprintId] = useState<string | null>(null);

  // Load project data
  const loadData = useCallback(async () => {
    if (!activeProjectId) return;

    setIsLoading(true);
    try {
      const [sprintsData, tasksData] = await Promise.all([
        projectsService.getSprints(activeProjectId),
        projectsService.getTasks(activeProjectId),
      ]);
      setSprints(activeProjectId, sprintsData);
      setTasks(activeProjectId, tasksData);
    } catch (err) {
      console.error('Failed to load project data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeProjectId, setSprints, setTasks]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get tasks for a specific sprint
  const getSprintTasks = (sprintId: string) => {
    return useProjectsStore.getState().tasksBySprint[sprintId]
      ?.map((id) => useProjectsStore.getState().tasks[id])
      .filter(Boolean) ?? [];
  };

  // Handle task status change
  const handleTaskStatusChange = useCallback(
    async (taskId: string, status: TaskStatus) => {
      try {
        const updated = await projectsService.updateTask(taskId, { status });
        updateTask(taskId, updated);
      } catch (err) {
        console.error('Failed to update task status:', err);
      }
    },
    [updateTask]
  );

  // Handle add task
  const handleAddTask = useCallback((sprintId: string | null) => {
    setEditingTask(null);
    setDefaultSprintId(sprintId);
    setTaskModalOpen(true);
  }, []);

  // Handle edit task
  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setDefaultSprintId(task.sprintId ?? null);
    setTaskModalOpen(true);
  }, []);

  // Handle save task
  const handleSaveTask = useCallback(
    async (data: TaskFormData) => {
      if (!activeProjectId) return;

      try {
        if (editingTask) {
          // Update existing task
          const updated = await projectsService.updateTask(editingTask.id, {
            title: data.title,
            description: data.description || undefined,
            status: data.status,
            priority: data.priority,
            sprintId: data.sprintId || undefined,
            estimatedHours: data.estimatedHours || undefined,
          });
          updateTask(editingTask.id, updated);
        } else {
          // Create new task
          const newTask = await projectsService.createTask({
            projectId: activeProjectId,
            title: data.title,
            description: data.description || undefined,
            priority: data.priority,
            sprintId: data.sprintId || undefined,
            estimatedHours: data.estimatedHours || undefined,
          });
          addTask(newTask);
        }
      } catch (err) {
        console.error('Failed to save task:', err);
      }
    },
    [activeProjectId, editingTask, addTask, updateTask]
  );

  // No project selected
  if (!activeProject) {
    return (
      <div className={cn(styles.view, styles.empty, className)}>
        <Icon icon={FolderKanban} size="lg" className={styles.emptyIcon} />
        <p className={styles.emptyText}>No project selected</p>
        <p className={styles.emptyHint}>
          Select or create a project to view the sprint board
        </p>
      </div>
    );
  }

  return (
    <div className={cn(styles.view, className)}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Icon icon={FolderKanban} size="sm" className={styles.headerIcon} />
          <h2 className={styles.projectName}>{activeProject.name}</h2>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="ghost"
            size="sm"
            icon={<Icon icon={RefreshCw} size="sm" />}
            onClick={loadData}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Icon icon={Plus} size="sm" />}
            onClick={() => handleAddTask(null)}
          >
            New Task
          </Button>
        </div>
      </div>

      <div className={styles.board}>
        {/* Backlog column */}
        <SprintColumn
          sprint={null}
          tasks={backlogTasks}
          onAddTask={handleAddTask}
          onTaskStatusChange={handleTaskStatusChange}
          onEditTask={handleEditTask}
        />

        {/* Sprint columns */}
        {sprints.map((sprint) => (
          <SprintColumn
            key={sprint.id}
            sprint={sprint}
            tasks={getSprintTasks(sprint.id)}
            onAddTask={handleAddTask}
            onTaskStatusChange={handleTaskStatusChange}
            onEditTask={handleEditTask}
          />
        ))}
      </div>

      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        sprints={sprints}
        defaultSprintId={defaultSprintId}
      />
    </div>
  );
});
