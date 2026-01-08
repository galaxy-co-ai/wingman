# 10 - Error Handling

This document defines error categories, display patterns, logging strategy, and recovery mechanisms for Wingman.

---

## Error Architecture

### Error Flow

```
Backend Error → IPC → Frontend → Store → UI Component → User
     ↓
  Logging
```

### AppError Structure

All errors follow the standard structure defined in doc 09:

```typescript
interface AppError {
  code: string;      // Machine-readable error code
  message: string;   // Human-readable message
  details?: unknown; // Additional context (debug only)
}
```

---

## Error Categories

### Claude CLI Errors

| Code | Internal Message | User Message | Recovery |
|------|------------------|--------------|----------|
| `CLAUDE_CLI_NOT_FOUND` | Claude CLI not found in PATH | Claude CLI is not installed. Please install it to continue. | Show CLI setup modal |
| `CLAUDE_CLI_ERROR` | CLI process error: {details} | Claude encountered an issue. Please try again. | Retry button |
| `CLAUDE_CLI_TIMEOUT` | CLI response timeout | Claude is taking too long to respond. | Cancel + Retry |
| `CLAUDE_CLI_CRASHED` | CLI process exited unexpectedly | Connection to Claude lost. Reconnecting... | Auto-reconnect |
| `CLAUDE_BUSY` | Another request in progress | Please wait for the current response to complete. | Disable input |
| `CLAUDE_AUTH_FAILED` | CLI authentication failed | Claude authentication failed. Please re-authenticate in terminal. | Open terminal instructions |

### Database Errors

| Code | Internal Message | User Message | Recovery |
|------|------------------|--------------|----------|
| `DATABASE_ERROR` | SQLite error: {details} | Unable to save data. Please try again. | Retry |
| `DATABASE_LOCKED` | Database locked by another process | Database is busy. Please wait. | Auto-retry (3x) |
| `DATABASE_CORRUPT` | Database integrity check failed | Data file is corrupted. Restoring from backup... | Auto-restore |
| `MIGRATION_FAILED` | Schema migration failed | Database upgrade failed. Please restart the app. | Restart prompt |

### File System Errors

| Code | Internal Message | User Message | Recovery |
|------|------------------|--------------|----------|
| `FILE_SYSTEM_ERROR` | File operation failed: {details} | Unable to access file. Check permissions. | Show path |
| `FILE_NOT_FOUND` | File not found: {path} | The file no longer exists. | Remove from list |
| `PERMISSION_DENIED` | Permission denied: {path} | Access denied to this location. | Request permission |
| `WATCH_ERROR` | File watcher error | Unable to monitor file changes. | Restart watcher |

### Validation Errors

| Code | Internal Message | User Message | Recovery |
|------|------------------|--------------|----------|
| `INVALID_INPUT` | Validation failed: {field} | Please check your input and try again. | Highlight field |
| `NOT_FOUND` | {Entity} not found: {id} | The requested item no longer exists. | Navigate away |
| `ALREADY_EXISTS` | {Entity} already exists | An item with this name already exists. | Suggest rename |
| `INVALID_STATE` | Invalid operation for current state | This action is not available right now. | Update UI state |

### System Errors

| Code | Internal Message | User Message | Recovery |
|------|------------------|--------------|----------|
| `INTERNAL_ERROR` | Unexpected error: {details} | Something went wrong. Please try again. | Retry + Report |
| `OUT_OF_MEMORY` | Memory limit exceeded | The app is running low on memory. | Suggest close tabs |
| `DISK_FULL` | No space left on device | Your disk is full. Please free up space. | Show storage |

---

## Error Display Patterns

### Toast Notifications

For recoverable, non-blocking errors:

```
┌─────────────────────────────────────────┐
│ ⚠ Unable to save session               │
│ Changes will be saved when possible.   │
│                              [Dismiss] │
└─────────────────────────────────────────┘
```

**Configuration:**
- Duration: 5 seconds (auto-dismiss)
- Duration (with action): 8 seconds
- Position: Bottom-right
- Max visible: 3 (queue overflow)
- Animation: Slide in from right

**Types:**
| Type | Icon | Color | Auto-dismiss |
|------|------|-------|--------------|
| Error | `x-circle` | `--color-error` | Yes (5s) |
| Warning | `alert-triangle` | `--color-warning` | Yes (5s) |
| Success | `check-circle` | `--color-success` | Yes (3s) |
| Info | `info` | `--color-accent` | Yes (5s) |

### Inline Errors

For form validation and field-specific errors:

```
┌─────────────────────────────────────────┐
│ Session Title                           │
│ ┌─────────────────────────────────────┐ │
│ │ This is a very long title that...  │ │
│ └─────────────────────────────────────┘ │
│ ⚠ Title must be 100 characters or less │
└─────────────────────────────────────────┘
```

**Behavior:**
- Appears immediately on validation failure
- Clears when user starts correcting
- Red border on invalid field
- Error icon + message below field
- Focus moves to first error on submit

### Chat Error Messages

For Claude CLI errors within a conversation:

```
┌─────────────────────────────────────────┐
│ ⚠ System                    10:42 AM   │
│                                         │
│ Claude encountered an error. Your       │
│ message was not sent.                   │
│                                         │
│ [Retry] [Copy Message]                  │
└─────────────────────────────────────────┘
```

**Behavior:**
- Displayed as system message in chat
- Contains retry action
- Preserves user's original message
- Distinguishable styling (dashed border, muted background)

### Modal Errors

For critical errors requiring user action:

```
┌─────────────────────────────────────────┐
│  Claude CLI Not Found                   │
├─────────────────────────────────────────┤
│                                         │
│  Wingman requires Claude CLI to work.   │
│  Please install it using:               │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ npm install -g @anthropic/cli    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [Open Documentation]  [Check Again]    │
│                                         │
└─────────────────────────────────────────┘
```

**Use for:**
- CLI not installed
- Database corruption
- Critical update required
- First-time setup errors

### Status Bar Indicator

For persistent/ongoing issues:

```
┌─────────────────────────────────────────┐
│ ⚠ File watcher disconnected  [Restart] │
└─────────────────────────────────────────┘
```

**Behavior:**
- Shows in status bar
- Persists until resolved
- Click to expand details
- Quick action button

---

## Error Handling by Layer

### Frontend Components

```typescript
// Component error display pattern
function SessionView() {
  const { error, clearError } = useSessionsStore(s => ({
    error: s.error,
    clearError: s.clearError
  }));

  // Show inline error if exists
  if (error?.code === 'NOT_FOUND') {
    return <NotFoundState onBack={() => navigate('/sessions')} />;
  }

  // Show error boundary for unexpected errors
  return (
    <ErrorBoundary fallback={<SessionErrorFallback />}>
      <SessionContent />
    </ErrorBoundary>
  );
}
```

### Service Layer

```typescript
// Service error handling pattern
export const sessionsService = {
  async sendMessage(sessionId: string, content: string) {
    try {
      return await invokeCommand('session_send_message', { sessionId, content });
    } catch (error) {
      const appError = error as AppError;

      // Transform known errors
      if (appError.code === 'CLAUDE_CLI_NOT_FOUND') {
        useUIStore.getState().openModal('cli-setup');
        throw appError;
      }

      // Log unexpected errors
      if (appError.code === 'INTERNAL_ERROR') {
        console.error('Unexpected error:', appError);
      }

      throw appError;
    }
  }
};
```

### Store Layer

```typescript
// Store error state pattern
interface SessionsState {
  error: AppError | null;
  setError: (error: AppError | null) => void;
  clearError: () => void;
}

// Action with error handling
sendMessage: async (content: string) => {
  set({ isLoading: true, error: null });
  try {
    await sessionsService.sendMessage(get().activeSessionId!, content);
  } catch (error) {
    set({ error: error as AppError });

    // Auto-clear non-critical errors
    if ((error as AppError).code !== 'CLAUDE_CLI_NOT_FOUND') {
      setTimeout(() => set({ error: null }), 10000);
    }
  } finally {
    set({ isLoading: false });
  }
}
```

### Rust Backend

```rust
// Command error handling pattern
#[tauri::command]
pub async fn session_send_message(
    session_id: String,
    content: String,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    // Validate input
    if content.trim().is_empty() {
        return Err(AppError::invalid_input("Message cannot be empty"));
    }

    // Check session exists
    let session = state.db.get_session(&session_id)
        .await
        .map_err(AppError::database)?
        .ok_or_else(|| AppError::not_found("Session", &session_id))?;

    // Check CLI is running
    let cli = state.cli_manager.get(&session_id)
        .ok_or_else(|| AppError::claude_cli_error("CLI not running for session"))?;

    // Send message
    cli.send(&content)
        .await
        .map_err(|e| AppError::claude_cli_error(e.to_string()))?;

    Ok(message_id)
}
```

---

## Logging Strategy

### Log Levels

| Level | Use For | Example |
|-------|---------|---------|
| `error` | Failures requiring attention | CLI crash, database error |
| `warn` | Potential issues | Slow query, high memory |
| `info` | Normal operations | Session created, message sent |
| `debug` | Development details | IPC payloads, state changes |
| `trace` | Verbose debugging | Every function call |

### What to Log

**Always Log:**
- All errors with stack traces
- CLI process lifecycle (start, stop, crash)
- Database operations (create, delete, migrate)
- File watcher events
- IPC command calls (without sensitive data)

**Never Log:**
- Message content (user privacy)
- File contents
- Full file paths (only relative)
- Any authentication tokens

### Log Format

```
[2025-01-07T10:42:15.123Z] [ERROR] [cli_manager] CLI process crashed
  session_id: sess_abc123
  exit_code: 1
  stderr: "Error: Connection refused"

[2025-01-07T10:42:15.456Z] [INFO] [cli_manager] Attempting auto-restart
  session_id: sess_abc123
  attempt: 1/3
```

### Log Storage (Rust Backend)

```rust
// Logging configuration
use tracing_subscriber::{fmt, prelude::*, EnvFilter};
use tracing_appender::rolling::{RollingFileAppender, Rotation};

fn setup_logging(app_dir: &Path) {
    let log_dir = app_dir.join("logs");

    // Rolling file appender (daily rotation, keep 7 days)
    let file_appender = RollingFileAppender::new(
        Rotation::DAILY,
        &log_dir,
        "wingman.log"
    );

    tracing_subscriber::registry()
        .with(EnvFilter::from_default_env()
            .add_directive("wingman=info".parse().unwrap())
            .add_directive("tauri=warn".parse().unwrap()))
        .with(fmt::layer().with_writer(file_appender))
        .init();
}
```

**Storage Limits:**
- Location: `{app_data}/logs/`
- Rotation: Daily
- Retention: 7 days
- Max size: 50 MB per file

### Frontend Console Logging

```typescript
// Development only logging
const logger = {
  error: (msg: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.error(`[Wingman] ${msg}`, data);
    }
    // Always send to backend for persistent logging
    invoke('log_error', { message: msg, data: JSON.stringify(data) });
  },

  info: (msg: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.log(`[Wingman] ${msg}`, data);
    }
  },

  debug: (msg: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.debug(`[Wingman] ${msg}`, data);
    }
  }
};
```

---

## Recovery Strategies

### Auto-Retry

For transient errors:

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    backoffMs?: number;
    retryableErrors?: string[];
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    backoffMs = 1000,
    retryableErrors = ['DATABASE_LOCKED', 'CLAUDE_CLI_TIMEOUT']
  } = options;

  let lastError: AppError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as AppError;

      if (!retryableErrors.includes(lastError.code)) {
        throw lastError;
      }

      if (attempt < maxAttempts) {
        const delay = backoffMs * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastError!;
}
```

**Retry Schedule:**
| Attempt | Delay | Total Wait |
|---------|-------|------------|
| 1 | 0ms | 0ms |
| 2 | 1000ms | 1s |
| 3 | 2000ms | 3s |
| (fail) | - | - |

### Auto-Reconnect (CLI)

```rust
// CLI auto-reconnect pattern
impl CliManager {
    async fn handle_disconnect(&self, session_id: &str) {
        let max_reconnects = 3;
        let mut attempt = 0;

        while attempt < max_reconnects {
            attempt += 1;

            emit_status(&self.app, session_id, "reconnecting");

            tokio::time::sleep(Duration::from_secs(attempt as u64)).await;

            match self.start_session(session_id).await {
                Ok(_) => {
                    emit_status(&self.app, session_id, "ready");
                    return;
                }
                Err(e) => {
                    tracing::warn!("Reconnect attempt {} failed: {}", attempt, e);
                }
            }
        }

        emit_error(&self.app, session_id, "Failed to reconnect", false);
    }
}
```

### Graceful Degradation

When features fail, continue with reduced functionality:

| Feature | Failure | Degraded Mode |
|---------|---------|---------------|
| File watcher | Watch error | Disable activity feed, show manual refresh |
| Preview panel | Webview error | Show "Preview unavailable" message |
| Auto-save | Save error | Queue changes, show "Unsaved" indicator |
| Theme | CSS load error | Fall back to default dark theme |

### State Recovery

```typescript
// Session state recovery on app restart
async function recoverSessionState() {
  const { tabs, activeTabId } = useSessionsStore.getState();

  // Verify all tabs still exist in database
  for (const tab of tabs) {
    try {
      await sessionsService.load(tab.sessionId);
    } catch (error) {
      if ((error as AppError).code === 'NOT_FOUND') {
        // Session was deleted, remove orphan tab
        useSessionsStore.getState().removeTab(tab.id);
      }
    }
  }

  // Verify active tab exists
  if (activeTabId && !tabs.find(t => t.id === activeTabId)) {
    useSessionsStore.getState().setActiveTab(tabs[0]?.id ?? null);
  }
}
```

### Database Recovery

```rust
// Database integrity check and recovery
pub async fn ensure_database_health(db_path: &Path) -> Result<(), AppError> {
    let conn = Connection::open(db_path)?;

    // Run integrity check
    let result: String = conn.query_row(
        "PRAGMA integrity_check",
        [],
        |row| row.get(0)
    )?;

    if result != "ok" {
        tracing::error!("Database corruption detected: {}", result);

        // Attempt recovery from backup
        let backup_path = db_path.with_extension("db.backup");
        if backup_path.exists() {
            std::fs::copy(&backup_path, db_path)?;
            tracing::info!("Restored database from backup");
            return Ok(());
        }

        return Err(AppError::database("Database corrupted, no backup available"));
    }

    // Create backup after successful check
    let backup_path = db_path.with_extension("db.backup");
    std::fs::copy(db_path, &backup_path)?;

    Ok(())
}
```

---

## User Communication

### Error Message Guidelines

**Do:**
- Use plain language
- Explain what happened
- Suggest next steps
- Provide actionable recovery

**Don't:**
- Show technical details (error codes, stack traces)
- Blame the user
- Use jargon
- Leave user without options

### Example Transformations

| Internal | User-Facing |
|----------|-------------|
| `SQLITE_BUSY: database is locked` | Unable to save right now. Please try again in a moment. |
| `ENOENT: no such file or directory` | The file was moved or deleted. |
| `spawn ENOENT: claude` | Claude CLI is not installed. Would you like help setting it up? |
| `ETIMEDOUT` | Claude is taking longer than expected. Keep waiting or cancel? |

---

## Error Reporting

### Opt-in Crash Reporting

For future consideration (not in MVP):

```typescript
// Potential crash reporting structure
interface CrashReport {
  error: {
    code: string;
    message: string;
    stack?: string;
  };
  context: {
    appVersion: string;
    os: string;
    timestamp: string;
  };
  // Never include:
  // - Message content
  // - File paths
  // - User identifiable information
}
```

### User Feedback

After errors, optionally prompt:

```
┌─────────────────────────────────────────┐
│ Sorry about that error!                 │
│                                         │
│ Would you like to tell us what          │
│ happened?                               │
│                                         │
│ [Send Feedback]  [No Thanks]            │
└─────────────────────────────────────────┘
```

---

## Quick Reference

### Error Code Prefixes

| Prefix | Category |
|--------|----------|
| `CLAUDE_*` | Claude CLI errors |
| `DATABASE_*` | SQLite errors |
| `FILE_*` | File system errors |
| `INVALID_*` | Validation errors |
| `NOT_FOUND` | Resource not found |
| `INTERNAL_*` | Unexpected errors |

### Recovery Quick Reference

| Error Type | Auto-Retry | User Action | Modal |
|------------|------------|-------------|-------|
| CLI not found | No | Install CLI | Yes |
| CLI timeout | Yes (3x) | Cancel/Retry | No |
| CLI crash | Yes (reconnect) | Wait | No |
| DB locked | Yes (3x) | None | No |
| DB corrupt | No | Restart | Yes |
| File not found | No | Remove reference | No |
| Validation | No | Fix input | No |
| Internal | No | Retry/Report | Toast |
