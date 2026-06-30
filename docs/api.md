# API Reference

All APIs are local and return JSON.

## `GET /api/health`

Returns runtime and ripgrep availability.

Response fields:

- `ok`
- `platform`
- `node`
- `host`
- `defaultRoot`
- `allowedRootsEnabled`
- `rgAvailable`
- `rgVersion`

## `GET /api/config`

Returns frontend startup configuration.

Response fields:

- `defaultRoot`
- `allowedRootsEnabled`
- `defaultGlobs`

## `POST /api/browse`

Lists directories for folder selection.

Request:

```json
{
  "root": "C:\\path\\to\\folder"
}
```

Use an empty `root` to list available drives on Windows.

Response fields:

- `path`
- `parent`
- `entries`

## `POST /api/select-folder`

Opens the native OS folder picker and returns the selected path.

Request:

```json
{
  "root": "C:\\path\\to\\current\\folder"
}
```

Response fields:

- `path`
- `canceled`

If the OS picker is not available, the UI falls back to `/api/browse`.

## `POST /api/reveal-folder`

Opens the selected folder in the OS file manager.

Request:

```json
{
  "root": "C:\\path\\to\\project"
}
```

The folder must exist and pass root validation.

## `POST /api/search`

Runs keyword search.

Request:

```json
{
  "root": "C:\\path\\to\\project",
  "query": "calculateAmount",
  "globs": ["*.js", "*.ts"],
  "caseSensitive": false,
  "context": 0,
  "maxResults": 300,
  "deepSearch": false
}
```

Response fields:

- `count`
- `results`
- `modules`
- `durationMs`
- `truncated`
- `timedOut`
- `message`

## `POST /api/impact`

Searches references for a file, function, include, import, or keyword.

Request:

```json
{
  "root": "C:\\path\\to\\project",
  "target": "auth.js",
  "globs": ["*.js", "*.ts"]
}
```

Response fields:

- `target`
- `usageCount`
- `includeCount`
- `modules`
- `risk`
- `results`
- `includeResults`
- `durationMs`
- `truncated`

## `POST /api/git-risk`

Analyzes changed files from Git.

Request:

```json
{
  "root": "C:\\path\\to\\project",
  "globs": ["*.js", "*.ts"]
}
```

Response fields:

- `changedCount`
- `scannedCount`
- `truncated`
- `durationMs`
- `files`

## `POST /api/open-vscode`

Opens a file in VS Code.

Request:

```json
{
  "root": "C:\\path\\to\\project",
  "filePath": "C:\\path\\to\\project\\src\\app.js",
  "lineNumber": 12
}
```

The file must exist and must be inside the selected root folder.
