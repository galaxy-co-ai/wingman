# Conventions

Code style and naming conventions for Wingman.

---

## File Naming

| Type | Convention | Example |
|------|------------|---------|
| Component | PascalCase.tsx | `ChatMessage.tsx` |
| Hook | use-kebab-case.ts | `use-chat-session.ts` |
| Util | kebab-case.ts | `format-date.ts` |
| Type | kebab-case.types.ts | `chat.types.ts` |
| Store | kebab-case.store.ts | `chat.store.ts` |
| Test | *.test.ts(x) | `ChatMessage.test.tsx` |
| Style | kebab-case.css | `chat-message.css` |

---

## Component Conventions

### Structure
```typescript
// 1. Imports (external, internal, relative, types)
// 2. Type definitions (or import from .types.ts)
// 3. Component function
// 4. Export
```

### Naming
- Components: PascalCase (`ChatMessage`)
- Props: `[Component]Props` (`ChatMessageProps`)
- Event handlers: `on[Event]` (`onClick`, `onSubmit`)

---

## Variable Naming

| Type | Convention | Example |
|------|------------|---------|
| Boolean | is/has/should prefix | `isLoading`, `hasError` |
| Array | Plural | `messages`, `sessions` |
| Function | Verb prefix | `getMessage`, `sendMessage` |
| Constant | SCREAMING_SNAKE | `MAX_RETRIES` |

---

## Git Conventions

### Branch Names
- `feature/[description]`
- `fix/[description]`
- `docs/[description]`

### Commit Messages
```
type: short description

Longer description if needed.
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for JS/TS
- **Semicolons**: Yes
- **Trailing commas**: Yes

See `.prettierrc` and `.eslintrc` for full rules.

---

## Import Order

1. External packages (`react`, `@tauri-apps/api`)
2. Internal absolute (`@/stores`, `@/components`)
3. Relative (`./ChatInput`)
4. Types (`import type { ... }`)

---

## Comments

- Use JSDoc for public functions/components
- Avoid obvious comments
- Explain "why", not "what"
