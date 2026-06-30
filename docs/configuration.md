# Configuration

Configuration is controlled by environment variables.

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3123` | HTTP port for the local server |
| `HOST` | `127.0.0.1` | Bind address. Keep localhost for safety |
| `DEFAULT_ROOT` | current working directory | Initial project root shown in the UI |
| `ALLOWED_ROOTS` | empty | Optional root allow-list |
| `COMMAND_TIMEOUT_MS` | `12000` | Max time for command/search work |
| `RG_THREADS` | `1` | ripgrep thread count for normal search |
| `RG_MAX_FILESIZE` | `1M` | Max file size scanned in normal search |
| `GIT_RISK_MAX_FILES` | `20` | Max changed files analyzed by Git Risk |

## Example

```powershell
$env:DEFAULT_ROOT="C:\work\my-project"
$env:ALLOWED_ROOTS="C:\work\my-project"
$env:COMMAND_TIMEOUT_MS="8000"
$env:RG_THREADS="1"
npm start
```

## Multiple Allowed Roots

On Windows, separate roots with `;`:

```powershell
$env:ALLOWED_ROOTS="C:\work\app1;C:\work\app2"
```

## Search Modes

Normal search:

- respects ignore files
- does not include hidden files
- uses `RG_MAX_FILESIZE`
- uses `RG_THREADS`

Deep search:

- includes hidden files
- ignores parent ignore files
- allows larger files
- can use more disk

Use Deep search only when necessary.

## Recommended Defaults For Large Repositories

For folders with hundreds of thousands or millions of files:

```powershell
$env:COMMAND_TIMEOUT_MS="5000"
$env:RG_THREADS="1"
$env:RG_MAX_FILESIZE="512K"
$env:GIT_RISK_MAX_FILES="10"
```

Also select the smallest useful project folder instead of scanning a whole drive.
