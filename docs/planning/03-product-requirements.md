# 03 - Product Requirements Document (PRD)

## Functional Requirements

### Must Have (P0)
Features required for MVP.

**Chat with Claude CLI**
| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| F01 | Chat interface | Terminal-style input/output; send messages, see Claude responses |
| F02 | Multi-session tabs | Open 2+ chat sessions simultaneously; switch between tabs |
| F03 | Claude CLI integration | Messages routed through actual Claude CLI (not API direct) |

**Live Preview**
| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| F04 | Web preview panel | Embedded browser shows localhost/dev server output |
| F05 | Auto-refresh on file change | Preview updates within 2 seconds of file save |

**File Awareness**
| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| F06 | File change notifications | See which files Claude modified in real-time |
| F07 | Change activity feed | Scrollable list of recent file operations |

**Session Persistence**
| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| F08 | Save conversations | All chat history saved locally; survives app restart |
| F09 | Session resume | Click previous session → loads full conversation context |
| F10 | Session browser | List/search all past sessions; delete unwanted ones |

**Project Management**
| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| F11 | Roadmap view | Visual roadmap with milestones and target dates |
| F12 | Sprint tracking | Create sprints; assign tasks; track completion % |
| F13 | Task management | Create/edit/complete tasks; set dependencies |
| F14 | Progress dashboard | At-a-glance view of current sprint status |

### Should Have (P1)
Important but not blocking launch.

**Multi-AI Support**
| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| F20 | Provider switching | Select AI provider (OpenAI, Gemini, Ollama) per session |
| F21 | API key management | Securely store/manage keys for each provider |
| F22 | Cost tracking | Show token usage and estimated cost per session |

**Enhanced UX**
| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| F23 | Keyboard shortcuts | Common actions (new session, switch tabs, send) have hotkeys |
| F24 | Theme support | Dark/light mode toggle |
| F25 | Session export | Export conversation to markdown file |

**Project Management Enhancements**
| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| F26 | Project templates | Start new projects from predefined templates |
| F27 | Timeline view | Gantt-style view of sprints and milestones |

### Nice to Have (P2)
Future enhancements.

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| F30 | Plugin system | Third-party extensions can add functionality |
| F31 | Conversation branching | Fork a conversation to try different approaches |
| F32 | Voice input | Speak to AI instead of typing |
| F33 | GitHub integration | Link tasks to issues/PRs; auto-update status |
| F34 | Custom AI personas | Save/load system prompts for different use cases |
| F35 | Session sharing | Export/import sessions to share with others |

---

## Non-Functional Requirements

### Performance
- App startup time: < 3 seconds to usable UI
- Message send latency: < 100ms to show in chat (AI response time separate)
- Memory usage: < 500MB baseline (excluding preview content)
- File change detection: < 1 second from save to notification

### Reliability
- Crash recovery: Auto-save every 30 seconds; restore state on restart
- Data persistence: Zero data loss on normal exit; graceful recovery on crash

### Security
- API key handling: Encrypted at rest using OS keychain (Windows Credential Manager)
- Data storage: All data local; no telemetry without explicit opt-in

### Usability
- Keyboard navigation: All primary actions accessible without mouse
- Accessibility: Screen reader compatible; WCAG 2.1 AA compliance target

---

## Constraints

### Technical Constraints
- Must use Tauri v2 (Rust + web frontend) - already committed
- Windows-first development; macOS/Linux support later
- Claude CLI wrapped, not bundled - user installs separately, we integrate
- Offline-capable for local AI (Ollama), but cloud AI requires internet

### Business Constraints
- Solo developer - architecture must be maintainable by one person
- No paid infrastructure - all data local, no server costs
- Personal use first - no monetization requirements for MVP

### Timeline Constraints
- None specified - ship when ready, quality over speed

---

## Assumptions
What are we assuming to be true?

- User has Claude CLI installed and authenticated before using Wingman
- User's projects run on localhost (for live preview)
- User has Node.js/pnpm/npm available for running dev servers
- Claude CLI API/output format remains stable across versions
- User has valid API keys for any AI providers they want to use

---

## Dependencies
What external systems/services does this depend on?

| Dependency | Purpose | Risk Level |
|------------|---------|------------|
| Claude CLI | Core AI interaction | High - app is useless without it |
| Tauri v2 | Desktop framework | Medium - stable but newer framework |
| OS File Watcher | Detect file changes | Low - built into Rust/Tauri |
| SQLite | Local data storage | Low - mature, embedded |
| OS Keychain | Secure credential storage | Low - native OS feature |
