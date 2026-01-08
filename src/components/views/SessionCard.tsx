/**
 * SessionCard Component
 * Card display for a session in the session browser
 */

import { memo, useCallback, useState } from 'react';
import { Icon, MessageSquare, Folder, Clock, Trash2, Edit2, MoreVertical } from '@/components/shared';
import { cn } from '@/utils';
import { formatRelativeTime } from '@/utils/format-date';
import styles from './SessionCard.module.css';

export interface SessionCardData {
  id: string;
  title: string;
  workingDirectory: string;
  projectName?: string;
  messageCount?: number;
  lastMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionCardProps {
  session: SessionCardData;
  onOpen: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  className?: string;
}

export const SessionCard = memo(function SessionCard({
  session,
  onOpen,
  onRename,
  onDelete,
  className,
}: SessionCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title);

  // Handle card click
  const handleClick = useCallback(() => {
    if (!isEditing) {
      onOpen(session.id);
    }
  }, [session.id, onOpen, isEditing]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isEditing) {
          onOpen(session.id);
        }
      }
    },
    [session.id, onOpen, isEditing]
  );

  // Handle rename
  const handleRenameSubmit = useCallback(() => {
    if (editTitle.trim() && editTitle !== session.title) {
      onRename(session.id, editTitle.trim());
    }
    setIsEditing(false);
    setEditTitle(session.title);
  }, [session.id, session.title, editTitle, onRename]);

  // Handle delete
  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowMenu(false);
      onDelete(session.id);
    },
    [session.id, onDelete]
  );

  // Handle rename start
  const handleRenameStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setIsEditing(true);
  }, []);

  // Handle menu toggle
  const handleMenuToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu((prev) => !prev);
  }, []);

  // Format path for display
  const displayPath = session.workingDirectory.replace(/\\/g, '/').split('/').slice(-2).join('/');

  return (
    <div
      className={cn(styles.card, className)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Open session: ${session.title}`}
    >
      <div className={styles.header}>
        <Icon icon={MessageSquare} size="sm" className={styles.icon} />
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') {
                setIsEditing(false);
                setEditTitle(session.title);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className={styles.titleInput}
            autoFocus
          />
        ) : (
          <h3 className={styles.title}>{session.title}</h3>
        )}
        <div className={styles.menuContainer}>
          <button
            className={styles.menuButton}
            onClick={handleMenuToggle}
            aria-label="Session options"
            aria-expanded={showMenu}
          >
            <Icon icon={MoreVertical} size="sm" />
          </button>
          {showMenu && (
            <div className={styles.menu}>
              <button className={styles.menuItem} onClick={handleRenameStart}>
                <Icon icon={Edit2} size="xs" />
                Rename
              </button>
              <button
                className={cn(styles.menuItem, styles.menuItemDanger)}
                onClick={handleDelete}
              >
                <Icon icon={Trash2} size="xs" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.meta}>
        <span className={styles.metaItem} title={session.workingDirectory}>
          <Icon icon={Folder} size="xs" />
          {displayPath}
        </span>
        <span className={styles.metaItem}>
          <Icon icon={Clock} size="xs" />
          {formatRelativeTime(session.updatedAt)}
        </span>
      </div>

      {session.lastMessage && (
        <p className={styles.preview}>{session.lastMessage}</p>
      )}

      {session.messageCount !== undefined && session.messageCount > 0 && (
        <div className={styles.footer}>
          <span className={styles.messageCount}>
            {session.messageCount} message{session.messageCount === 1 ? '' : 's'}
          </span>
        </div>
      )}
    </div>
  );
});
