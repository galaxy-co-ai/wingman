# 09 - API Contracts

## Overview

This document defines the complete API surface for Wingman:
- **Tauri IPC Commands**: Frontend-to-backend function calls
- **Backend Events**: Real-time data pushed from Rust to React
- **Request/Response Types**: TypeScript interfaces for all payloads
- **Claude CLI Integration**: How we interface with the wrapped CLI
- **Error Contracts**: Standardized error handling

All commands use Tauri's `invoke()` and events use `listen()` from `@tauri-apps/api`.

---

## IPC Command Reference

### Naming Convention

```
{domain}_{action}_{entity}

Examples:
- session_create
- session_send_message
- project_get_all
- settings_update
```

---

## Session Commands

Commands for managing chat sessions and messages.

### session_create

Creates a new chat session.

```typescript
// Frontend call
const sessionId = await invoke<string>('session_create', {
  workingDirectory: '/path/to/project',
  projectId: 'proj_123',  // optional
  title: 'New Session'    // optional, auto-generated if not provided
});
```

**Request**:
```typescript
interface SessionCreateRequest {
  workingDirectory: string;  // Required: absolute path
  projectId?: string;        // Optional: associate with project
  title?: string;            // Optional: defaults to "New Session"
}
```

**Response**: `string` - The new session ID

**Errors**:
- `InvalidInput` - workingDirectory is empty or relative
- `FileSystemError` - directory doesn't exist

---

### session_load

Loads a session with all its messages and activity.

```typescript
const session = await invoke<SessionWithMessages>('session_load', {
  sessionId: 'sess_123'
});
```

**Request**:
```typescript
interface SessionLoadRequest {
  sessionId: string;
}
```

**Response**:
```typescript
interface SessionWithMessages {
  session: Session;
  messages: Message[];
  activity: ActivityEntry[];
}
```

**Errors**:
- `NotFound` - session doesn't exist
- `DatabaseError` - SQLite query failed

---

### session_delete

Permanently deletes a session and all associated data.

```typescript
await invoke('session_delete', { sessionId: 'sess_123' });
```

**Request**:
```typescript
interface SessionDeleteRequest {
  sessionId: string;
}
```

**Response**: `void`

**Errors**:
- `NotFound` - session doesn't exist

---

### session_rename

Updates a session's title.

```typescript
await invoke('session_rename', {
  sessionId: 'sess_123',
  title: 'Feature Discussion'
});
```

**Request**:
```typescript
interface SessionRenameRequest {
  sessionId: string;
  title: string;  // 1-100 characters
}
```

**Response**: `void`

**Errors**:
- `NotFound` - session doesn't exist
- `InvalidInput` - title empty or too long

---

### session_list

Gets all sessions as summaries for the session browser.

```typescript
const sessions = await invoke<SessionSummary[]>('session_list', {
  projectId: 'proj_123',  // optional filter
  limit: 50,
  offset: 0
});
```

**Request**:
```typescript
interface SessionListRequest {
  projectId?: string;  // Filter by project
  limit?: number;      // Default: 50, max: 200
  offset?: number;     // For pagination
}
```

**Response**: `SessionSummary[]`

---

### session_start_cli

Starts a Claude CLI process for an existing session.

```typescript
await invoke('session_start_cli', {
  sessionId: 'sess_123',
  resume: true  // Send handoff context
});
```

**Request**:
```typescript
interface SessionStartCliRequest {
  sessionId: string;
  resume?: boolean;  // Whether to send conversation history to CLI
}
```

**Response**: `void`

**Side Effects**:
- Spawns Claude CLI process
- Begins emitting `claude_output` events

**Errors**:
- `ClaudeCliNotFound` - CLI not installed or not in PATH
- `ClaudeCliError` - CLI failed to start
- `NotFound` - session doesn't exist

---

### session_stop_cli

Terminates the Claude CLI process for a session.

```typescript
await invoke('session_stop_cli', { sessionId: 'sess_123' });
```

**Request**:
```typescript
interface SessionStopCliRequest {
  sessionId: string;
}
```

**Response**: `void`

---

### session_send_message

Sends a user message to Claude via the CLI.

```typescript
await invoke('session_send_message', {
  sessionId: 'sess_123',
  content: 'Can you help me refactor this function?'
});
```

**Request**:
```typescript
interface SessionSendMessageRequest {
  sessionId: string;
  content: string;  // User's message text
}
```

**Response**: `string` - The created message ID

**Side Effects**:
- Creates user message in database
- Sends to Claude CLI stdin
- Triggers `claude_output` events for response

**Errors**:
- `NotFound` - session doesn't exist
- `InvalidInput` - content is empty
- `ClaudeCliError` - CLI not running for session

---

### session_cancel_response

Cancels an in-progress Claude response.

```typescript
await invoke('session_cancel_response', { sessionId: 'sess_123' });
```

**Request**:
```typescript
interface SessionCancelRequest {
  sessionId: string;
}
```

**Response**: `void`

**Side Effects**:
- Sends interrupt signal to CLI process
- Marks current assistant message as complete (partial)

---

## Project Commands

Commands for project management, sprints, tasks, and roadmap.

### project_create

Creates a new project.

```typescript
const projectId = await invoke<string>('project_create', {
  name: 'My App',
  rootPath: '/path/to/project',
  description: 'A cool app',
  previewUrl: 'http://localhost:3000'
});
```

**Request**:
```typescript
interface ProjectCreateRequest {
  name: string;           // 1-100 characters
  rootPath: string;       // Absolute path, must be unique
  description?: string;
  previewUrl?: string;    // Default: http://localhost:3000
}
```

**Response**: `string` - The new project ID

**Errors**:
- `InvalidInput` - name empty, path relative
- `AlreadyExists` - project with same rootPath exists

---

### project_get_all

Gets all projects.

```typescript
const projects = await invoke<Project[]>('project_get_all');
```

**Response**: `Project[]`

---

### project_get

Gets a single project with related data.

```typescript
const project = await invoke<ProjectWithData>('project_get', {
  projectId: 'proj_123'
});
```

**Response**:
```typescript
interface ProjectWithData {
  project: Project;
  milestones: Milestone[];
  sprints: Sprint[];
  taskCounts: {
    total: number;
    completed: number;
    inProgress: number;
  };
}
```

---

### project_update

Updates project properties.

```typescript
await invoke('project_update', {
  projectId: 'proj_123',
  updates: {
    name: 'New Name',
    previewUrl: 'http://localhost:5173'
  }
});
```

**Request**:
```typescript
interface ProjectUpdateRequest {
  projectId: string;
  updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>;
}
```

**Response**: `void`

---

### project_delete

Deletes a project and all associated data.

```typescript
await invoke('project_delete', { projectId: 'proj_123' });
```

**Request**:
```typescript
interface ProjectDeleteRequest {
  projectId: string;
}
```

**Response**: `void`

**Side Effects**:
- Cascades to delete all milestones, sprints, tasks
- Unlinks sessions (sets projectId to null)

---

### milestone_create

Creates a milestone on the project roadmap.

```typescript
const milestoneId = await invoke<string>('milestone_create', {
  projectId: 'proj_123',
  name: 'MVP Release',
  description: 'Core features complete',
  targetDate: '2025-03-01'
});
```

**Request**:
```typescript
interface MilestoneCreateRequest {
  projectId: string;
  name: string;
  description?: string;
  targetDate?: string;  // ISO 8601 date
}
```

**Response**: `string` - Milestone ID

---

### milestone_update

Updates a milestone.

```typescript
await invoke('milestone_update', {
  milestoneId: 'ms_123',
  updates: {
    completedAt: new Date().toISOString()
  }
});
```

**Request**:
```typescript
interface MilestoneUpdateRequest {
  milestoneId: string;
  updates: Partial<Omit<Milestone, 'id' | 'projectId'>>;
}
```

---

### milestone_delete

Deletes a milestone.

```typescript
await invoke('milestone_delete', { milestoneId: 'ms_123' });
```

**Side Effects**: Sets `milestoneId` to null on linked sprints

---

### milestone_reorder

Reorders milestones on the roadmap.

```typescript
await invoke('milestone_reorder', {
  projectId: 'proj_123',
  orderedIds: ['ms_2', 'ms_1', 'ms_3']
});
```

---

### sprint_create

Creates a sprint.

```typescript
const sprintId = await invoke<string>('sprint_create', {
  projectId: 'proj_123',
  name: 'Sprint 1',
  milestoneId: 'ms_123',
  startDate: '2025-01-15',
  endDate: '2025-01-29'
});
```

**Request**:
```typescript
interface SprintCreateRequest {
  projectId: string;
  name: string;
  description?: string;
  milestoneId?: string;
  startDate?: string;
  endDate?: string;
}
```

---

### sprint_update

Updates a sprint (including status changes).

```typescript
await invoke('sprint_update', {
  sprintId: 'spr_123',
  updates: {
    status: 'active'
  }
});
```

---

### sprint_delete

Deletes a sprint.

```typescript
await invoke('sprint_delete', { sprintId: 'spr_123' });
```

**Side Effects**: Moves tasks to backlog (sets `sprintId` to null)

---

### task_create

Creates a task.

```typescript
const taskId = await invoke<string>('task_create', {
  projectId: 'proj_123',
  title: 'Implement login',
  sprintId: 'spr_123',  // null = backlog
  priority: 'high',
  estimate: 5
});
```

**Request**:
```typescript
interface TaskCreateRequest {
  projectId: string;
  title: string;           // 1-200 characters
  description?: string;
  sprintId?: string;       // null = backlog
  priority?: 'high' | 'medium' | 'low';  // default: medium
  estimate?: number;       // story points
}
```

---

### task_update

Updates a task.

```typescript
await invoke('task_update', {
  taskId: 'task_123',
  updates: {
    status: 'done',
    completedAt: new Date().toISOString()
  }
});
```

**Request**:
```typescript
interface TaskUpdateRequest {
  taskId: string;
  updates: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>;
}
```

---

### task_delete

Deletes a task.

```typescript
await invoke('task_delete', { taskId: 'task_123' });
```

---

### task_move

Moves a task between sprints/backlog and reorders.

```typescript
await invoke('task_move', {
  taskId: 'task_123',
  toSprintId: 'spr_456',  // null = backlog
  toIndex: 2
});
```

**Request**:
```typescript
interface TaskMoveRequest {
  taskId: string;
  toSprintId: string | null;
  toIndex: number;
}
```

---

### task_add_dependency

Creates a task dependency (blocked by).

```typescript
await invoke('task_add_dependency', {
  taskId: 'task_123',
  blockedByTaskId: 'task_456'
});
```

---

### task_remove_dependency

Removes a task dependency.

```typescript
await invoke('task_remove_dependency', {
  taskId: 'task_123',
  blockedByTaskId: 'task_456'
});
```

---

### tasks_get_by_sprint

Gets all tasks for a sprint.

```typescript
const tasks = await invoke<Task[]>('tasks_get_by_sprint', {
  sprintId: 'spr_123'
});
```

---

### tasks_get_backlog

Gets all backlog tasks (not assigned to a sprint).

```typescript
const tasks = await invoke<Task[]>('tasks_get_backlog', {
  projectId: 'proj_123'
});
```

---

## Activity Commands

Commands for the file activity feed.

### activity_get

Gets activity entries for a session.

```typescript
const entries = await invoke<ActivityEntry[]>('activity_get', {
  sessionId: 'sess_123',
  filter: 'modified',  // optional
  limit: 100
});
```

**Request**:
```typescript
interface ActivityGetRequest {
  sessionId: string;
  filter?: 'all' | 'created' | 'modified' | 'deleted';
  limit?: number;   // default: 100
  offset?: number;
}
```

---

### activity_clear

Clears activity log for a session.

```typescript
await invoke('activity_clear', { sessionId: 'sess_123' });
```

---

## Settings Commands

Commands for user preferences.

### settings_get

Gets all settings.

```typescript
const settings = await invoke<Settings>('settings_get');
```

**Response**: `Settings` (see doc 08)

---

### settings_update

Updates settings (partial update).

```typescript
await invoke('settings_update', {
  updates: {
    theme: 'light',
    fontSize: 'large'
  }
});
```

**Request**:
```typescript
interface SettingsUpdateRequest {
  updates: Partial<Settings>;
}
```

**Side Effects**:
- Persists to SQLite
- May emit `theme_changed` event

---

### settings_reset

Resets settings to defaults.

```typescript
await invoke('settings_reset');
```

---

## System Commands

Commands for app-level operations.

### system_check_cli

Checks if Claude CLI is available and returns version info.

```typescript
const cliInfo = await invoke<CliInfo>('system_check_cli');
```

**Response**:
```typescript
interface CliInfo {
  installed: boolean;
  path: string | null;
  version: string | null;
}
```

---

### system_open_external

Opens a URL in the default browser.

```typescript
await invoke('system_open_external', {
  url: 'https://docs.example.com'
});
```

---

### system_open_path

Opens a file or folder in the system file manager.

```typescript
await invoke('system_open_path', {
  path: '/path/to/project'
});
```

---

### system_select_directory

Opens a directory picker dialog.

```typescript
const path = await invoke<string | null>('system_select_directory', {
  title: 'Select Project Folder',
  defaultPath: '/home/user/projects'
});
```

---

### system_get_app_info

Gets application metadata.

```typescript
const info = await invoke<AppInfo>('system_get_app_info');
```

**Response**:
```typescript
interface AppInfo {
  version: string;
  platform: 'windows' | 'macos' | 'linux';
  dataDir: string;    // Where wingman.db lives
  cacheDir: string;
}
```

---

### file_watcher_start

Starts watching a directory for changes.

```typescript
await invoke('file_watcher_start', {
  sessionId: 'sess_123',
  path: '/path/to/project',
  recursive: true
});
```

**Request**:
```typescript
interface FileWatcherStartRequest {
  sessionId: string;  // Associate changes with this session
  path: string;
  recursive?: boolean;  // Default: true
  ignorePatterns?: string[];  // Glob patterns to ignore
}
```

**Side Effects**: Begins emitting `file_changed` events

---

### file_watcher_stop

Stops watching a directory.

```typescript
await invoke('file_watcher_stop', { sessionId: 'sess_123' });
```

---

## Backend Events

Events emitted from Rust backend to React frontend.

### Event Subscription Pattern

```typescript
import { listen, UnlistenFn } from '@tauri-apps/api/event';

// In React component or hook
useEffect(() => {
  let unlisten: UnlistenFn;

  const setup = async () => {
    unlisten = await listen<ClaudeOutputPayload>('claude_output', (event) => {
      console.log('Received:', event.payload);
    });
  };

  setup();
  return () => unlisten?.();
}, []);
```

---

### claude_output

Streaming output from Claude CLI.

```typescript
interface ClaudeOutputPayload {
  sessionId: string;
  messageId: string;       // ID of the assistant message being built
  chunk: string;           // Text chunk to append
  isComplete: boolean;     // True when response finished
  toolUse?: ToolUseEvent;  // Present when Claude uses a tool
}

interface ToolUseEvent {
  type: 'created' | 'modified' | 'deleted' | 'read' | 'executed';
  filePath: string;
  details?: string;
}
```

**When Emitted**: During Claude response streaming

---

### claude_error

Error from Claude CLI process.

```typescript
interface ClaudeErrorPayload {
  sessionId: string;
  error: string;       // Error message
  code?: string;       // Error code if available
  recoverable: boolean;
}
```

**When Emitted**: CLI process error, API error, timeout

---

### claude_status

CLI process status change.

```typescript
interface ClaudeStatusPayload {
  sessionId: string;
  status: 'starting' | 'ready' | 'busy' | 'stopped' | 'error';
}
```

---

### file_changed

File system change detected.

```typescript
interface FileChangedPayload {
  sessionId: string;
  type: 'created' | 'modified' | 'deleted';
  path: string;           // Absolute path
  relativePath: string;   // Relative to watched root
  timestamp: string;      // ISO 8601
  source: 'claude' | 'external';  // Who made the change
}
```

**When Emitted**:
- After file watcher detects change (500ms debounce)
- Source is 'claude' if change occurred during CLI response

---

### session_saved

Auto-save completed.

```typescript
interface SessionSavedPayload {
  sessionId: string;
  messageCount: number;
}
```

**When Emitted**: After auto-save interval (default: 30s)

---

### theme_changed

System theme changed (when theme setting is 'system').

```typescript
interface ThemeChangedPayload {
  theme: 'dark' | 'light';
}
```

---

### update_available

New app version available.

```typescript
interface UpdateAvailablePayload {
  currentVersion: string;
  newVersion: string;
  releaseNotes: string;
  downloadUrl: string;
}
```

---

### update_progress

Download progress for update.

```typescript
interface UpdateProgressPayload {
  downloaded: number;  // bytes
  total: number;       // bytes
  percent: number;     // 0-100
}
```

---

## Claude CLI Integration

Wingman wraps the Claude CLI rather than calling the API directly. This section documents the complete integration protocol.

### Requirements

- **Claude CLI Version**: >= 1.0.0 (requires `--print` flag support)
- **Installation**: User must install Claude CLI separately and authenticate via `claude login`
- **PATH**: CLI must be accessible in system PATH, or user configures custom path in settings

### CLI Process Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLI PROCESS STATES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐   start_cli   ┌──────────┐                      │
│   │ stopped  │ ────────────► │ starting │                      │
│   └──────────┘               └────┬─────┘                      │
│        ▲                          │                             │
│        │                          │ CLI process spawned         │
│        │                          ▼                             │
│        │                    ┌──────────┐                        │
│        │      stop_cli      │  ready   │ ◄─── Can receive msgs  │
│        │ ◄───────────────── └────┬─────┘                        │
│        │                          │                             │
│        │                          │ send_message                │
│        │                          ▼                             │
│        │                    ┌──────────┐                        │
│        │  response complete │   busy   │ ◄─── Processing        │
│        │ ◄───────────────── └────┬─────┘                        │
│        │                          │                             │
│        │         ┌────────────────┴────────────────┐            │
│        │         ▼                                 ▼            │
│        │   ┌──────────┐                      ┌──────────┐       │
│        └── │  error   │                      │  ready   │       │
│            └──────────┘                      └──────────┘       │
│                 │                                               │
│                 │ auto-reconnect (3 attempts)                   │
│                 ▼                                               │
│            ┌──────────┐                                         │
│            │ stopped  │ ◄─── Final failure                      │
│            └──────────┘                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Status Enum** (canonical - use this everywhere):
```typescript
type ClaudeStatus = 'starting' | 'ready' | 'busy' | 'stopped' | 'error';
```

### CLI Invocation Protocol

**Spawning the CLI Process**:
```rust
use std::process::{Command, Stdio};

fn spawn_claude_cli(working_dir: &Path, resume_context: Option<&str>) -> Result<Child, AppError> {
    // Validate working directory exists
    if !working_dir.is_dir() {
        return Err(AppError::file_system("Working directory does not exist"));
    }

    // Find Claude CLI
    let claude_path = which::which("claude")
        .map_err(|_| AppError::claude_cli_not_found())?;

    // Build command
    let mut cmd = Command::new(claude_path);
    cmd.arg("--print")              // Machine-readable JSON output
       .current_dir(working_dir)    // Set working directory
       .stdin(Stdio::piped())       // Accept input
       .stdout(Stdio::piped())      // Capture output
       .stderr(Stdio::piped());     // Capture errors

    // Spawn process
    let mut child = cmd.spawn()
        .map_err(|e| AppError::claude_cli_error(format!("Failed to spawn: {}", e)))?;

    // Send resume context if provided
    if let Some(context) = resume_context {
        if let Some(stdin) = child.stdin.as_mut() {
            use std::io::Write;
            writeln!(stdin, "{}", context)
                .map_err(|e| AppError::claude_cli_error(format!("Failed to send context: {}", e)))?;
        }
    }

    Ok(child)
}
```

**Sending Messages**:
```rust
async fn send_to_cli(child: &mut Child, message: &str) -> Result<(), AppError> {
    let stdin = child.stdin.as_mut()
        .ok_or_else(|| AppError::claude_cli_error("CLI stdin not available"))?;

    use tokio::io::AsyncWriteExt;
    stdin.write_all(message.as_bytes()).await
        .map_err(|e| AppError::claude_cli_error(e.to_string()))?;
    stdin.write_all(b"\n").await
        .map_err(|e| AppError::claude_cli_error(e.to_string()))?;
    stdin.flush().await
        .map_err(|e| AppError::claude_cli_error(e.to_string()))?;

    Ok(())
}
```

**Canceling Response** (SIGINT):
```rust
async fn cancel_response(child: &Child) -> Result<(), AppError> {
    #[cfg(unix)]
    {
        use nix::sys::signal::{kill, Signal};
        use nix::unistd::Pid;
        kill(Pid::from_raw(child.id() as i32), Signal::SIGINT)
            .map_err(|e| AppError::claude_cli_error(e.to_string()))?;
    }

    #[cfg(windows)]
    {
        // Windows: Generate Ctrl+C event
        use windows::Win32::System::Console::GenerateConsoleCtrlEvent;
        unsafe {
            GenerateConsoleCtrlEvent(0, child.id());
        }
    }

    Ok(())
}
```

### Output Parsing Protocol

Claude CLI with `--print` outputs newline-delimited JSON (NDJSON). Each line is a complete JSON object.

**Output Event Types**:

| Type | Description | Fields |
|------|-------------|--------|
| `assistant` | Start of assistant response | `message.id` |
| `content_block_start` | Start of content block | `content_block.type` |
| `content_block_delta` | Text chunk | `delta.text` |
| `content_block_stop` | End of content block | - |
| `tool_use` | Tool being used | `name`, `input` |
| `tool_result` | Tool execution result | `tool_use_id`, `content` |
| `message_stop` | End of response | - |
| `error` | Error occurred | `error.message` |

**Example Output Stream**:
```jsonl
{"type":"assistant","message":{"id":"msg_01XYZ","role":"assistant"}}
{"type":"content_block_start","content_block":{"type":"text"}}
{"type":"content_block_delta","delta":{"type":"text_delta","text":"I'll help you "}}
{"type":"content_block_delta","delta":{"type":"text_delta","text":"with that code."}}
{"type":"content_block_stop"}
{"type":"tool_use","id":"toolu_01ABC","name":"write_file","input":{"path":"src/app.ts","content":"..."}}
{"type":"tool_result","tool_use_id":"toolu_01ABC","content":"File written successfully"}
{"type":"message_stop"}
```

**Rust Parser Implementation**:
```rust
use serde::{Deserialize, Serialize};
use tokio::io::{AsyncBufReadExt, BufReader};

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum ClaudeEvent {
    Assistant { message: AssistantMessage },
    ContentBlockStart { content_block: ContentBlock },
    ContentBlockDelta { delta: Delta },
    ContentBlockStop,
    ToolUse { id: String, name: String, input: serde_json::Value },
    ToolResult { tool_use_id: String, content: String },
    MessageStop,
    Error { error: ErrorInfo },
}

#[derive(Debug, Deserialize)]
struct AssistantMessage {
    id: String,
    role: String,
}

#[derive(Debug, Deserialize)]
struct ContentBlock {
    #[serde(rename = "type")]
    block_type: String,
}

#[derive(Debug, Deserialize)]
struct Delta {
    #[serde(rename = "type")]
    delta_type: String,
    text: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ErrorInfo {
    message: String,
    #[serde(rename = "type")]
    error_type: Option<String>,
}

async fn process_cli_output(
    app: AppHandle,
    session_id: String,
    child: &mut Child,
) {
    let stdout = child.stdout.take().expect("stdout not captured");
    let reader = BufReader::new(stdout);
    let mut lines = reader.lines();

    let message_id = format!("msg_{}", uuid::Uuid::new_v4());
    let mut current_tool_files: Vec<String> = Vec::new();

    while let Ok(Some(line)) = lines.next_line().await {
        if line.is_empty() { continue; }

        match serde_json::from_str::<ClaudeEvent>(&line) {
            Ok(event) => match event {
                ClaudeEvent::ContentBlockDelta { delta } => {
                    if let Some(text) = delta.text {
                        emit_claude_output(&app, ClaudeOutputPayload {
                            session_id: session_id.clone(),
                            message_id: message_id.clone(),
                            chunk: text,
                            is_complete: false,
                            tool_use: None,
                        });
                    }
                }
                ClaudeEvent::ToolUse { id, name, input } => {
                    // Track files modified by Claude for source attribution
                    if let Some(path) = input.get("path").and_then(|p| p.as_str()) {
                        current_tool_files.push(path.to_string());
                    }

                    let tool_type = match name.as_str() {
                        "write_file" | "create_file" => "created",
                        "edit_file" | "str_replace" => "modified",
                        "delete_file" => "deleted",
                        "read_file" => "read",
                        _ => "executed",
                    };

                    emit_claude_output(&app, ClaudeOutputPayload {
                        session_id: session_id.clone(),
                        message_id: message_id.clone(),
                        chunk: String::new(),
                        is_complete: false,
                        tool_use: Some(ToolUseEvent {
                            tool_type: tool_type.to_string(),
                            file_path: input.get("path")
                                .and_then(|p| p.as_str())
                                .unwrap_or("")
                                .to_string(),
                            details: Some(name),
                        }),
                    });
                }
                ClaudeEvent::MessageStop => {
                    emit_claude_output(&app, ClaudeOutputPayload {
                        session_id: session_id.clone(),
                        message_id: message_id.clone(),
                        chunk: String::new(),
                        is_complete: true,
                        tool_use: None,
                    });

                    // Store tool files for source attribution
                    store_claude_modified_files(&session_id, &current_tool_files);
                }
                ClaudeEvent::Error { error } => {
                    emit_claude_error(&app, ClaudeErrorPayload {
                        session_id: session_id.clone(),
                        error: error.message,
                        code: error.error_type,
                        recoverable: true,
                    });
                }
                _ => {} // Other events ignored
            },
            Err(e) => {
                tracing::warn!("Failed to parse CLI output: {} - line: {}", e, line);
            }
        }
    }
}
```

### Session Handoff Protocol

When resuming a session, we send context to Claude so it understands the conversation history.

**Handoff Message Structure**:
```rust
fn build_handoff_message(
    session: &Session,
    messages: &[Message],
    tool_usages: &[ToolUsage],
    project: Option<&Project>,
) -> String {
    // Limit context to avoid token overflow
    const MAX_MESSAGES: usize = 20;
    const MAX_CONTENT_LENGTH: usize = 500;
    const MAX_TOOL_USAGES: usize = 50;

    let recent_messages: Vec<_> = messages
        .iter()
        .rev()
        .take(MAX_MESSAGES)
        .collect::<Vec<_>>()
        .into_iter()
        .rev()
        .collect();

    let recent_tools: Vec<_> = tool_usages
        .iter()
        .rev()
        .take(MAX_TOOL_USAGES)
        .collect();

    let mut handoff = String::new();

    // Header
    handoff.push_str("You are resuming a previous conversation. Here is the context:\n\n");

    // Session info
    handoff.push_str("## Session Information\n");
    handoff.push_str(&format!("- Working Directory: {}\n", session.working_directory));
    if let Some(proj) = project {
        handoff.push_str(&format!("- Project: {}\n", proj.name));
        handoff.push_str(&format!("- Project Path: {}\n", proj.root_path));
    }
    handoff.push_str("\n");

    // Conversation history
    handoff.push_str("## Conversation History\n");
    for msg in recent_messages {
        let role_label = match msg.role.as_str() {
            "user" => "User",
            "assistant" => "Assistant",
            "system" => "System",
            _ => "Unknown",
        };

        // Truncate long messages
        let content = if msg.content.len() > MAX_CONTENT_LENGTH {
            format!("{}... [truncated]", &msg.content[..MAX_CONTENT_LENGTH])
        } else {
            msg.content.clone()
        };

        handoff.push_str(&format!("\n### {}\n{}\n", role_label, content));
    }

    // Recent file operations
    if !recent_tools.is_empty() {
        handoff.push_str("\n## Recent File Operations\n");
        for tool in recent_tools {
            handoff.push_str(&format!("- {} {}\n", tool.tool_type, tool.file_path));
        }
    }

    // Instructions
    handoff.push_str("\n## Instructions\n");
    handoff.push_str("Continue the conversation from where it left off. ");
    handoff.push_str("The user may ask follow-up questions or request changes to previous work.\n");

    handoff
}
```

**When Handoff is Sent**:
1. User opens a previously closed session
2. `session_start_cli` is called with `resume: true`
3. Backend builds handoff message from database
4. Handoff is sent to CLI stdin before any user message

**Handoff Size Limits**:
| Limit | Value | Rationale |
|-------|-------|-----------|
| Max messages | 20 | Keep context focused |
| Max content per message | 500 chars | Prevent token overflow |
| Max tool usages | 50 | Recent operations only |
| Total handoff size | ~10KB | Well under context limit |

### File Source Attribution

To determine if a file change was made by Claude or externally:

**Attribution Algorithm**:
```rust
use std::collections::HashMap;
use std::time::{Duration, Instant};

struct FileSourceTracker {
    // Files modified by Claude in current response, with timestamp
    claude_modified: HashMap<String, Instant>,
    // Window for attribution (file change within this time = Claude)
    attribution_window: Duration,
}

impl FileSourceTracker {
    fn new() -> Self {
        Self {
            claude_modified: HashMap::new(),
            attribution_window: Duration::from_millis(2000), // 2 second window
        }
    }

    /// Called when Claude uses a file tool
    fn record_claude_file_operation(&mut self, file_path: &str) {
        self.claude_modified.insert(
            file_path.to_string(),
            Instant::now()
        );
    }

    /// Called when file watcher detects a change
    fn determine_source(&mut self, file_path: &str) -> &'static str {
        // Clean up old entries
        let now = Instant::now();
        self.claude_modified.retain(|_, timestamp| {
            now.duration_since(*timestamp) < self.attribution_window
        });

        // Check if Claude recently modified this file
        if let Some(timestamp) = self.claude_modified.get(file_path) {
            if now.duration_since(*timestamp) < self.attribution_window {
                self.claude_modified.remove(file_path);
                return "claude";
            }
        }

        "external"
    }
}
```

**Integration with File Watcher**:
```rust
async fn handle_file_change(
    path: &Path,
    change_type: &str,
    session_id: &str,
    tracker: &mut FileSourceTracker,
    app: &AppHandle,
) {
    let source = tracker.determine_source(path.to_str().unwrap());

    emit_file_changed(app, FileChangedPayload {
        session_id: session_id.to_string(),
        change_type: change_type.to_string(),
        path: path.to_string_lossy().to_string(),
        relative_path: compute_relative_path(path),
        timestamp: chrono::Utc::now().to_rfc3339(),
        source: source.to_string(),
    });
}
```

### Error Recovery

**Auto-Reconnect on CLI Crash**:
```rust
async fn handle_cli_crash(
    app: &AppHandle,
    session_id: &str,
    state: &AppState,
) {
    const MAX_RECONNECT_ATTEMPTS: u32 = 3;
    const RECONNECT_DELAYS: [u64; 3] = [1000, 2000, 4000]; // Exponential backoff

    for attempt in 0..MAX_RECONNECT_ATTEMPTS {
        emit_claude_status(app, session_id, "starting");

        tokio::time::sleep(Duration::from_millis(RECONNECT_DELAYS[attempt as usize])).await;

        match start_cli_for_session(session_id, state, false).await {
            Ok(_) => {
                emit_claude_status(app, session_id, "ready");
                return;
            }
            Err(e) => {
                tracing::warn!(
                    "Reconnect attempt {}/{} failed for {}: {}",
                    attempt + 1,
                    MAX_RECONNECT_ATTEMPTS,
                    session_id,
                    e
                );
            }
        }
    }

    // Final failure
    emit_claude_status(app, session_id, "error");
    emit_claude_error(app, ClaudeErrorPayload {
        session_id: session_id.to_string(),
        error: "Failed to reconnect to Claude CLI after multiple attempts".to_string(),
        code: Some("CLI_RECONNECT_FAILED".to_string()),
        recoverable: false,
    });
}

---

## Error Handling

### Error Types

All IPC commands can return these error types:

```typescript
type AppErrorCode =
  | 'NOT_FOUND'           // Resource doesn't exist
  | 'ALREADY_EXISTS'      // Duplicate resource
  | 'INVALID_INPUT'       // Validation failed
  | 'DATABASE_ERROR'      // SQLite operation failed
  | 'FILE_SYSTEM_ERROR'   // File operation failed
  | 'CLAUDE_CLI_NOT_FOUND'// CLI not installed
  | 'CLAUDE_CLI_ERROR'    // CLI execution error
  | 'NETWORK_ERROR'       // Connection failed
  | 'PERMISSION_DENIED'   // Access denied
  | 'INTERNAL_ERROR';     // Unexpected error

interface AppError {
  code: AppErrorCode;
  message: string;
  details?: unknown;  // Additional context
}
```

### Frontend Error Handling

```typescript
import { invoke } from '@tauri-apps/api/core';

async function sendMessage(sessionId: string, content: string) {
  try {
    await invoke('session_send_message', { sessionId, content });
  } catch (error) {
    const appError = error as AppError;

    switch (appError.code) {
      case 'NOT_FOUND':
        // Session was deleted
        uiStore.addNotification({
          type: 'error',
          message: 'Session no longer exists',
          autoDismiss: false
        });
        break;

      case 'CLAUDE_CLI_NOT_FOUND':
        // Show setup guide
        uiStore.openModal('cli-setup');
        break;

      case 'CLAUDE_CLI_ERROR':
        // Show error in chat
        sessionsStore.addMessage(sessionId, {
          role: 'system',
          content: `Error: ${appError.message}`,
          isError: true
        });
        break;

      default:
        // Generic error notification
        uiStore.addNotification({
          type: 'error',
          message: appError.message,
          autoDismiss: true
        });
    }
  }
}
```

### Rust Error Implementation

```rust
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct AppError {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

impl AppError {
    pub fn not_found(entity: &str, id: &str) -> Self {
        Self {
            code: "NOT_FOUND".into(),
            message: format!("{} '{}' not found", entity, id),
            details: None,
        }
    }

    pub fn invalid_input(message: &str) -> Self {
        Self {
            code: "INVALID_INPUT".into(),
            message: message.into(),
            details: None,
        }
    }

    pub fn database(err: rusqlite::Error) -> Self {
        Self {
            code: "DATABASE_ERROR".into(),
            message: "Database operation failed".into(),
            details: Some(serde_json::json!({ "error": err.to_string() })),
        }
    }

    pub fn claude_cli_not_found() -> Self {
        Self {
            code: "CLAUDE_CLI_NOT_FOUND".into(),
            message: "Claude CLI not found. Please install it and ensure it's in your PATH.".into(),
            details: None,
        }
    }
}

// In Tauri command
#[tauri::command]
async fn session_send_message(
    session_id: String,
    content: String,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    if content.trim().is_empty() {
        return Err(AppError::invalid_input("Message content cannot be empty"));
    }

    let session = state.db.get_session(&session_id)
        .map_err(AppError::database)?
        .ok_or_else(|| AppError::not_found("Session", &session_id))?;

    // ... rest of implementation
}
```

---

## Response Wrapper

For complex queries, use a standard response wrapper:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: AppError;
  meta?: {
    total?: number;     // For paginated results
    page?: number;
    pageSize?: number;
  };
}
```

**Usage in paginated endpoints**:

```typescript
const response = await invoke<ApiResponse<SessionSummary[]>>('session_list', {
  projectId: 'proj_123',
  limit: 20,
  offset: 40
});

if (response.success) {
  console.log(`Showing ${response.data.length} of ${response.meta.total}`);
}
```

---

## Type Definitions Summary

All request/response types for quick reference:

```typescript
// === Session Types ===
interface SessionCreateRequest {
  workingDirectory: string;
  projectId?: string;
  title?: string;
}

interface SessionLoadRequest {
  sessionId: string;
}

interface SessionWithMessages {
  session: Session;
  messages: Message[];
  activity: ActivityEntry[];
}

interface SessionListRequest {
  projectId?: string;
  limit?: number;
  offset?: number;
}

interface SessionStartCliRequest {
  sessionId: string;
  resume?: boolean;
}

interface SessionSendMessageRequest {
  sessionId: string;
  content: string;
}

// === Project Types ===
interface ProjectCreateRequest {
  name: string;
  rootPath: string;
  description?: string;
  previewUrl?: string;
}

interface ProjectWithData {
  project: Project;
  milestones: Milestone[];
  sprints: Sprint[];
  taskCounts: {
    total: number;
    completed: number;
    inProgress: number;
  };
}

interface ProjectUpdateRequest {
  projectId: string;
  updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>;
}

// === Task Types ===
interface TaskCreateRequest {
  projectId: string;
  title: string;
  description?: string;
  sprintId?: string;
  priority?: 'high' | 'medium' | 'low';
  estimate?: number;
}

interface TaskMoveRequest {
  taskId: string;
  toSprintId: string | null;
  toIndex: number;
}

// === System Types ===
interface CliInfo {
  installed: boolean;
  path: string | null;
  version: string | null;
}

interface AppInfo {
  version: string;
  platform: 'windows' | 'macos' | 'linux';
  dataDir: string;
  cacheDir: string;
}

interface FileWatcherStartRequest {
  sessionId: string;
  path: string;
  recursive?: boolean;
  ignorePatterns?: string[];
}

// === Event Payloads ===
interface ClaudeOutputPayload {
  sessionId: string;
  messageId: string;
  chunk: string;
  isComplete: boolean;
  toolUse?: ToolUseEvent;
}

interface ToolUseEvent {
  type: 'created' | 'modified' | 'deleted' | 'read' | 'executed';
  filePath: string;
  details?: string;
}

interface ClaudeErrorPayload {
  sessionId: string;
  error: string;
  code?: string;
  recoverable: boolean;
}

interface ClaudeStatusPayload {
  sessionId: string;
  status: 'starting' | 'ready' | 'busy' | 'stopped' | 'error';
}

interface FileChangedPayload {
  sessionId: string;
  type: 'created' | 'modified' | 'deleted';
  path: string;
  relativePath: string;
  timestamp: string;
  source: 'claude' | 'external';
}

interface UpdateAvailablePayload {
  currentVersion: string;
  newVersion: string;
  releaseNotes: string;
  downloadUrl: string;
}
```
