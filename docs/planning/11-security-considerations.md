# 11 - Security Considerations

This document defines security measures for Wingman, covering data protection, input validation, Tauri-specific security, and attack surface mitigation.

---

## Security Model Overview

### Architecture Security

Wingman uses a two-process architecture with Tauri:

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (WebView)                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  React App (Sandboxed)                          │   │
│  │  - No direct file system access                 │   │
│  │  - No direct process spawning                   │   │
│  │  - Communication only via IPC                   │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │ IPC (invoke/listen)
┌────────────────────────▼────────────────────────────────┐
│                   BACKEND (Rust)                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Tauri Commands (Validated)                     │   │
│  │  - All input sanitized                          │   │
│  │  - All paths validated                          │   │
│  │  - Controlled process spawning                  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### No API Keys Stored

**Critical Design Decision**: Wingman wraps the Claude CLI rather than making direct API calls. This means:

- No API keys stored in the application
- Claude CLI handles its own authentication
- Users authenticate via `claude login` in terminal
- Wingman never sees or handles authentication tokens

---

## Data Protection

### Sensitive Data Inventory

| Data Type | Sensitivity | Storage | Protection |
|-----------|-------------|---------|------------|
| Chat messages | High | SQLite | Local-only, no sync |
| Session metadata | Medium | SQLite | Local-only |
| File paths | Medium | SQLite | Validated, sandboxed |
| User preferences | Low | SQLite | Plain storage |
| Tab state | Low | localStorage | Persisted UI state |

### Data at Rest

**SQLite Database:**
- Location: Platform-specific app data directory
  - Windows: `%APPDATA%/com.wingman.app/`
  - macOS: `~/Library/Application Support/com.wingman.app/`
  - Linux: `~/.local/share/com.wingman.app/`
- Encryption: Not encrypted (local-only application)
- Backup: Daily backup with 7-day retention

**Log Files:**
- Location: `{app_data}/logs/`
- Content: Never includes message content or file contents
- Rotation: Daily, 7-day retention
- Max size: 50 MB per file

### Data in Transit

**Local IPC:**
- All frontend ↔ backend communication via Tauri IPC
- No network calls from frontend (all through backend)

**Claude CLI Communication:**
- CLI handles its own HTTPS communication
- Wingman communicates with CLI via stdin/stdout
- No network traffic from Wingman itself

### Data Deletion

| Action | Data Deleted |
|--------|--------------|
| Delete session | Messages, activity log for session |
| Delete project | Project, tasks, milestones, sprints |
| Clear activity | Activity entries for session |
| Uninstall app | All app data (platform-dependent) |

```rust
// Secure deletion pattern
pub async fn delete_session(db: &Connection, session_id: &str) -> Result<(), AppError> {
    // Delete in correct order (foreign key constraints)
    db.execute("DELETE FROM activity WHERE session_id = ?1", [session_id])?;
    db.execute("DELETE FROM messages WHERE session_id = ?1", [session_id])?;
    db.execute("DELETE FROM sessions WHERE id = ?1", [session_id])?;

    // Vacuum to reclaim space and remove deleted data
    db.execute("VACUUM", [])?;

    Ok(())
}
```

---

## Input Validation

### Frontend Validation

Basic validation for UX, not security:

```typescript
// Input validation (UX only - not security boundary)
const validateSessionTitle = (title: string): string | null => {
  if (!title.trim()) return 'Title is required';
  if (title.length > 100) return 'Title must be 100 characters or less';
  return null;
};
```

### Backend Validation (Security Boundary)

All security-critical validation happens in Rust:

```rust
// Session title validation
pub fn validate_title(title: &str) -> Result<String, AppError> {
    let trimmed = title.trim();

    if trimmed.is_empty() {
        return Err(AppError::invalid_input("Title cannot be empty"));
    }

    if trimmed.len() > 100 {
        return Err(AppError::invalid_input("Title must be 100 characters or less"));
    }

    // Remove any control characters
    let sanitized: String = trimmed
        .chars()
        .filter(|c| !c.is_control())
        .collect();

    Ok(sanitized)
}

// Message content validation
pub fn validate_message_content(content: &str) -> Result<String, AppError> {
    let trimmed = content.trim();

    if trimmed.is_empty() {
        return Err(AppError::invalid_input("Message cannot be empty"));
    }

    // No length limit for messages (Claude CLI will handle)
    // But prevent extremely large inputs
    if trimmed.len() > 1_000_000 {
        return Err(AppError::invalid_input("Message too large"));
    }

    Ok(trimmed.to_string())
}
```

### Path Validation

Critical for preventing path traversal attacks:

```rust
use std::path::{Path, PathBuf};

/// Validate and canonicalize a working directory path
pub fn validate_working_directory(path: &str) -> Result<PathBuf, AppError> {
    let path = Path::new(path);

    // Must be absolute
    if !path.is_absolute() {
        return Err(AppError::invalid_input("Path must be absolute"));
    }

    // Canonicalize to resolve symlinks and ..
    let canonical = path.canonicalize()
        .map_err(|_| AppError::file_system("Invalid path"))?;

    // Must be a directory
    if !canonical.is_dir() {
        return Err(AppError::file_system("Path is not a directory"));
    }

    // Must exist
    if !canonical.exists() {
        return Err(AppError::file_system("Directory does not exist"));
    }

    Ok(canonical)
}

/// Validate a file path is within allowed directory
pub fn validate_file_within_directory(
    file_path: &str,
    allowed_dir: &Path
) -> Result<PathBuf, AppError> {
    let file = Path::new(file_path);

    // Canonicalize both paths
    let canonical_file = file.canonicalize()
        .map_err(|_| AppError::file_system("Invalid file path"))?;
    let canonical_dir = allowed_dir.canonicalize()
        .map_err(|_| AppError::file_system("Invalid directory"))?;

    // Check file is within directory (prevent path traversal)
    if !canonical_file.starts_with(&canonical_dir) {
        return Err(AppError::invalid_input("File path outside allowed directory"));
    }

    Ok(canonical_file)
}
```

### SQL Injection Prevention

All database queries use parameterized statements:

```rust
// CORRECT: Parameterized query
pub async fn get_sessions_by_project(
    conn: &Connection,
    project_id: &str
) -> Result<Vec<Session>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT * FROM sessions WHERE project_id = ?1 ORDER BY updated_at DESC"
    )?;

    let sessions = stmt.query_map([project_id], |row| {
        // Map row to Session
    })?;

    Ok(sessions.collect())
}

// NEVER do this:
// let query = format!("SELECT * FROM sessions WHERE project_id = '{}'", project_id);
```

---

## Tauri Security Configuration

### Capabilities (Tauri v2)

```json
// src-tauri/capabilities/default.json
{
  "identifier": "default",
  "description": "Default capabilities for Wingman",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "shell:allow-open",
    "dialog:allow-open",
    "dialog:allow-save",
    "fs:allow-read",
    "fs:allow-write",
    "process:allow-exit"
  ]
}
```

### Content Security Policy

```rust
// tauri.conf.json security settings
{
  "security": {
    "csp": {
      "default-src": "'self'",
      "script-src": "'self'",
      "style-src": "'self' 'unsafe-inline'",
      "img-src": "'self' data: https:",
      "font-src": "'self' data:",
      "connect-src": "'self'",
      "frame-src": "'self' https:"
    },
    "dangerousDisableAssetCspModification": false
  }
}
```

**CSP Breakdown:**
- `default-src 'self'`: Only load resources from app
- `script-src 'self'`: No inline scripts, no external scripts
- `style-src 'self' 'unsafe-inline'`: Allow inline styles (CSS-in-JS)
- `img-src 'self' data: https:`: Allow data URLs and HTTPS images
- `frame-src 'self' https:`: Allow preview webview to load HTTPS

### WebView Security

The preview panel uses a webview for HTML preview:

```rust
// Webview configuration for preview panel
pub fn create_preview_webview(app: &AppHandle) -> Result<(), AppError> {
    let webview = tauri::WebviewWindowBuilder::new(
        app,
        "preview",
        tauri::WebviewUrl::App("about:blank".into())
    )
    .title("Preview")
    // Security settings
    .devtools(cfg!(debug_assertions)) // Only in dev
    .transparent(false)
    .build()?;

    Ok(())
}
```

**Preview Security:**
- JavaScript disabled by default
- Only loads local HTML content
- No external network access
- Isolated from main app context

---

## Process Security

### Claude CLI Spawning

Controlled process execution:

```rust
use std::process::Command;

pub fn spawn_claude_cli(working_dir: &Path) -> Result<Child, AppError> {
    // Validate working directory first
    let canonical = validate_working_directory(working_dir.to_str().unwrap())?;

    // Find Claude CLI in PATH (don't accept arbitrary paths)
    let claude_path = which::which("claude")
        .map_err(|_| AppError::claude_cli_not_found())?;

    // Spawn with controlled arguments
    let child = Command::new(&claude_path)
        .arg("--print")           // Machine-readable output
        .current_dir(&canonical)  // Validated working directory
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        // Clear environment except safe variables
        .env_clear()
        .env("PATH", std::env::var("PATH").unwrap_or_default())
        .env("HOME", std::env::var("HOME").unwrap_or_default())
        .env("USER", std::env::var("USER").unwrap_or_default())
        .spawn()
        .map_err(|e| AppError::claude_cli_error(e.to_string()))?;

    Ok(child)
}
```

**Process Security Measures:**
- Only spawn `claude` from PATH (no arbitrary executables)
- Clear environment except safe variables
- Validated working directory
- Controlled arguments (no user-provided flags)
- Piped I/O (no terminal access)

### External Link Handling

```rust
// Safe external link opening
#[tauri::command]
pub async fn open_external_url(url: String) -> Result<(), AppError> {
    // Validate URL scheme
    let parsed = url::Url::parse(&url)
        .map_err(|_| AppError::invalid_input("Invalid URL"))?;

    match parsed.scheme() {
        "http" | "https" => {
            // Safe to open
            open::that(&url)
                .map_err(|e| AppError::internal(e.to_string()))?;
            Ok(())
        }
        _ => {
            Err(AppError::invalid_input("Only HTTP/HTTPS URLs allowed"))
        }
    }
}
```

---

## Attack Surface Analysis

### Potential Vectors and Mitigations

| Vector | Risk | Mitigation |
|--------|------|------------|
| **XSS in chat** | Medium | React auto-escaping, CSP, no `dangerouslySetInnerHTML` |
| **Path traversal** | High | Canonical path validation in Rust |
| **SQL injection** | High | Parameterized queries only |
| **Command injection** | High | No shell execution, controlled CLI spawning |
| **Memory corruption** | Low | Rust memory safety |
| **Dependency vulnerabilities** | Medium | Regular `cargo audit`, `npm audit` |
| **Local privilege escalation** | Low | No elevated permissions required |

### XSS Prevention

```typescript
// Chat message rendering - safe by default
function ChatMessage({ content }: { content: string }) {
  // React escapes content automatically
  return <div className={styles.content}>{content}</div>;
}

// For markdown rendering, use safe parser
import { marked } from 'marked';
import DOMPurify from 'dompurify';

function renderMarkdown(content: string): string {
  const html = marked.parse(content);
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['href', 'class']
  });
}

// Only use dangerouslySetInnerHTML with sanitized content
<div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
```

### Code Block Security

```typescript
// Code blocks from Claude responses
function CodeBlock({ code, language }: { code: string; language: string }) {
  // Never execute code
  // Always display as text
  return (
    <pre className={styles.codeBlock}>
      <code className={`language-${language}`}>
        {code} {/* React auto-escapes */}
      </code>
    </pre>
  );
}
```

---

## File System Security

### Allowed Operations

| Operation | Scope | Validation |
|-----------|-------|------------|
| Read file | Within session working directory | Path validation |
| Watch directory | Session working directory only | Canonical path check |
| Open in editor | Single file, user-initiated | Path validation |
| Select directory | User chooses via system dialog | OS-provided |

### File Watcher Security

```rust
// File watcher is scoped to session working directory
pub async fn start_file_watcher(
    session_id: String,
    watch_path: String,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    // Get session to verify ownership
    let session = state.db.get_session(&session_id)
        .await?
        .ok_or_else(|| AppError::not_found("Session", &session_id))?;

    // Validate watch path is within session working directory
    let canonical_watch = validate_file_within_directory(
        &watch_path,
        Path::new(&session.working_directory)
    )?;

    // Start watcher on validated path
    state.file_watcher.watch(&canonical_watch, session_id).await?;

    Ok(())
}
```

---

## Dependency Security

### Rust Dependencies

```toml
# Cargo.toml - specify exact versions for security
[dependencies]
tauri = "=2.0.0"
rusqlite = "=0.31.0"
tokio = "=1.35.0"
serde = "=1.0.195"
```

**Security Practices:**
- Run `cargo audit` in CI
- Pin major versions
- Review transitive dependencies
- Update monthly for security patches

### Frontend Dependencies

```json
// package.json - minimize dependencies
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "@tauri-apps/api": "^2.0.0"
  }
}
```

**Security Practices:**
- Run `npm audit` in CI
- Use `pnpm` for strict dependencies
- Minimal dependency tree
- Regular updates

### Security Audit Schedule

| Task | Frequency |
|------|-----------|
| `cargo audit` | Every PR, daily CI |
| `npm audit` | Every PR, daily CI |
| Dependency updates | Monthly |
| Full security review | Quarterly |

---

## Audit Logging

### Security Events to Log

| Event | Logged Data | Purpose |
|-------|-------------|---------|
| Session created | Session ID, working directory | Audit trail |
| Session deleted | Session ID | Audit trail |
| File watcher started | Session ID, directory | Monitor access |
| External link opened | URL (no query params) | Security audit |
| CLI start/stop | Session ID, status | Process monitoring |
| Error with path | Error code (not full path) | Security monitoring |

### Log Example

```
[2025-01-07T10:42:15Z] [INFO] [audit] Session created
  session_id: sess_abc123
  working_dir_hash: a1b2c3d4 (SHA-256 of path)

[2025-01-07T10:42:20Z] [WARN] [audit] Path validation failed
  error: PATH_TRAVERSAL_ATTEMPT
  session_id: sess_abc123
```

---

## Privacy Considerations

### What We Don't Collect

- No telemetry
- No crash reporting (unless user opts in)
- No usage analytics
- No message content logging

### What Stays Local

- All chat messages
- All session data
- All project data
- All user preferences

### User Data Rights

| Right | Implementation |
|-------|----------------|
| Data access | All data in local SQLite |
| Data deletion | Delete session/project removes data |
| Data export | Possible future feature |
| Data portability | SQLite file is portable |

---

## Security Checklist

### Development

- [ ] Never log sensitive data (messages, paths)
- [ ] Always validate input in Rust backend
- [ ] Use parameterized SQL queries
- [ ] Validate all file paths
- [ ] Run `cargo audit` before commits
- [ ] Run `npm audit` before commits

### Code Review

- [ ] Check for hardcoded paths
- [ ] Verify path validation in file operations
- [ ] Ensure no `shell=true` in process spawning
- [ ] Verify CSP is not weakened
- [ ] Check for `dangerouslySetInnerHTML` usage

### Release

- [ ] All dependencies audited
- [ ] No debug code in production
- [ ] DevTools disabled in release
- [ ] Code signing configured
- [ ] Update manifest uses HTTPS

---

## Incident Response

### If Vulnerability Discovered

1. **Assess severity** (Critical/High/Medium/Low)
2. **Create private security advisory**
3. **Develop fix in private branch**
4. **Release patch update**
5. **Disclose after patch available**

### Contact

For security vulnerabilities, contact: [security email TBD]

---

## Summary

| Category | Status |
|----------|--------|
| API key storage | N/A (CLI handles auth) |
| Data at rest | Local SQLite, not encrypted |
| Data in transit | IPC only, CLI handles HTTPS |
| Input validation | All in Rust backend |
| Path security | Canonical validation |
| SQL security | Parameterized queries |
| Process security | Controlled CLI spawning |
| XSS prevention | React + CSP + DOMPurify |
| Dependency security | Regular audits |
