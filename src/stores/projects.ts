/**
 * Projects Store
 * Manages projects, milestones, sprints, tasks, and dashboard state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  Project,
  Milestone,
  SprintWithProgress,
  Task,
  DashboardStats,
} from '@/types';

// State interface
interface ProjectsState {
  // Data
  projects: Record<string, Project>;
  milestones: Record<string, Milestone>;
  sprints: Record<string, SprintWithProgress>;
  tasks: Record<string, Task>;

  // Relationships (for quick lookups)
  milestonesByProject: Record<string, string[]>;
  sprintsByProject: Record<string, string[]>;
  tasksByProject: Record<string, string[]>;
  tasksBySprint: Record<string, string[]>;

  // Current selection
  activeProjectId: string | null;

  // Dashboard
  dashboardStats: DashboardStats | null;
  isLoadingStats: boolean;
}

// Actions interface
interface ProjectsActions {
  // Project management
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;

  // Milestone management
  setMilestones: (projectId: string, milestones: Milestone[]) => void;
  addMilestone: (milestone: Milestone) => void;
  updateMilestone: (id: string, updates: Partial<Milestone>) => void;
  removeMilestone: (id: string) => void;

  // Sprint management
  setSprints: (projectId: string, sprints: SprintWithProgress[]) => void;
  addSprint: (sprint: SprintWithProgress) => void;
  updateSprint: (id: string, updates: Partial<SprintWithProgress>) => void;
  removeSprint: (id: string) => void;

  // Task management
  setTasks: (projectId: string, tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  moveTask: (taskId: string, newSprintId: string | null) => void;

  // Dashboard
  setDashboardStats: (stats: DashboardStats | null) => void;
  setIsLoadingStats: (loading: boolean) => void;

  // Bulk operations
  reset: () => void;
}

// Initial state
const initialState: ProjectsState = {
  projects: {},
  milestones: {},
  sprints: {},
  tasks: {},

  milestonesByProject: {},
  sprintsByProject: {},
  tasksByProject: {},
  tasksBySprint: {},

  activeProjectId: null,

  dashboardStats: null,
  isLoadingStats: false,
};

// Create the store
export const useProjectsStore = create<ProjectsState & ProjectsActions>()(
  persist(
    immer((set) => ({
      ...initialState,

      // Project management
      setProjects: (projects) =>
        set((state) => {
          state.projects = {};
          for (const project of projects) {
            state.projects[project.id] = project;
          }
        }),

      addProject: (project) =>
        set((state) => {
          state.projects[project.id] = project;
          state.milestonesByProject[project.id] = [];
          state.sprintsByProject[project.id] = [];
          state.tasksByProject[project.id] = [];
        }),

      updateProject: (id, updates) =>
        set((state) => {
          if (state.projects[id]) {
            Object.assign(state.projects[id], updates);
          }
        }),

      removeProject: (id) =>
        set((state) => {
          delete state.projects[id];
          // Clean up related data
          const milestoneIds = state.milestonesByProject[id] || [];
          for (const mid of milestoneIds) {
            delete state.milestones[mid];
          }
          const sprintIds = state.sprintsByProject[id] || [];
          for (const sid of sprintIds) {
            delete state.sprints[sid];
            delete state.tasksBySprint[sid];
          }
          const taskIds = state.tasksByProject[id] || [];
          for (const tid of taskIds) {
            delete state.tasks[tid];
          }
          delete state.milestonesByProject[id];
          delete state.sprintsByProject[id];
          delete state.tasksByProject[id];

          if (state.activeProjectId === id) {
            state.activeProjectId = null;
          }
        }),

      setActiveProject: (id) =>
        set((state) => {
          state.activeProjectId = id;
        }),

      // Milestone management
      setMilestones: (projectId, milestones) =>
        set((state) => {
          state.milestonesByProject[projectId] = milestones.map((m) => m.id);
          for (const milestone of milestones) {
            state.milestones[milestone.id] = milestone;
          }
        }),

      addMilestone: (milestone) =>
        set((state) => {
          state.milestones[milestone.id] = milestone;
          if (!state.milestonesByProject[milestone.projectId]) {
            state.milestonesByProject[milestone.projectId] = [];
          }
          if (!state.milestonesByProject[milestone.projectId].includes(milestone.id)) {
            state.milestonesByProject[milestone.projectId].push(milestone.id);
          }
        }),

      updateMilestone: (id, updates) =>
        set((state) => {
          if (state.milestones[id]) {
            Object.assign(state.milestones[id], updates);
          }
        }),

      removeMilestone: (id) =>
        set((state) => {
          const milestone = state.milestones[id];
          if (milestone) {
            const projectId = milestone.projectId;
            state.milestonesByProject[projectId] = state.milestonesByProject[projectId]?.filter(
              (mid) => mid !== id
            ) || [];
            delete state.milestones[id];
          }
        }),

      // Sprint management
      setSprints: (projectId, sprints) =>
        set((state) => {
          state.sprintsByProject[projectId] = sprints.map((s) => s.id);
          for (const sprint of sprints) {
            state.sprints[sprint.id] = sprint;
            if (!state.tasksBySprint[sprint.id]) {
              state.tasksBySprint[sprint.id] = [];
            }
          }
        }),

      addSprint: (sprint) =>
        set((state) => {
          state.sprints[sprint.id] = sprint;
          if (!state.sprintsByProject[sprint.projectId]) {
            state.sprintsByProject[sprint.projectId] = [];
          }
          if (!state.sprintsByProject[sprint.projectId].includes(sprint.id)) {
            state.sprintsByProject[sprint.projectId].push(sprint.id);
          }
          state.tasksBySprint[sprint.id] = [];
        }),

      updateSprint: (id, updates) =>
        set((state) => {
          if (state.sprints[id]) {
            Object.assign(state.sprints[id], updates);
          }
        }),

      removeSprint: (id) =>
        set((state) => {
          const sprint = state.sprints[id];
          if (sprint) {
            const projectId = sprint.projectId;
            state.sprintsByProject[projectId] = state.sprintsByProject[projectId]?.filter(
              (sid) => sid !== id
            ) || [];
            // Move tasks to backlog (null sprint)
            const taskIds = state.tasksBySprint[id] || [];
            for (const tid of taskIds) {
              if (state.tasks[tid]) {
                state.tasks[tid].sprintId = undefined;
              }
            }
            delete state.tasksBySprint[id];
            delete state.sprints[id];
          }
        }),

      // Task management
      setTasks: (projectId, tasks) =>
        set((state) => {
          state.tasksByProject[projectId] = tasks.map((t) => t.id);
          // Clear sprint task mappings for this project
          const sprintIds = state.sprintsByProject[projectId] || [];
          for (const sid of sprintIds) {
            state.tasksBySprint[sid] = [];
          }
          // Add backlog key
          state.tasksBySprint['backlog'] = [];

          for (const task of tasks) {
            state.tasks[task.id] = task;
            const sprintKey = task.sprintId || 'backlog';
            if (!state.tasksBySprint[sprintKey]) {
              state.tasksBySprint[sprintKey] = [];
            }
            state.tasksBySprint[sprintKey].push(task.id);
          }
        }),

      addTask: (task) =>
        set((state) => {
          state.tasks[task.id] = task;
          if (!state.tasksByProject[task.projectId]) {
            state.tasksByProject[task.projectId] = [];
          }
          if (!state.tasksByProject[task.projectId].includes(task.id)) {
            state.tasksByProject[task.projectId].push(task.id);
          }
          const sprintKey = task.sprintId || 'backlog';
          if (!state.tasksBySprint[sprintKey]) {
            state.tasksBySprint[sprintKey] = [];
          }
          if (!state.tasksBySprint[sprintKey].includes(task.id)) {
            state.tasksBySprint[sprintKey].push(task.id);
          }
        }),

      updateTask: (id, updates) =>
        set((state) => {
          if (state.tasks[id]) {
            Object.assign(state.tasks[id], updates);
          }
        }),

      removeTask: (id) =>
        set((state) => {
          const task = state.tasks[id];
          if (task) {
            const projectId = task.projectId;
            state.tasksByProject[projectId] = state.tasksByProject[projectId]?.filter(
              (tid) => tid !== id
            ) || [];
            const sprintKey = task.sprintId || 'backlog';
            state.tasksBySprint[sprintKey] = state.tasksBySprint[sprintKey]?.filter(
              (tid) => tid !== id
            ) || [];
            delete state.tasks[id];
          }
        }),

      moveTask: (taskId, newSprintId) =>
        set((state) => {
          const task = state.tasks[taskId];
          if (task) {
            const oldSprintKey = task.sprintId || 'backlog';
            const newSprintKey = newSprintId || 'backlog';

            // Remove from old sprint
            state.tasksBySprint[oldSprintKey] = state.tasksBySprint[oldSprintKey]?.filter(
              (tid) => tid !== taskId
            ) || [];

            // Add to new sprint
            if (!state.tasksBySprint[newSprintKey]) {
              state.tasksBySprint[newSprintKey] = [];
            }
            if (!state.tasksBySprint[newSprintKey].includes(taskId)) {
              state.tasksBySprint[newSprintKey].push(taskId);
            }

            // Update task
            task.sprintId = newSprintId || undefined;
          }
        }),

      // Dashboard
      setDashboardStats: (stats) =>
        set((state) => {
          state.dashboardStats = stats;
        }),

      setIsLoadingStats: (loading) =>
        set((state) => {
          state.isLoadingStats = loading;
        }),

      // Reset
      reset: () => set(initialState),
    })),
    {
      name: 'wingman-projects',
      storage: createJSONStorage(() => localStorage),
      // Only persist active project selection
      partialize: (state) => ({
        activeProjectId: state.activeProjectId,
      }),
    }
  )
);

// Selectors
export const selectActiveProject = (state: ProjectsState) =>
  state.activeProjectId ? state.projects[state.activeProjectId] : null;

export const selectProjectMilestones = (projectId: string) => (state: ProjectsState) => {
  const ids = state.milestonesByProject[projectId] || [];
  return ids.map((id) => state.milestones[id]).filter(Boolean);
};

export const selectProjectSprints = (projectId: string) => (state: ProjectsState) => {
  const ids = state.sprintsByProject[projectId] || [];
  return ids.map((id) => state.sprints[id]).filter(Boolean);
};

export const selectProjectTasks = (projectId: string) => (state: ProjectsState) => {
  const ids = state.tasksByProject[projectId] || [];
  return ids.map((id) => state.tasks[id]).filter(Boolean);
};

export const selectSprintTasks = (sprintId: string | null) => (state: ProjectsState) => {
  const key = sprintId || 'backlog';
  const ids = state.tasksBySprint[key] || [];
  return ids.map((id) => state.tasks[id]).filter(Boolean);
};

export const selectTasksByStatus = (projectId: string, status: string) => (state: ProjectsState) => {
  const ids = state.tasksByProject[projectId] || [];
  return ids
    .map((id) => state.tasks[id])
    .filter((task) => task && task.status === status);
};

export const selectActiveSprint = (projectId: string) => (state: ProjectsState) => {
  const ids = state.sprintsByProject[projectId] || [];
  for (const id of ids) {
    const sprint = state.sprints[id];
    if (sprint && sprint.status === 'active') {
      return sprint;
    }
  }
  return null;
};

export const selectDashboardStats = (state: ProjectsState) => state.dashboardStats;

export const selectIsLoadingStats = (state: ProjectsState) => state.isLoadingStats;
