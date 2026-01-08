import { memo, useState, type ReactNode } from 'react';
import { TitleBar } from './TitleBar';
import { StatusBar, StatusIndicator } from './StatusBar';
import { PanelDivider } from './PanelDivider';
import { RightPanelTabs } from './RightPanelTabs';
import { cn } from '@/utils';
import type { RightPanelMode } from '@/types';
import { PANEL_MIN_WIDTH, PANEL_DEFAULT_SPLIT } from '@/constants';
import styles from './MainLayout.module.css';

export interface MainLayoutProps {
  /** Left panel content (chat) */
  leftPanel: ReactNode;
  /** Right panel content (preview/activity/dashboard) */
  rightPanel: ReactNode;
  /** Tab bar content */
  tabBar?: ReactNode;
  /** Current Claude status */
  claudeStatus?: 'ready' | 'busy' | 'error' | 'offline';
  /** Additional status bar content */
  statusContent?: ReactNode;
  /** Current right panel mode */
  rightPanelMode?: RightPanelMode;
  /** Callback when right panel mode changes */
  onRightPanelModeChange?: (mode: RightPanelMode) => void;
  className?: string;
}

export const MainLayout = memo(function MainLayout({
  leftPanel,
  rightPanel,
  tabBar,
  claudeStatus = 'ready',
  statusContent,
  rightPanelMode: rightPanelModeProp,
  onRightPanelModeChange,
  className,
}: MainLayoutProps) {
  const [panelSplit, setPanelSplit] = useState(PANEL_DEFAULT_SPLIT);
  const [rightPanelModeLocal, setRightPanelModeLocal] = useState<RightPanelMode>('preview');
  const [rightPanelCollapsed] = useState(false);

  // Use prop if provided, otherwise use local state
  const rightPanelMode = rightPanelModeProp ?? rightPanelModeLocal;
  const setRightPanelMode = onRightPanelModeChange ?? setRightPanelModeLocal;

  // Calculate panel widths based on split percentage
  const leftWidth = rightPanelCollapsed ? 100 : panelSplit;
  const rightWidth = rightPanelCollapsed ? 0 : 100 - panelSplit;

  return (
    <div className={cn(styles.layout, className)}>
      <TitleBar />

      <div className={styles.main}>
        {/* Left Panel (Chat) */}
        <div
          className={styles.leftPanel}
          style={{ width: `${leftWidth}%` }}
        >
          {tabBar && <div className={styles.tabBar}>{tabBar}</div>}
          <div className={styles.leftContent}>{leftPanel}</div>
        </div>

        {/* Divider */}
        {!rightPanelCollapsed && (
          <PanelDivider
            split={panelSplit}
            onSplitChange={setPanelSplit}
            minSplit={(PANEL_MIN_WIDTH / window.innerWidth) * 100}
            maxSplit={100 - (PANEL_MIN_WIDTH / window.innerWidth) * 100}
          />
        )}

        {/* Right Panel (Preview/Activity/Dashboard) */}
        {!rightPanelCollapsed && (
          <div
            className={styles.rightPanel}
            style={{ width: `${rightWidth}%` }}
          >
            <RightPanelTabs activeTab={rightPanelMode} onTabChange={setRightPanelMode} />
            <div
              className={styles.rightContent}
              id={`panel-${rightPanelMode}`}
              role="tabpanel"
              aria-labelledby={`tab-${rightPanelMode}`}
            >
              {rightPanel}
            </div>
          </div>
        )}
      </div>

      <StatusBar
        left={<StatusIndicator status={claudeStatus} />}
        right={statusContent}
      />
    </div>
  );
});
