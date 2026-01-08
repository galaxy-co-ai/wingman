# 08 - Data Models

## Overview

This document defines all data structures used in Wingman:
- TypeScript interfaces for the frontend
- SQLite schema for persistence
- Zustand store structure
- Data flow patterns

---

## TypeScript Interfaces

### Session & Messages

```typescript
// Unique identifier type for type safety
type SessionId = string & { readonly brand: unique symbol };
type MessageId = string & { readonly brand: unique symbol };
type ProjectId = string & { readonly brand: unique symbol };

// Chat Session
interface Session {
  id: SessionId;
  title: string;
  projectId: ProjectId | null;      // Associated project (optional)
  workingDirectory: string;          // Absolute path for Claude CLI
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date | null;
  messageCount: number;
  isActive: boolean;                 // Currently has CLI process running
}

// Individual chat message
interface Message {
  id: MessageId;
  sessionId: SessionId;
  role: 'user' | 'assistant' | 'system';
  content: string;                   // Raw content (may contain markdown)
  timestamp: Date;
  isStreaming: boolean;              // True while assistant is responding
  isError: boolean;                  // True if this is an error message
  toolUsages: ToolUsage[];           // File operations performed
  tokenCount?: number;               // Estimated tokens (for context tracking)
}

// Tool usage within a message (file operations)
interface ToolUsage {
  id: string;
  type: 'created' | 'modified' | 'deleted' | 'read' | 'executed';
  filePath: string;
  timestamp: Date;
  details?: string;                  // e.g., command executed, lines changed
}

// Session summary for browser view (lighter than full Session)
interface SessionSummary {
  id: SessionId;
  title: string;
  projectName: string | null;
  lastMessageAt: Date | null;
  messageCount: number;
  previewText: string;               // First ~100 chars of last message
}
```

---

### Project Management

```typescript
// Project container
interface Project {
  id: ProjectId;
  name: string;
  description: string;
  rootPath: string;                  // Absolute path to project directory
  previewUrl: string;                // Default localhost URL for preview
  createdAt: Date;
  updatedAt: Date;
}

// Milestone on the roadmap
interface Milestone {
  id: string;
  projectId: ProjectId;
  name: string;
  description: string;
  targetDate: Date | null;
  completedAt: Date | null;
  order: number;                     // Display order on roadmap
}

// Sprint for organizing work
interface Sprint {
  id: string;
  projectId: ProjectId;
  milestoneId: string | null;        // Optional milestone association
  name: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
  status: 'planning' | 'active' | 'completed';
  order: number;
}

// Individual task
interface Task {
  id: string;
  projectId: ProjectId;
  sprintId: string | null;           // Null = backlog
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'high' | 'medium' | 'low';
  estimate: number | null;           // Story points or hours
  order: number;                     // Order within sprint/backlog
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

// Task dependency (blocked by relationship)
interface TaskDependency {
  taskId: string;
  blockedByTaskId: string;
}
```

---

### Activity Feed

```typescript
// File system activity entry
interface ActivityEntry {
  id: string;
  sessionId: SessionId;
  type: 'created' | 'modified' | 'deleted';  // Only write operations tracked
  filePath: string;
  timestamp: Date;
  messageId: MessageId | null;       // Link to related chat message
  source: 'claude' | 'external';     // Who made the change
}

// Filter options for activity feed
type ActivityFilter = 'all' | 'created' | 'modified' | 'deleted';
```

---

### Settings & Preferences

```typescript
// User preferences (persisted)
interface Settings {
  // Appearance
  theme: 'dark' | 'light' | 'system';
  fontSize: 'small' | 'medium' | 'large';

  // Claude CLI
  claudeCliPath: string | null;      // Custom path (null = use PATH)
  defaultModel: string;              // e.g., 'claude-3-opus'
  streamingEnabled: boolean;
  verboseMode: boolean;

  // Projects
  defaultProjectDirectory: string;
  recentProjects: string[];          // Paths to recent projects (max 10)

  // Preview
  defaultPreviewUrl: string;         // Default: 'http://localhost:3000'
  autoRefreshEnabled: boolean;
  autoRefreshDebounce: number;       // Milliseconds

  // Updates
  checkForUpdates: 'startup' | 'daily' | 'weekly' | 'never';
  includePreReleases: boolean;

  // Behavior
  confirmOnTabClose: boolean;
  autoSaveInterval: number;          // Seconds (0 = on every message)
}

// Default settings
const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  fontSize: 'medium',
  claudeCliPath: null,
  defaultModel: 'claude-sonnet-4',  // CLI resolves to latest version
  streamingEnabled: true,
  verboseMode: false,
  defaultProjectDirectory: '',
  recentProjects: [],
  defaultPreviewUrl: 'http://localhost:3000',
  autoRefreshEnabled: true,
  autoRefreshDebounce: 500,
  checkForUpdates: 'startup',
  includePreReleases: false,
  confirmOnTabClose: true,
  autoSaveInterval: 30,
};
```

---

### UI State (Non-persisted)

```typescript
// Transient UI state
interface UIState {
  // Layout
  leftPanelWidth: number;            // Percentage (0-100)
  rightPanelTab: 'preview' | 'activity' | 'dashboard';

  // Session tabs
  openTabIds: SessionId[];
  activeTabId: SessionId | null;

  // Modals
  activeModal: ModalType | null;
  modalData: unknown;

  // Activity feed
  activityFilter: ActivityFilter;
  unreadActivityCount: number;

  // Preview
  previewUrl: string;
  previewIsLoading: boolean;

  // Connection (maps to ClaudeStatus from doc 09)
  claudeCliStatus: 'starting' | 'ready' | 'busy' | 'stopped' | 'error';

  // Notifications
  notifications: Notification[];
}

type ModalType =
  | 'new-session'
  | 'confirm-close'
  | 'task-detail'
  | 'settings'
  | 'session-browser'
  | 'project-view';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: Date;
  autoDismiss: boolean;
}
```

---

## SQLite Schema

### Database: `wingman.db`

Located at: `{APP_DATA}/wingman/wingman.db`

> **Important**: SQLite requires `PRAGMA foreign_keys = ON` to be executed on each
> database connection. The Rust backend must run this pragma when opening the connection.
> See connection setup in code patterns (doc 17).

```sql
-- Enable foreign keys (must be run per-connection, see note above)
PRAGMA foreign_keys = ON;

-- ============================================
-- SESSIONS & MESSAGES
-- ============================================

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  working_directory TEXT NOT NULL,
  created_at TEXT NOT NULL,          -- ISO 8601
  updated_at TEXT NOT NULL,
  last_message_at TEXT,
  message_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 0        -- Boolean
);

CREATE INDEX idx_sessions_project ON sessions(project_id);
CREATE INDEX idx_sessions_updated ON sessions(updated_at DESC);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  is_streaming INTEGER DEFAULT 0,
  is_error INTEGER DEFAULT 0,
  token_count INTEGER
);

CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_messages_timestamp ON messages(session_id, timestamp);

CREATE TABLE tool_usages (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('created', 'modified', 'deleted', 'read', 'executed')),
  file_path TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  details TEXT
);

CREATE INDEX idx_tool_usages_message ON tool_usages(message_id);

-- ============================================
-- PROJECT MANAGEMENT
-- ============================================

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  root_path TEXT NOT NULL UNIQUE,
  preview_url TEXT DEFAULT 'http://localhost:3000',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE milestones (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  target_date TEXT,
  completed_at TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_milestones_project ON milestones(project_id);

CREATE TABLE sprints (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id TEXT REFERENCES milestones(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed')),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_sprints_project ON sprints(project_id);
CREATE INDEX idx_sprints_milestone ON sprints(milestone_id);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sprint_id TEXT REFERENCES sprints(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  estimate INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_sprint ON tasks(sprint_id);
CREATE INDEX idx_tasks_status ON tasks(status);

CREATE TABLE task_dependencies (
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  blocked_by_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, blocked_by_task_id)
);

-- ============================================
-- ACTIVITY LOG
-- ============================================

CREATE TABLE activity_log (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('created', 'modified', 'deleted')),  -- Only write operations
  file_path TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  message_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'claude' CHECK (source IN ('claude', 'external'))
);

CREATE INDEX idx_activity_session ON activity_log(session_id);
CREATE INDEX idx_activity_timestamp ON activity_log(session_id, timestamp DESC);

-- ============================================
-- SETTINGS
-- ============================================

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL                -- JSON encoded
);

-- ============================================
-- SCHEMA MIGRATIONS
-- ============================================

CREATE TABLE schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

INSERT INTO schema_version (version, applied_at) VALUES (1, datetime('now'));
```

---

## Zustand Store Structure

Based on Decision 1 from doc 07, organized into domain slices:

### Store: `sessions.ts`

```typescript
interface SessionsState {
  // Data
  sessions: Map<SessionId, Session>;
  messages: Map<SessionId, Message[]>;

  // UI State
  openTabIds: SessionId[];
  activeTabId: SessionId | null;

  // Actions
  createSession: (workingDir: string, projectId?: ProjectId) => Promise<SessionId>;
  loadSession: (id: SessionId) => Promise<void>;
  closeSession: (id: SessionId) => void;
  deleteSession: (id: SessionId) => Promise<void>;
  renameSession: (id: SessionId, title: string) => Promise<void>;

  // Tabs
  openTab: (id: SessionId) => void;
  closeTab: (id: SessionId) => void;
  setActiveTab: (id: SessionId) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;

  // Messages
  addMessage: (sessionId: SessionId, message: Omit<Message, 'id'>) => void;
  updateMessage: (sessionId: SessionId, messageId: MessageId, updates: Partial<Message>) => void;

  // Persistence
  saveSession: (id: SessionId) => Promise<void>;
  loadAllSessions: () => Promise<SessionSummary[]>;
}
```

### Store: `projects.ts`

```typescript
interface ProjectsState {
  // Data
  projects: Map<ProjectId, Project>;
  milestones: Map<string, Milestone>;
  sprints: Map<string, Sprint>;
  tasks: Map<string, Task>;
  dependencies: TaskDependency[];

  // Current context
  activeProjectId: ProjectId | null;
  activeSprintId: string | null;

  // Project actions
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ProjectId>;
  updateProject: (id: ProjectId, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: ProjectId) => Promise<void>;
  setActiveProject: (id: ProjectId | null) => void;

  // Milestone actions
  createMilestone: (milestone: Omit<Milestone, 'id'>) => Promise<string>;
  updateMilestone: (id: string, updates: Partial<Milestone>) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;
  reorderMilestones: (projectId: ProjectId, orderedIds: string[]) => Promise<void>;

  // Sprint actions
  createSprint: (sprint: Omit<Sprint, 'id'>) => Promise<string>;
  updateSprint: (id: string, updates: Partial<Sprint>) => Promise<void>;
  deleteSprint: (id: string) => Promise<void>;
  setActiveSprint: (id: string | null) => void;

  // Task actions
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (taskId: string, toSprintId: string | null, toIndex: number) => Promise<void>;
  addDependency: (taskId: string, blockedById: string) => Promise<void>;
  removeDependency: (taskId: string, blockedById: string) => Promise<void>;

  // Computed (via selectors)
  getProjectTasks: (projectId: ProjectId) => Task[];
  getSprintTasks: (sprintId: string) => Task[];
  getBacklogTasks: (projectId: ProjectId) => Task[];
  getSprintProgress: (sprintId: string) => { completed: number; total: number; percent: number };
}
```

### Store: `activity.ts`

```typescript
interface ActivityState {
  // Data
  entries: Map<SessionId, ActivityEntry[]>;

  // UI
  filter: ActivityFilter;
  unreadCount: number;

  // Actions
  addEntry: (entry: Omit<ActivityEntry, 'id'>) => void;
  clearEntries: (sessionId: SessionId) => void;
  setFilter: (filter: ActivityFilter) => void;
  markAsRead: () => void;

  // Persistence
  loadSessionActivity: (sessionId: SessionId) => Promise<void>;
}
```

### Store: `settings.ts`

```typescript
interface SettingsState {
  settings: Settings;
  isLoaded: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;

  // Computed
  getTheme: () => 'dark' | 'light';  // Resolves 'system' to actual theme
}
```

### Store: `ui.ts`

```typescript
interface UIStateStore {
  // Layout
  leftPanelWidth: number;
  rightPanelTab: 'preview' | 'activity' | 'dashboard';

  // Preview
  previewUrl: string;
  previewIsLoading: boolean;

  // Connection (maps to ClaudeStatus from doc 09)
  claudeCliStatus: 'starting' | 'ready' | 'busy' | 'stopped' | 'error';

  // Modals
  activeModal: ModalType | null;
  modalData: unknown;

  // Notifications
  notifications: Notification[];

  // Actions
  setLeftPanelWidth: (width: number) => void;
  setRightPanelTab: (tab: 'preview' | 'activity' | 'dashboard') => void;
  setPreviewUrl: (url: string) => void;
  setPreviewLoading: (loading: boolean) => void;
  setClaudeStatus: (status: 'starting' | 'ready' | 'busy' | 'stopped' | 'error') => void;

  openModal: (type: ModalType, data?: unknown) => void;
  closeModal: () => void;

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
}
```

---

## Data Flow Diagrams

### Send Message Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  User types message                                                     │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────┐    Enter/Click    ┌─────────────────┐                 │
│  │  InputArea  │ ─────────────────►│ sessionsStore.  │                 │
│  │  Component  │                   │ addMessage()    │                 │
│  └─────────────┘                   └────────┬────────┘                 │
│                                             │                           │
│                          ┌──────────────────┴──────────────────┐       │
│                          ▼                                      ▼       │
│                   Add user message                    invoke('send_    │
│                   to local state                      message', ...)   │
│                          │                                      │       │
└──────────────────────────┼──────────────────────────────────────┼───────┘
                           │                                      │
                           │         ┌────────────────────────────┘
                           │         │  IPC
                           │         ▼
┌──────────────────────────┼─────────────────────────────────────────────┐
│                          │         BACKEND (Rust)                       │
├──────────────────────────┼─────────────────────────────────────────────┤
│                          │                                              │
│                          │    ┌─────────────────┐                       │
│                          │    │ send_message()  │                       │
│                          │    │ Tauri Command   │                       │
│                          │    └────────┬────────┘                       │
│                          │             │                                │
│                          │             ▼                                │
│                          │    ┌─────────────────┐                       │
│                          │    │ Spawn Claude    │                       │
│                          │    │ CLI process     │                       │
│                          │    └────────┬────────┘                       │
│                          │             │                                │
│                          │             ▼                                │
│                          │    ┌─────────────────┐      ┌──────────────┐│
│                          │    │ Stream output   │─────►│ emit('claude-││
│                          │    │ parser          │      │ output')     ││
│                          │    └────────┬────────┘      └──────┬───────┘│
│                          │             │                      │        │
│                          │             ▼                      │        │
│                          │    ┌─────────────────┐             │        │
│                          │    │ Save to SQLite  │             │        │
│                          │    └─────────────────┘             │        │
│                          │                                    │        │
└──────────────────────────┼────────────────────────────────────┼────────┘
                           │                                    │
                           │         ┌──────────────────────────┘
                           │         │  Event
                           │         ▼
┌──────────────────────────┼─────────────────────────────────────────────┐
│                          │         FRONTEND                             │
├──────────────────────────┼─────────────────────────────────────────────┤
│                          │                                              │
│                          │    ┌─────────────────┐                       │
│                          │    │ listen('claude- │                       │
│                          │    │ output')        │                       │
│                          │    └────────┬────────┘                       │
│                          │             │                                │
│                          │             ▼                                │
│                          │    ┌─────────────────┐                       │
│                          │    │ sessionsStore.  │                       │
│                          │    │ updateMessage() │                       │
│                          │    └────────┬────────┘                       │
│                          │             │                                │
│                          ▼             ▼                                │
│                   ┌─────────────────────────────┐                       │
│                   │     MessageList re-renders  │                       │
│                   │     with streaming content  │                       │
│                   └─────────────────────────────┘                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### File Change Detection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    FILE SYSTEM                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Claude CLI modifies file ───► notify crate detects change    │
│                                          │                      │
└──────────────────────────────────────────┼──────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Rust)                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────┐     Debounce     ┌──────────────────┐    │
│   │ File Watcher    │ ────(500ms)────► │ emit('file-      │    │
│   │ Handler         │                  │ changed', {...}) │    │
│   └─────────────────┘                  └────────┬─────────┘    │
│                                                 │               │
│                                                 │               │
│   ┌─────────────────┐                          │               │
│   │ Save to         │◄─────────────────────────┘               │
│   │ activity_log    │                                          │
│   └─────────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────┬───────────────────────┘
                                          │ Event
                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────┐                                          │
│   │ listen('file-   │                                          │
│   │ changed')       │                                          │
│   └────────┬────────┘                                          │
│            │                                                    │
│            ├─────────────────────┬─────────────────────┐       │
│            ▼                     ▼                     ▼       │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────┐ │
│   │ activityStore.  │   │ Trigger preview │   │ Update badge│ │
│   │ addEntry()      │   │ refresh         │   │ if tab not  │ │
│   └────────┬────────┘   │ (if enabled)    │   │ active      │ │
│            │            └─────────────────┘   └─────────────┘ │
│            ▼                                                   │
│   ┌─────────────────┐                                          │
│   │ ActivityFeed    │                                          │
│   │ re-renders      │                                          │
│   └─────────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Session Resume Flow

```
User clicks session in SessionBrowser
                │
                ▼
┌───────────────────────────────┐
│ sessionsStore.loadSession(id) │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ invoke('load_session', {id})  │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ Rust: Query SQLite            │
│ - Load session metadata       │
│ - Load all messages           │
│ - Load activity log           │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ Return to frontend            │
└───────────────┬───────────────┘
                │
                ├────────────────────────────┐
                ▼                            ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│ sessionsStore:            │   │ activityStore:            │
│ - Add to sessions map     │   │ - Load activity entries   │
│ - Add messages to map     │   └───────────────────────────┘
│ - Open tab                │
│ - Set as active           │
└───────────────┬───────────┘
                │
                ▼
┌───────────────────────────────┐
│ invoke('start_session', {     │
│   sessionId,                  │
│   workingDirectory,           │
│   resumeContext: true         │  ◄── Send handoff message to CLI
│ })                            │
└───────────────────────────────┘
```

---

## Validation Rules

### Session

| Field | Rule |
|-------|------|
| title | Required, 1-100 characters |
| workingDirectory | Required, must be valid absolute path, directory must exist |

### Message

| Field | Rule |
|-------|------|
| content | Required for user messages, non-empty |
| role | Required, one of: 'user', 'assistant', 'system' |
| sessionId | Required, must reference existing session |

### Project

| Field | Rule |
|-------|------|
| name | Required, 1-100 characters |
| rootPath | Required, valid absolute path, unique across projects |
| previewUrl | Must be valid URL if provided |

### Task

| Field | Rule |
|-------|------|
| title | Required, 1-200 characters |
| status | One of: 'todo', 'in_progress', 'done' |
| priority | One of: 'high', 'medium', 'low' |
| estimate | If provided, must be positive number |
| projectId | Required, must reference existing project |

### Sprint

| Field | Rule |
|-------|------|
| name | Required, 1-100 characters |
| startDate | If provided, must be valid date |
| endDate | If provided, must be >= startDate |
| status | One of: 'planning', 'active', 'completed' |
| projectId | Required, must reference existing project |

### Milestone

| Field | Rule |
|-------|------|
| name | Required, 1-100 characters |
| targetDate | If provided, must be valid date |
| projectId | Required, must reference existing project |

### Settings

| Field | Rule |
|-------|------|
| theme | One of: 'dark', 'light', 'system' |
| fontSize | One of: 'small', 'medium', 'large' |
| autoRefreshDebounce | 100-5000 milliseconds |
| autoSaveInterval | 0-300 seconds |
| claudeCliPath | If provided, file must exist and be executable |

---

## ID Generation

All IDs use UUID v4 for uniqueness:

```typescript
import { v4 as uuidv4 } from 'uuid';

function generateId(): string {
  return uuidv4();
}

// Type-safe ID creation
function createSessionId(): SessionId {
  return uuidv4() as SessionId;
}
```

---

## Migration Strategy

### Version Tracking

Each schema change increments the version in `schema_version` table.

### Migration Process

```typescript
async function runMigrations(db: Database): Promise<void> {
  const currentVersion = await db.get<{ version: number }>(
    'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
  );

  const version = currentVersion?.version ?? 0;

  // Apply migrations in order
  for (const migration of migrations) {
    if (migration.version > version) {
      await migration.up(db);
      await db.run(
        'INSERT INTO schema_version (version, applied_at) VALUES (?, ?)',
        [migration.version, new Date().toISOString()]
      );
    }
  }
}

// Example migration
const migrations: Migration[] = [
  {
    version: 2,
    up: async (db) => {
      await db.run('ALTER TABLE tasks ADD COLUMN due_date TEXT');
    },
    down: async (db) => {
      // SQLite doesn't support DROP COLUMN, would need table rebuild
    }
  }
];
```
