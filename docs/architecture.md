# Architecture

The project is intentionally small and local-first.

## Components

| File | Responsibility |
| --- | --- |
| `server.js` | Express server, ripgrep runner, Git risk logic, folder browsing, VS Code opener |
| `public/index.html` | Static UI structure |
| `public/app.js` | Browser UI behavior, i18n, API calls, cancel handling |
| `public/styles.css` | Layout and styling |
| `scripts/smoke-test.js` | Local API smoke tests |

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
