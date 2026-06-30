# Code Review Notes

Date: 2026-06-30

## Status

The project is ready as a local developer tool.

It is not designed for public hosting because it intentionally reads local files and can open VS Code.

## Verified

- `npm run check` passed.
- `npm run smoke` passed.
- Sensitive string scan found no API keys, tokens, private keys, personal paths, or provider credentials.
- Package dry-run previously showed only source and documentation files are included.

## Strengths

- Small dependency surface: Express only.
- Localhost binding by default.
- Root validation before file operations.
- Optional `ALLOWED_ROOTS`.
- Disk-friendly search defaults.
- True global search result cap.
- Cancel support from browser to backend child process.
- Timing data for performance review.
- Folder browser improves usability.
- Smoke tests cover core APIs.

## Known Limitations

- No persistent search index or KV cache.
- Search still walks the filesystem; very large folders can time out.
- Risk scoring is heuristic, not a full static analyzer.
- Git Risk scans changed file names, not semantic dependency graphs.
- Browser i18n is simple and does not re-render old results when language changes.

## Recommended Future Improvements

1. Add optional SQLite/FlexSearch index for repeated searches.
2. Add progress reporting for very large scans.
3. Add a recent project roots list.
4. Add export/share for search results.
5. Add automated browser tests for the UI.
6. Add GitHub Actions workflow for `npm run check` and `npm run smoke`.
