import { memo } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Icon, Minus, Square, X } from '@/components/shared';
import { cn } from '@/utils';
import styles from './TitleBar.module.css';

export interface TitleBarProps {
  title?: string;
  className?: string;
}

export const TitleBar = memo(function TitleBar({ title = 'Wingman', className }: TitleBarProps) {
  const handleMinimize = () => {
    getCurrentWindow().minimize();
  };

  const handleMaximize = () => {
    getCurrentWindow().toggleMaximize();
  };

  const handleClose = () => {
    getCurrentWindow().close();
  };

  return (
    <header className={cn(styles.titleBar, className)} data-tauri-drag-region>
      <div className={styles.left}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>W</span>
        </div>
        <span className={styles.title}>{title}</span>
      </div>

      <div className={styles.center} data-tauri-drag-region />

      <div className={styles.right}>
        <button
          className={styles.windowControl}
          onClick={handleMinimize}
          aria-label="Minimize"
          tabIndex={-1}
        >
          <Icon icon={Minus} size="sm" />
        </button>
        <button
          className={styles.windowControl}
          onClick={handleMaximize}
          aria-label="Maximize"
          tabIndex={-1}
        >
          <Icon icon={Square} size="sm" />
        </button>
        <button
          className={cn(styles.windowControl, styles.closeButton)}
          onClick={handleClose}
          aria-label="Close"
          tabIndex={-1}
        >
          <Icon icon={X} size="sm" />
        </button>
      </div>
    </header>
  );
});
