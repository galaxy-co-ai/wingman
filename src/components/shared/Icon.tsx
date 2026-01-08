import { memo, type ComponentProps } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils';
import styles from './Icon.module.css';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface IconProps extends Omit<ComponentProps<'span'>, 'children'> {
  icon: LucideIcon;
  size?: IconSize;
  label?: string;
}

/**
 * Icon wrapper component for Lucide icons
 * Provides consistent sizing and accessibility
 */
export const Icon = memo(function Icon({
  icon: LucideIcon,
  size = 'md',
  label,
  className,
  ...props
}: IconProps) {
  return (
    <span
      className={cn(styles.icon, styles[size], className)}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={!label}
      {...props}
    >
      <LucideIcon />
    </span>
  );
});

// Re-export commonly used icons for convenience
export {
  X,
  Plus,
  Minus,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Settings,
  Folder,
  File,
  FileText,
  Code,
  Terminal,
  Send,
  RefreshCw,
  ExternalLink,
  Copy,
  Trash2,
  Edit2,
  Save,
  Play,
  Pause,
  Square,
  Circle,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Loader2,
  MoreHorizontal,
  MoreVertical,
  Menu,
  Maximize2,
  Minimize2,
  PanelLeft,
  PanelRight,
  Sun,
  Moon,
  Monitor,
  Home,
  Clock,
  Calendar,
  Target,
  Flag,
  List,
  LayoutGrid,
  Kanban,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Link,
  Unlink,
  Paperclip,
  Image,
  MessageSquare,
  User,
  Bot,
  Sparkles,
  Activity,
} from 'lucide-react';
