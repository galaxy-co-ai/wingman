/**
 * Activity Feed Types
 */

/** File operation type */
export type FileOperation = 'created' | 'modified' | 'deleted';

/** Source of the file change */
export type ActivitySource = 'claude' | 'external';

/** Activity entry representing a file change */
export interface ActivityEntry {
  id: string;
  sessionId: string;
  path: string;
  operation: FileOperation;
  source: ActivitySource;
  timestamp: string;
}

/** Filter options for activity feed */
export interface ActivityFilter {
  operations?: FileOperation[];
  sources?: ActivitySource[];
  sessionId?: string;
}

/** Activity feed state */
export interface ActivityState {
  entries: ActivityEntry[];
  filter: ActivityFilter;
  isWatching: boolean;
}
