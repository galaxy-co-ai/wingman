/**
 * SessionBrowser Component
 * View for browsing, searching, and managing past sessions
 */

import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { Icon, Search, Plus, ArrowLeft, LayoutGrid, List } from '@/components/shared';
import { Button, Input } from '@/components/shared';
import { Skeleton } from '@/components/shared';
import { SessionCard, type SessionCardData } from './SessionCard';
import { sessionsService } from '@/services/sessions';
import { cn } from '@/utils';
import styles from './SessionBrowser.module.css';

export interface SessionBrowserProps {
  onBack: () => void;
  onOpenSession: (sessionId: string) => void;
  onNewSession: () => void;
  className?: string;
}

type SortBy = 'updatedAt' | 'createdAt' | 'title';
type ViewMode = 'grid' | 'list';

export const SessionBrowser = memo(function SessionBrowser({
  onBack,
  onOpenSession,
  onNewSession,
  className,
}: SessionBrowserProps) {
  const [sessions, setSessions] = useState<SessionCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('updatedAt');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Load sessions
  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await sessionsService.list(undefined, 100, 0);
      setSessions(
        response.map((s) => ({
          id: s.id,
          title: s.title,
          workingDirectory: s.workingDirectory,
          projectName: s.projectName,
          messageCount: s.messageCount,
          lastMessage: s.lastMessage,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }))
      );
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    let result = sessions;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          (s.lastMessage && s.lastMessage.toLowerCase().includes(query)) ||
          (s.projectName && s.projectName.toLowerCase().includes(query))
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updatedAt':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return result;
  }, [sessions, searchQuery, sortBy]);

  // Handle rename
  const handleRename = useCallback(async (id: string, newTitle: string) => {
    try {
      await sessionsService.rename(id, newTitle);
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
      );
    } catch (err) {
      console.error('Failed to rename session:', err);
    }
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this session? This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      await sessionsService.delete(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  }, []);

  return (
    <div className={cn(styles.container, className)}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" size="sm" onClick={onBack} aria-label="Back">
            <Icon icon={ArrowLeft} size="sm" />
          </Button>
          <h1 className={styles.title}>Sessions</h1>
        </div>
        <Button variant="primary" size="sm" onClick={onNewSession}>
          <Icon icon={Plus} size="sm" />
          New Session
        </Button>
      </header>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <Icon icon={Search} size="sm" className={styles.searchIcon} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sessions..."
            className={styles.searchInput}
            aria-label="Search sessions"
          />
        </div>

        <div className={styles.toolbarActions}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className={styles.sortSelect}
            aria-label="Sort by"
          >
            <option value="updatedAt">Last Active</option>
            <option value="createdAt">Created Date</option>
            <option value="title">Title</option>
          </select>

          <div className={styles.viewToggle} role="group" aria-label="View mode">
            <button
              className={cn(styles.viewButton, viewMode === 'grid' && styles.active)}
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              aria-label="Grid view"
            >
              <Icon icon={LayoutGrid} size="sm" />
            </button>
            <button
              className={cn(styles.viewButton, viewMode === 'list' && styles.active)}
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              aria-label="List view"
            >
              <Icon icon={List} size="sm" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {isLoading ? (
          <div className={cn(styles.sessionGrid, viewMode === 'list' && styles.listView)}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <Skeleton height={20} width="60%" />
                <Skeleton height={14} width="40%" />
                <Skeleton height={32} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className={styles.error}>
            <p>{error}</p>
            <Button variant="secondary" onClick={loadSessions}>
              Retry
            </Button>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className={styles.empty}>
            {searchQuery ? (
              <>
                <p>No sessions match your search.</p>
                <Button variant="ghost" onClick={() => setSearchQuery('')}>
                  Clear search
                </Button>
              </>
            ) : (
              <>
                <p>No sessions yet. Start a new conversation!</p>
                <Button variant="primary" onClick={onNewSession}>
                  <Icon icon={Plus} size="sm" />
                  New Session
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className={cn(styles.sessionGrid, viewMode === 'list' && styles.listView)}>
            {filteredSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onOpen={onOpenSession}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer with count */}
      {!isLoading && !error && filteredSessions.length > 0 && (
        <footer className={styles.footer}>
          <span className={styles.count}>
            {filteredSessions.length} session{filteredSessions.length === 1 ? '' : 's'}
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
        </footer>
      )}
    </div>
  );
});
