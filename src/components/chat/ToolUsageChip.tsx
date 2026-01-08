/**
 * ToolUsageChip Component
 * Displays a tool usage (file operation) as a compact chip
 */

import { memo, useState, useCallback } from 'react';
import { cn } from '@/utils';
import {
  Icon,
  FileText,
  Edit2,
  Trash2,
  Eye,
  Terminal,
  Loader2,
  Check,
  AlertCircle,
} from '@/components/shared';
import styles from './ToolUsageChip.module.css';
import type { ToolUsage } from '@/types';
import type { LucideIcon } from 'lucide-react';

export interface ToolUsageChipProps {
  usage: ToolUsage;
  onClick?: () => void;
}

// Map tool names to icons and display labels
const toolConfig: Record<string, { icon: LucideIcon; label: string }> = {
  write_file: { icon: FileText, label: 'Write' },
  create_file: { icon: FileText, label: 'Create' },
  edit_file: { icon: Edit2, label: 'Edit' },
  str_replace: { icon: Edit2, label: 'Edit' },
  delete_file: { icon: Trash2, label: 'Delete' },
  read_file: { icon: Eye, label: 'Read' },
  execute: { icon: Terminal, label: 'Run' },
  bash: { icon: Terminal, label: 'Run' },
};

// Map status to icon
const statusIcons: Record<ToolUsage['status'], LucideIcon> = {
  pending: Loader2,
  running: Loader2,
  completed: Check,
  error: AlertCircle,
};

export const ToolUsageChip = memo(function ToolUsageChip({
  usage,
  onClick,
}: ToolUsageChipProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const config = toolConfig[usage.name] ?? { icon: Terminal, label: usage.name };
  const StatusIcon = statusIcons[usage.status];

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else {
      setIsExpanded((prev) => !prev);
    }
  }, [onClick]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  // Extract file path from input
  const filePath = (usage.input?.path as string) ?? '';
  const filename = filePath.split('/').pop() ?? filePath;

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        styles.chip,
        styles[usage.status],
        isExpanded && styles.expanded
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${config.label} ${filename} - ${usage.status}`}
      aria-expanded={isExpanded}
    >
      <Icon icon={StatusIcon} size="xs" className={styles.icon} />
      <span>{config.label}</span>
      <span className={styles.path} title={filePath}>
        {filename}
      </span>

      {isExpanded && usage.output && (
        <div className={styles.details}>{usage.output}</div>
      )}
    </div>
  );
});
