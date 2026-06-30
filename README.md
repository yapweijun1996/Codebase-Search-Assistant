# Codebase Search Assistant

Local browser-based codebase search and impact review tool for large projects. It uses `ripgrep` for fast search, adds disk-friendly limits for very large folders, and provides a small UI for search, impact checks, Git risk review, and opening matches in VS Code.

This is a local developer tool. Do not expose it to the public internet.

## Features

- Search any local project folder with `ripgrep`.
- Browse and select project folders with the native OS folder picker.
- Open the selected project folder in the OS file manager.
- Filter common source file types.
- Cancel long-running Search, Impact Check, and Git Risk Check actions.
- Show elapsed time for performance review.
- Return partial results when a timeout is reached.
- Open matched files directly in VS Code.
- English and Chinese UI.
- Smoke tests for API health, search, browsing, invalid roots, and cancel behavior.

## Requirements

- Node.js 18 or newer
- `ripgrep` available as `rg`
- VS Code `code` command in `PATH` if you want Open VS Code support

Install ripgrep on Windows:

```powershell
winget install BurntSushi.ripgrep.MSVC
```

## Quick Start

```powershell
npm install
npm start
```

Open:

```text
http://127.0.0.1:3123
```

By default, the project root is the folder where the server starts. You can also choose a folder from the UI with **Browse**.

## Common Commands

```powershell
npm start
npm run check
npm run smoke
```

## Configuration

Configuration is via environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3123` | Local server port |
| `HOST` | `127.0.0.1` | Bind address |
| `DEFAULT_ROOT` | current working directory | Initial project folder |
| `ALLOWED_ROOTS` | empty | Optional path allow-list, separated by `;` on Windows |
| `COMMAND_TIMEOUT_MS` | `12000` | Search/process timeout |
| `RG_THREADS` | `1` | ripgrep worker threads |
| `RG_MAX_FILESIZE` | `1M` | Max file size for normal search |
| `GIT_RISK_MAX_FILES` | `20` | Max changed files scanned in Git Risk |

Example:

```powershell
$env:DEFAULT_ROOT="C:\path\to\your\project"
$env:ALLOWED_ROOTS="C:\path\to\your\project"
npm start
```

## Documentation

- [User Guide](docs/user-guide.md)
- [Configuration](docs/configuration.md)
- [Architecture](docs/architecture.md)
- [API Reference](docs/api.md)
- [Security](docs/security.md)
- [Development](docs/development.md)
- [Code Review Notes](docs/code-review.md)

## Public Release Notes

The repository has been checked for common sensitive strings such as API keys, tokens, personal paths, and provider credentials. Runtime logs, local agent folders, environment files, `node_modules`, and generated tarballs are ignored.

Before publishing, initialize a clean Git repository if needed:

```powershell
git init
git add .
git commit -m "Initial public release"
```

## License

MIT
