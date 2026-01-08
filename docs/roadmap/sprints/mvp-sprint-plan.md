# MVP Sprint Plan

**Phase**: 3 - Implementation
**Goal**: Deliver all 14 P0 features for a functional MVP
**Structure**: 6 sprints, vertical slices through the stack

---

## Sprint Overview

| Sprint | Focus | Features | Dependencies |
|--------|-------|----------|--------------|
| 1 | Foundation & Infrastructure | - | None |
| 2 | Chat Core & Claude CLI | F1, F3 | Sprint 1 |
| 3 | Session Management | F2, F8, F9, F10 | Sprint 2 |
| 4 | File Watching & Activity | F6, F7 | Sprint 1 |
| 5 | Web Preview | F4, F5 | Sprint 4 |
| 6 | Project Management | F11, F12, F13, F14 | Sprint 1 |

---

## Sprint 1: Foundation & Infrastructure

**Goal**: Establish project structure, core infrastructure, and shared components that all other sprints depend on.

### Deliverables

#### 1.1 Project Setup
- [ ] Configure TypeScript paths (tsconfig.json)
- [ ] Set up ESLint + Prettier
- [ ] Configure Vite for CSS Modules
- [ ] Add core dependencies:
  - `zustand` (state management)
  - `immer` (immutable updates)
  - `lucide-react` (icons)
  - `react-markdown` + `rehype-raw` (markdown rendering)
  - `shiki` (code highlighting)

#### 1.2 Design System
- [ ] Create `src/styles/tokens.css` (from doc 16)
- [ ] Create `src/styles/themes/dark.css`
- [ ] Create `src/styles/themes/light.css`
- [ ] Create `src/styles/global.css` (reset, base)
- [ ] Create `src/styles/animations.css`
- [ ] Create `src/styles/tokens.ts` (TS exports)

#### 1.3 Shared Components
- [ ] Button (primary, secondary, ghost, danger variants)
- [ ] Input (text input with label, error states)
- [ ] Icon (Lucide wrapper with size/color props)
- [ ] Tooltip (hover tooltip)
- [ ] Badge (status indicators)
- [ ] Skeleton (loading placeholders)

#### 1.4 Layout Shell
- [ ] MainLayout (left panel + right panel + divider)
- [ ] TitleBar (custom titlebar with window controls)
- [ ] StatusBar (bottom status display)
- [ ] PanelDivider (resizable divider)
- [ ] RightPanelTabs (Preview/Activity/Dashboard tabs)

#### 1.5 Core Infrastructure
- [ ] `src/utils/classnames.ts` (cn utility)
- [ ] `src/utils/id-generator.ts` (nanoid wrapper)
- [ ] `src/utils/format-date.ts`
- [ ] `src/services/tauri.ts` (invokeCommand, subscribeToEvent)
- [ ] `src/types/errors.types.ts` (AppError interface)
- [ ] `src/constants/defaults.ts`

#### 1.6 Rust Backend Foundation
- [ ] Add Cargo dependencies: `serde`, `serde_json`, `tokio`, `sqlx`, `chrono`, `notify`, `uuid`
- [ ] Set up `src-tauri/src/error.rs` (AppError enum)
- [ ] Create module structure (commands/, db/, state/, claude/, events/)
- [ ] Set up SQLite database connection with foreign keys
- [ ] Create initial migration (`001_initial.sql`)
- [ ] Implement `system_get_app_info` command

#### 1.7 Tauri Configuration
- [ ] Configure window settings (min size, title, decorations)
- [ ] Set up capabilities for required permissions
- [ ] Configure IPC command allowlist

### Exit Criteria
- [ ] App launches with empty shell layout
- [ ] Theme toggle works (dark/light)
- [ ] Panel divider is draggable
- [ ] All shared components render correctly
- [ ] Rust backend compiles with database connection
- [ ] `system_get_app_info` returns version

---

## Sprint 2: Chat Core & Claude CLI Integration

**Goal**: Implement basic chat interface with Claude CLI communication.

**Features**: F1 (Chat Interface), F3 (Claude CLI Integration)

### Deliverables

#### 2.1 Chat Components
- [ ] ChatSession (container for a single chat)
- [ ] MessageList (scrollable message container)
- [ ] ChatMessage (individual message display)
  - User vs assistant styling
  - Markdown rendering
  - Code block with syntax highlighting
- [ ] InputArea (text input + send button)
  - Shift+Enter for newline
  - Ctrl/Cmd+Enter to send
- [ ] CodeBlock (syntax-highlighted code)
- [ ] ToolUsageChip (displays tool calls)

#### 2.2 Sessions Store
- [ ] `src/stores/sessions.ts`
  - State: sessions map, messages map, activeSessionId
  - Actions: addSession, addMessage, updateMessage (for streaming)
  - No persistence yet (Sprint 3)

#### 2.3 Claude CLI Integration (Rust)
- [ ] `src-tauri/src/claude/process.rs`
  - Spawn `claude` with `--print` flag
  - Set working directory
  - Handle stdin/stdout/stderr
- [ ] `src-tauri/src/claude/parser.rs`
  - Parse NDJSON output
  - Extract text, tool_use, tool_result events
- [ ] `src-tauri/src/state/cli_manager.rs`
  - Track CLI process per session
  - Status enum: starting, ready, busy, stopped, error

#### 2.4 CLI IPC Commands
- [ ] `session_start_cli` - Spawn CLI process for session
- [ ] `session_stop_cli` - Terminate CLI process
- [ ] `session_send_message` - Send user input to CLI stdin
- [ ] `session_cancel_response` - Send interrupt signal
- [ ] `system_check_cli` - Verify Claude CLI is installed

#### 2.5 CLI Events
- [ ] `claude_output` event (streaming text chunks)
- [ ] `claude_status` event (status changes)
- [ ] `claude_error` event (CLI errors)

#### 2.6 Frontend Hooks
- [ ] `use-claude-session.ts` - Manage CLI lifecycle
- [ ] `use-tauri-events.ts` - Subscribe to backend events

#### 2.7 Sessions Service
- [ ] `src/services/sessions.ts` (IPC wrappers)

#### 2.8 CLI Setup Modal
- [ ] CliSetupModal (shown if CLI not found)
  - Instructions to install Claude CLI
  - "Check Again" button

### Exit Criteria
- [ ] Can type message and see it displayed
- [ ] Message sent to Claude CLI
- [ ] Response streams back in real-time
- [ ] Tool usage displayed with chips
- [ ] Code blocks have syntax highlighting
- [ ] Error shown if CLI not installed
- [ ] Can cancel in-progress response

---

## Sprint 3: Session Management

**Goal**: Implement session persistence, tabs, and session browser.

**Features**: F2 (Tabs), F8 (Save), F9 (Resume), F10 (Browser)

### Deliverables

#### 3.1 Database Schema
- [ ] `sessions` table (id, title, working_directory, project_id, created_at, updated_at)
- [ ] `messages` table (id, session_id, role, content, tool_usage, created_at)
- [ ] Indexes for common queries

#### 3.2 Session IPC Commands
- [ ] `session_create` - Create new session record
- [ ] `session_load` - Load session with messages
- [ ] `session_delete` - Delete session and messages
- [ ] `session_rename` - Update session title
- [ ] `session_list` - List sessions with summary

#### 3.3 Auto-Save
- [ ] Save messages on each message (after send/receive complete)
- [ ] Update session `updated_at` timestamp
- [ ] Debounce saves during streaming (save on complete)

#### 3.4 Tab Bar Component
- [ ] TabBar (horizontal tab list)
  - Tab with title, close button
  - Active tab highlighting
  - New tab button (+)
  - Tab overflow handling (scroll or dropdown)
- [ ] Tab drag-to-reorder

#### 3.5 Multi-Session Support
- [ ] Extend sessions store for multiple tabs
  - tabs array, activeTabId
  - Tab <-> Session mapping
- [ ] Each tab has independent CLI process
- [ ] Switching tabs preserves scroll position

#### 3.6 Session Resume
- [ ] Load conversation history into ChatMessage components
- [ ] Build handoff message for CLI context
  - Last N messages summarized
  - Recent tool usage
  - 50KB limit
- [ ] `session_start_cli` with `resume: true` flag

#### 3.7 Session Browser View
- [ ] SessionBrowser (full view)
  - Search input (by title/content)
  - Sort by: last active, created date
  - Grid or list layout toggle
- [ ] SessionCard (preview card)
  - Title, project name, last active
  - Message count, preview snippet
  - Delete button with confirmation

#### 3.8 New Session Modal
- [ ] NewSessionModal
  - Select working directory (folder picker)
  - Optional: link to project
  - Optional: set title

### Exit Criteria
- [ ] Sessions persist across app restarts
- [ ] Multiple tabs work independently
- [ ] Can close and reopen tabs
- [ ] Session browser shows all sessions
- [ ] Search finds sessions by content
- [ ] Delete removes session permanently
- [ ] Resume sends context to CLI

---

## Sprint 4: File Watching & Activity Feed

**Goal**: Monitor file system changes and display activity log.

**Features**: F6 (File Notifications), F7 (Activity Feed)

### Deliverables

#### 4.1 File Watcher (Rust)
- [ ] `src-tauri/src/state/file_watcher.rs`
  - Use `notify` crate for cross-platform watching
  - Watch project directory recursively
  - Debounce rapid changes (100ms)
  - Ignore patterns (.git, node_modules, etc.)

#### 4.2 File Watcher Commands
- [ ] `file_watcher_start` - Start watching directory
- [ ] `file_watcher_stop` - Stop watching

#### 4.3 File Events
- [ ] `file_changed` event
  - path, operation (created/modified/deleted)
  - timestamp
  - source attribution (claude vs external)

#### 4.4 Source Attribution Algorithm
- [ ] Track CLI write operations
- [ ] If file change within 2s of CLI write to same path → "claude"
- [ ] Otherwise → "external"

#### 4.5 Activity Database
- [ ] `activity_log` table (id, session_id, path, operation, source, timestamp)
- [ ] `activity_get` command (with filters)
- [ ] `activity_clear` command

#### 4.6 Activity Store
- [ ] `src/stores/activity.ts`
  - State: entries array, filter
  - Actions: addEntry, clearEntries, setFilter

#### 4.7 Activity Components
- [ ] ActivityFeed (scrollable list)
- [ ] ActivityHeader (filter controls, clear button)
- [ ] ActivityEntry (individual file change)
  - Icon by operation type
  - Relative path, timestamp
  - Source badge (Claude vs External)
  - Click to open in editor

#### 4.8 Activity Hook
- [ ] `use-file-watcher.ts` - Subscribe to file events

### Exit Criteria
- [ ] File changes detected within 1 second
- [ ] Activity feed shows all changes
- [ ] Filter by operation type works
- [ ] Source attribution correctly identifies Claude changes
- [ ] Can clear activity feed
- [ ] Activity persists with session

---

## Sprint 5: Web Preview Panel

**Goal**: Embedded browser for live preview with auto-refresh.

**Features**: F4 (Web Preview), F5 (Auto-Refresh)

### Deliverables

#### 5.1 Preview Components
- [ ] PreviewPanel (container)
- [ ] PreviewToolbar
  - URL input field
  - Refresh button
  - Auto-refresh toggle
  - Home button (reset to default URL)
- [ ] PreviewWebview (Tauri webview)
- [ ] PreviewError (error state display)

#### 5.2 Webview Integration
- [ ] Use `tauri-plugin-shell` or custom webview
- [ ] Load URL from project settings (default localhost:3000)
- [ ] Handle navigation events
- [ ] Display loading spinner while loading
- [ ] Show error page on load failure

#### 5.3 Auto-Refresh Logic
- [ ] Subscribe to `file_changed` events
- [ ] Debounce refresh (500ms after last change)
- [ ] Only refresh on watched file types
- [ ] Visual indicator when refresh triggered
- [ ] Toggle to disable auto-refresh

#### 5.4 Preview Settings
- [ ] Default URL per project (stored in settings)
- [ ] Auto-refresh on/off (stored in settings)
- [ ] Watched file extensions (configurable)

#### 5.5 UI Store Updates
- [ ] `src/stores/ui.ts`
  - rightPanelMode: 'preview' | 'activity' | 'dashboard'
  - previewUrl, autoRefresh

### Exit Criteria
- [ ] Preview panel shows webpage
- [ ] URL bar navigates to different URLs
- [ ] Manual refresh button works
- [ ] Auto-refresh triggers on file changes
- [ ] Auto-refresh can be toggled off
- [ ] Loading/error states displayed
- [ ] Tab switching works (Preview/Activity/Dashboard)

---

## Sprint 6: Project Management

**Goal**: Implement roadmap, sprints, tasks, and progress dashboard.

**Features**: F11 (Roadmap), F12 (Sprints), F13 (Tasks), F14 (Dashboard)

### Deliverables

#### 6.1 Database Schema
- [ ] `projects` table
- [ ] `milestones` table
- [ ] `sprints` table
- [ ] `tasks` table
- [ ] `task_dependencies` table

#### 6.2 Project IPC Commands
- [ ] `project_create`, `project_get_all`, `project_get`, `project_update`, `project_delete`
- [ ] `milestone_create`, `milestone_update`, `milestone_delete`, `milestone_reorder`
- [ ] `sprint_create`, `sprint_update`, `sprint_delete`
- [ ] `task_create`, `task_update`, `task_delete`, `task_move`
- [ ] `task_add_dependency`, `task_remove_dependency`

#### 6.3 Projects Store
- [ ] `src/stores/projects.ts`
  - State: projects, milestones, sprints, tasks
  - Actions: CRUD for all entities
  - Computed: tasksBySprintId, sprintProgress

#### 6.4 Project View Components
- [ ] ProjectView (main container with tabs)
- [ ] RoadmapTab (milestone timeline)
- [ ] SprintsTab (kanban-style sprint board)
- [ ] TasksTab (all tasks list view)
- [ ] TaskCard (draggable task item)
- [ ] SprintColumn (contains tasks)
- [ ] MilestoneCard (milestone display)

#### 6.5 Dashboard Widget
- [ ] Dashboard (right panel widget)
- [ ] SprintWidget (current sprint progress)
- [ ] TodayWidget (tasks completed today)
- [ ] MilestoneWidget (next milestone)
- [ ] ProgressBar (reusable progress component)

#### 6.6 Task Modal
- [ ] TaskModal (create/edit task)
  - Title, description
  - Status, priority dropdowns
  - Sprint assignment
  - Dependencies selection

#### 6.7 Drag and Drop
- [ ] Task drag between sprints
- [ ] Task reorder within sprint
- [ ] Milestone drag to reorder

### Exit Criteria
- [ ] Can create projects with milestones
- [ ] Can create sprints and assign to milestones
- [ ] Can create tasks and assign to sprints
- [ ] Kanban board shows tasks by status
- [ ] Task drag-and-drop works
- [ ] Dashboard shows current progress
- [ ] Clicking dashboard opens full project view

---

## Implementation Order

The sprints have dependencies that suggest this execution order:

```
Sprint 1 ─────────────────────────────────────────────────►
          │
          ├──► Sprint 2 ──► Sprint 3
          │         │
          │         └──► Sprint 5 (needs file events)
          │
          ├──► Sprint 4 ──► Sprint 5
          │
          └──► Sprint 6 (can run parallel to 2-5)
```

**Recommended Order**:
1. Sprint 1 (Foundation) - Must be first
2. Sprint 2 (Chat + CLI) - Core functionality
3. Sprint 4 (File Watching) - Enables Sprint 5
4. Sprint 3 (Sessions) - Extends Sprint 2
5. Sprint 5 (Preview) - Depends on Sprint 4
6. Sprint 6 (Projects) - Can start after Sprint 1

Sprints 3, 4, and 6 can partially overlap since they touch different parts of the codebase.

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Claude CLI parsing complexity | Start with `--print` flag (simpler output), add streaming later |
| Webview platform differences | Test early on all platforms, use iframe fallback if needed |
| File watcher reliability | Use `notify` crate's proven implementation, extensive testing |
| SQLite concurrent access | Use connection pool, WAL mode for performance |
| State management complexity | Keep stores focused, avoid cross-store dependencies |

---

## Definition of Done (per Sprint)

- [ ] All deliverables implemented
- [ ] Unit tests for utilities and hooks (80%+ coverage)
- [ ] Component tests for new components
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Manual testing on Windows (primary platform)
- [ ] Code reviewed and merged
- [ ] Progress tracker updated
