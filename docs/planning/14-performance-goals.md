# 14 - Performance Goals

This document defines performance targets, optimization strategies, and monitoring approaches for Wingman.

---

## Performance Philosophy

### Principles

1. **Perceived performance matters most** - Users care about responsiveness, not benchmarks
2. **Measure before optimizing** - Profile to find actual bottlenecks
3. **Budget early** - Set limits before they become problems
4. **Degrade gracefully** - Maintain usability under stress

### Key Metrics

| Metric | Description | Why It Matters |
|--------|-------------|----------------|
| **TTFB** | Time to First Byte | Initial load speed |
| **FCP** | First Contentful Paint | Perceived load time |
| **TTI** | Time to Interactive | When app is usable |
| **FID** | First Input Delay | Responsiveness |
| **LCP** | Largest Contentful Paint | Visual completeness |

---

## Startup Performance

### Targets

| Metric | Target | Maximum | Measurement |
|--------|--------|---------|-------------|
| Cold start | < 2s | 3s | Launch → Window visible |
| First paint | < 500ms | 800ms | Launch → First content |
| Time to interactive | < 2.5s | 4s | Launch → Usable UI |
| Warm start | < 500ms | 1s | Background → Active |

### Cold Start Breakdown

```
┌──────────────────────────────────────────────────────────┐
│ Phase                    │ Budget  │ Max    │ Actual    │
├──────────────────────────────────────────────────────────┤
│ Tauri bootstrap          │ 200ms   │ 400ms  │ [measure] │
│ Rust initialization      │ 100ms   │ 200ms  │ [measure] │
│ SQLite connection        │ 50ms    │ 100ms  │ [measure] │
│ Frontend bundle load     │ 300ms   │ 500ms  │ [measure] │
│ React hydration          │ 200ms   │ 400ms  │ [measure] │
│ Initial data fetch       │ 150ms   │ 300ms  │ [measure] │
│ First paint              │ -       │ -      │ [measure] │
├──────────────────────────────────────────────────────────┤
│ Total                    │ 1000ms  │ 1900ms │ [measure] │
└──────────────────────────────────────────────────────────┘
```

### Startup Optimizations

**Rust Backend:**
- Lazy-load non-critical modules
- Defer database migrations to background
- Pre-compile SQLite queries
- Use release profile optimizations

```rust
// Cargo.toml release profile
[profile.release]
lto = true
codegen-units = 1
panic = "abort"
strip = true
```

**Frontend:**
- Code splitting by route
- Preload critical CSS
- Defer non-essential JavaScript
- Use skeleton screens during load

```typescript
// Lazy load non-critical views
const SettingsView = lazy(() => import('./views/SettingsView'));
const SessionBrowser = lazy(() => import('./views/SessionBrowser'));
const ProjectView = lazy(() => import('./views/ProjectView'));
```

---

## Runtime Performance

### Memory Usage

| State | Target | Maximum | Notes |
|-------|--------|---------|-------|
| Idle | < 80 MB | 120 MB | No sessions open |
| Single session | < 120 MB | 180 MB | One active chat |
| 5 sessions | < 200 MB | 300 MB | Multiple tabs |
| 10 sessions | < 300 MB | 450 MB | Heavy usage |
| Long session (1000+ msgs) | < 150 MB | 250 MB | Virtual list active |

### Memory Optimizations

**Message List:**
```typescript
// Virtual list for message rendering
import { useVirtualizer } from '@tanstack/react-virtual';

function MessageList({ messages }) {
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 100, // Estimated row height
    overscan: 5, // Render 5 extra items above/below
  });

  // Only render visible items
  return virtualizer.getVirtualItems().map(/* ... */);
}
```

**Store Cleanup:**
```typescript
// Remove old messages from memory (keep in DB)
const MAX_MESSAGES_IN_MEMORY = 200;

const trimMessages = (sessionId: string) => {
  const messages = get().messages[sessionId];
  if (messages && messages.length > MAX_MESSAGES_IN_MEMORY) {
    // Keep most recent, can reload older from DB
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: messages.slice(-MAX_MESSAGES_IN_MEMORY),
      },
    }));
  }
};
```

**Image Handling:**
```typescript
// Lazy load images in messages
function MessageImage({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
    />
  );
}
```

### CPU Usage

| State | Target | Maximum | Notes |
|-------|--------|---------|-------|
| Idle | < 1% | 3% | No activity |
| Typing | < 5% | 10% | Input processing |
| Receiving response | < 15% | 25% | Stream processing |
| Scrolling | < 10% | 20% | Virtual list rendering |
| File watching | < 2% | 5% | Background activity |

### CPU Optimizations

**Debounce Input:**
```typescript
// Debounce input area resize calculations
const debouncedResize = useDebouncedCallback(() => {
  calculateInputHeight();
}, 100);
```

**Memoize Expensive Renders:**
```typescript
// Memoize message rendering
const MemoizedMessage = memo(ChatMessage, (prev, next) => {
  return (
    prev.message.id === next.message.id &&
    prev.message.content === next.message.content &&
    prev.isStreaming === next.isStreaming
  );
});
```

**Batch State Updates:**
```typescript
// Batch multiple store updates
const addMessagesFromLoad = (sessionId: string, messages: Message[]) => {
  // Single state update instead of multiple
  set((state) => ({
    messages: {
      ...state.messages,
      [sessionId]: messages,
    },
  }));
};
```

---

## Response Latency

### UI Interactions

| Operation | Target | Maximum | Notes |
|-----------|--------|---------|-------|
| Tab switch | < 50ms | 100ms | Instant feel |
| Modal open | < 100ms | 200ms | Smooth animation |
| Theme toggle | < 100ms | 200ms | CSS var swap |
| Search filter | < 100ms | 200ms | Debounced |
| Settings save | < 200ms | 500ms | Async write |
| Panel resize | 16ms | 32ms | 60fps during drag |

### IPC Operations

| Operation | Target | Maximum | Notes |
|-----------|--------|---------|-------|
| Session list | < 100ms | 300ms | Paginated |
| Session load | < 200ms | 500ms | With messages |
| Session create | < 100ms | 200ms | DB insert |
| Message send | < 50ms | 100ms | Just queuing |
| Activity fetch | < 100ms | 200ms | Last 100 entries |
| Settings update | < 50ms | 100ms | Single row |

### Database Queries

| Query | Target | Maximum | Index |
|-------|--------|---------|-------|
| Get session by ID | < 5ms | 10ms | Primary key |
| List sessions | < 20ms | 50ms | `idx_sessions_updated` |
| Get messages by session | < 30ms | 100ms | `idx_messages_session` |
| Get tasks by sprint | < 20ms | 50ms | `idx_tasks_sprint` |
| Search sessions | < 50ms | 200ms | FTS if implemented |

```sql
-- Key indexes for performance
CREATE INDEX idx_sessions_project ON sessions(project_id);
CREATE INDEX idx_sessions_updated ON sessions(updated_at DESC);
CREATE INDEX idx_messages_session ON messages(session_id, created_at);
CREATE INDEX idx_tasks_sprint ON tasks(sprint_id, position);
CREATE INDEX idx_activity_session ON activity(session_id, timestamp DESC);
```

---

## Streaming Performance

### Claude Response Streaming

| Metric | Target | Notes |
|--------|--------|-------|
| First chunk latency | < 100ms | From send to first text |
| Chunk processing | < 5ms | Per chunk render |
| Scroll during stream | 60fps | No jank |
| Memory per stream | < 1MB | For typical response |

### Stream Handling

```typescript
// Efficient stream processing
function useStreamingMessage(messageId: string) {
  const contentRef = useRef('');
  const [displayContent, setDisplayContent] = useState('');

  // Batch updates for smooth rendering
  const flushInterval = useRef<NodeJS.Timer>();

  const appendChunk = useCallback((chunk: string) => {
    contentRef.current += chunk;

    // Flush every 50ms instead of every chunk
    if (!flushInterval.current) {
      flushInterval.current = setInterval(() => {
        setDisplayContent(contentRef.current);
      }, 50);
    }
  }, []);

  const complete = useCallback(() => {
    clearInterval(flushInterval.current);
    setDisplayContent(contentRef.current);
  }, []);

  return { displayContent, appendChunk, complete };
}
```

---

## File Watching Performance

### Targets

| Metric | Target | Maximum |
|--------|--------|---------|
| Event latency | < 100ms | 500ms |
| Events per second | 100+ | N/A |
| Memory overhead | < 10 MB | 20 MB |
| CPU (idle) | < 0.5% | 1% |

### Debounce Strategy

```rust
// Debounce rapid file events
use std::time::Duration;
use tokio::time::sleep;

const DEBOUNCE_MS: u64 = 100;

async fn handle_file_event(event: FileEvent) {
    // Debounce: wait for burst to settle
    sleep(Duration::from_millis(DEBOUNCE_MS)).await;

    // Batch events from same file
    // Only emit if this is still the latest event for this path
}
```

### Ignore Patterns

```rust
// Default ignore patterns for efficiency
const DEFAULT_IGNORES: &[&str] = &[
    "node_modules",
    ".git",
    "dist",
    "build",
    "target",
    ".next",
    "__pycache__",
    "*.log",
    ".DS_Store",
    "thumbs.db",
];
```

---

## Bundle Size Budget

### JavaScript

| Bundle | Budget | Maximum | Notes |
|--------|--------|---------|-------|
| Main bundle | < 150 KB | 200 KB | Core app |
| Vendor bundle | < 100 KB | 150 KB | React, Zustand |
| Route chunks | < 30 KB ea | 50 KB | Per lazy route |
| **Total JS** | < 300 KB | 450 KB | gzipped |

### CSS

| Bundle | Budget | Maximum | Notes |
|--------|--------|---------|-------|
| Global styles | < 10 KB | 15 KB | Reset, tokens |
| Component styles | < 30 KB | 50 KB | All CSS modules |
| **Total CSS** | < 40 KB | 65 KB | gzipped |

### Assets

| Asset Type | Budget | Maximum | Notes |
|------------|--------|---------|-------|
| Icons (SVG sprite) | < 20 KB | 30 KB | All icons |
| Fonts | < 50 KB | 80 KB | If custom fonts |
| Images | 0 KB | 0 KB | None in bundle |

### Bundle Analysis

```bash
# Analyze bundle size
pnpm build
pnpm exec vite-bundle-visualizer

# Check against budgets
pnpm exec bundlesize
```

```json
// package.json
{
  "bundlesize": [
    {
      "path": "./dist/assets/index-*.js",
      "maxSize": "200 KB"
    },
    {
      "path": "./dist/assets/index-*.css",
      "maxSize": "40 KB"
    }
  ]
}
```

---

## Optimization Strategies

### Frontend

| Strategy | Impact | Effort | When |
|----------|--------|--------|------|
| Virtual scrolling | High | Medium | Messages > 100 |
| Code splitting | High | Low | Initial |
| Memo components | Medium | Low | Re-renders |
| Debounce inputs | Medium | Low | Initial |
| Lazy load images | Low | Low | If images exist |
| CSS containment | Medium | Low | List items |

**CSS Containment:**
```css
.message {
  contain: content; /* Isolate layout calculations */
}

.message-list {
  contain: strict;
  content-visibility: auto; /* Skip offscreen rendering */
}
```

### Backend

| Strategy | Impact | Effort | When |
|----------|--------|--------|------|
| Query indexes | High | Low | Initial |
| Connection pooling | Medium | Low | Initial |
| Prepared statements | Medium | Low | Initial |
| Batch writes | Medium | Medium | High write load |
| Async file I/O | High | Medium | File operations |

**Prepared Statements:**
```rust
// Prepare once, execute many
lazy_static! {
    static ref GET_SESSION: &'static str =
        "SELECT * FROM sessions WHERE id = ?1";
    static ref LIST_MESSAGES: &'static str =
        "SELECT * FROM messages WHERE session_id = ?1 ORDER BY created_at";
}
```

### Tauri-Specific

| Strategy | Impact | Notes |
|----------|--------|-------|
| Release builds only | High | Debug is 10x slower |
| LTO (link-time opt) | Medium | Slower builds, faster runtime |
| Strip symbols | Low | Smaller binary |
| Single codegen unit | Medium | Better optimization |

---

## Performance Monitoring

### Development

```typescript
// Performance logging hook
function usePerformanceLog(name: string) {
  useEffect(() => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      if (duration > 100) {
        console.warn(`[Perf] ${name} took ${duration.toFixed(1)}ms`);
      }
    };
  }, [name]);
}

// Usage
function ChatSession({ sessionId }) {
  usePerformanceLog(`ChatSession-${sessionId}`);
  // ...
}
```

### Production Metrics

```typescript
// Collect startup metrics
const startupMetrics = {
  appStart: performance.now(),
  firstPaint: 0,
  firstContentfulPaint: 0,
  timeToInteractive: 0,
};

// Report to console/telemetry
window.addEventListener('load', () => {
  const paint = performance.getEntriesByType('paint');
  startupMetrics.firstPaint = paint.find(p => p.name === 'first-paint')?.startTime ?? 0;
  startupMetrics.firstContentfulPaint = paint.find(p => p.name === 'first-contentful-paint')?.startTime ?? 0;

  console.log('[Startup Metrics]', startupMetrics);
});
```

### Rust Performance Tracing

```rust
use tracing::{info, instrument};

#[instrument(skip(state))]
#[tauri::command]
pub async fn session_load(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<SessionWithMessages, AppError> {
    let start = std::time::Instant::now();

    let result = load_session_impl(&session_id, &state).await?;

    info!(
        session_id = %session_id,
        duration_ms = %start.elapsed().as_millis(),
        "Session loaded"
    );

    Ok(result)
}
```

---

## Performance Testing

### Automated Tests

```typescript
// tests/performance/startup.test.ts
import { test, expect } from '@playwright/test';

test('app starts within budget', async ({ page }) => {
  const startTime = Date.now();

  await page.goto('/');
  await page.waitForSelector('[data-testid="app-ready"]');

  const loadTime = Date.now() - startTime;

  expect(loadTime).toBeLessThan(3000); // 3 second max
});

test('tab switch is instant', async ({ page }) => {
  await page.goto('/');

  // Open second tab
  await page.click('[data-testid="new-session"]');

  const startTime = Date.now();
  await page.click('[role="tab"]:first-child');
  await page.waitForSelector('[data-testid="session-content"]');
  const switchTime = Date.now() - startTime;

  expect(switchTime).toBeLessThan(100); // 100ms max
});
```

### Manual Benchmarks

```bash
# Memory profiling
# 1. Open DevTools > Memory
# 2. Take heap snapshot
# 3. Perform actions
# 4. Take another snapshot
# 5. Compare

# CPU profiling
# 1. Open DevTools > Performance
# 2. Start recording
# 3. Perform action (scroll, type, etc.)
# 4. Stop recording
# 5. Analyze flame graph
```

---

## Performance Checklist

### Before Release

- [ ] Bundle size within budget
- [ ] Startup time < 2 seconds
- [ ] No layout thrashing in scroll
- [ ] Memory stable over time (no leaks)
- [ ] 60fps during animations
- [ ] All database queries indexed

### Monitoring

- [ ] Startup metrics logged
- [ ] Slow operations warned (> 100ms)
- [ ] Memory usage tracked
- [ ] Large list virtualized

---

## Summary

| Category | Target | Status |
|----------|--------|--------|
| Cold start | < 2s | TBD |
| Memory (idle) | < 80 MB | TBD |
| Memory (active) | < 150 MB | TBD |
| Tab switch | < 50ms | TBD |
| Message send | < 50ms | TBD |
| JS bundle | < 300 KB | TBD |
| CSS bundle | < 40 KB | TBD |
| 60fps scroll | Yes | TBD |

All targets will be validated during implementation and adjusted based on real-world measurements.
