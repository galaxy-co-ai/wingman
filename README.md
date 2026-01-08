<div align="center">

# Wingman

**A beautiful desktop GUI for Claude Code**

[![Release](https://img.shields.io/github/v/release/galaxy-co-ai/wingman?style=flat-square)](https://github.com/galaxy-co-ai/wingman/releases)
[![Build](https://img.shields.io/github/actions/workflow/status/galaxy-co-ai/wingman/release.yml?style=flat-square)](https://github.com/galaxy-co-ai/wingman/actions)
[![License](https://img.shields.io/github/license/galaxy-co-ai/wingman?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue?style=flat-square)]()

[Download](#download) • [Features](#features) • [Screenshots](#screenshots) • [Development](#development)

</div>

---

## What is Wingman?

Wingman wraps [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (Anthropic's CLI for Claude) with a native desktop interface. Chat with Claude, see code changes in real-time, and manage multiple projects—all without leaving your editor.

## Features

- **Live Code Preview** — Watch your code render as Claude writes it. Supports React, HTML, CSS, and more.
- **Multi-Session Management** — Run multiple Claude conversations simultaneously. Switch contexts instantly.
- **Project Dashboard** — Track tasks, sprints, and milestones. Built-in project management for your codebase.
- **Native Performance** — Built with Tauri for minimal resource usage. Fast startup, low memory footprint.
- **Privacy First** — Everything runs locally. No telemetry, no data collection. Direct connection to Claude API.

## Download

| Platform | Download |
|----------|----------|
| **Windows** | [Wingman_0.1.0_x64.msi](https://github.com/galaxy-co-ai/wingman/releases/latest) |
| **macOS (Apple Silicon)** | [Wingman_0.1.0_aarch64.dmg](https://github.com/galaxy-co-ai/wingman/releases/latest) |
| **macOS (Intel)** | [Wingman_0.1.0_x64.dmg](https://github.com/galaxy-co-ai/wingman/releases/latest) |
| **Linux** | [Wingman_0.1.0_amd64.AppImage](https://github.com/galaxy-co-ai/wingman/releases/latest) |

> **Note:** Wingman requires [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) to be installed and authenticated.

### First Launch

- **macOS:** Right-click the app and select "Open" to bypass Gatekeeper
- **Windows:** Click "More info" → "Run anyway" if SmartScreen appears

## Screenshots

<div align="center">
<i>Screenshots coming soon</i>
</div>

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Zustand |
| Backend | Rust, Tauri 2, SQLite (sqlx) |
| Styling | CSS Modules |
| File Watching | notify crate |

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Rust](https://rustup.rs/) 1.75+
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)

### Setup

```bash
# Clone the repository
git clone https://github.com/galaxy-co-ai/wingman.git
cd wingman

# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev
```

### Build

```bash
# Build for production
pnpm tauri build
```

## Project Structure

```
wingman/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── stores/             # Zustand state management
│   ├── hooks/              # Custom React hooks
│   └── styles/             # CSS modules
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── claude/         # Claude CLI integration
│   │   ├── services/       # Database & file services
│   │   └── commands/       # Tauri IPC commands
│   └── Cargo.toml
└── landing/                # Landing page (Next.js)
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with care by [Galaxy Co AI](https://github.com/galaxy-co-ai)

</div>
