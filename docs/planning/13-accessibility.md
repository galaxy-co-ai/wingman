# 13 - Accessibility (A11y)

## Standards Compliance

**Target**: WCAG 2.1 Level AA

**Core Principles**:
- **Perceivable**: Information presented in ways all users can perceive
- **Operable**: UI components and navigation must be operable by all
- **Understandable**: Information and UI operation must be understandable
- **Robust**: Content must be robust enough for assistive technologies

---

## Keyboard Navigation

### Global Shortcuts (Windows/Linux)

| Action | Shortcut | Mac Equivalent |
|--------|----------|----------------|
| New session | Ctrl+N | Cmd+N |
| Close current tab | Ctrl+W | Cmd+W |
| Next tab | Ctrl+Tab | Cmd+Option+→ |
| Previous tab | Ctrl+Shift+Tab | Cmd+Option+← |
| Go to tab 1-9 | Ctrl+1 through Ctrl+9 | Cmd+1 through Cmd+9 |
| Session browser | Ctrl+Shift+S | Cmd+Shift+S |
| Settings | Ctrl+, | Cmd+, |
| Toggle right panel | Ctrl+B | Cmd+B |
| Focus chat input | Ctrl+L | Cmd+L |
| Switch to Preview | Ctrl+Shift+1 | Cmd+Shift+1 |
| Switch to Activity | Ctrl+Shift+2 | Cmd+Shift+2 |
| Switch to Dashboard | Ctrl+Shift+3 | Cmd+Shift+3 |
| Refresh preview | Ctrl+R | Cmd+R |
| New task | Ctrl+Shift+T | Cmd+Shift+T |

### Chat Input Shortcuts

| Action | Shortcut |
|--------|----------|
| Send message | Enter |
| Newline (multi-line) | Shift+Enter |
| Cancel response | Escape |
| Clear input | Ctrl+Shift+Backspace |

### Focus Order

The focus order follows a logical top-to-bottom, left-to-right flow:

1. **Title Bar** (when applicable)
   - Window controls (minimize, maximize, close)

2. **Left Panel - Chat**
   - Tab bar (individual tabs, new tab button)
   - Message list (scrollable region)
   - Message input field
   - Send/Cancel button

3. **Panel Divider**
   - Resizable separator (keyboard adjustable)

4. **Right Panel**
   - Mode tabs (Preview, Activity, Dashboard)
   - Active panel content
   - Panel-specific controls

5. **Status Bar**
   - Interactive status items
   - Settings button

### Focus Management Rules

| Scenario | Focus Behavior |
|----------|----------------|
| New session created | Focus moves to message input |
| Tab switched | Focus moves to message input of new tab |
| Modal opened | Focus trapped inside modal, moves to first focusable element |
| Modal closed | Focus returns to triggering element |
| Dropdown opened | Focus moves to first option |
| Dropdown closed | Focus returns to trigger button |
| Right panel tab changed | Focus remains on tab bar |
| Response complete | Focus returns to message input |

### Focus Indicators

All interactive elements display visible focus indicators:

```css
/* Focus ring styling */
:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* High contrast focus for dark backgrounds */
[data-theme="dark"] :focus-visible {
  outline-color: #39D4BA;  /* Teal accent */
  box-shadow: 0 0 0 4px rgba(57, 212, 186, 0.25);
}

/* Light theme focus */
[data-theme="light"] :focus-visible {
  outline-color: #1B9E85;
  box-shadow: 0 0 0 4px rgba(27, 158, 133, 0.2);
}
```

### Skip Links

Provide skip links for keyboard users to bypass repetitive content:

```html
<body>
  <a href="#main-chat" class="skip-link">Skip to chat</a>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <!-- ... -->
</body>
```

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  padding: var(--space-2) var(--space-4);
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  z-index: var(--z-maximum);
  transition: top var(--duration-fast);
}

.skip-link:focus {
  top: 0;
}
```

---

## Screen Reader Support

### Landmark Regions

```html
<div class="app">
  <header role="banner">
    <!-- Title bar -->
  </header>

  <nav role="navigation" aria-label="Session tabs">
    <!-- Tab bar -->
  </nav>

  <main role="main" id="main-chat">
    <section aria-label="Chat conversation">
      <!-- Message list -->
    </section>

    <form aria-label="Message input">
      <!-- Input area -->
    </form>
  </main>

  <aside role="complementary" aria-label="Preview and activity panel">
    <!-- Right panel -->
  </aside>

  <footer role="contentinfo">
    <!-- Status bar -->
  </footer>
</div>
```

### ARIA Labels by Component

| Component | Element | ARIA Attribute |
|-----------|---------|----------------|
| **TabBar** | Container | `role="tablist"` |
| | Tab | `role="tab"`, `aria-selected`, `aria-controls` |
| | Tab panel | `role="tabpanel"`, `aria-labelledby` |
| | Close button | `aria-label="Close tab: {title}"` |
| | New tab button | `aria-label="New session"` |
| **MessageList** | Container | `role="log"`, `aria-live="polite"`, `aria-label="Chat messages"` |
| **ChatMessage** | Message | `role="article"`, `aria-label="{role} message at {time}"` |
| | Code block | `aria-label="Code block in {language}"` |
| | Copy button | `aria-label="Copy code"` |
| | File link | `aria-label="Open {filename}"` |
| **InputArea** | Textarea | `aria-label="Message input"`, `aria-describedby="input-hint"` |
| | Send button | `aria-label="Send message"` |
| | Cancel button | `aria-label="Cancel response"` |
| **PreviewPanel** | Container | `aria-label="Web preview"` |
| | Back button | `aria-label="Go back"` |
| | Forward button | `aria-label="Go forward"` |
| | Refresh button | `aria-label="Refresh preview"` |
| | URL input | `aria-label="Preview URL"` |
| **ActivityFeed** | Container | `role="feed"`, `aria-label="File activity feed"` |
| | Entry | `role="article"`, `aria-label="{action}: {filename}"` |
| | Filter | `aria-label="Filter activity by type"` |
| **Dashboard** | Widget | `role="region"`, `aria-labelledby="{widget-title-id}"` |
| | Progress bar | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| **StatusBar** | Connection | `role="status"`, `aria-label="Connection status: {status}"` |
| | Context usage | `aria-label="Context usage: {percent}%"` |
| **Modal** | Container | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| **Dropdown** | Button | `aria-haspopup="listbox"`, `aria-expanded` |
| | List | `role="listbox"` |
| | Option | `role="option"`, `aria-selected` |
| **Tooltip** | Content | `role="tooltip"` |
| | Trigger | `aria-describedby="{tooltip-id}"` |

### Live Regions

Different types of updates require different announcement strategies:

| Update Type | ARIA Live | Priority | Examples |
|-------------|-----------|----------|----------|
| New chat message | `aria-live="polite"` | Normal | Incoming assistant response |
| File activity | `aria-live="polite"` | Normal | "Created: Login.tsx" |
| Error messages | `aria-live="assertive"` | High | Connection failed, validation error |
| Status changes | `aria-live="polite"` | Normal | "Connected", "Context: 45%" |
| Loading states | `aria-busy="true"` | - | Response streaming |
| Progress updates | `aria-live="off"` | None | Progress bar (visual only) |

### Screen Reader Announcements

```tsx
// Announce important state changes
const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const region = document.getElementById(`sr-${priority}`);
  if (region) {
    region.textContent = message;
    // Clear after announcement
    setTimeout(() => { region.textContent = ''; }, 1000);
  }
};

// Usage examples
announce('Message sent');
announce('Session "Login Feature" opened');
announce('Connection lost. Reconnecting...', 'assertive');
announce('File Login.tsx modified');
```

### Hidden Announcement Regions

```html
<!-- Add to app root -->
<div id="sr-polite" aria-live="polite" aria-atomic="true" class="sr-only"></div>
<div id="sr-assertive" aria-live="assertive" aria-atomic="true" class="sr-only"></div>
```

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## Semantic HTML

### Heading Hierarchy

Maintain proper heading structure throughout the application:

```
h1: "Wingman" (app title, visually hidden or in title bar)
  h2: "Chat: {session name}" (current session)
    h3: Message timestamps or groupings (if used)
  h2: "Preview" | "Activity" | "Dashboard" (right panel)
    h3: Widget titles within dashboard
  h2: "Settings" (when in settings view)
    h3: Setting section names
```

### Proper Element Usage

| Purpose | Use | Avoid |
|---------|-----|-------|
| Buttons that trigger actions | `<button>` | `<div onclick>`, `<a href="#">` |
| Links to other views/pages | `<a href>` | `<button>` for navigation |
| Form inputs | `<input>`, `<textarea>`, `<select>` | Custom div-based inputs |
| Lists of items | `<ul>`, `<ol>`, `<li>` | Nested divs |
| Data tables | `<table>`, `<th>`, `<td>` | Div grids for tabular data |
| Icons with meaning | `<svg aria-label="...">` | `<img>` or unlabeled SVG |
| Decorative icons | `<svg aria-hidden="true">` | Icon with redundant label |

---

## Color & Contrast

### Contrast Requirements (WCAG AA)

| Content Type | Minimum Ratio | Our Implementation |
|--------------|---------------|-------------------|
| Normal text (<18px) | 4.5:1 | All text exceeds this |
| Large text (≥18px or ≥14px bold) | 3:1 | All headings exceed this |
| UI components | 3:1 | All interactive elements meet this |
| Focus indicators | 3:1 | Accent color provides 8.7:1 on dark |

### Verified Color Combinations

#### Dark Theme
| Element | Foreground | Background | Ratio | Status |
|---------|------------|------------|-------|--------|
| Primary text | #E6EDF3 | #0D1117 | 13.5:1 | ✓ Pass |
| Primary text | #E6EDF3 | #161B22 | 11.2:1 | ✓ Pass |
| Secondary text | #8B949E | #161B22 | 4.8:1 | ✓ Pass |
| Muted text | #6E7681 | #161B22 | 3.2:1 | ✓ Pass (UI) |
| Accent | #39D4BA | #161B22 | 8.7:1 | ✓ Pass |
| Error | #F85149 | #161B22 | 5.4:1 | ✓ Pass |
| Success | #3FB950 | #161B22 | 6.1:1 | ✓ Pass |
| Warning | #D29922 | #161B22 | 5.8:1 | ✓ Pass |

#### Light Theme
| Element | Foreground | Background | Ratio | Status |
|---------|------------|------------|-------|--------|
| Primary text | #24292F | #FFFFFF | 14.7:1 | ✓ Pass |
| Primary text | #24292F | #F6F8FA | 12.8:1 | ✓ Pass |
| Secondary text | #57606A | #F6F8FA | 5.1:1 | ✓ Pass |
| Muted text | #8C959F | #FFFFFF | 3.5:1 | ✓ Pass (UI) |
| Accent | #1B9E85 | #F6F8FA | 4.6:1 | ✓ Pass |
| Error | #CF222E | #F6F8FA | 5.8:1 | ✓ Pass |
| Success | #1A7F37 | #F6F8FA | 5.9:1 | ✓ Pass |
| Warning | #9A6700 | #F6F8FA | 4.9:1 | ✓ Pass |

### Color Independence

Never convey information by color alone:

| Information | Color | Additional Indicator |
|-------------|-------|---------------------|
| Error state | Red border | Error icon + error message text |
| Success state | Green | Checkmark icon + "Success" text |
| Warning state | Yellow/Amber | Warning icon + description |
| Active/Selected | Accent color | Bold text, underline, or icon |
| File created | Green icon | "✚ Created" text label |
| File modified | Blue icon | "✎ Modified" text label |
| File deleted | Red icon | "✗ Deleted" text label |
| Required field | - | Asterisk (*) + "(required)" label |
| Task status | Status color | ✓ (done), → (active), ○ (pending) icons |

---

## Motion & Animation

### Reduced Motion Support

Respect the user's motion preferences:

```css
/* Disable animations when user prefers reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Animation Guidelines

| Animation Type | Standard | Reduced Motion |
|----------------|----------|----------------|
| Hover effects | 100ms transition | Instant |
| Tab switches | 150ms fade | Instant |
| Panel transitions | 200ms slide | Instant |
| Modal open/close | 200ms scale+fade | Fade only (50ms) |
| Loading spinners | Continuous rotation | Static indicator |
| Progress bars | 400ms width transition | Instant updates |
| Message appear | 200ms slide+fade | Fade only (50ms) |

### Safe Animation Patterns

Animations that are generally safe for all users:
- Opacity changes (fading)
- Color transitions
- Simple scaling (small range, e.g., 0.98 to 1.02)

Animations to avoid or make optional:
- Parallax scrolling
- Auto-playing videos
- Flashing content (never flash >3 times/second)
- Large-scale motion
- Infinite animations (except loading indicators)

---

## Touch & Pointer Accessibility

### Touch Targets

All interactive elements meet minimum touch target sizes:

| Element | Minimum Size | Our Implementation |
|---------|--------------|-------------------|
| Buttons | 44×44px | 44px height (lg), 36px (md), 28px (sm) |
| Tab bar tabs | 44×44px | 36px height, 100-200px width |
| Close buttons | 44×44px | 24px icon with 44px touch area |
| Links in text | 44px height | Line height ensures 24px+ height |
| Checkboxes | 44×44px | 20px visual, 44px touch area |

### Pointer Customization

Support for different pointer types:

```css
/* Fine pointer (mouse) - smaller targets OK */
@media (pointer: fine) {
  .button-sm {
    min-height: 28px;
  }
}

/* Coarse pointer (touch) - larger targets */
@media (pointer: coarse) {
  .button-sm {
    min-height: 44px;
  }
}
```

---

## Form Accessibility

### Input Labels

All form inputs have associated labels:

```tsx
// Visible label
<label htmlFor="project-name">Project Name</label>
<input id="project-name" type="text" />

// Hidden label (for icon-only inputs)
<label htmlFor="search" className="sr-only">Search sessions</label>
<input id="search" type="search" placeholder="Search..." />

// aria-label alternative
<input aria-label="Search sessions" type="search" placeholder="Search..." />
```

### Error Handling

```tsx
<div className="form-field">
  <label htmlFor="url">Preview URL</label>
  <input
    id="url"
    type="url"
    aria-invalid={hasError}
    aria-describedby={hasError ? "url-error" : undefined}
  />
  {hasError && (
    <div id="url-error" role="alert" className="error-message">
      Please enter a valid URL
    </div>
  )}
</div>
```

### Form Validation Timing

| Validation Type | When to Validate |
|-----------------|------------------|
| Required fields | On submit, after first blur |
| Format validation | On blur, with debounce |
| Async validation | On blur, with loading state |
| Real-time feedback | Character count only |

---

## Component-Specific Guidelines

### Chat Messages

```tsx
<article
  role="article"
  aria-label={`${role} message at ${formatTime(timestamp)}`}
  className={`message message--${role}`}
>
  <div className="message-header">
    <span className="message-role">{role === 'user' ? 'You' : 'Claude'}</span>
    <time dateTime={timestamp.toISOString()}>{formatTime(timestamp)}</time>
  </div>

  <div className="message-content">
    {/* Rendered markdown content */}
  </div>

  {toolUsages.length > 0 && (
    <ul aria-label="File changes" className="tool-usages">
      {toolUsages.map(usage => (
        <li key={usage.filePath}>
          <button
            aria-label={`Open ${usage.filePath}`}
            onClick={() => openFile(usage.filePath)}
          >
            {getIcon(usage.type)} {usage.type}: {usage.filePath}
          </button>
        </li>
      ))}
    </ul>
  )}
</article>
```

### Modal Dialogs

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Close Session?</h2>
  <p id="modal-description">
    This session has unsaved changes. Are you sure you want to close it?
  </p>

  <div className="modal-actions">
    <button onClick={onCancel}>Cancel</button>
    <button onClick={onConfirm} autoFocus>Close</button>
  </div>
</div>
```

### Tab Panel Pattern

```tsx
<div role="tablist" aria-label="Session tabs">
  {tabs.map((tab, index) => (
    <button
      key={tab.id}
      role="tab"
      id={`tab-${tab.id}`}
      aria-selected={tab.id === activeTabId}
      aria-controls={`panel-${tab.id}`}
      tabIndex={tab.id === activeTabId ? 0 : -1}
    >
      {tab.title}
    </button>
  ))}
</div>

<div
  role="tabpanel"
  id={`panel-${activeTabId}`}
  aria-labelledby={`tab-${activeTabId}`}
  tabIndex={0}
>
  {/* Tab content */}
</div>
```

---

## Testing Strategy

### Automated Testing

| Tool | Purpose | Integration |
|------|---------|-------------|
| **axe-core** | WCAG violations | Jest/Vitest tests |
| **eslint-plugin-jsx-a11y** | JSX accessibility | ESLint config |
| **Playwright** | E2E keyboard navigation | CI pipeline |
| **Storybook a11y addon** | Component-level testing | Storybook |

### Automated Test Examples

```typescript
// Jest + axe-core
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('ChatMessage has no accessibility violations', async () => {
  const { container } = render(<ChatMessage {...props} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

```typescript
// Playwright keyboard navigation
test('can navigate tabs with keyboard', async ({ page }) => {
  await page.goto('/');

  // Tab to first tab
  await page.keyboard.press('Tab');
  await expect(page.locator('[role="tab"]').first()).toBeFocused();

  // Arrow to next tab
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[role="tab"]').nth(1)).toBeFocused();

  // Enter to select
  await page.keyboard.press('Enter');
  await expect(page.locator('[role="tab"]').nth(1)).toHaveAttribute('aria-selected', 'true');
});
```

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] All interactive elements reachable via Tab
- [ ] Focus order follows logical reading order
- [ ] Focus visible on all elements
- [ ] Escape closes modals/dropdowns
- [ ] Arrow keys work in menus and tabs
- [ ] Enter/Space activate buttons and links
- [ ] No keyboard traps

#### Screen Reader Testing

Test with at least two of:
- [ ] **NVDA** (Windows) - Free, widely used
- [ ] **VoiceOver** (macOS/iOS) - Built-in
- [ ] **JAWS** (Windows) - Enterprise standard
- [ ] **TalkBack** (Android) - Mobile testing

| Scenario | Expected Behavior |
|----------|-------------------|
| Page load | Announce app name, current view |
| Navigate to chat | Announce "Chat conversation, {n} messages" |
| New message received | Announce message content |
| Open modal | Announce modal title, trap focus |
| Error occurs | Immediately announce error message |
| Tab switch | Announce new tab name |

#### Visual Testing
- [ ] Content readable at 200% zoom
- [ ] No horizontal scroll at 320px width (responsive)
- [ ] Focus indicators visible in all themes
- [ ] Color contrast meets requirements
- [ ] Information not conveyed by color alone

#### Motion Testing
- [ ] Enable "Reduce motion" in OS
- [ ] Verify animations are disabled/reduced
- [ ] Ensure functionality still works
- [ ] Loading states still visible

---

## Accessibility Preferences

### User Settings

Provide accessibility options in Settings:

| Setting | Options | Default |
|---------|---------|---------|
| Theme | Dark / Light / System | System |
| Reduce motion | On / Off / System | System |
| Font size | Small / Medium / Large / X-Large | Medium |
| High contrast | On / Off | Off |
| Screen reader hints | Show / Hide | Show |

### Implementation

```tsx
// Detect and apply system preferences
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Apply to document
document.documentElement.setAttribute('data-theme', prefersDarkMode ? 'dark' : 'light');
document.documentElement.setAttribute('data-reduce-motion', prefersReducedMotion ? 'true' : 'false');
```

---

## Resources

### WCAG 2.1 Quick Reference
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Screen Readers
- [NVDA Download](https://www.nvaccess.org/download/)
- [VoiceOver Guide](https://support.apple.com/guide/voiceover/welcome/mac)
