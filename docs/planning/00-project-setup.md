# 00 - Project Setup

## Environment Requirements

### Node.js
- **Version**: 22.19.0
- **Install**: https://nodejs.org/

### Rust
- **Version**: 1.92.0
- **Install**: https://rustup.rs/

### pnpm
- **Version**: 10.15.1+
- **Install**: `npm install -g pnpm`

### OS-Specific Prerequisites
- **Windows**: Visual Studio Build Tools 2022, WebView2
- **macOS**: Xcode Command Line Tools
- **Linux**: webkit2gtk, build-essential

### IMPORTANT: Windows PATH Issue
On Windows with Git Bash, there's a conflict between Git's `link.exe` and MSVC's `link.exe`.

**Solution**: Run Tauri commands from **VS Developer Command Prompt** instead of regular terminal:
1. Open "Developer Command Prompt for VS 2022" from Start Menu
2. Navigate to project directory
3. Run `pnpm tauri dev`

See `docs/reference/troubleshooting.md` for more options.

---

## Bootstrap Commands

### Step 1: Clone/Navigate to Project
```bash
cd C:\Users\Owner\workspace\wingman
```

### Step 2: Install Dependencies
```bash
pnpm install
```

### Step 3: Verify Setup
```bash
node --version    # Should show v22.x
rustc --version   # Should show 1.92+
pnpm --version    # Should show 10.x+
```

### Step 4: First Run (Use VS Developer Command Prompt!)
```bash
pnpm tauri dev
```

---

## IDE Setup

### Required VSCode Extensions
- [ ] Rust Analyzer
- [ ] Tauri
- [ ] ESLint
- [ ] Prettier
- [ ] TypeScript

### settings.json Overrides
```json
{
  [TBD]
}
```

---

## Verification Checklist

- [ ] Node version matches requirement
- [ ] Rust compiles (`cargo --version`)
- [ ] pnpm works (`pnpm --version`)
- [ ] `pnpm dev` starts without errors
- [ ] Tauri window opens
- [ ] Hot reload works (edit a file, see change)
