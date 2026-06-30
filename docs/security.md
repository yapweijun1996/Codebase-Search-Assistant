# Security

This is a local developer tool.

## Important Rule

Do not expose this app to the public internet.

The server can:

- read local project files
- list local directories
- open the native folder picker
- open folders in the OS file manager
- run `ripgrep`
- run `git diff`
- open files in VS Code

These capabilities are useful locally but unsafe for public hosting.

## Default Safety Settings

The server binds to:

```text
127.0.0.1
```

This keeps it local to your machine by default.

## Root Validation

Every operation validates the selected root folder.

`/api/open-vscode` also validates that the target file is inside the selected root.

## Allowed Roots

Use `ALLOWED_ROOTS` to restrict the tool to known folders:

```powershell
$env:ALLOWED_ROOTS="C:\work\project-a;C:\work\project-b"
```

This is recommended when sharing the tool with teammates.

## Ignored Local Files

The repository ignores:

- `.env`
- `*.log`
- `*.tgz`
- `.agents/`
- `.codex/`
- `node_modules/`

## Public Repository Checklist

Before publishing:

1. Run `npm run check`.
2. Run `npm run smoke`.
3. Search for sensitive terms with your preferred scanner. For example, review the repository for credential-like words before publishing.

4. Confirm no logs or local archives are present.
5. Confirm `.env` is not committed.
