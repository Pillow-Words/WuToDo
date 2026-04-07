# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
# Development (starts Vite dev server + Tauri app)
npx tauri dev

# Production build (NSIS installer for Windows)
npx tauri build

# Frontend only (no Tauri shell)
npm run dev        # Vite dev server on port 1420
npm run build      # vue-tsc --noEmit && vite build
```

Rust backend lives in `src-tauri/`. Tauri's `beforeDevCommand` auto-runs `npm run dev`, so `npx tauri dev` is the single command needed.

## Architecture

**Dual-window Tauri 2 app** — a tiny trigger strip and a larger panel window, solving the problem that a single transparent window would intercept clicks on the desktop.

| Window | Size | Purpose |
|--------|------|---------|
| `trigger` | 200×10 px | Always-visible bar at screen top-right edge. Emits `trigger-enter` event on mouseenter. |
| `panel` | 360×500 px | Todo panel, hidden by default. Slides down via CSS `translateY` on trigger hover, collapses 400ms after mouseleave. |

Both windows: frameless, always-on-top, skip-taskbar, initially hidden (positioned in `lib.rs` setup hook, then trigger is shown).

**Why CSS animation, not Tauri IPC resize?** Calling `setSize`/`setPosition` per frame causes IPC overhead and jank. CSS `transform + transition` runs at 60fps within the webview.

### Event flow

1. `trigger.ts`: mouseenter on strip → `emit("trigger-enter")`
2. `useWindowSlide.ts`: listens for event → `panel.show()` + sets `expanded = true` (CSS slides panel down)
3. Panel mouseleave → 400ms debounce → `expanded = false` → after 250ms transition → `panel.hide()`

### Data flow

- `useTodos.ts`: single reactive `todos` ref shared across components, CRUD functions, auto-saves via `tauri-plugin-store` with 500ms debounce to `%APPDATA%/com.wutodo.app/todos.json`
- `useWindowSlide.ts`: module-level singleton state (not per-component)

### Vite multi-page setup

Two HTML entry points: `index.html` (panel/Vue app) and `trigger.html` (plain TS, no Vue). Configured in `vite.config.ts` rollupOptions.input.

## Key Conventions

- **Language**: UI text is in Chinese (e.g., tray menu: "显示面板", "退出")
- **Window positioning**: Always use `LogicalPosition`/`LogicalSize` for DPI scaling support
- **Monitor detection**: Use `app.primary_monitor()` with fallback to `available_monitors().next()`; avoid `window.current_monitor()` which can return None before window is shown
- **Trigger window**: Must NOT have `transparent: true` in tauri.conf.json (causes invisibility on Windows); panel DOES use transparent
