/**
 * Project Management Types
 */

/** Task status */
export type TaskStatus = 'todo' | 'in_progress' | 'done';

/** Task priority */
export type TaskPriority = 'low' | 'medium' | 'high';

/** Sprint status */
export type SprintStatus = 'planned' | 'active' | 'completed';

/** Milestone status */
export type MilestoneStatus = 'planned' | 'in_progress' | 'completed';

/** Project entity */
export interface Project {
  id: string;
  name: string;
  description?: string;
  rootPath: string;
  previewUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/** Milestone entity */
export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  targetDate?: string;
  status: MilestoneStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** Sprint entity */
export interface Sprint {
  id: string;
  projectId: string;
  milestoneId?: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: SprintStatus;
  createdAt: string;
  updatedAt: string;
}

/** Task entity */
export interface Task {
  id: string;
  projectId: string;
  sprintId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedHours?: number;
  createdAt: string;
  updatedAt: string;
}

/** Task dependency */
export interface TaskDependency {
  taskId: string;
  dependsOnTaskId: string;
}

/** Sprint with computed progress */
export interface SprintWithProgress extends Sprint {
  taskCount: number;
  completedCount: number;
  progress: number;
}

/** Milestone with sprints */
export interface MilestoneWithSprints extends Milestone {
  sprints: Sprint[];
}

/** Dashboard stats from backend */
export interface DashboardStats {
  activeSprint: SprintWithProgress | null;
  tasksCompletedToday: number;
  totalTasks: number;
  completedTasks: number;
  nextMilestone: Milestone | null;
}

/** Request types for API calls */
export interface ProjectCreateRequest {
  name: string;
  description?: string;
  rootPath: string;
  previewUrl?: string;
}

export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
  rootPath?: string;
  previewUrl?: string;
}

export interface MilestoneCreateRequest {
  projectId: string;
  name: string;
  description?: string;
  targetDate?: string;
}

export interface MilestoneUpdateRequest {
  name?: string;
  description?: string;
  targetDate?: string;
  status?: MilestoneStatus;
}

export interface SprintCreateRequest {
  projectId: string;
  milestoneId?: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface SprintUpdateRequest {
  milestoneId?: string;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: SprintStatus;
}

export interface TaskCreateRequest {
  projectId: string;
  sprintId?: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  estimatedHours?: number;
}

export interface TaskUpdateRequest {
  sprintId?: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimatedHours?: number;
}
