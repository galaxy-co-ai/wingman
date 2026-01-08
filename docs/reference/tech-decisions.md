# Tech Decisions

Quick reference for why we chose each technology.

---

## Framework: Tauri v2

**Why**: Lightweight, small bundle size, Rust backend for performance.

**Alternatives Considered**:
- Electron: Too heavy for a developer tool
- Native: Too much platform-specific code

**Trade-offs**: Need to learn Rust, smaller ecosystem

---

## Frontend: React + TypeScript

**Why**: Component model fits UI, strong typing, large ecosystem.

**Alternatives Considered**:
- Vue: Less familiar, smaller ecosystem
- Solid: Too new, less tooling

---

## State Management: [TBD]

**Why**: [TBD]

**Alternatives Considered**:
- [TBD]

---

## Styling: [TBD]

**Why**: [TBD]

**Alternatives Considered**:
- [TBD]

---

## Build Tool: Vite

**Why**: Fast, modern, great DX, built-in TypeScript support.

---

## Package Manager: pnpm

**Why**: Fast, efficient disk usage, strict dependency resolution.

---

*Add new decisions as they're made. Full decision context in doc 18.*
