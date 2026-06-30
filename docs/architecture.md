# Architecture

The project is intentionally small and local-first.

## Components

The backend is a single Express file. The browser code is a small ES-module
"micro framework": a reactive store is the single source of truth (SSOT), core
modules hold shared concerns, and three components own the topbar / sidebar /
content regions by attaching to the static markup in `index.html`.

| File | Responsibility |
| --- | --- |
| `server.js` | Express server, ripgrep runner (SSE search stream), Git risk logic, folder browsing, VS Code opener, ripgrep auto-install |
| `public/index.html` | Static UI markup + mount points |
| `public/styles.css` | Layout and styling (incl. dark mode) |
| `public/app.js` | Bootstrap: wires i18n to the store, mounts components, global shortcuts, initial config/health load |
| `public/state.js` | The store instance, mutating actions, request registry, shared DOM selectors |
| `public/core/store.js` | Tiny reactive store (`get` / `set` / `subscribe`) — the SSOT engine |
| `public/core/i18n.js` | SSOT for all UI text + tooltip help text; `t()` / `tt()` read the current language from the store |
| `public/core/api.js` | SSOT for every server call, including the SSE stream helper |
| `public/core/storage.js` | SSOT for localStorage keys + history/recent-roots lists |
| `public/core/format.js` | Pure formatters: duration, match highlighting, Copy-for-AI markdown, clipboard |
| `public/core/ui.js` | Badge / summary-toast / inline-error DOM helpers |
| `public/core/dom.js` | `$`, `$$`, `escapeHtml`, `applyI18n` |
| `public/components/topbar.js` | Language switcher, dark-mode toggle, status |
| `public/components/sidebar.js` | Collapse, root + recent roots, folder browser, filters/presets, exclude, rg install |
| `public/components/content.js` | Tabs, streaming search, impact, git risk, history, Copy-for-AI |
| `public/components/settings-modal.js` | Search timeout / max results / max file size editor |
| `public/components/tooltip.js` | Cursor-following tooltip engine |
| `scripts/smoke-test.js` | Local API smoke tests |

### State flow

1. A component reads the current value from the store (or the DOM for local input).
2. User interaction calls an **action** in `state.js`, the only place that mutates shared state (and mirrors it to localStorage).
3. The store notifies subscribers; each component's `update(state)` patches only the slices that changed.

## Request Flow

1. User starts the server with `npm start`.
2. Browser loads static files from `public/`.
3. UI sends API requests to the local Express server.
4. Server validates the selected project root.
5. Server runs local commands such as `rg` or `git`.
6. Server returns structured JSON with results, timing, and truncation state.

## Search Flow

Search uses `ripgrep --json`.

The backend streams JSON output line by line and parses only match events. It stops the child process when the global result limit is reached. This avoids collecting unlimited output and reduces disk pressure.

Search response includes:

- `count`
- `results`
- `modules`
- `durationMs`
- `truncated`
- `timedOut`

## Cancellation

The browser uses `AbortController`.

The backend creates an abort signal from the HTTP request/response lifecycle. If the client cancels or disconnects, the running child process is killed.

## Folder Browser

The main **Browse** button calls `/api/select-folder`, which opens the native OS folder picker when available.

The `/api/browse` endpoint is kept as a fallback and lists directories only.

On Windows, an empty browse request returns available drives such as `C:\` and `D:\`.

When `ALLOWED_ROOTS` is configured, folder browsing is restricted to allowed paths.

The `/api/reveal-folder` endpoint opens the selected project folder in the OS file manager.

## Risk Classification

Risk is heuristic.

High risk is assigned when:

- path contains shared/common/core/security/config hints
- usage count is high

The tool is not a static analyzer. Treat output as guidance for review and smoke testing.
