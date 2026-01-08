# Troubleshooting

Common issues and solutions.

---

## Build Issues

### "linking with link.exe failed" (Git vs MSVC conflict)
```
error: linking with `link.exe` failed
note: /usr/bin/link: extra operand...
```
**Cause**: Git Bash's `link.exe` is being used instead of MSVC's `link.exe`.

**Solutions**:
1. **Use VS Developer Command Prompt**:
   - Open "Developer Command Prompt for VS 2022"
   - Navigate to project: `cd C:\Users\Owner\workspace\wingman`
   - Run: `pnpm tauri dev`

2. **Or fix PATH temporarily**:
   ```powershell
   $env:PATH = "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.xx.xxxxx\bin\Hostx64\x64;" + $env:PATH
   ```

3. **Or use PowerShell with VS environment**:
   ```powershell
   & "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat" -arch=x64
   pnpm tauri dev
   ```

### "Rust not found"
```
error: rustup could not be found
```
**Solution**: Install Rust via https://rustup.rs/

### "WebView2 not found" (Windows)
```
error: WebView2 runtime not found
```
**Solution**: Install WebView2 from Microsoft or run Windows Update

### "pnpm: command not found"
**Solution**: `npm install -g pnpm`

---

## Development Issues

### "Module not found"
```
Cannot find module '@/components/...'
```
**Solution**: Check path aliases in `tsconfig.json` match actual paths

### Hot reload not working
1. Check if file is saved
2. Check Vite terminal for errors
3. Try restarting `pnpm dev`

### IPC command not found
```
Unhandled promise rejection: invoke() called with unknown command
```
**Solution**:
1. Check command name matches in Rust and TypeScript
2. Ensure command is registered in `main.rs`
3. Rebuild: `pnpm tauri dev`

---

## Runtime Issues

### App opens but blank screen
1. Check browser console for errors
2. Check Rust logs in terminal
3. Verify `pnpm dev` has no errors

### API key not working
1. Check key is correctly saved
2. Verify key has correct permissions
3. Check network connectivity

---

## Performance Issues

### App feels slow
1. Check for console errors
2. Check memory usage in Task Manager
3. Look for expensive renders in React DevTools

### High memory usage
1. Close unused sessions
2. Clear chat history
3. Restart app

---

## Common Commands

```bash
# Clean rebuild
pnpm clean && pnpm install && pnpm dev

# Check Rust compilation
cd src-tauri && cargo check

# Check TypeScript
pnpm tsc --noEmit

# Update dependencies
pnpm update
```

---

*Add new issues and solutions as they're discovered*
