# 12 - Testing Strategy

This document defines the testing approach for Wingman, including tools, coverage goals, test organization, and CI/CD integration.

---

## Testing Philosophy

### Principles

1. **Test behavior, not implementation** - Focus on what users experience
2. **Fast feedback** - Unit tests should run in seconds
3. **Confidence over coverage** - Test critical paths thoroughly
4. **Maintainable tests** - Tests should be easy to update with code changes
5. **Mock at boundaries** - Mock IPC calls, not internal functions

### Testing Pyramid

```
            /\
           /  \        E2E Tests (5-10)
          /    \       Critical user journeys
         /──────\
        /        \     Integration Tests (20-30)
       /          \    Component + Store + Service
      /────────────\
     /              \  Unit Tests (100+)
    /                \ Components, Hooks, Utils, Stores
   /──────────────────\
```

---

## Test Stack

### Tools

| Category | Tool | Purpose |
|----------|------|---------|
| Test Runner | Vitest | Fast, Vite-native testing |
| Component Testing | @testing-library/react | DOM testing utilities |
| Assertions | Vitest built-in + jest-dom | Expect matchers |
| Mocking | Vitest built-in | IPC mocking |
| E2E | Playwright | Cross-browser automation |
| Rust Testing | cargo test | Backend unit tests |
| Coverage | c8 (Vitest) | Code coverage reports |

### Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'tests/e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.types.ts',
        'src/**/index.ts',
        'src/main.tsx',
        'src/**/*.test.{ts,tsx}',
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});
```

```typescript
// tests/setup.ts
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Tauri API globally
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
  emit: vi.fn(),
}));

// Mock window.matchMedia for theme tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

---

## Coverage Goals

### By Category

| Category | Target | Rationale |
|----------|--------|-----------|
| Components | 80% | User-facing, critical |
| Hooks | 90% | Reusable logic |
| Stores | 85% | State management |
| Services | 70% | IPC wrappers (mostly mocked) |
| Utils | 95% | Pure functions |
| Types | 0% | Type definitions only |

### Critical Paths (Must Have 100%)

- Send message flow
- Session create/load/delete
- Tab management (add, remove, switch)
- Error handling display
- Theme switching

### What to Skip

- Generated code (barrel exports)
- Type definitions
- Third-party library wrappers
- Simple pass-through functions

---

## Unit Tests

### Component Tests

```typescript
// src/components/chat/ChatMessage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatMessage } from './ChatMessage';
import type { Message } from '@/types';

const createMessage = (overrides?: Partial<Message>): Message => ({
  id: 'msg-1',
  sessionId: 'sess-1',
  role: 'assistant',
  content: 'Hello, how can I help?',
  timestamp: '2025-01-07T10:00:00Z',
  isStreaming: false,
  ...overrides,
});

describe('ChatMessage', () => {
  describe('rendering', () => {
    it('renders message content', () => {
      render(<ChatMessage message={createMessage()} />);
      expect(screen.getByText('Hello, how can I help?')).toBeInTheDocument();
    });

    it('applies user role styling', () => {
      render(<ChatMessage message={createMessage({ role: 'user' })} />);
      expect(screen.getByRole('article')).toHaveClass('user');
    });

    it('applies assistant role styling', () => {
      render(<ChatMessage message={createMessage({ role: 'assistant' })} />);
      expect(screen.getByRole('article')).toHaveClass('assistant');
    });

    it('shows streaming indicator when streaming', () => {
      render(<ChatMessage message={createMessage()} isStreaming />);
      expect(document.querySelector('.cursor')).toBeInTheDocument();
    });
  });

  describe('truncation', () => {
    it('truncates long messages', () => {
      const longContent = 'A'.repeat(600);
      render(<ChatMessage message={createMessage({ content: longContent })} />);

      expect(screen.getByText('Show more')).toBeInTheDocument();
      expect(screen.queryByText(longContent)).not.toBeInTheDocument();
    });

    it('expands truncated message on click', () => {
      const longContent = 'A'.repeat(600);
      render(<ChatMessage message={createMessage({ content: longContent })} />);

      fireEvent.click(screen.getByText('Show more'));

      expect(screen.getByText('Show less')).toBeInTheDocument();
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onFileClick when tool chip is clicked', () => {
      const onFileClick = vi.fn();
      const message = createMessage({
        toolUsages: [{ type: 'modified', filePath: '/src/app.ts', timestamp: '' }],
      });

      render(<ChatMessage message={message} onFileClick={onFileClick} />);
      fireEvent.click(screen.getByText(/app\.ts/));

      expect(onFileClick).toHaveBeenCalledWith('/src/app.ts');
    });

    it('shows retry button on error messages', () => {
      const onRetry = vi.fn();
      const message = createMessage({ isError: true });

      render(<ChatMessage message={message} onRetry={onRetry} />);
      fireEvent.click(screen.getByText('Retry'));

      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has correct article role', () => {
      render(<ChatMessage message={createMessage()} />);
      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('has descriptive aria-label', () => {
      render(<ChatMessage message={createMessage()} />);
      const article = screen.getByRole('article');
      expect(article.getAttribute('aria-label')).toContain('assistant');
    });
  });
});
```

### Hook Tests

```typescript
// src/hooks/use-debounce.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebounce, useDebouncedCallback } from './use-debounce';

describe('useDebounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('updates value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });
    expect(result.current).toBe('initial');

    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toBe('updated');
  });

  it('resets timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'b' });
    act(() => vi.advanceTimersByTime(300));

    rerender({ value: 'c' });
    act(() => vi.advanceTimersByTime(300));

    expect(result.current).toBe('a'); // Still waiting

    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe('c'); // Final value only
  });
});

describe('useDebouncedCallback', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('debounces callback execution', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    result.current('arg1');
    result.current('arg2');
    result.current('arg3');

    expect(callback).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(500));

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('arg3');
  });
});
```

### Store Tests

```typescript
// src/stores/sessions.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionsStore } from './sessions';
import type { Session, Message, Tab } from '@/types';

const createSession = (id = 'sess-1'): Session => ({
  id,
  title: 'Test Session',
  workingDirectory: '/test',
  createdAt: '2025-01-07T10:00:00Z',
  updatedAt: '2025-01-07T10:00:00Z',
});

const createMessage = (id = 'msg-1', sessionId = 'sess-1'): Message => ({
  id,
  sessionId,
  role: 'user',
  content: 'Test message',
  timestamp: '2025-01-07T10:00:00Z',
});

describe('useSessionsStore', () => {
  beforeEach(() => {
    useSessionsStore.getState().reset();
  });

  describe('session management', () => {
    it('adds a session', () => {
      const session = createSession();
      useSessionsStore.getState().addSession(session);

      const state = useSessionsStore.getState();
      expect(state.sessions['sess-1']).toEqual(session);
    });

    it('removes a session and all associated data', () => {
      const store = useSessionsStore.getState();
      store.addSession(createSession());
      store.addMessage('sess-1', createMessage());
      store.addTab({ id: 'sess-1', sessionId: 'sess-1', title: 'Test' });

      store.removeSession('sess-1');

      const state = useSessionsStore.getState();
      expect(state.sessions['sess-1']).toBeUndefined();
      expect(state.messages['sess-1']).toBeUndefined();
      expect(state.tabs.find(t => t.id === 'sess-1')).toBeUndefined();
    });

    it('updates session properties', () => {
      useSessionsStore.getState().addSession(createSession());
      useSessionsStore.getState().updateSession('sess-1', { title: 'Updated' });

      expect(useSessionsStore.getState().sessions['sess-1'].title).toBe('Updated');
    });
  });

  describe('message management', () => {
    it('adds messages to a session', () => {
      useSessionsStore.getState().addSession(createSession());
      useSessionsStore.getState().addMessage('sess-1', createMessage());

      const messages = useSessionsStore.getState().messages['sess-1'];
      expect(messages).toHaveLength(1);
    });

    it('updates streaming message content', () => {
      useSessionsStore.getState().addSession(createSession());
      useSessionsStore.getState().addMessage('sess-1', {
        ...createMessage(),
        content: '',
        isStreaming: true,
      });

      useSessionsStore.getState().updateStreamingMessage('msg-1', 'Hello ');
      useSessionsStore.getState().updateStreamingMessage('msg-1', 'world!');

      const messages = useSessionsStore.getState().messages['sess-1'];
      expect(messages[0].content).toBe('Hello world!');
    });

    it('completes streaming message', () => {
      useSessionsStore.getState().addSession(createSession());
      useSessionsStore.getState().addMessage('sess-1', {
        ...createMessage(),
        isStreaming: true,
      });

      useSessionsStore.getState().completeMessage('msg-1');

      const messages = useSessionsStore.getState().messages['sess-1'];
      expect(messages[0].isStreaming).toBe(false);
    });
  });

  describe('tab management', () => {
    it('adds tab and sets as active', () => {
      useSessionsStore.getState().addTab({ id: 'tab-1', sessionId: 'sess-1', title: 'Tab 1' });

      const state = useSessionsStore.getState();
      expect(state.tabs).toHaveLength(1);
      expect(state.activeTabId).toBe('tab-1');
    });

    it('removes tab and activates adjacent', () => {
      const store = useSessionsStore.getState();
      store.addTab({ id: 'tab-1', sessionId: 'sess-1', title: 'Tab 1' });
      store.addTab({ id: 'tab-2', sessionId: 'sess-2', title: 'Tab 2' });
      store.setActiveTab('tab-1');

      store.removeTab('tab-1');

      const state = useSessionsStore.getState();
      expect(state.tabs).toHaveLength(1);
      expect(state.activeTabId).toBe('tab-2');
    });

    it('reorders tabs', () => {
      const store = useSessionsStore.getState();
      store.addTab({ id: 'tab-1', sessionId: 'sess-1', title: 'Tab 1' });
      store.addTab({ id: 'tab-2', sessionId: 'sess-2', title: 'Tab 2' });
      store.addTab({ id: 'tab-3', sessionId: 'sess-3', title: 'Tab 3' });

      store.reorderTabs(0, 2);

      const tabs = useSessionsStore.getState().tabs;
      expect(tabs.map(t => t.id)).toEqual(['tab-2', 'tab-3', 'tab-1']);
    });
  });
});
```

### Utility Tests

```typescript
// src/utils/format-date.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatDate, formatRelativeTime } from './format-date';

describe('formatDate', () => {
  it('formats ISO date string', () => {
    const result = formatDate('2025-01-07T10:30:00Z');
    expect(result).toMatch(/10:30/);
  });

  it('handles invalid date gracefully', () => {
    const result = formatDate('invalid');
    expect(result).toBe('Invalid date');
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-07T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows "just now" for recent times', () => {
    const result = formatRelativeTime('2025-01-07T11:59:30Z');
    expect(result).toBe('just now');
  });

  it('shows minutes ago', () => {
    const result = formatRelativeTime('2025-01-07T11:55:00Z');
    expect(result).toBe('5 minutes ago');
  });

  it('shows hours ago', () => {
    const result = formatRelativeTime('2025-01-07T10:00:00Z');
    expect(result).toBe('2 hours ago');
  });

  it('shows yesterday', () => {
    const result = formatRelativeTime('2025-01-06T10:00:00Z');
    expect(result).toBe('yesterday');
  });
});
```

---

## Integration Tests

### Component + Store Integration

```typescript
// tests/integration/session-flow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { ChatSession } from '@/components/chat/ChatSession';
import { useSessionsStore } from '@/stores';

vi.mock('@tauri-apps/api/core');

describe('Chat Session Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionsStore.getState().reset();
  });

  it('loads session and displays messages', async () => {
    // Setup mock
    vi.mocked(invoke).mockResolvedValueOnce({
      session: {
        id: 'sess-1',
        title: 'Test Session',
        workingDirectory: '/test',
      },
      messages: [
        { id: 'msg-1', role: 'user', content: 'Hello' },
        { id: 'msg-2', role: 'assistant', content: 'Hi there!' },
      ],
    });

    // Render component
    render(<ChatSession sessionId="sess-1" />);

    // Wait for load
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });
  });

  it('sends message and shows in chat', async () => {
    // Setup initial state
    useSessionsStore.getState().addSession({
      id: 'sess-1',
      title: 'Test',
      workingDirectory: '/test',
      createdAt: '',
      updatedAt: '',
    });

    vi.mocked(invoke).mockResolvedValueOnce('msg-new');

    render(<ChatSession sessionId="sess-1" />);

    // Type and send message
    const input = screen.getByPlaceholderText(/send a message/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(input.closest('form')!);

    // Verify IPC call
    expect(invoke).toHaveBeenCalledWith('session_send_message', {
      sessionId: 'sess-1',
      content: 'Test message',
    });
  });

  it('shows error toast on send failure', async () => {
    useSessionsStore.getState().addSession({
      id: 'sess-1',
      title: 'Test',
      workingDirectory: '/test',
      createdAt: '',
      updatedAt: '',
    });

    vi.mocked(invoke).mockRejectedValueOnce({
      code: 'CLAUDE_CLI_ERROR',
      message: 'CLI crashed',
    });

    render(<ChatSession sessionId="sess-1" />);

    const input = screen.getByPlaceholderText(/send a message/i);
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/CLI crashed/i)).toBeInTheDocument();
    });
  });
});
```

### Service + Mock Integration

```typescript
// tests/integration/sessions-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { sessionsService } from '@/services/sessions';

vi.mock('@tauri-apps/api/core');

describe('sessionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('creates session with valid input', async () => {
      vi.mocked(invoke).mockResolvedValueOnce('sess-new');

      const result = await sessionsService.create({
        workingDirectory: '/test/path',
      });

      expect(invoke).toHaveBeenCalledWith('session_create', {
        workingDirectory: '/test/path',
      });
      expect(result).toBe('sess-new');
    });
  });

  describe('rename', () => {
    it('validates title is not empty', async () => {
      await expect(sessionsService.rename('sess-1', '')).rejects.toThrow(
        'Title cannot be empty'
      );
      expect(invoke).not.toHaveBeenCalled();
    });

    it('validates title length', async () => {
      const longTitle = 'A'.repeat(101);
      await expect(sessionsService.rename('sess-1', longTitle)).rejects.toThrow(
        '100 characters or less'
      );
    });

    it('trims and sends valid title', async () => {
      vi.mocked(invoke).mockResolvedValueOnce(undefined);

      await sessionsService.rename('sess-1', '  New Title  ');

      expect(invoke).toHaveBeenCalledWith('session_rename', {
        sessionId: 'sess-1',
        title: 'New Title',
      });
    });
  });
});
```

---

## E2E Tests

### Setup

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Serial for desktop app
  reporter: [['html'], ['list']],

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'Desktop App',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
```

### Critical Path Tests

```typescript
// tests/e2e/session-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Session Management', () => {
  test('creates new session from browser', async ({ page }) => {
    // Navigate to session browser
    await page.goto('/sessions');

    // Click new session button
    await page.click('[data-testid="new-session-button"]');

    // Fill in directory
    await page.fill('[data-testid="directory-input"]', '/Users/test/project');

    // Submit
    await page.click('[data-testid="create-session"]');

    // Verify navigation to chat
    await expect(page).toHaveURL(/\/session\//);

    // Verify tab created
    await expect(page.locator('[role="tab"]')).toHaveCount(1);
  });

  test('sends message and receives response', async ({ page }) => {
    // Setup: Create session first
    await page.goto('/session/test-sess');

    // Type message
    await page.fill('[data-testid="message-input"]', 'Hello Claude');

    // Send
    await page.press('[data-testid="message-input"]', 'Enter');

    // Verify user message appears
    await expect(page.locator('.message.user')).toContainText('Hello Claude');

    // Wait for response (mocked in test environment)
    await expect(page.locator('.message.assistant')).toBeVisible({
      timeout: 10000,
    });
  });

  test('switches between tabs', async ({ page }) => {
    // Setup: Two sessions open
    await page.goto('/');

    // Click second tab
    await page.click('[role="tab"]:nth-child(2)');

    // Verify active state
    await expect(page.locator('[role="tab"]:nth-child(2)')).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  test('closes tab with middle click', async ({ page }) => {
    await page.goto('/');

    const tabCount = await page.locator('[role="tab"]').count();

    // Middle click first tab
    await page.click('[role="tab"]:first-child', { button: 'middle' });

    // Verify tab removed
    await expect(page.locator('[role="tab"]')).toHaveCount(tabCount - 1);
  });
});

test.describe('Keyboard Navigation', () => {
  test('navigates tabs with arrow keys', async ({ page }) => {
    await page.goto('/');

    // Focus tab bar
    await page.focus('[role="tablist"]');

    // Press right arrow
    await page.keyboard.press('ArrowRight');

    // Verify next tab focused and selected
    await expect(page.locator('[role="tab"]:nth-child(2)')).toBeFocused();
  });

  test('sends message with Cmd+Enter', async ({ page }) => {
    await page.goto('/session/test');

    await page.fill('[data-testid="message-input"]', 'Test message');
    await page.keyboard.press('Meta+Enter');

    await expect(page.locator('.message.user')).toContainText('Test message');
  });

  test('toggles theme with Cmd+Shift+T', async ({ page }) => {
    await page.goto('/');

    const initialTheme = await page.getAttribute('html', 'data-theme');

    await page.keyboard.press('Meta+Shift+T');

    const newTheme = await page.getAttribute('html', 'data-theme');
    expect(newTheme).not.toBe(initialTheme);
  });
});
```

### Accessibility Tests

```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('main view has no a11y violations', async ({ page }) => {
    await page.goto('/session/test');

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });

  test('settings view has no a11y violations', async ({ page }) => {
    await page.goto('/settings');

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });

  test('modal traps focus', async ({ page }) => {
    await page.goto('/');

    // Open modal
    await page.click('[data-testid="new-session-button"]');

    // Tab through modal
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should still be in modal
    const focusedElement = await page.evaluate(() =>
      document.activeElement?.closest('[role="dialog"]')
    );
    expect(focusedElement).not.toBeNull();
  });

  test('error messages are announced', async ({ page }) => {
    await page.goto('/session/test');

    // Trigger error
    await page.fill('[data-testid="message-input"]', '');
    await page.click('[data-testid="send-button"]');

    // Verify aria-live region
    const errorRegion = page.locator('[role="alert"]');
    await expect(errorRegion).toBeVisible();
  });
});
```

---

## Rust Backend Tests

### Unit Tests

```rust
// src-tauri/src/db/sessions.rs
#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(include_str!("../../migrations/001_initial.sql")).unwrap();
        conn
    }

    #[test]
    fn test_create_session() {
        let conn = setup_test_db();

        let id = create(&conn, "/test/path", None, Some("Test Session")).unwrap();

        assert!(id.starts_with("sess_"));
    }

    #[test]
    fn test_get_session_by_id() {
        let conn = setup_test_db();

        let id = create(&conn, "/test/path", None, Some("Test")).unwrap();
        let session = get_by_id(&conn, &id).unwrap();

        assert!(session.is_some());
        assert_eq!(session.unwrap().title, "Test");
    }

    #[test]
    fn test_get_nonexistent_session() {
        let conn = setup_test_db();

        let session = get_by_id(&conn, "nonexistent").unwrap();

        assert!(session.is_none());
    }

    #[test]
    fn test_delete_session() {
        let conn = setup_test_db();

        let id = create(&conn, "/test", None, None).unwrap();
        delete(&conn, &id).unwrap();

        let session = get_by_id(&conn, &id).unwrap();
        assert!(session.is_none());
    }
}
```

### Validation Tests

```rust
// src-tauri/src/validation.rs
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_title_empty() {
        let result = validate_title("");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().code, "INVALID_INPUT");
    }

    #[test]
    fn test_validate_title_too_long() {
        let long_title = "A".repeat(101);
        let result = validate_title(&long_title);
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_title_strips_control_chars() {
        let result = validate_title("Test\x00Title").unwrap();
        assert_eq!(result, "TestTitle");
    }

    #[test]
    fn test_validate_title_trims_whitespace() {
        let result = validate_title("  Test  ").unwrap();
        assert_eq!(result, "Test");
    }

    #[test]
    fn test_validate_working_directory_relative() {
        let result = validate_working_directory("./relative");
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_working_directory_nonexistent() {
        let result = validate_working_directory("/nonexistent/path/12345");
        assert!(result.is_err());
    }
}
```

---

## Test Data & Fixtures

### Mock Data

```typescript
// tests/fixtures/sessions.ts
import type { Session, Message } from '@/types';

export const mockSessions: Session[] = [
  {
    id: 'sess-1',
    title: 'Project Setup',
    workingDirectory: '/Users/test/project-a',
    projectId: 'proj-1',
    createdAt: '2025-01-07T10:00:00Z',
    updatedAt: '2025-01-07T11:30:00Z',
  },
  {
    id: 'sess-2',
    title: 'Bug Fix',
    workingDirectory: '/Users/test/project-a',
    projectId: 'proj-1',
    createdAt: '2025-01-07T09:00:00Z',
    updatedAt: '2025-01-07T09:45:00Z',
  },
];

export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    sessionId: 'sess-1',
    role: 'user',
    content: 'Help me set up a React project',
    timestamp: '2025-01-07T10:00:00Z',
  },
  {
    id: 'msg-2',
    sessionId: 'sess-1',
    role: 'assistant',
    content: "I'll help you set up a React project. Let me create the initial structure...",
    timestamp: '2025-01-07T10:00:15Z',
    toolUsages: [
      { type: 'created', filePath: '/src/App.tsx', timestamp: '2025-01-07T10:00:20Z' },
      { type: 'created', filePath: '/src/index.tsx', timestamp: '2025-01-07T10:00:21Z' },
    ],
  },
];
```

### IPC Mock Helpers

```typescript
// tests/helpers/ipc-mock.ts
import { vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { mockSessions, mockMessages } from '../fixtures/sessions';

export function setupSessionMocks() {
  vi.mocked(invoke).mockImplementation(async (cmd, args) => {
    switch (cmd) {
      case 'session_list':
        return mockSessions;

      case 'session_load':
        const session = mockSessions.find(s => s.id === args?.sessionId);
        const messages = mockMessages.filter(m => m.sessionId === args?.sessionId);
        return { session, messages };

      case 'session_create':
        return `sess-${Date.now()}`;

      case 'session_delete':
        return undefined;

      default:
        throw new Error(`Unmocked IPC command: ${cmd}`);
    }
  });
}
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install

      - run: pnpm test:coverage

      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  rust-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: dtolnay/rust-toolchain@stable

      - uses: Swatinem/rust-cache@v2
        with:
          workspaces: src-tauri

      - run: cargo test
        working-directory: src-tauri

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, rust-tests]
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install

      - run: pnpm exec playwright install --with-deps

      - run: pnpm test:e2e

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Manual Testing Checklist

### Before Each Release

**Core Functionality:**
- [ ] App launches successfully
- [ ] Can create new session
- [ ] Can send message and receive response
- [ ] Can switch between tabs
- [ ] Can close tabs
- [ ] Session persists after restart

**UI/UX:**
- [ ] Dark theme renders correctly
- [ ] Light theme renders correctly
- [ ] Theme switch works
- [ ] All keyboard shortcuts work
- [ ] Tab reordering works
- [ ] Panel resizing works

**Error Handling:**
- [ ] Shows error when CLI not installed
- [ ] Shows error on network failure
- [ ] Retry button works
- [ ] Error toast auto-dismisses

**Accessibility:**
- [ ] Can navigate entire app with keyboard
- [ ] Screen reader announces content changes
- [ ] Focus visible on all interactive elements
- [ ] Color contrast passes WCAG AA

**Performance:**
- [ ] App starts in < 3 seconds
- [ ] UI responsive during message streaming
- [ ] No jank when scrolling long messages

---

## Summary

| Test Type | Count | Coverage | Run Time |
|-----------|-------|----------|----------|
| Unit (Components) | 50+ | 80% | ~10s |
| Unit (Hooks) | 20+ | 90% | ~3s |
| Unit (Stores) | 15+ | 85% | ~2s |
| Unit (Utils) | 20+ | 95% | ~1s |
| Integration | 20-30 | N/A | ~30s |
| E2E | 5-10 | N/A | ~2min |
| Rust | 30+ | 70% | ~10s |
| **Total** | **160+** | **70%+** | **~3min** |
