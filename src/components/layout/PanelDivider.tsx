import { memo, useCallback, useRef, useState, useEffect } from 'react';
import { cn } from '@/utils';
import styles from './PanelDivider.module.css';

export interface PanelDividerProps {
  /** Current split percentage (0-100) */
  split: number;
  /** Callback when split changes */
  onSplitChange: (split: number) => void;
  /** Minimum split percentage */
  minSplit?: number;
  /** Maximum split percentage */
  maxSplit?: number;
  /** Direction of the divider */
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export const PanelDivider = memo(function PanelDivider({
  split,
  onSplitChange,
  minSplit = 20,
  maxSplit = 80,
  direction = 'horizontal',
  className,
}: PanelDividerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const parent = containerRef.current.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      let newSplit: number;

      if (direction === 'horizontal') {
        newSplit = ((e.clientX - rect.left) / rect.width) * 100;
      } else {
        newSplit = ((e.clientY - rect.top) / rect.height) * 100;
      }

      // Clamp to min/max
      newSplit = Math.max(minSplit, Math.min(maxSplit, newSplit));
      onSplitChange(newSplit);
    },
    [isDragging, direction, minSplit, maxSplit, onSplitChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, direction]);

  const handleDoubleClick = () => {
    onSplitChange(50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    let newSplit = split;

    if (direction === 'horizontal') {
      if (e.key === 'ArrowLeft') newSplit = split - step;
      if (e.key === 'ArrowRight') newSplit = split + step;
    } else {
      if (e.key === 'ArrowUp') newSplit = split - step;
      if (e.key === 'ArrowDown') newSplit = split + step;
    }

    if (newSplit !== split) {
      e.preventDefault();
      onSplitChange(Math.max(minSplit, Math.min(maxSplit, newSplit)));
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        styles.divider,
        styles[direction],
        { [styles.dragging]: isDragging },
        className
      )}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      role="separator"
      aria-orientation={direction}
      aria-valuenow={split}
      aria-valuemin={minSplit}
      aria-valuemax={maxSplit}
      tabIndex={0}
    >
      <div className={styles.handle} />
    </div>
  );
});
