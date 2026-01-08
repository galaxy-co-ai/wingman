/**
 * Projects Service
 * IPC commands for project, milestone, sprint, and task management
 */

import { invokeCommand } from './tauri';
import type {
  Project,
  Milestone,
  SprintWithProgress,
  Task,
  DashboardStats,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  MilestoneCreateRequest,
  MilestoneUpdateRequest,
  SprintCreateRequest,
  SprintUpdateRequest,
  TaskCreateRequest,
  TaskUpdateRequest,
} from '@/types';

export const projectsService = {
  // ============================================================================
  // Projects
  // ============================================================================

  /**
   * Create a new project
   */
  create: (request: ProjectCreateRequest) =>
    invokeCommand<Project>('project_create', request),

  /**
   * Get all projects
   */
  getAll: () => invokeCommand<Project[]>('project_get_all'),

  /**
   * Get a single project
   */
  get: (projectId: string) => invokeCommand<Project>('project_get', { projectId }),

  /**
   * Update a project
   */
  update: (projectId: string, request: ProjectUpdateRequest) =>
    invokeCommand<Project>('project_update', { projectId, request }),

  /**
   * Delete a project
   */
  delete: (projectId: string) => invokeCommand<void>('project_delete', { projectId }),

  // ============================================================================
  // Milestones
  // ============================================================================

  /**
   * Create a milestone
   */
  createMilestone: (request: MilestoneCreateRequest) =>
    invokeCommand<Milestone>('milestone_create', request),

  /**
   * Get all milestones for a project
   */
  getMilestones: (projectId: string) =>
    invokeCommand<Milestone[]>('milestone_get_all', { projectId }),

  /**
   * Update a milestone
   */
  updateMilestone: (milestoneId: string, request: MilestoneUpdateRequest) =>
    invokeCommand<Milestone>('milestone_update', { milestoneId, request }),

  /**
   * Delete a milestone
   */
  deleteMilestone: (milestoneId: string) =>
    invokeCommand<void>('milestone_delete', { milestoneId }),

  /**
   * Reorder milestones
   */
  reorderMilestones: (milestoneIds: string[]) =>
    invokeCommand<void>('milestone_reorder', { milestoneIds }),

  // ============================================================================
  // Sprints
  // ============================================================================

  /**
   * Create a sprint
   */
  createSprint: (request: SprintCreateRequest) =>
    invokeCommand<SprintWithProgress>('sprint_create', request),

  /**
   * Get all sprints for a project with progress stats
   */
  getSprints: (projectId: string) =>
    invokeCommand<SprintWithProgress[]>('sprint_get_all', { projectId }),

  /**
   * Update a sprint
   */
  updateSprint: (sprintId: string, request: SprintUpdateRequest) =>
    invokeCommand<SprintWithProgress>('sprint_update', { sprintId, request }),

  /**
   * Delete a sprint
   */
  deleteSprint: (sprintId: string) =>
    invokeCommand<void>('sprint_delete', { sprintId }),

  // ============================================================================
  // Tasks
  // ============================================================================

  /**
   * Create a task
   */
  createTask: (request: TaskCreateRequest) =>
    invokeCommand<Task>('task_create', request),

  /**
   * Get all tasks for a project, optionally filtered by sprint
   */
  getTasks: (projectId: string, sprintId?: string) =>
    invokeCommand<Task[]>('task_get_all', { projectId, sprintId }),

  /**
   * Update a task
   */
  updateTask: (taskId: string, request: TaskUpdateRequest) =>
    invokeCommand<Task>('task_update', { taskId, request }),

  /**
   * Move a task to a different sprint
   */
  moveTask: (taskId: string, sprintId?: string) =>
    invokeCommand<void>('task_move', { taskId, sprintId }),

  /**
   * Delete a task
   */
  deleteTask: (taskId: string) => invokeCommand<void>('task_delete', { taskId }),

  /**
   * Add a dependency to a task
   */
  addDependency: (taskId: string, dependsOnTaskId: string) =>
    invokeCommand<void>('task_add_dependency', { taskId, dependsOnTaskId }),

  /**
   * Remove a dependency from a task
   */
  removeDependency: (taskId: string, dependsOnTaskId: string) =>
    invokeCommand<void>('task_remove_dependency', { taskId, dependsOnTaskId }),

  /**
   * Get dependencies for a task
   */
  getDependencies: (taskId: string) =>
    invokeCommand<string[]>('task_get_dependencies', { taskId }),

  // ============================================================================
  // Dashboard
  // ============================================================================

  /**
   * Get dashboard stats for a project
   */
  getDashboardStats: (projectId: string) =>
    invokeCommand<DashboardStats>('dashboard_stats', { projectId }),
};
