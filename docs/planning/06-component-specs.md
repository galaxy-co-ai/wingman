# 06 - Component Specs

## Component Hierarchy

```
App
├── Layout
│   ├── TitleBar
│   ├── MainContent
│   │   ├── LeftPanel
│   │   │   ├── TabBar
│   │   │   └── ChatSession
│   │   │       ├── MessageList
│   │   │       │   └── ChatMessage
│   │   │       └── InputArea
│   │   ├── PanelDivider
│   │   └── RightPanel
│   │       ├── RightPanelTabs
│   │       ├── PreviewPanel
│   │       ├── ActivityFeed
│   │       └── Dashboard
│   │           ├── SprintWidget
│   │           ├── TodayWidget
│   │           └── MilestoneWidget
│   └── StatusBar
├── Views
│   ├── SessionBrowser
│   ├── ProjectView
│   │   ├── RoadmapTab
│   │   ├── SprintsTab
│   │   └── TasksTab
│   └── SettingsView
├── Modals
│   ├── ConfirmModal
│   ├── NewSessionModal
│   └── TaskModal
└── Providers
    ├── ThemeProvider
    ├── SessionProvider
    └── ProjectProvider
```

---

## Priority Components

---

### Component: ChatMessage

**Location**: `src/components/chat/ChatMessage.tsx`

**Purpose**: Renders a single message in the chat thread with role-appropriate styling, code block rendering, and file change indicators.

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| id | string | Yes | - | Unique message identifier |
| role | 'user' \| 'assistant' \| 'system' | Yes | - | Determines styling and alignment |
| content | string | Yes | - | Message text (supports Markdown) |
| timestamp | Date | Yes | - | When message was sent |
| isStreaming | boolean | No | false | Shows typing indicator, cursor at end |
| toolUsages | ToolUsage[] | No | [] | File operations performed (shown inline) |
| codeBlocks | CodeBlock[] | No | [] | Extracted code blocks for syntax highlighting |
| isCollapsed | boolean | No | false | For long messages, show truncated |

**Types**:
```tsx
interface ToolUsage {
  type: 'created' | 'modified' | 'deleted' | 'read';
  filePath: string;
  timestamp: Date;
}

interface CodeBlock {
  language: string;
  code: string;
  fileName?: string;
}
```

**State**:
| State | Type | Purpose |
|-------|------|---------|
| isExpanded | boolean | Toggle for collapsed long messages |
| copiedBlockIndex | number \| null | Which code block was just copied (for feedback) |

**Events Emitted**:
- `onFileClick(filePath: string)`: When user clicks a file link/tool usage
- `onCopyCode(code: string)`: When user copies a code block
- `onRetry()`: When user clicks retry on a failed assistant message

**Behavior**:
- User messages: Right-aligned, elevated gray background (#21262D), border (#30363D)
- Assistant messages: Left-aligned, panel background (#161B22), no border
- System messages: Centered, muted background (#1C2128), dashed border
- Markdown rendered with syntax highlighting in code blocks
- Tool usages shown as compact chips below message content: "✓ Modified: src/file.tsx"
- Click file chip → triggers `onFileClick` to open in external editor
- Long messages (>500 chars) collapsed by default with "Show more" toggle
- Code blocks have copy button (top-right), shows "Copied!" feedback for 2s
- Streaming messages show blinking cursor at end, no copy buttons until complete
- Timestamps shown on hover (tooltip) or always visible based on density setting

**Accessibility**:
- `role="article"` with `aria-label` indicating role and timestamp
- Code blocks use `<pre><code>` with proper language labeling
- Copy buttons have `aria-label="Copy code"`
- Collapsed state announced: "Message truncated, activate to expand"
- Focus management: Tab through interactive elements (file links, copy buttons)

**Responsive Behavior**:
- Max-width: 85% of container to prevent overly wide messages
- Code blocks horizontally scroll if content exceeds container
- On narrow panels (<400px), timestamps move to separate line

**Example Usage**:
```tsx
<ChatMessage
  id="msg-123"
  role="assistant"
  content="I'll create a login form for you..."
  timestamp={new Date()}
  isStreaming={false}
  toolUsages={[
    { type: 'modified', filePath: 'src/Login.tsx', timestamp: new Date() }
  ]}
  onFileClick={(path) => openInEditor(path)}
/>
```

---

### Component: TabBar

**Location**: `src/components/chat/TabBar.tsx`

**Purpose**: Horizontal tab strip for managing multiple chat sessions with add, close, reorder, and context menu capabilities.

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| tabs | Tab[] | Yes | - | Array of session tabs to display |
| activeTabId | string | Yes | - | Currently selected tab ID |
| onTabSelect | (id: string) => void | Yes | - | Tab click handler |
| onTabClose | (id: string) => void | Yes | - | Close button/middle-click handler |
| onTabReorder | (fromIndex: number, toIndex: number) => void | Yes | - | Drag reorder handler |
| onNewTab | () => void | Yes | - | Plus button click handler |

**Types**:
```tsx
interface Tab {
  id: string;
  title: string;
  projectName?: string;
  isModified?: boolean;  // unsaved changes indicator
  isLoading?: boolean;   // session connecting/loading
}
```

**State**:
| State | Type | Purpose |
|-------|------|---------|
| draggedTabId | string \| null | Tab currently being dragged |
| dropTargetIndex | number \| null | Visual indicator for drop position |
| contextMenuTab | string \| null | Tab with open context menu |
| contextMenuPosition | {x, y} \| null | Position for context menu |

**Events Emitted**:
- `onRename(id: string)`: Context menu rename action
- `onDuplicate(id: string)`: Context menu duplicate action
- `onCloseOthers(id: string)`: Context menu close others action

**Behavior**:
- Tabs scroll horizontally when overflow (no wrapping)
- Active tab visually distinct: accent underline, brighter text
- Hover: background highlight (#30363D), close button appears
- Click tab: triggers `onTabSelect`
- Click × on tab: triggers `onTabClose` (with confirmation if session active)
- Middle-click tab: closes without confirmation
- Right-click tab: shows context menu (Rename, Duplicate, Close, Close Others)
- Drag tab: reorders position, shows drop indicator line
- Plus button (+) at end: triggers `onNewTab`
- Modified indicator: small dot next to tab title
- Loading indicator: spinner replaces dot during connection

**Keyboard Navigation**:
- Ctrl+Tab / Cmd+Option+→: Next tab
- Ctrl+Shift+Tab / Cmd+Option+←: Previous tab
- Ctrl+W / Cmd+W: Close current tab
- Ctrl+1-9 / Cmd+1-9: Jump to tab by index

**Accessibility**:
- `role="tablist"` on container
- Each tab: `role="tab"`, `aria-selected`, `aria-controls`
- Close button: `aria-label="Close tab: {title}"`
- Plus button: `aria-label="New session"`
- Arrow key navigation between tabs when tablist focused
- Screen reader announces tab count and position

**Responsive Behavior**:
- Tabs have min-width: 100px, max-width: 200px
- Tab titles truncate with ellipsis when too long
- On narrow panels, show fewer tabs with scroll indicators
- Plus button always visible (pinned to right)

**Example Usage**:
```tsx
<TabBar
  tabs={[
    { id: '1', title: 'Login Feature', projectName: 'wingman' },
    { id: '2', title: 'API Refactor', projectName: 'wingman', isModified: true }
  ]}
  activeTabId="1"
  onTabSelect={(id) => switchToSession(id)}
  onTabClose={(id) => closeSession(id)}
  onTabReorder={(from, to) => reorderSessions(from, to)}
  onNewTab={() => createNewSession()}
/>
```

---

### Component: PreviewPanel

**Location**: `src/components/preview/PreviewPanel.tsx`

**Purpose**: Embedded webview for live-previewing web applications with navigation controls and auto-refresh capability.

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| url | string | Yes | - | URL to load in webview |
| autoRefresh | boolean | No | true | Whether to auto-refresh on file changes |
| refreshDebounce | number | No | 500 | Milliseconds to debounce auto-refresh |
| onUrlChange | (url: string) => void | No | - | Called when URL changes (navigation) |

**State**:
| State | Type | Purpose |
|-------|------|---------|
| inputUrl | string | URL in address bar (may differ from loaded URL) |
| isLoading | boolean | Loading indicator state |
| canGoBack | boolean | Back button enabled state |
| canGoForward | boolean | Forward button enabled state |
| loadError | string \| null | Error message if load failed |

**Events Emitted**:
- `onNavigate(url: string)`: When user navigates to new URL
- `onRefresh()`: When manual refresh triggered
- `onToggleAutoRefresh(enabled: boolean)`: When auto-refresh toggled

**Sub-components**:

**PreviewToolbar**:
- Back button (◀): Disabled when no history
- Forward button (▶): Disabled when at latest
- Refresh button (↻): Manual refresh trigger
- URL input: Editable, Enter to navigate
- Loading indicator: Progress bar below toolbar

**PreviewWebview**:
- Tauri webview component
- Handles loading states and errors
- Captures navigation events

**PreviewFooter**:
- Auto-refresh toggle: "Auto-refresh: ON/OFF"
- Current URL display (when different from input)

**Behavior**:
- Initial load: Shows skeleton/loading state, then renders page
- Auto-refresh: File watcher triggers refresh after debounce period
- Navigation: Back/Forward use webview history
- URL bar: Edit and press Enter to navigate, Escape to revert
- Error state: Shows error message with retry button
- External links: Open in system default browser (not in webview)

**Accessibility**:
- Toolbar buttons have `aria-label`
- URL input has `aria-label="Preview URL"`
- Loading state announced to screen readers
- Error messages in live region
- Webview has `title` attribute for screen readers

**Responsive Behavior**:
- Toolbar compacts on narrow panels: icons only, URL truncated
- Footer hidden below 350px width
- Minimum functional width: 300px

**Example Usage**:
```tsx
<PreviewPanel
  url="http://localhost:3000"
  autoRefresh={true}
  refreshDebounce={500}
  onUrlChange={(url) => savePreviewUrl(url)}
/>
```

---

### Component: ActivityFeed

**Location**: `src/components/activity/ActivityFeed.tsx`

**Purpose**: Real-time feed of file system changes made during the current session, with filtering and quick actions.

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| entries | ActivityEntry[] | Yes | - | File change entries |
| filter | ActivityFilter | No | 'all' | Current filter selection |
| onFilterChange | (filter: ActivityFilter) => void | No | - | Filter dropdown handler |
| onClear | () => void | No | - | Clear button handler |
| onFileClick | (path: string) => void | Yes | - | Open file in editor |

**Types**:
```tsx
interface ActivityEntry {
  id: string;
  type: 'created' | 'modified' | 'deleted' | 'read';
  filePath: string;
  timestamp: Date;
  messageId?: string;  // Link back to chat message
}

type ActivityFilter = 'all' | 'created' | 'modified' | 'deleted';
```

**State**:
| State | Type | Purpose |
|-------|------|---------|
| contextMenuEntry | string \| null | Entry with open context menu |
| contextMenuPosition | {x, y} \| null | Context menu position |

**Events Emitted**:
- `onCopyPath(path: string)`: Context menu copy path action
- `onShowInExplorer(path: string)`: Context menu reveal in explorer
- `onJumpToMessage(messageId: string)`: Navigate to related chat message

**Sub-components**:

**ActivityHeader**:
- Filter dropdown: All / Created / Modified / Deleted
- Clear button: Clears feed for current session
- Entry count: "12 files changed"

**ActivityEntry** (list item):
- Icon: ✚ (created), ✎ (modified), ✗ (deleted), 👁 (read)
- File path: Truncated from left if too long
- Timestamp: Relative ("2m ago") or absolute on hover
- Click: Opens file in external editor
- Right-click: Context menu

**Behavior**:
- New entries animate in from top (slide + fade, 150ms)
- Entries sorted by timestamp, newest first
- Filter dropdown filters displayed entries (not source data)
- Click entry → opens file in system default editor
- Right-click entry → context menu: Open, Copy Path, Show in Explorer, Jump to Message
- Badge on Activity tab shows unread count when tab not active
- Clear resets feed and badge count
- Read operations shown with lower opacity (less important)

**Accessibility**:
- `role="feed"` on container with `aria-label="File activity feed"`
- Entries use `role="article"` with descriptive `aria-label`
- Filter dropdown properly labeled
- New entries announced via `aria-live="polite"` region
- Keyboard: Enter/Space to open, context menu via Shift+F10

**Responsive Behavior**:
- File paths truncate from left: "...components/Chat.tsx"
- On narrow width, timestamp moves to separate line
- Filter dropdown collapses to icon-only below 350px

**Example Usage**:
```tsx
<ActivityFeed
  entries={fileChanges}
  filter="all"
  onFilterChange={(f) => setFilter(f)}
  onClear={() => clearActivity()}
  onFileClick={(path) => openInEditor(path)}
/>
```

---

### Component: Dashboard

**Location**: `src/components/dashboard/Dashboard.tsx`

**Purpose**: Overview panel showing current sprint progress, today's tasks, and upcoming milestones.

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| currentSprint | Sprint \| null | No | null | Active sprint data |
| todayTasks | Task[] | No | [] | Tasks for today |
| nextMilestone | Milestone \| null | No | null | Upcoming milestone |
| onViewProject | () => void | Yes | - | "View Full Project" link handler |
| onTaskClick | (taskId: string) => void | No | - | Task item click handler |

**Types**:
```tsx
interface Sprint {
  id: string;
  name: string;
  completedTasks: number;
  totalTasks: number;
  percentComplete: number;
}

interface Task {
  id: string;
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
}

interface Milestone {
  id: string;
  name: string;
  targetDate: Date;
}
```

**State**:
| State | Type | Purpose |
|-------|------|---------|
| None | - | Dashboard is stateless, displays props |

**Events Emitted**:
- `onSprintClick()`: When sprint widget clicked
- `onMilestoneClick()`: When milestone widget clicked

**Sub-components**:

**SprintWidget**:
```tsx
<SprintWidget
  name="Sprint 3: Authentication"
  completedTasks={6}
  totalTasks={10}
  percentComplete={60}
  onClick={() => navigateToSprint()}
/>
```
- Sprint name as header
- Progress bar with percentage
- Task count: "6/10 tasks complete"
- Click to navigate to sprint detail

**TodayWidget**:
```tsx
<TodayWidget
  tasks={[
    { id: '1', title: 'Login form UI', status: 'completed' },
    { id: '2', title: 'Form validation', status: 'completed' },
    { id: '3', title: 'Auth API integration', status: 'in_progress' }
  ]}
  onTaskClick={(id) => openTask(id)}
/>
```
- "Today" header
- Task list with status icons: ✓ (done), → (active), ○ (pending)
- Active task highlighted with accent color
- Click task to view details

**MilestoneWidget**:
```tsx
<MilestoneWidget
  name="MVP Release"
  targetDate={new Date('2025-01-20')}
  onClick={() => navigateToMilestone()}
/>
```
- Target icon + milestone name
- Formatted date: "Jan 20"
- Days remaining shown if < 14 days

**DashboardFooter**:
- "View Full Project →" link

**Behavior**:
- Empty states shown when no data:
  - No sprint: "No active sprint" with "Create Sprint" action
  - No tasks: "No tasks for today"
  - No milestone: Widget hidden
- Progress bar animates on updates (400ms width transition)
- Widgets clickable to navigate to full detail views
- "View Full Project" opens expanded project management view

**Accessibility**:
- Widgets use `role="region"` with `aria-labelledby`
- Progress bar has `role="progressbar"` with `aria-valuenow`
- Task status conveyed via icon + text (not color alone)
- All interactive elements keyboard accessible

**Responsive Behavior**:
- Widgets stack vertically in single column
- On very narrow width (<300px), widget padding reduced
- Progress bar maintains minimum height for touch targets

**Example Usage**:
```tsx
<Dashboard
  currentSprint={{
    id: 's3',
    name: 'Sprint 3: Authentication',
    completedTasks: 6,
    totalTasks: 10,
    percentComplete: 60
  }}
  todayTasks={todaysTasks}
  nextMilestone={{
    id: 'm1',
    name: 'MVP Release',
    targetDate: new Date('2025-01-20')
  }}
  onViewProject={() => navigateTo('/project')}
/>
```

---

## Layout Components

---

### Component: TitleBar

**Location**: `src/components/layout/TitleBar.tsx`

**Purpose**: Custom window title bar with app branding and window controls (minimize, maximize, close).

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| title | string | No | "Wingman" | Window title text |

**State**:
| State | Type | Purpose |
|-------|------|---------|
| isMaximized | boolean | Track window state for maximize button icon |

**Behavior**:
- Draggable region for window movement
- Double-click toggles maximize/restore
- Window control buttons: minimize (—), maximize (□/⧉), close (×)
- Close button has hover danger color (#F85149)
- Title shows "Wingman" or "Wingman - [context]" for specific views

**Platform Notes**:
- Windows/Linux: Custom title bar with our controls
- macOS: Use native traffic lights, custom title area
- Title bar height: 32px Windows/Linux, 28px macOS

**Accessibility**:
- Window controls have `aria-label`
- Draggable region not focusable (decoration only)

**Example Usage**:
```tsx
<TitleBar title="Wingman - Settings" />
```

---

### Component: StatusBar

**Location**: `src/components/layout/StatusBar.tsx`

**Purpose**: Bottom information bar showing connection status, project context, session stats, and quick settings access.

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| connectionStatus | 'connected' \| 'disconnected' \| 'connecting' | Yes | - | Claude CLI status |
| projectName | string \| null | No | null | Current project name |
| contextUsage | number | No | 0 | Context window usage percentage |
| sessionDuration | number | No | 0 | Session time in seconds |
| onSettingsClick | () => void | Yes | - | Settings button handler |
| onProjectClick | () => void | No | - | Project name click handler |

**State**:
| State | Type | Purpose |
|-------|------|---------|
| None | - | Display only, stateless |

**Behavior**:
- Connection indicator: ● green (connected), ○ gray (disconnected), ◐ animated (connecting)
- Click project name → opens project folder in explorer
- Hover context % → tooltip with token counts
- Click session time → tooltip with session start time
- Click settings gear → opens settings view
- Context usage has color coding: green (<50%), yellow (50-80%), red (>80%)

**Accessibility**:
- `role="status"` for connection indicator
- Interactive elements keyboard accessible
- Tooltips accessible via focus

**Example Usage**:
```tsx
<StatusBar
  connectionStatus="connected"
  projectName="wingman"
  contextUsage={45}
  sessionDuration={300}
  onSettingsClick={() => openSettings()}
/>
```

---

### Component: PanelDivider

**Location**: `src/components/layout/PanelDivider.tsx`

**Purpose**: Draggable divider between left and right panels for resizing.

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| onResize | (leftWidth: number) => void | Yes | - | Resize handler (px or %) |
| minLeftWidth | number | No | 300 | Minimum left panel width (px) |
| minRightWidth | number | No | 300 | Minimum right panel width (px) |
| snapPoints | number[] | No | [30, 50, 70] | Percentage snap points |

**State**:
| State | Type | Purpose |
|-------|------|---------|
| isDragging | boolean | Visual feedback during drag |
| nearSnapPoint | number \| null | Show magnetic snap indicator |

**Behavior**:
- Drag left/right to resize panels
- Visual indicator on hover (wider/highlighted)
- Magnetic snap at 30%, 50%, 70% (5px tolerance)
- Double-click to reset to 50/50
- Respects minimum widths on both sides
- Cursor changes to col-resize on hover

**Accessibility**:
- `role="separator"` with `aria-orientation="vertical"`
- `aria-valuenow` indicates current split position
- Keyboard: Arrow keys adjust position when focused

**Example Usage**:
```tsx
<PanelDivider
  onResize={(width) => setLeftPanelWidth(width)}
  minLeftWidth={300}
  minRightWidth={300}
  snapPoints={[30, 50, 70]}
/>
```

---

### Component: RightPanelTabs

**Location**: `src/components/layout/RightPanelTabs.tsx`

**Purpose**: Tab strip for switching between Preview, Activity, and Dashboard modes.

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| activeTab | 'preview' \| 'activity' \| 'dashboard' | Yes | - | Currently active tab |
| onTabChange | (tab: string) => void | Yes | - | Tab selection handler |
| activityBadge | number | No | 0 | Unread activity count badge |

**Behavior**:
- Three fixed tabs: Preview, Activity, Dashboard
- Active tab has accent underline
- Activity tab shows badge when has unread count
- Badge clears when Activity tab selected

**Keyboard Shortcuts**:
- Ctrl+Shift+1: Preview
- Ctrl+Shift+2: Activity
- Ctrl+Shift+3: Dashboard

**Accessibility**:
- Standard tablist/tab ARIA pattern
- Badge count announced to screen readers

**Example Usage**:
```tsx
<RightPanelTabs
  activeTab="preview"
  onTabChange={(tab) => setActiveRightTab(tab)}
  activityBadge={3}
/>
```

---

## Chat Components

---

### Component: MessageList

**Location**: `src/components/chat/MessageList.tsx`

**Purpose**: Scrollable container for chat messages with auto-scroll and virtualization.

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| messages | Message[] | Yes | - | Array of messages to display |
| isLoading | boolean | No | false | Show loading skeleton |
| onFileClick | (path: string) => void | Yes | - | Passed to ChatMessage |
| onRetry | (messageId: string) => void | No | - | Retry failed message |

**State**:
| State | Type | Purpose |
|-------|------|---------|
| shouldAutoScroll | boolean | Whether to follow new messages |
| isUserScrolling | boolean | Detected manual scroll, pause auto-scroll |

**Behavior**:
- Auto-scrolls to bottom on new messages (unless user scrolled up)
- Scroll-to-bottom button appears when not at bottom
- Large message histories virtualized (render only visible)
- Loading state: 3 skeleton message bubbles
- Empty state: Welcome message with tips

**Accessibility**:
- `role="log"` with `aria-live="polite"`
- `aria-label="Chat messages"`
- New messages announced automatically

**Example Usage**:
```tsx
<MessageList
  messages={sessionMessages}
  isLoading={isConnecting}
  onFileClick={(path) => openInEditor(path)}
/>
```

---

### Component: InputArea

**Location**: `src/components/chat/InputArea.tsx`

**Purpose**: Message input field with send button, multi-line support, and disabled states.

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| value | string | Yes | - | Current input value |
| onChange | (value: string) => void | Yes | - | Input change handler |
| onSend | () => void | Yes | - | Send message handler |
| onCancel | () => void | No | - | Cancel ongoing response |
| disabled | boolean | No | false | Disable during response |
| isResponding | boolean | No | false | Show cancel button instead of send |
| placeholder | string | No | "Type a message..." | Input placeholder |

**State**:
| State | Type | Purpose |
|-------|------|---------|
| isFocused | boolean | Visual focus indicator |

**Behavior**:
- Enter sends message (single line)
- Shift+Enter creates new line (multi-line)
- Escape cancels ongoing response (when isResponding)
- Input auto-grows up to 5 lines, then scrolls
- Send button disabled when input empty or disabled
- During response: input disabled, shows "Cancel" button
- Ctrl+Shift+Backspace clears input

**Accessibility**:
- `aria-label="Message input"`
- Send button: `aria-label="Send message"`
- Cancel button: `aria-label="Cancel response"`
- Disabled state announced

**Example Usage**:
```tsx
<InputArea
  value={inputText}
  onChange={(text) => setInputText(text)}
  onSend={() => sendMessage()}
  onCancel={() => cancelResponse()}
  disabled={isResponding}
  isResponding={isResponding}
/>
```

---

## Shared Components

---

### Component: Button

**Location**: `src/components/shared/Button.tsx`

**Purpose**: Reusable button with multiple variants and sizes.

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| variant | 'primary' \| 'secondary' \| 'ghost' \| 'danger' | No | 'secondary' | Visual style |
| size | 'sm' \| 'md' \| 'lg' | No | 'md' | Button size |
| disabled | boolean | No | false | Disabled state |
| loading | boolean | No | false | Show spinner, disable |
| leftIcon | ReactNode | No | - | Icon before label |
| rightIcon | ReactNode | No | - | Icon after label |
| children | ReactNode | Yes | - | Button label |
| onClick | () => void | No | - | Click handler |

**Variants**:
- **Primary**: Accent background (#39D4BA), dark text
- **Secondary**: Elevated background (#21262D), light text
- **Ghost**: Transparent, shows background on hover
- **Danger**: Red background (#F85149), white text

**Sizes**:
- **sm**: 28px height, 12px font, 8px padding
- **md**: 36px height, 14px font, 12px padding
- **lg**: 44px height, 16px font, 16px padding

**Behavior**:
- Hover: Background lightens, subtle scale (1.02x)
- Press: Scale down (0.98x)
- Focus: Accent outline ring
- Loading: Shows spinner, text still visible but muted

**Accessibility**:
- Uses native `<button>` element
- `aria-disabled` when disabled
- `aria-busy` when loading
- Focus visible outline

**Example Usage**:
```tsx
<Button variant="primary" size="md" onClick={handleSave}>
  Save Changes
</Button>

<Button variant="ghost" leftIcon={<PlusIcon />} onClick={handleNew}>
  New Session
</Button>
```

---

### Component: Input

**Location**: `src/components/shared/Input.tsx`

**Purpose**: Text input field with variants for different use cases.

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| type | 'text' \| 'search' \| 'url' | No | 'text' | Input type |
| value | string | Yes | - | Input value |
| onChange | (value: string) => void | Yes | - | Change handler |
| placeholder | string | No | '' | Placeholder text |
| disabled | boolean | No | false | Disabled state |
| error | string | No | - | Error message to display |
| leftIcon | ReactNode | No | - | Icon inside left edge |
| rightElement | ReactNode | No | - | Element inside right edge |

**Behavior**:
- Focus: Border transitions to accent color
- Error: Red border, error message below
- Search type: Has clear button when not empty
- URL type: Protocol prefix styling

**Accessibility**:
- Proper labeling via `aria-label` or associated `<label>`
- `aria-invalid` and `aria-describedby` for errors
- Clear button has `aria-label="Clear input"`

**Example Usage**:
```tsx
<Input
  type="search"
  value={searchQuery}
  onChange={(q) => setSearchQuery(q)}
  placeholder="Search sessions..."
  leftIcon={<SearchIcon />}
/>
```

---

### Component: Dropdown

**Location**: `src/components/shared/Dropdown.tsx`

**Purpose**: Select dropdown with custom styling.

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| options | DropdownOption[] | Yes | - | Available options |
| value | string | Yes | - | Selected value |
| onChange | (value: string) => void | Yes | - | Selection handler |
| placeholder | string | No | 'Select...' | Placeholder when no selection |
| disabled | boolean | No | false | Disabled state |

**Types**:
```tsx
interface DropdownOption {
  value: string;
  label: string;
  icon?: ReactNode;
}
```

**Behavior**:
- Click opens dropdown menu
- Click outside or Escape closes
- Arrow keys navigate options
- Enter selects highlighted option
- Menu positioned below, flips up if near bottom edge

**Accessibility**:
- `role="listbox"` pattern
- `aria-expanded`, `aria-selected`
- Arrow key navigation announced

**Example Usage**:
```tsx
<Dropdown
  options={[
    { value: 'all', label: 'All' },
    { value: 'created', label: 'Created', icon: <PlusIcon /> },
    { value: 'modified', label: 'Modified', icon: <EditIcon /> }
  ]}
  value={filter}
  onChange={(f) => setFilter(f)}
/>
```

---

### Component: Modal

**Location**: `src/components/shared/Modal.tsx`

**Purpose**: Dialog overlay for confirmations and forms.

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| isOpen | boolean | Yes | - | Modal visibility |
| onClose | () => void | Yes | - | Close handler (backdrop click, Escape) |
| title | string | Yes | - | Modal header title |
| size | 'sm' \| 'md' \| 'lg' | No | 'md' | Modal width |
| children | ReactNode | Yes | - | Modal content |
| footer | ReactNode | No | - | Footer buttons area |

**Sizes**:
- **sm**: 400px max-width
- **md**: 500px max-width
- **lg**: 700px max-width

**Behavior**:
- Opens with fade + scale animation (200ms)
- Backdrop click closes (unless persistent)
- Escape key closes
- Focus trapped inside modal
- Scrollable content if overflow
- Returns focus to trigger element on close

**Accessibility**:
- `role="dialog"` with `aria-modal="true"`
- `aria-labelledby` pointing to title
- Focus trap while open
- Escape key closes

**Example Usage**:
```tsx
<Modal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  title="Close Session?"
  footer={
    <>
      <Button variant="ghost" onClick={() => setShowConfirm(false)}>
        Cancel
      </Button>
      <Button variant="danger" onClick={handleClose}>
        Close
      </Button>
    </>
  }
>
  <p>This session has unsaved changes. Are you sure?</p>
</Modal>
```

---

### Component: Icon

**Location**: `src/components/shared/Icon.tsx`

**Purpose**: Wrapper for Lucide icons with consistent sizing.

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| name | string | Yes | - | Lucide icon name |
| size | 'xs' \| 'sm' \| 'md' \| 'lg' | No | 'md' | Icon size |
| color | string | No | 'currentColor' | Icon color |
| className | string | No | - | Additional CSS classes |

**Sizes**:
- **xs**: 12px
- **sm**: 16px
- **md**: 20px
- **lg**: 24px

**Example Usage**:
```tsx
<Icon name="plus" size="sm" />
<Icon name="settings" size="md" color="#8B949E" />
```

---

### Component: Tooltip

**Location**: `src/components/shared/Tooltip.tsx`

**Purpose**: Contextual information on hover/focus.

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| content | ReactNode | Yes | - | Tooltip content |
| position | 'top' \| 'bottom' \| 'left' \| 'right' | No | 'top' | Tooltip position |
| delay | number | No | 300 | Delay before showing (ms) |
| children | ReactNode | Yes | - | Trigger element |

**Behavior**:
- Shows after hover delay
- Also shows on focus (keyboard accessible)
- Auto-repositions if near viewport edge
- Hides immediately on mouse leave

**Accessibility**:
- Uses `aria-describedby` pattern
- Content in `role="tooltip"`
- Accessible via keyboard focus

**Example Usage**:
```tsx
<Tooltip content="Context window usage: 45,000 / 100,000 tokens">
  <span>Context: 45%</span>
</Tooltip>
```

---

### Component: Badge

**Location**: `src/components/shared/Badge.tsx`

**Purpose**: Notification count indicator.

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| count | number | Yes | - | Number to display |
| max | number | No | 99 | Max before showing "99+" |
| variant | 'default' \| 'accent' \| 'danger' | No | 'accent' | Color variant |

**Behavior**:
- Hidden when count is 0
- Shows "99+" when count exceeds max
- Positioned relative to parent (use with position wrapper)

**Example Usage**:
```tsx
<div className="relative">
  <span>Activity</span>
  <Badge count={3} />
</div>
```

---

## View Components

---

### Component: SessionBrowser

**Location**: `src/views/SessionBrowser.tsx`

**Purpose**: Full-page view for browsing and managing all sessions.

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| sessions | SessionSummary[] | Yes | - | All sessions |
| onSessionSelect | (id: string) => void | Yes | - | Open session handler |
| onSessionDelete | (id: string) => void | Yes | - | Delete session handler |
| onSessionRename | (id: string, name: string) => void | Yes | - | Rename handler |
| onBack | () => void | Yes | - | Return to main view |

**Sub-components**:
- **SessionSearchBar**: Search input for filtering
- **SessionCard**: Individual session preview card

**Behavior**:
- Search filters by session name and project
- Cards show: title, project, message count, last active
- Click card → opens session in new tab
- Edit button → inline rename
- Delete button → confirmation modal

**Example Usage**:
```tsx
<SessionBrowser
  sessions={allSessions}
  onSessionSelect={(id) => openSession(id)}
  onSessionDelete={(id) => deleteSession(id)}
  onSessionRename={(id, name) => renameSession(id, name)}
  onBack={() => navigateToMain()}
/>
```

---

### Component: SettingsView

**Location**: `src/views/SettingsView.tsx`

**Purpose**: Full-page settings configuration with categorized sections.

**Sections**:
- **General**: Language, startup behavior
- **Appearance**: Theme (Dark/Light/System), font size
- **Claude CLI**: CLI path, default model, streaming, verbose mode
- **Projects**: Default project directory, recent projects
- **Keyboard**: Shortcut customization

**Sub-components**:
- **SettingsSidebar**: Section navigation
- **SettingsSection**: Individual settings group
- **SettingRow**: Label + control for single setting

**Example Usage**:
```tsx
<SettingsView
  settings={currentSettings}
  onSave={(settings) => saveSettings(settings)}
  onCancel={() => navigateBack()}
/>
```

---

## Component Categories Summary

| Category | Components |
|----------|------------|
| **Layout** | TitleBar, StatusBar, PanelDivider, RightPanelTabs |
| **Chat** | TabBar, ChatSession, MessageList, ChatMessage, InputArea |
| **Preview** | PreviewPanel, PreviewToolbar, PreviewWebview |
| **Activity** | ActivityFeed, ActivityHeader, ActivityEntry |
| **Dashboard** | Dashboard, SprintWidget, TodayWidget, MilestoneWidget |
| **Project** | ProjectView, RoadmapTab, SprintsTab, TasksTab |
| **Views** | SessionBrowser, SettingsView |
| **Modals** | Modal, ConfirmModal, NewSessionModal, TaskModal |
| **Shared** | Button, Input, Dropdown, Icon, Tooltip, Badge |
| **Providers** | ThemeProvider, SessionProvider, ProjectProvider |

---

## Design Tokens Reference

Components should use tokens from `src/styles/tokens.ts` (defined in doc 16):

```tsx
// Usage example
import { colors, spacing, typography, animation } from '@/styles/tokens';

const StyledButton = styled.button`
  background: ${colors.accent.primary};
  padding: ${spacing.md};
  font-size: ${typography.sizes.md};
  transition: all ${animation.fast};
`;
```

See doc 16 (Design Tokens) for complete token definitions.
