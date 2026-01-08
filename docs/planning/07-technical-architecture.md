# 07 - Technical Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Wingman App                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Frontend (React + TypeScript)          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │    │
│  │  │Components│  │  Stores  │  │     Hooks        │   │    │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │    │
│  └─────────────────────┬───────────────────────────────┘    │
│                        │ IPC (Tauri Commands)               │
│  ┌─────────────────────┴───────────────────────────────┐    │
│  │              Backend (Rust / Tauri)                 │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │    │
│  │  │ Commands │  │  State   │  │   File System    │   │    │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Claude API    │
                    └─────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Tauri | v2.x |
| Frontend | React | v19.x |
| Language (FE) | TypeScript | v5.x |
| Language (BE) | Rust | v1.75+ |
| Build Tool | Vite | v7.x |
| Package Manager | pnpm | v9.x |
| State Management | Zustand | v5.x |
| Styling | CSS Modules + CSS Custom Properties | - |
| Icons | Lucide React | v0.x |
| Database | SQLite (via Tauri plugin) | - |
| Markdown | react-markdown + rehype | - |
| Code Highlighting | Shiki | v1.x |

---

## Data Flow

```
User Input → React Component → Store → IPC Command → Rust Handler
                                                          │
                                                          ▼
                                                    Claude API
                                                          │
                                                          ▼
React Component ← Store Update ← IPC Response ← Rust Handler
```

---

## Key Architectural Decisions

### Decision 1: State Management with Zustand

- **Choice**: Zustand v5 for client-side state management
- **Rationale**:
  - Minimal boilerplate compared to Redux (no actions, reducers, providers)
  - First-class TypeScript support with excellent type inference
  - Works naturally with async operations (Tauri IPC commands)
  - Built-in `persist` middleware for syncing state to SQLite
  - Tiny bundle size (~1KB) keeps app lightweight
  - No Context Provider wrapping needed - cleaner component tree
- **Trade-offs**:
  - Less structured than Redux (mitigated by defining clear store slices)
  - No built-in DevTools (can add zustand/devtools middleware)
- **Implementation**:
  ```
  src/stores/
  ├── sessions.ts      # Chat sessions, messages, tabs
  ├── projects.ts      # Sprints, tasks, milestones, roadmap
  ├── activity.ts      # File change feed
  ├── settings.ts      # User preferences, theme
  └── index.ts         # Combined exports
  ```

---

### Decision 2: CSS Modules with CSS Custom Properties

- **Choice**: CSS Modules for scoped styles + CSS Custom Properties for theming
- **Rationale**:
  - Zero runtime overhead (styles compiled at build time)
  - Scoped class names prevent style conflicts
  - CSS Custom Properties enable dynamic theme switching without JS
  - Design tokens (doc 16) export directly as CSS variables
  - Native CSS features (cascade, media queries) work naturally
  - Excellent IDE support (autocomplete, hover previews)
- **Trade-offs**:
  - Less dynamic than CSS-in-JS (props-based styling requires className logic)
  - Theme switching via CSS variables instead of JS object
- **Implementation**:
  ```
  src/styles/
  ├── tokens.css       # CSS custom properties from doc 16
  ├── themes/
  │   ├── dark.css     # Dark theme overrides
  │   └── light.css    # Light theme overrides
  └── global.css       # Reset, base styles

  src/components/chat/
  ├── ChatMessage.tsx
  └── ChatMessage.module.css
  ```

---

### Decision 3: Wrap Claude CLI (Not Bundle)

- **Choice**: Spawn Claude CLI as child process rather than bundling or direct API
- **Rationale**:
  - Full Claude Code capabilities (tools, file editing, MCP) without reimplementation
  - Users manage their own Claude CLI installation and authentication
  - Automatic updates when user updates their CLI
  - Smaller Wingman bundle size
  - No API key management complexity in MVP
- **Trade-offs**:
  - Requires user to have Claude CLI installed (show setup guide on first run)
  - Less control over CLI behavior
  - Must parse CLI output for streaming display
- **Implementation**:
  - Rust backend spawns `claude` process with `--print` or streaming flags
  - Parse JSON/text output and relay to frontend via Tauri events
  - Working directory set per session

---

### Decision 4: SQLite for Local Persistence

- **Choice**: SQLite via `tauri-plugin-sql` for all persistent data
- **Rationale**:
  - Single file database, no external dependencies
  - Battle-tested, handles concurrent access
  - Full SQL query capability for session search
  - Tauri plugin provides async Rust bindings
  - Easy backup (copy single file)
- **Trade-offs**:
  - Requires schema migrations for updates
  - Not suitable for real-time sync (not needed for single-user)
- **Tables**:
  - `sessions` - Chat session metadata
  - `messages` - Individual chat messages
  - `projects` - Project definitions
  - `sprints` - Sprint data
  - `tasks` - Task items
  - `milestones` - Milestone data
  - `activity_log` - File change history
  - `settings` - User preferences

---

### Decision 5: File Watching via Tauri

- **Choice**: Use `notify` crate (via Tauri fs plugin) for file system watching
- **Rationale**:
  - Native performance, low CPU usage
  - Cross-platform (Windows, macOS, Linux)
  - Debouncing handled in Rust for efficiency
  - Events pushed to frontend via Tauri event system
- **Trade-offs**:
  - Platform differences in event granularity (mitigated by normalization layer)
- **Implementation**:
  - Rust backend watches project directory
  - Emits `file-changed` events with path, operation type, timestamp
  - Frontend ActivityFeed subscribes to events

---

### Decision 6: Tauri Webview for Preview Panel

- **Choice**: Embedded Tauri webview component for live preview
- **Rationale**:
  - Native webview (WebView2 on Windows, WebKit on macOS/Linux)
  - Full browser capabilities without bundling Chromium
  - Can intercept navigation, inject scripts if needed
  - Smaller app size than Electron
- **Trade-offs**:
  - Less control than Chromium (no DevTools in preview)
  - Platform-dependent rendering (minor differences)
- **Implementation**:
  - Webview component loads localhost URL
  - Navigation events captured and relayed to UI
  - Auto-refresh triggered by file watcher events

---

## Build Process

### Development
```bash
pnpm dev
```

### Production Build
```bash
pnpm build
```

### Output
- Windows: `.exe` / `.msi`
- macOS: `.dmg`
- Linux: `.AppImage` / `.deb`

---

## Deployment

### Distribution

**Platforms & Artifacts**:
| Platform | Format | Notes |
|----------|--------|-------|
| Windows | `.msi` installer, portable `.exe` | MSI for standard install, exe for portable use |
| macOS | `.dmg` disk image | Universal binary (Intel + Apple Silicon) |
| Linux | `.AppImage`, `.deb` | AppImage for universal, deb for Debian/Ubuntu |

**Distribution Channels**:
1. **GitHub Releases** (Primary)
   - Tagged releases with changelog
   - Artifacts uploaded automatically via CI
   - Users download directly from releases page

2. **Website** (Future)
   - Download page linking to latest GitHub release
   - Platform detection for suggested download

**Signing & Notarization**:
- Windows: Code signing certificate (required for MSI, prevents SmartScreen warnings)
- macOS: Apple Developer ID + notarization (required for Gatekeeper)
- Linux: No signing required (AppImage is portable)

---

### Auto-updates

**Strategy**: Tauri's built-in updater plugin (`tauri-plugin-updater`)

**How It Works**:
1. App checks for updates on startup (configurable frequency)
2. Fetches update manifest from GitHub Releases API
3. If newer version available, prompts user
4. Downloads update in background
5. Applies update on next app restart

**Update Flow**:
```
App Start → Check GitHub API → Compare versions
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
              No update                      Update available
                    │                               │
                    ▼                               ▼
              Continue                    Show update notification
                                                    │
                                                    ▼
                                          User clicks "Update"
                                                    │
                                                    ▼
                                          Download in background
                                                    │
                                                    ▼
                                          "Restart to apply"
```

**Configuration** (`tauri.conf.json`):
```json
{
  "plugins": {
    "updater": {
      "active": true,
      "pubkey": "YOUR_PUBLIC_KEY",
      "endpoints": [
        "https://github.com/username/wingman/releases/latest/download/latest.json"
      ]
    }
  }
}
```

**User Preferences**:
- Check frequency: Startup / Daily / Weekly / Never
- Auto-download: On / Off (just notify)
- Include pre-releases: On / Off

---

## IPC Architecture

Communication between React frontend and Rust backend via Tauri Commands.

### Command Categories

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ invoke("command_name", payload)
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Tauri IPC Bridge                              │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Session Cmds   │     │  Project Cmds   │     │  System Cmds    │
│                 │     │                 │     │                 │
│ • start_session │     │ • get_projects  │     │ • get_settings  │
│ • send_message  │     │ • create_sprint │     │ • save_settings │
│ • load_history  │     │ • update_task   │     │ • open_external │
│ • save_session  │     │ • get_roadmap   │     │ • watch_dir     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Event Streams (Backend → Frontend)

For real-time data, Rust emits events that React subscribes to:

| Event | Payload | Purpose |
|-------|---------|---------|
| `claude-output` | `{ text, isComplete, toolUse }` | Streaming Claude responses |
| `file-changed` | `{ path, operation, timestamp }` | File system changes |
| `session-saved` | `{ sessionId }` | Confirm auto-save complete |
| `update-available` | `{ version, releaseNotes }` | New version notification |

### Error Handling

All IPC commands return `Result<T, AppError>`:

```rust
#[derive(Serialize)]
pub enum AppError {
    ClaudeCliNotFound,
    ClaudeCliError(String),
    DatabaseError(String),
    FileSystemError(String),
    InvalidInput(String),
}
```

Frontend displays appropriate error UI based on error type.

---

## Security Considerations

### Tauri Security Model
- Webview runs in sandboxed context
- Only allowlisted Tauri commands accessible from frontend
- No Node.js runtime (unlike Electron) - smaller attack surface

### API Key Handling (P1 - Multi-AI)
- Keys stored in OS keychain (Windows Credential Manager, macOS Keychain)
- Never logged or transmitted except to respective AI API
- Displayed masked in settings UI

### File System Access
- Scoped to user-selected project directories
- No arbitrary file system access from webview
- File operations go through Rust backend

### Claude CLI
- Inherits user's CLI authentication
- No credentials stored in Wingman

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| App startup | < 2 seconds | Time to interactive |
| Message send | < 100ms | Input to CLI spawn |
| File change detection | < 500ms | FS event to UI update |
| Memory usage | < 200MB | Idle with 5 sessions |
| Bundle size | < 50MB | Installed app size |

### Optimization Strategies
- Virtualized message lists (only render visible messages)
- Debounced file watching (batch rapid changes)
- Lazy-load views (Session Browser, Settings)
- SQLite connection pooling
- Image/asset compression
