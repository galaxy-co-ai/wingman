/**
 * Dashboard
 * Main dashboard component showing project progress widgets
 */

import { memo, useEffect, useCallback } from 'react';
import { LayoutGrid, FolderOpen, RefreshCw, Plus } from 'lucide-react';
import { Icon, Button, Skeleton } from '@/components/shared';
import {
  useProjectsStore,
  selectActiveProject,
  selectDashboardStats,
  selectIsLoadingStats,
} from '@/stores';
import { projectsService } from '@/services';
import { cn } from '@/utils';
import { SprintWidget } from './SprintWidget';
import { TodayWidget } from './TodayWidget';
import { MilestoneWidget } from './MilestoneWidget';
import styles from './Dashboard.module.css';

export interface DashboardProps {
  className?: string;
  onOpenProjectView?: () => void;
}

export const Dashboard = memo(function Dashboard({
  className,
  onOpenProjectView,
}: DashboardProps) {
  const activeProject = useProjectsStore(selectActiveProject);
  const stats = useProjectsStore(selectDashboardStats);
  const isLoading = useProjectsStore(selectIsLoadingStats);
  const setDashboardStats = useProjectsStore((state) => state.setDashboardStats);
  const setIsLoadingStats = useProjectsStore((state) => state.setIsLoadingStats);

  // Load dashboard stats when project changes
  const loadStats = useCallback(async () => {
    if (!activeProject) {
      setDashboardStats(null);
      return;
    }

    setIsLoadingStats(true);
    try {
      const dashboardStats = await projectsService.getDashboardStats(activeProject.id);
      setDashboardStats(dashboardStats);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setDashboardStats(null);
    } finally {
      setIsLoadingStats(false);
    }
  }, [activeProject, setDashboardStats, setIsLoadingStats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // No project selected
  if (!activeProject) {
    return (
      <div className={cn(styles.dashboard, styles.empty, className)}>
        <Icon icon={FolderOpen} size="lg" className={styles.emptyIcon} />
        <p className={styles.emptyText}>No project selected</p>
        <p className={styles.emptyHint}>
          Create or select a project to see your dashboard
        </p>
        <Button
          variant="primary"
          size="sm"
          icon={<Icon icon={Plus} size="sm" />}
          onClick={onOpenProjectView}
          className={styles.emptyAction}
        >
          Open Project View
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoading && !stats) {
    return (
      <div className={cn(styles.dashboard, className)}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <Icon icon={LayoutGrid} size="sm" className={styles.headerIcon} />
            <Skeleton width={120} height={16} />
          </div>
        </div>
        <div className={styles.widgets}>
          <Skeleton height={140} />
          <Skeleton height={140} />
          <Skeleton height={140} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(styles.dashboard, className)}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Icon icon={LayoutGrid} size="sm" className={styles.headerIcon} />
          <span className={styles.projectName}>{activeProject.name}</span>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="ghost"
            size="sm"
            icon={<Icon icon={RefreshCw} size="sm" />}
            onClick={loadStats}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className={styles.widgets}>
        <SprintWidget sprint={stats?.activeSprint ?? null} />

        <TodayWidget
          completedToday={stats?.tasksCompletedToday ?? 0}
          totalTasks={stats?.totalTasks ?? 0}
          completedTasks={stats?.completedTasks ?? 0}
        />

        <MilestoneWidget milestone={stats?.nextMilestone ?? null} />
      </div>

      {onOpenProjectView && (
        <div className={styles.footer}>
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenProjectView}
            className={styles.viewButton}
          >
            View Full Project
          </Button>
        </div>
      )}
    </div>
  );
});
