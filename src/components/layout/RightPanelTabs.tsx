import { memo } from 'react';
import { Icon, Eye, Activity, LayoutGrid } from '@/components/shared';
import { cn } from '@/utils';
import type { RightPanelMode } from '@/types';
import styles from './RightPanelTabs.module.css';

export interface RightPanelTabsProps {
  activeTab: RightPanelMode;
  onTabChange: (tab: RightPanelMode) => void;
  className?: string;
}

const TABS: Array<{ id: RightPanelMode; label: string; icon: typeof Eye }> = [
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
];

export const RightPanelTabs = memo(function RightPanelTabs({
  activeTab,
  onTabChange,
  className,
}: RightPanelTabsProps) {
  return (
    <div className={cn(styles.tabs, className)} role="tablist" aria-label="Right panel tabs">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={cn(styles.tab, { [styles.active]: activeTab === tab.id })}
          onClick={() => onTabChange(tab.id)}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          tabIndex={activeTab === tab.id ? 0 : -1}
        >
          <Icon icon={tab.icon} size="sm" />
          <span className={styles.label}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
});
