# User Guide

Codebase Search Assistant is a local browser tool for reviewing code changes and finding usage across large project folders.

## Start The App

```powershell
npm install
npm start
```

Open:

```text
http://127.0.0.1:3123
```

## Select A Project Folder

Use the **Project root folder** field in the sidebar.

Options:

- Type or paste a folder path.
- Click **Browse** to open the native OS folder picker.
- Click **Open** to reveal the selected folder in the OS file manager.
- Click **Use this folder** to set the current folder.
- Click **Save folder** to remember it in browser local storage.

If the native folder picker is unavailable, the app falls back to the built-in folder browser.

## Search

Use the **Search** tab to find keywords, functions, routes, table names, config keys, or file names.

Normal search is disk-friendly:

- Uses one ripgrep thread by default.
- Skips common heavy folders.
- Skips hidden and ignored files.
- Stops after the result cap.
- Returns partial results if timeout is reached.

Use **Deep search** only when you need hidden or ignored files.

## Impact Check

Use **Impact Check** when changing a shared file, function, include, import, route, or keyword.

The tool searches for usage and estimates:

- usage count
- include/import-like references
- affected areas such as frontend, backend, database, auth, config, docs, build
- rough risk level

## Git Risk Check

Use **Git Risk Check** before commit or push.

It runs:

```text
git diff --name-only HEAD
```

Then it scans usage for changed file names and suggests smoke tests.

## Performance Timing

Search, Impact Check, and Git Risk Check show elapsed time in the summary area.

Use this to compare:

- normal search versus Deep search
- broad keyword versus specific keyword
- different project root folders
- timeout and result cap settings

## Cancel

Each long-running action has a **Cancel** button.

Cancel aborts the browser request and asks the backend to stop the running child process.

## Open In VS Code

Search results include **Open VS Code**.

This requires the `code` command to be installed in PATH.

The backend validates that the file is inside the selected project root before opening it.
