# 15 - File Architecture

## Complete Folder Tree

```
wingman/
├── docs/                              # Documentation
│   ├── planning/                      # Planning documents (01-18)
│   ├── roadmap/                       # Sprint planning
│   │   ├── sprints/                   # Individual sprint docs
│   │   └── progress-tracker.md
│   └── reference/                     # API docs, guides
│
├── src/                               # Frontend source
│   ├── components/                    # React components
│   │   ├── layout/                    # App shell components
│   │   │   ├── TitleBar.tsx
│   │   │   ├── TitleBar.module.css
│   │   │   ├── StatusBar.tsx
│   │   │   ├── StatusBar.module.css
│   │   │   ├── PanelDivider.tsx
│   │   │   ├── PanelDivider.module.css
│   │   │   ├── RightPanelTabs.tsx
│   │   │   ├── RightPanelTabs.module.css
│   │   │   ├── MainLayout.tsx
│   │   │   ├── MainLayout.module.css
│   │   │   └── index.ts
│   │   │
│   │   ├── chat/                      # Chat interface components
│   │   │   ├── TabBar.tsx
│   │   │   ├── TabBar.module.css
│   │   │   ├── ChatSession.tsx
│   │   │   ├── ChatSession.module.css
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageList.module.css
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatMessage.module.css
│   │   │   ├── InputArea.tsx
│   │   │   ├── InputArea.module.css
│   │   │   ├── CodeBlock.tsx
│   │   │   ├── CodeBlock.module.css
│   │   │   ├── ToolUsageChip.tsx
│   │   │   ├── ToolUsageChip.module.css
│   │   │   └── index.ts
│   │   │
│   │   ├── preview/                   # Preview panel components
│   │   │   ├── PreviewPanel.tsx
│   │   │   ├── PreviewPanel.module.css
│   │   │   ├── PreviewToolbar.tsx
│   │   │   ├── PreviewToolbar.module.css
│   │   │   ├── PreviewWebview.tsx
│   │   │   ├── PreviewError.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── activity/                  # Activity feed components
│   │   │   ├── ActivityFeed.tsx
│   │   │   ├── ActivityFeed.module.css
│   │   │   ├── ActivityHeader.tsx
│   │   │   ├── ActivityEntry.tsx
│   │   │   ├── ActivityEntry.module.css
│   │   │   └── index.ts
│   │   │
│   │   ├── dashboard/                 # Dashboard widgets
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Dashboard.module.css
│   │   │   ├── SprintWidget.tsx
│   │   │   ├── SprintWidget.module.css
│   │   │   ├── TodayWidget.tsx
│   │   │   ├── TodayWidget.module.css
│   │   │   ├── MilestoneWidget.tsx
│   │   │   ├── MilestoneWidget.module.css
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── ProgressBar.module.css
│   │   │   └── index.ts
│   │   │
│   │   ├── project/                   # Project management components
│   │   │   ├── ProjectView.tsx
│   │   │   ├── ProjectView.module.css
│   │   │   ├── RoadmapTab.tsx
│   │   │   ├── RoadmapTab.module.css
│   │   │   ├── SprintsTab.tsx
│   │   │   ├── SprintsTab.module.css
│   │   │   ├── TasksTab.tsx
│   │   │   ├── TasksTab.module.css
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskCard.module.css
│   │   │   ├── SprintColumn.tsx
│   │   │   ├── SprintColumn.module.css
│   │   │   ├── MilestoneCard.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── modals/                    # Modal dialogs
│   │   │   ├── Modal.tsx
│   │   │   ├── Modal.module.css
│   │   │   ├── ConfirmModal.tsx
│   │   │   ├── NewSessionModal.tsx
│   │   │   ├── NewSessionModal.module.css
│   │   │   ├── TaskModal.tsx
│   │   │   ├── TaskModal.module.css
│   │   │   ├── CliSetupModal.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── shared/                    # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Button.module.css
│   │       ├── Input.tsx
│   │       ├── Input.module.css
│   │       ├── Dropdown.tsx
│   │       ├── Dropdown.module.css
│   │       ├── Icon.tsx
│   │       ├── Tooltip.tsx
│   │       ├── Tooltip.module.css
│   │       ├── Badge.tsx
│   │       ├── Badge.module.css
│   │       ├── Skeleton.tsx
│   │       ├── Skeleton.module.css
│   │       ├── ContextMenu.tsx
│   │       ├── ContextMenu.module.css
│   │       └── index.ts
│   │
│   ├── views/                         # Full-page views
│   │   ├── SessionBrowser.tsx
│   │   ├── SessionBrowser.module.css
│   │   ├── SessionCard.tsx
│   │   ├── SessionCard.module.css
│   │   ├── SettingsView.tsx
│   │   ├── SettingsView.module.css
│   │   ├── SettingsSidebar.tsx
│   │   ├── SettingsSection.tsx
│   │   ├── SettingRow.tsx
│   │   └── index.ts
│   │
│   ├── providers/                     # React context providers
│   │   ├── ThemeProvider.tsx
│   │   ├── KeyboardProvider.tsx
│   │   └── index.ts
│   │
│   ├── hooks/                         # Custom React hooks
│   │   ├── use-tauri-events.ts        # Event subscription helpers
│   │   ├── use-claude-session.ts      # CLI session management
│   │   ├── use-file-watcher.ts        # File change subscription
│   │   ├── use-keyboard-shortcuts.ts  # Keyboard shortcut handling
│   │   ├── use-theme.ts               # Theme switching
│   │   ├── use-local-storage.ts       # Persist UI state
│   │   ├── use-debounce.ts            # Debounce values
│   │   ├── use-virtual-list.ts        # Message list virtualization
│   │   ├── use-panel-resize.ts        # Panel divider logic
│   │   ├── use-context-menu.ts        # Right-click menus
│   │   └── index.ts
│   │
│   ├── stores/                        # Zustand stores
│   │   ├── sessions.ts                # Chat sessions, messages, tabs
│   │   ├── projects.ts                # Projects, sprints, tasks, milestones
│   │   ├── activity.ts                # File change feed
│   │   ├── settings.ts                # User preferences
│   │   ├── ui.ts                      # UI state (modals, panels, notifications)
│   │   └── index.ts                   # Combined exports
│   │
│   ├── services/                      # IPC abstraction layer
│   │   ├── tauri.ts                   # Base invoke/listen wrappers
│   │   ├── sessions.ts                # Session IPC commands
│   │   ├── projects.ts                # Project IPC commands
│   │   ├── activity.ts                # Activity IPC commands
│   │   ├── settings.ts                # Settings IPC commands
│   │   ├── system.ts                  # System IPC commands
│   │   └── index.ts
│   │
│   ├── utils/                         # Utility functions
│   │   ├── format-date.ts             # Date formatting helpers
│   │   ├── format-path.ts             # Path truncation, display
│   │   ├── format-duration.ts         # Time duration formatting
│   │   ├── parse-markdown.ts          # Markdown parsing setup
│   │   ├── extract-code-blocks.ts     # Code block extraction
│   │   ├── id-generator.ts            # Client-side ID generation
│   │   ├── keyboard.ts                # Key combo parsing
│   │   ├── classnames.ts              # CSS class merging
│   │   └── index.ts
│   │
│   ├── types/                         # TypeScript type definitions
│   │   ├── session.types.ts           # Session, Message, Tab types
│   │   ├── project.types.ts           # Project, Sprint, Task, Milestone
│   │   ├── activity.types.ts          # ActivityEntry, ActivityFilter
│   │   ├── settings.types.ts          # Settings, Theme types
│   │   ├── ipc.types.ts               # IPC request/response types
│   │   ├── events.types.ts            # Backend event payloads
│   │   ├── errors.types.ts            # AppError, error codes
│   │   └── index.ts
│   │
│   ├── styles/                        # Global styles
│   │   ├── tokens.css                 # CSS custom properties (from doc 16)
│   │   ├── themes/
│   │   │   ├── dark.css               # Dark theme overrides
│   │   │   └── light.css              # Light theme overrides
│   │   ├── global.css                 # Reset, base styles
│   │   ├── animations.css             # Shared keyframe animations
│   │   └── tokens.ts                  # TypeScript token exports
│   │
│   ├── constants/                     # App constants
│   │   ├── keyboard-shortcuts.ts      # Shortcut definitions
│   │   ├── defaults.ts                # Default settings values
│   │   └── routes.ts                  # View route constants
│   │
│   ├── App.tsx                        # Root component
│   ├── App.module.css                 # Root styles
│   └── main.tsx                       # Entry point
│
├── src-tauri/                         # Rust backend
│   ├── src/
│   │   ├── main.rs                    # Entry point, Tauri setup
│   │   │
│   │   ├── commands/                  # IPC command handlers
│   │   │   ├── mod.rs                 # Module exports
│   │   │   ├── session.rs             # session_* commands
│   │   │   ├── project.rs             # project_*, milestone_*, sprint_*
│   │   │   ├── task.rs                # task_* commands
│   │   │   ├── activity.rs            # activity_* commands
│   │   │   ├── settings.rs            # settings_* commands
│   │   │   └── system.rs              # system_*, file_watcher_* commands
│   │   │
│   │   ├── state/                     # Application state
│   │   │   ├── mod.rs
│   │   │   ├── app_state.rs           # Main AppState struct
│   │   │   ├── cli_manager.rs         # Claude CLI process management
│   │   │   └── file_watcher.rs        # File watcher state
│   │   │
│   │   ├── db/                        # Database layer
│   │   │   ├── mod.rs
│   │   │   ├── connection.rs          # SQLite connection pool
│   │   │   ├── migrations.rs          # Schema migrations
│   │   │   ├── sessions.rs            # Session queries
│   │   │   ├── messages.rs            # Message queries
│   │   │   ├── projects.rs            # Project queries
│   │   │   ├── tasks.rs               # Task queries
│   │   │   ├── activity.rs            # Activity queries
│   │   │   └── settings.rs            # Settings queries
│   │   │
│   │   ├── claude/                    # Claude CLI integration
│   │   │   ├── mod.rs
│   │   │   ├── process.rs             # Process spawning, management
│   │   │   ├── parser.rs              # JSON output parsing
│   │   │   └── handoff.rs             # Session handoff message builder
│   │   │
│   │   ├── events/                    # Backend event emission
│   │   │   ├── mod.rs
│   │   │   └── emitter.rs             # Event helper functions
│   │   │
│   │   ├── error.rs                   # AppError type
│   │   └── utils.rs                   # Shared utilities
│   │
│   ├── migrations/                    # SQLite migrations
│   │   ├── 001_initial.sql
│   │   └── 002_add_indexes.sql
│   │
│   ├── Cargo.toml                     # Rust dependencies
│   ├── Cargo.lock
│   ├── tauri.conf.json                # Tauri configuration
│   ├── capabilities/                  # Tauri v2 capabilities
│   │   └── default.json
│   └── icons/                         # App icons (all sizes)
│       ├── icon.ico
│       ├── icon.icns
│       ├── icon.png
│       ├── 32x32.png
│       ├── 128x128.png
│       └── 128x128@2x.png
│
├── public/                            # Static assets
│   └── fonts/                         # Custom fonts (if any)
│
├── tests/                             # Test files (non-colocated)
│   ├── e2e/                           # End-to-end tests
│   │   ├── session-flow.spec.ts
│   │   ├── project-management.spec.ts
│   │   └── settings.spec.ts
│   └── fixtures/                      # Test data
│       ├── sessions.json
│       └── projects.json
│
├── scripts/                           # Build/dev scripts
│   ├── generate-icons.js              # Icon generation
│   └── check-cli.js                   # Pre-build CLI check
│
├── .github/                           # GitHub workflows
│   └── workflows/
│       ├── ci.yml                     # Test on PR
│       ├── release.yml                # Build releases
│       └── update-manifest.yml        # Auto-update manifest
│
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── eslint.config.js
├── .prettierrc
├── .gitignore
└── README.md
```

---

## Naming Conventions

### Files

| Type | Convention | Example |
|------|------------|---------|
| Component | PascalCase.tsx | `ChatMessage.tsx` |
| Component Style | PascalCase.module.css | `ChatMessage.module.css` |
| Hook | use-kebab-case.ts | `use-claude-session.ts` |
| Util | kebab-case.ts | `format-date.ts` |
| Type | kebab-case.types.ts | `session.types.ts` |
| Store | kebab-case.ts | `sessions.ts` |
| Service | kebab-case.ts | `sessions.ts` |
| Test (unit) | *.test.ts(x) | `ChatMessage.test.tsx` |
| Test (e2e) | *.spec.ts | `session-flow.spec.ts` |
| Rust module | snake_case.rs | `cli_manager.rs` |

### Folders

- All lowercase
- Kebab-case for multi-word: `chat-session/`
- Rust uses snake_case: `file_watcher/`

### Exports

- Components: Named exports, PascalCase
- Hooks: Named exports, camelCase with `use` prefix
- Utils: Named exports, camelCase
- Types: Named exports, PascalCase for interfaces/types

---

## Import Patterns

### Import Order

```typescript
// 1. External packages
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// 2. Internal absolute imports (by category)
import { useSessionsStore } from '@/stores';
import { Button, Input } from '@/components/shared';
import { formatDate } from '@/utils';

// 3. Relative imports (same feature)
import { ChatInput } from './ChatInput';
import styles from './ChatMessage.module.css';

// 4. Types (always last, use type-only imports)
import type { Message, ToolUsage } from '@/types';
```

### Path Aliases

```json
// tsconfig.json paths
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/stores/*": ["src/stores/*"],
      "@/services/*": ["src/services/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"],
      "@/styles/*": ["src/styles/*"],
      "@/constants/*": ["src/constants/*"]
    }
  }
}
```

---

## Index Barrel Exports

### When to Use

Create `index.ts` barrel exports for:

```typescript
// src/components/shared/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Dropdown } from './Dropdown';
export { Icon } from './Icon';
export { Tooltip } from './Tooltip';
export { Badge } from './Badge';
export { Skeleton } from './Skeleton';
export { ContextMenu } from './ContextMenu';
```

```typescript
// src/stores/index.ts
export { useSessionsStore } from './sessions';
export { useProjectsStore } from './projects';
export { useActivityStore } from './activity';
export { useSettingsStore } from './settings';
export { useUIStore } from './ui';
```

```typescript
// src/types/index.ts
export type * from './session.types';
export type * from './project.types';
export type * from './activity.types';
export type * from './settings.types';
export type * from './ipc.types';
export type * from './events.types';
export type * from './errors.types';
```

### When NOT to Use

- **Feature-specific components**: Import directly for clarity
  ```typescript
  // Prefer direct import for feature components
  import { ChatMessage } from '@/components/chat/ChatMessage';

  // NOT from barrel (unclear what's in 'chat')
  import { ChatMessage } from '@/components/chat';
  ```
- **Single-file modules**: No need for index.ts wrapper
- **Views**: Import directly since there are few of them

---

## Co-location Rules

### Component Files

Each component can have these co-located files:

```
src/components/chat/
├── ChatMessage.tsx           # Component
├── ChatMessage.module.css    # Styles
├── ChatMessage.test.tsx      # Unit tests
└── ChatMessage.types.ts      # Component-specific types (optional)
```

**When to create separate types file**:
- Complex prop types with multiple interfaces
- Types shared only within the component folder
- Otherwise, define props inline in the component

### Global vs Local

| File Type | When Global (`src/`) | When Local (same folder) |
|-----------|---------------------|--------------------------|
| Types | Shared across features | Component-specific |
| Styles | Tokens, themes, reset | Component scoped |
| Utils | Used 3+ places | Single component helper |
| Hooks | Reusable pattern | Component-specific logic |

---

## Rust Backend Organization

### Module Structure

```rust
// src-tauri/src/main.rs
mod commands;
mod state;
mod db;
mod claude;
mod events;
mod error;
mod utils;

fn main() {
    tauri::Builder::default()
        .manage(state::AppState::new())
        .invoke_handler(tauri::generate_handler![
            // Session commands
            commands::session::session_create,
            commands::session::session_load,
            commands::session::session_delete,
            commands::session::session_rename,
            commands::session::session_list,
            commands::session::session_start_cli,
            commands::session::session_stop_cli,
            commands::session::session_send_message,
            commands::session::session_cancel_response,
            // Project commands
            commands::project::project_create,
            commands::project::project_get_all,
            commands::project::project_get,
            commands::project::project_update,
            commands::project::project_delete,
            commands::project::milestone_create,
            commands::project::milestone_update,
            commands::project::milestone_delete,
            commands::project::milestone_reorder,
            commands::project::sprint_create,
            commands::project::sprint_update,
            commands::project::sprint_delete,
            // Task commands
            commands::task::task_create,
            commands::task::task_update,
            commands::task::task_delete,
            commands::task::task_move,
            commands::task::task_add_dependency,
            commands::task::task_remove_dependency,
            commands::task::tasks_get_by_sprint,
            commands::task::tasks_get_backlog,
            // Activity commands
            commands::activity::activity_get,
            commands::activity::activity_clear,
            // Settings commands
            commands::settings::settings_get,
            commands::settings::settings_update,
            commands::settings::settings_reset,
            // System commands
            commands::system::system_check_cli,
            commands::system::system_open_external,
            commands::system::system_open_path,
            commands::system::system_select_directory,
            commands::system::system_get_app_info,
            commands::system::file_watcher_start,
            commands::system::file_watcher_stop,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Command Module Pattern

```rust
// src-tauri/src/commands/session.rs
use crate::db;
use crate::error::AppError;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub async fn session_create(
    working_directory: String,
    project_id: Option<String>,
    title: Option<String>,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    // Validate input
    if working_directory.is_empty() {
        return Err(AppError::invalid_input("Working directory is required"));
    }

    // Create session in database
    let session_id = db::sessions::create(
        &state.db,
        &working_directory,
        project_id.as_deref(),
        title.as_deref(),
    ).await?;

    Ok(session_id)
}
```

### Database Module Pattern

```rust
// src-tauri/src/db/sessions.rs
use crate::error::AppError;
use rusqlite::Connection;

pub async fn create(
    conn: &Connection,
    working_directory: &str,
    project_id: Option<&str>,
    title: Option<&str>,
) -> Result<String, AppError> {
    let id = crate::utils::generate_id("sess");
    let title = title.unwrap_or("New Session");
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO sessions (id, title, working_directory, project_id, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?5)",
        [&id, title, working_directory, project_id.unwrap_or(""), &now],
    ).map_err(AppError::database)?;

    Ok(id)
}
```

---

## Services Layer (Frontend IPC)

The services layer wraps Tauri IPC calls with proper typing:

```typescript
// src/services/tauri.ts
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import type { AppError } from '@/types';

export async function invokeCommand<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    throw error as AppError;
  }
}

export async function subscribeToEvent<T>(
  event: string,
  handler: (payload: T) => void
): Promise<UnlistenFn> {
  return listen<T>(event, (e) => handler(e.payload));
}
```

```typescript
// src/services/sessions.ts
import { invokeCommand } from './tauri';
import type {
  SessionCreateRequest,
  SessionWithMessages,
  SessionSummary,
} from '@/types';

export const sessionsService = {
  create: (request: SessionCreateRequest) =>
    invokeCommand<string>('session_create', request),

  load: (sessionId: string) =>
    invokeCommand<SessionWithMessages>('session_load', { sessionId }),

  delete: (sessionId: string) =>
    invokeCommand<void>('session_delete', { sessionId }),

  rename: (sessionId: string, title: string) =>
    invokeCommand<void>('session_rename', { sessionId, title }),

  list: (projectId?: string, limit = 50, offset = 0) =>
    invokeCommand<SessionSummary[]>('session_list', { projectId, limit, offset }),

  startCli: (sessionId: string, resume = false) =>
    invokeCommand<void>('session_start_cli', { sessionId, resume }),

  stopCli: (sessionId: string) =>
    invokeCommand<void>('session_stop_cli', { sessionId }),

  sendMessage: (sessionId: string, content: string) =>
    invokeCommand<string>('session_send_message', { sessionId, content }),

  cancelResponse: (sessionId: string) =>
    invokeCommand<void>('session_cancel_response', { sessionId }),
};
```

---

## Hooks Organization

### Hook Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **IPC Hooks** | Wrap service calls with state | `use-claude-session.ts` |
| **Event Hooks** | Subscribe to backend events | `use-tauri-events.ts`, `use-file-watcher.ts` |
| **UI Hooks** | UI behavior patterns | `use-context-menu.ts`, `use-panel-resize.ts` |
| **Utility Hooks** | General helpers | `use-debounce.ts`, `use-local-storage.ts` |

### Hook Pattern Examples

```typescript
// src/hooks/use-claude-session.ts
import { useEffect, useCallback } from 'react';
import { useSessionsStore } from '@/stores';
import { sessionsService } from '@/services';
import { useTauriEvents } from './use-tauri-events';
import type { ClaudeOutputPayload, ClaudeStatusPayload } from '@/types';

export function useClaudeSession(sessionId: string) {
  const { updateMessage, setSessionStatus } = useSessionsStore();

  // Subscribe to Claude events
  useTauriEvents<ClaudeOutputPayload>('claude_output', (payload) => {
    if (payload.sessionId === sessionId) {
      updateMessage(payload.messageId, payload.chunk, payload.isComplete);
    }
  });

  useTauriEvents<ClaudeStatusPayload>('claude_status', (payload) => {
    if (payload.sessionId === sessionId) {
      setSessionStatus(sessionId, payload.status);
    }
  });

  const sendMessage = useCallback(async (content: string) => {
    await sessionsService.sendMessage(sessionId, content);
  }, [sessionId]);

  const cancel = useCallback(async () => {
    await sessionsService.cancelResponse(sessionId);
  }, [sessionId]);

  return { sendMessage, cancel };
}
```

```typescript
// src/hooks/use-tauri-events.ts
import { useEffect, useRef } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export function useTauriEvents<T>(
  eventName: string,
  handler: (payload: T) => void
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    let unlisten: UnlistenFn;

    const setup = async () => {
      unlisten = await listen<T>(eventName, (event) => {
        handlerRef.current(event.payload);
      });
    };

    setup();
    return () => unlisten?.();
  }, [eventName]);
}
```

---

## Store Organization

### Store Pattern

```typescript
// src/stores/sessions.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session, Message, Tab } from '@/types';

interface SessionsState {
  // State
  sessions: Map<string, Session>;
  messages: Map<string, Message[]>;
  tabs: Tab[];
  activeTabId: string | null;

  // Actions
  addSession: (session: Session) => void;
  removeSession: (id: string) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateMessage: (messageId: string, chunk: string, isComplete: boolean) => void;
  setActiveTab: (tabId: string) => void;
  addTab: (tab: Tab) => void;
  removeTab: (tabId: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
}

export const useSessionsStore = create<SessionsState>()(
  persist(
    (set, get) => ({
      sessions: new Map(),
      messages: new Map(),
      tabs: [],
      activeTabId: null,

      addSession: (session) =>
        set((state) => ({
          sessions: new Map(state.sessions).set(session.id, session),
        })),

      removeSession: (id) =>
        set((state) => {
          const sessions = new Map(state.sessions);
          sessions.delete(id);
          return { sessions };
        }),

      addMessage: (sessionId, message) =>
        set((state) => {
          const messages = new Map(state.messages);
          const sessionMessages = messages.get(sessionId) ?? [];
          messages.set(sessionId, [...sessionMessages, message]);
          return { messages };
        }),

      // ... other actions
    }),
    {
      name: 'wingman-sessions',
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
      }),
    }
  )
);
```

---

## Test File Organization

### Unit Tests (Co-located)

```
src/components/chat/
├── ChatMessage.tsx
├── ChatMessage.test.tsx    # Co-located with component
└── ChatMessage.module.css
```

```typescript
// src/components/chat/ChatMessage.test.tsx
import { render, screen } from '@testing-library/react';
import { ChatMessage } from './ChatMessage';

describe('ChatMessage', () => {
  it('renders user message with correct styling', () => {
    render(
      <ChatMessage
        id="msg-1"
        role="user"
        content="Hello"
        timestamp={new Date()}
      />
    );

    expect(screen.getByRole('article')).toHaveClass('user');
  });

  it('renders markdown content', () => {
    render(
      <ChatMessage
        id="msg-1"
        role="assistant"
        content="Here is some **bold** text"
        timestamp={new Date()}
      />
    );

    expect(screen.getByText('bold')).toHaveStyle({ fontWeight: 'bold' });
  });
});
```

### E2E Tests (Separate folder)

```
tests/e2e/
├── session-flow.spec.ts     # Full session workflow
├── project-management.spec.ts
└── settings.spec.ts
```

### Test Configuration

```typescript
// vitest.config.ts (for unit tests)
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.types.ts', 'src/**/index.ts'],
    },
  },
});
```

---

## File Templates

### New Component

```typescript
// src/components/[category]/[ComponentName].tsx
import { memo } from 'react';
import styles from './[ComponentName].module.css';

interface [ComponentName]Props {
  // Props here
}

export const [ComponentName] = memo(function [ComponentName]({
  // Destructure props
}: [ComponentName]Props) {
  return (
    <div className={styles.container}>
      {/* Component content */}
    </div>
  );
});
```

### New Hook

```typescript
// src/hooks/use-[hook-name].ts
import { useState, useEffect, useCallback } from 'react';

export function use[HookName](/* params */) {
  // State and effects

  return {
    // Return values
  };
}
```

### New Store

```typescript
// src/stores/[name].ts
import { create } from 'zustand';

interface [Name]State {
  // State shape
}

interface [Name]Actions {
  // Action types
}

export const use[Name]Store = create<[Name]State & [Name]Actions>()((set, get) => ({
  // Initial state

  // Actions
}));
```

### New Service

```typescript
// src/services/[name].ts
import { invokeCommand } from './tauri';
import type { /* types */ } from '@/types';

export const [name]Service = {
  // IPC command wrappers
};
```

---

## CSS Module Patterns

### Component Styles

```css
/* src/components/chat/ChatMessage.module.css */
.container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.user {
  align-self: flex-end;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
}

.assistant {
  align-self: flex-start;
}

.content {
  font-size: var(--font-size-md);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-primary);
}

.timestamp {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
```

### Using Styles in Component

```typescript
import styles from './ChatMessage.module.css';
import { cn } from '@/utils/classnames';

<div className={cn(styles.container, role === 'user' && styles.user)}>
```

---

## Summary

| Category | Location | Naming | Exports |
|----------|----------|--------|---------|
| Components | `src/components/{category}/` | PascalCase.tsx | Named |
| Views | `src/views/` | PascalCase.tsx | Named |
| Hooks | `src/hooks/` | use-kebab-case.ts | Named |
| Stores | `src/stores/` | kebab-case.ts | Named |
| Services | `src/services/` | kebab-case.ts | Named object |
| Utils | `src/utils/` | kebab-case.ts | Named |
| Types | `src/types/` | kebab-case.types.ts | Named |
| Styles | `src/styles/` | kebab-case.css | - |
| Constants | `src/constants/` | kebab-case.ts | Named |
| Rust Commands | `src-tauri/src/commands/` | snake_case.rs | pub fn |
| Rust DB | `src-tauri/src/db/` | snake_case.rs | pub async fn |
| Unit Tests | Same folder as source | *.test.tsx | - |
| E2E Tests | `tests/e2e/` | *.spec.ts | - |
