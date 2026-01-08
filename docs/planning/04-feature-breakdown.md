# 04 - Feature Breakdown

## Feature List

Each feature as a user story with acceptance criteria.

---

## P0 Features (MVP)

### Chat with Claude CLI

#### Feature 1: Chat Interface

**User Story**: As a solopreneur, I want a terminal-style chat interface so that I can communicate with Claude naturally.

**Priority**: P0

**Acceptance Criteria**:
- [ ] Text input field at bottom of chat panel
- [ ] Messages display in scrollable conversation view
- [ ] User messages visually distinct from Claude responses
- [ ] Markdown rendering for Claude responses (code blocks, lists, etc.)
- [ ] Auto-scroll to new messages; manual scroll pauses auto-scroll

**Dependencies**: None (foundational)

---

#### Feature 2: Multi-Session Tabs

**User Story**: As a solopreneur, I want multiple chat sessions in tabs so that I can work on different tasks simultaneously.

**Priority**: P0

**Acceptance Criteria**:
- [ ] Tab bar shows all open sessions
- [ ] Click tab to switch sessions
- [ ] New tab button creates fresh session
- [ ] Close button on each tab (with confirmation if unsaved)
- [ ] Tab shows session name or project context

**Dependencies**: Feature 1 (Chat Interface)

---

#### Feature 3: Claude CLI Integration

**User Story**: As a solopreneur, I want my messages sent through Claude CLI so that I get full Claude Code capabilities (tools, file editing, etc.).

**Priority**: P0

**Acceptance Criteria**:
- [ ] Messages routed to Claude CLI process (not direct API)
- [ ] Claude CLI output streamed back to chat in real-time
- [ ] Tool use (file edits, bash commands) executed by CLI
- [ ] Working directory set per session
- [ ] Error states shown clearly in chat

**Dependencies**: Feature 1 (Chat Interface)

---

### Live Preview

#### Feature 4: Web Preview Panel

**User Story**: As a solopreneur, I want to see my app's live preview so that I don't have to switch to a browser.

**Priority**: P0

**Acceptance Criteria**:
- [ ] Embedded webview in right panel
- [ ] URL bar to enter/change preview URL
- [ ] Refresh button to manually reload
- [ ] Default to localhost:3000 (configurable per project)
- [ ] Show loading state while page loads

**Dependencies**: None (can work independently)

---

#### Feature 5: Auto-Refresh on File Change

**User Story**: As a solopreneur, I want the preview to refresh automatically when files change so that I see updates without manual action.

**Priority**: P0

**Acceptance Criteria**:
- [ ] Detect file changes in project directory
- [ ] Trigger preview refresh within 2 seconds of change
- [ ] Debounce rapid changes (don't refresh 10x for batch edits)
- [ ] Toggle to disable auto-refresh if needed
- [ ] Visual indicator when refresh triggered

**Dependencies**: Feature 4 (Web Preview Panel), Feature 6 (File Change Notifications)

---

### File Awareness

#### Feature 6: File Change Notifications

**User Story**: As a solopreneur, I want to see which files Claude is modifying so that I'm aware of changes happening in real-time.

**Priority**: P0

**Acceptance Criteria**:
- [ ] Watch project directory for file system events
- [ ] Show notification when file created/modified/deleted
- [ ] Notification includes file path and operation type
- [ ] Notifications appear within 1 second of change
- [ ] Highlight files changed by Claude vs external changes

**Dependencies**: None (foundational for file awareness)

---

#### Feature 7: Change Activity Feed

**User Story**: As a solopreneur, I want a scrollable log of file changes so that I can review what happened during a session.

**Priority**: P0

**Acceptance Criteria**:
- [ ] Activity feed panel showing recent file operations
- [ ] Each entry shows: timestamp, file path, operation type
- [ ] Click entry to open file (in external editor or preview)
- [ ] Filter by operation type (created/modified/deleted)
- [ ] Clear feed option; persists with session

**Dependencies**: Feature 6 (File Change Notifications)

---

### Session Persistence

#### Feature 8: Save Conversations

**User Story**: As a solopreneur, I want my chat history saved automatically so that I never lose work if the app closes.

**Priority**: P0

**Acceptance Criteria**:
- [ ] All messages saved to local SQLite database
- [ ] Auto-save triggers every 30 seconds and on each message
- [ ] Survives app restart, crash, or system reboot
- [ ] Store message content, timestamps, role (user/assistant)
- [ ] Associate messages with session and project

**Dependencies**: Feature 1 (Chat Interface)

---

#### Feature 9: Session Resume

**User Story**: As a solopreneur, I want to resume previous sessions with full context so that I can continue where I left off.

**Priority**: P0

**Acceptance Criteria**:
- [ ] Click previous session to reopen in tab
- [ ] Full conversation history loads in chat view
- [ ] Working directory restored to original project
- [ ] Claude CLI context restored (or session handoff message sent)
- [ ] File activity feed restored for that session

**Dependencies**: Feature 8 (Save Conversations), Feature 2 (Multi-Session Tabs)

---

#### Feature 10: Session Browser

**User Story**: As a solopreneur, I want to browse and manage all my past sessions so that I can find and organize my work.

**Priority**: P0

**Acceptance Criteria**:
- [ ] List view of all saved sessions
- [ ] Show: session name, project, last active date, message count
- [ ] Search sessions by name or content
- [ ] Delete sessions (with confirmation)
- [ ] Rename sessions

**Dependencies**: Feature 8 (Save Conversations)

---

### Project Management

#### Feature 11: Roadmap View

**User Story**: As a solopreneur, I want to see my project roadmap so that I understand the big picture and milestones.

**Priority**: P0

**Acceptance Criteria**:
- [ ] Visual roadmap showing milestones on a timeline
- [ ] Create/edit/delete milestones
- [ ] Milestone shows: name, target date, completion status
- [ ] Milestones linked to sprints
- [ ] Drag to reorder milestones

**Dependencies**: None (foundational for project management)

---

#### Feature 12: Sprint Tracking

**User Story**: As a solopreneur, I want to organize work into sprints so that I can focus on achievable chunks.

**Priority**: P0

**Acceptance Criteria**:
- [ ] Create sprints with name and optional date range
- [ ] Assign tasks to sprints
- [ ] View sprint completion percentage
- [ ] Mark sprint as active/complete
- [ ] Sprint backlog for unassigned tasks

**Dependencies**: Feature 13 (Task Management)

---

#### Feature 13: Task Management

**User Story**: As a solopreneur, I want to create and track tasks so that I know what needs to be done.

**Priority**: P0

**Acceptance Criteria**:
- [ ] Create tasks with title and description
- [ ] Set task status: todo, in progress, done
- [ ] Set task priority: high, medium, low
- [ ] Define task dependencies (blocked by other tasks)
- [ ] Estimate effort (optional)

**Dependencies**: None (foundational for project management)

---

#### Feature 14: Progress Dashboard

**User Story**: As a solopreneur, I want a quick progress overview so that I can see status at a glance while working.

**Priority**: P0

**Acceptance Criteria**:
- [ ] Dashboard widget in right panel
- [ ] Show current sprint name and progress bar
- [ ] Show tasks completed today
- [ ] Show next upcoming milestone
- [ ] Clickable to expand into full project view

**Dependencies**: Feature 11, Feature 12, Feature 13

---

## P1 Features (Fast Follow)

### Multi-AI Support

#### Feature 20: Provider Switching

**User Story**: As a solopreneur, I want to switch between AI providers so that I can use the best tool for each task and manage costs.

**Priority**: P1

**Acceptance Criteria**:
- [ ] Dropdown to select AI provider per session
- [ ] Support: Claude (CLI), OpenAI, Gemini, Ollama (local)
- [ ] Provider persists for session, changeable mid-conversation
- [ ] Show current provider indicator in chat header
- [ ] Graceful fallback if provider unavailable

**Dependencies**: Feature 3 (Claude CLI Integration)

---

#### Feature 21: API Key Management

**User Story**: As a solopreneur, I want to securely manage my API keys so that I can use multiple AI providers.

**Priority**: P1

**Acceptance Criteria**:
- [ ] Settings page to add/edit/delete API keys
- [ ] Keys stored encrypted in OS keychain
- [ ] Validate key on save (test API call)
- [ ] Show which providers are configured
- [ ] Never display full key after saving (masked)

**Dependencies**: None (foundational for multi-AI)

---

#### Feature 22: Cost Tracking

**User Story**: As a solopreneur, I want to see my AI usage costs so that I can optimize spending.

**Priority**: P1

**Acceptance Criteria**:
- [ ] Track token usage per message
- [ ] Calculate estimated cost based on provider pricing
- [ ] Show session cost total
- [ ] Show daily/weekly/monthly cost summaries
- [ ] Cost visible in session browser

**Dependencies**: Feature 20 (Provider Switching)

---

### Enhanced UX

#### Feature 23: Keyboard Shortcuts

**User Story**: As a solopreneur, I want keyboard shortcuts for common actions so that I can work faster without reaching for the mouse.

**Priority**: P1

**Acceptance Criteria**:
- [ ] Cmd/Ctrl+N: New session
- [ ] Cmd/Ctrl+W: Close current tab
- [ ] Cmd/Ctrl+Tab: Switch to next tab
- [ ] Cmd/Ctrl+Enter: Send message
- [ ] Cmd/Ctrl+K: Command palette for all actions
- [ ] Customizable shortcuts in settings

**Dependencies**: Feature 2 (Multi-Session Tabs)

---

#### Feature 24: Theme Support

**User Story**: As a solopreneur, I want dark and light modes so that I can work comfortably in any lighting.

**Priority**: P1

**Acceptance Criteria**:
- [ ] Dark mode (default)
- [ ] Light mode
- [ ] System preference detection (auto)
- [ ] Toggle in settings and quick-access menu
- [ ] Smooth transition animation between themes

**Dependencies**: None

---

#### Feature 25: Session Export

**User Story**: As a solopreneur, I want to export conversations so that I can save them externally or share them.

**Priority**: P1

**Acceptance Criteria**:
- [ ] Export session to Markdown file
- [ ] Include: messages, timestamps, metadata
- [ ] Option to include/exclude file activity log
- [ ] Choose export location via file picker
- [ ] Bulk export multiple sessions

**Dependencies**: Feature 8 (Save Conversations)

---

### Project Management Enhancements

#### Feature 26: Project Templates

**User Story**: As a solopreneur, I want to start projects from templates so that I can quickly set up common project structures.

**Priority**: P1

**Acceptance Criteria**:
- [ ] Template library with common setups (React, Node, Python, etc.)
- [ ] Template includes: default tasks, milestones, sprint structure
- [ ] Create custom templates from existing projects
- [ ] Import/export templates as files
- [ ] Apply template to new or existing project

**Dependencies**: Feature 11 (Roadmap View), Feature 13 (Task Management)

---

#### Feature 27: Timeline View

**User Story**: As a solopreneur, I want a Gantt-style timeline so that I can visualize how sprints and tasks overlap.

**Priority**: P1

**Acceptance Criteria**:
- [ ] Horizontal timeline with date axis
- [ ] Sprints shown as bars with start/end dates
- [ ] Tasks shown within sprint bars
- [ ] Drag to adjust dates
- [ ] Dependencies shown as connecting lines
- [ ] Zoom in/out on timeline

**Dependencies**: Feature 12 (Sprint Tracking), Feature 13 (Task Management)

---

## P2 Features (Future)

#### Feature 30: Plugin System

**User Story**: As a solopreneur, I want to extend Wingman with plugins so that I can add custom functionality.

**Priority**: P2

**Acceptance Criteria**:
- [ ] Plugin API with documented extension points
- [ ] Plugins can add: panel widgets, commands, integrations
- [ ] Plugin manager to install/enable/disable plugins
- [ ] Sandboxed execution for security
- [ ] Plugin marketplace or directory (future)

**Dependencies**: Core app stable (all P0 complete)

---

#### Feature 31: Conversation Branching

**User Story**: As a solopreneur, I want to fork conversations so that I can explore different approaches without losing the original.

**Priority**: P2

**Acceptance Criteria**:
- [ ] "Branch from here" option on any message
- [ ] Creates new session starting from that point
- [ ] Visual indicator showing branch relationship
- [ ] Navigate between branches
- [ ] Merge learnings back (manual)

**Dependencies**: Feature 8 (Save Conversations), Feature 9 (Session Resume)

---

#### Feature 32: Voice Input

**User Story**: As a solopreneur, I want to speak to the AI so that I can work hands-free.

**Priority**: P2

**Acceptance Criteria**:
- [ ] Microphone button in chat input
- [ ] Speech-to-text transcription
- [ ] Support system microphone
- [ ] Visual feedback during recording
- [ ] Edit transcription before sending

**Dependencies**: Feature 1 (Chat Interface)

---

#### Feature 33: GitHub Integration

**User Story**: As a solopreneur, I want tasks linked to GitHub issues so that my project management stays in sync with my repo.

**Priority**: P2

**Acceptance Criteria**:
- [ ] Connect GitHub account (OAuth)
- [ ] Link task to existing GitHub issue
- [ ] Create GitHub issue from task
- [ ] Sync status changes bidirectionally
- [ ] Show PR status on linked tasks

**Dependencies**: Feature 13 (Task Management)

---

#### Feature 34: Custom AI Personas

**User Story**: As a solopreneur, I want to save custom system prompts so that I can quickly switch Claude's behavior for different tasks.

**Priority**: P2

**Acceptance Criteria**:
- [ ] Create persona with name and system prompt
- [ ] Select persona when starting session
- [ ] Library of built-in personas (code reviewer, architect, etc.)
- [ ] Edit/delete custom personas
- [ ] Share personas as exportable files

**Dependencies**: Feature 3 (Claude CLI Integration)

---

#### Feature 35: Session Sharing

**User Story**: As a solopreneur, I want to share sessions with others so that I can get feedback or showcase work.

**Priority**: P2

**Acceptance Criteria**:
- [ ] Generate shareable link for session
- [ ] Read-only view for recipients (no account needed)
- [ ] Option to share with or without file activity
- [ ] Expiring links (24h, 7d, permanent)
- [ ] Revoke shared links

**Dependencies**: Feature 25 (Session Export)

---

## Feature Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FOUNDATIONAL                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [F1 Chat Interface]          [F4 Web Preview]         [F6 File Watcher]   │
│         │                           │                        │              │
│         ├──► [F2 Tabs]              │                        │              │
│         │       │                   │                        │              │
│         ├──► [F3 CLI Integration]   │                        ▼              │
│         │       │                   │                  [F7 Activity Feed]   │
│         │       │                   │                        │              │
│         ▼       │                   ▼                        │              │
│  [F8 Save Conversations]      [F5 Auto-Refresh] ◄────────────┘              │
│         │                                                                   │
│         ├──► [F9 Session Resume] ◄── [F2]                                  │
│         │                                                                   │
│         └──► [F10 Session Browser]                                         │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                           PROJECT MANAGEMENT                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [F11 Roadmap] ◄───────┐                                                   │
│         │              │                                                    │
│         │        [F13 Task Management]                                      │
│         │              │                                                    │
│         │              ├──► [F12 Sprint Tracking]                          │
│         │              │                                                    │
│         ▼              ▼                                                    │
│  [F14 Progress Dashboard] ◄─────────┘                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

P1 Dependencies:
  F3 ──► F20 (Provider Switching) ──► F22 (Cost Tracking)
  F2 ──► F23 (Keyboard Shortcuts)
  F8 ──► F25 (Session Export)
  F11, F13 ──► F26 (Project Templates)
  F12, F13 ──► F27 (Timeline View)

P2 Dependencies:
  All P0 ──► F30 (Plugin System)
  F8, F9 ──► F31 (Conversation Branching)
  F1 ──► F32 (Voice Input)
  F13 ──► F33 (GitHub Integration)
  F3 ──► F34 (Custom AI Personas)
  F25 ──► F35 (Session Sharing)
```

---

## Priority Summary

| Priority | Count | Features |
|----------|-------|----------|
| P0 (Must Have) | 14 | F1-F14: Chat, Tabs, CLI, Preview, Auto-Refresh, File Notifications, Activity Feed, Save, Resume, Browser, Roadmap, Sprints, Tasks, Dashboard |
| P1 (Should Have) | 8 | F20-F27: Provider Switching, API Keys, Cost Tracking, Shortcuts, Themes, Export, Templates, Timeline |
| P2 (Nice to Have) | 6 | F30-F35: Plugins, Branching, Voice, GitHub, Personas, Sharing |

---

## MVP Scope

Features included in initial release (P0):

**Chat with Claude CLI**
- [ ] F1: Chat Interface
- [ ] F2: Multi-Session Tabs
- [ ] F3: Claude CLI Integration

**Live Preview**
- [ ] F4: Web Preview Panel
- [ ] F5: Auto-Refresh on File Change

**File Awareness**
- [ ] F6: File Change Notifications
- [ ] F7: Change Activity Feed

**Session Persistence**
- [ ] F8: Save Conversations
- [ ] F9: Session Resume
- [ ] F10: Session Browser

**Project Management**
- [ ] F11: Roadmap View
- [ ] F12: Sprint Tracking
- [ ] F13: Task Management
- [ ] F14: Progress Dashboard
