# Development

## Project Structure

```text
.
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── scripts/
│   └── smoke-test.js
├── docs/
├── server.js
├── package.json
└── README.md
```

## Run Locally

```powershell
npm install
npm start
```

## Checks

Syntax check:

```powershell
npm run check
```

API smoke test:

```powershell
npm run smoke
```

The smoke test starts the server on a temporary port and verifies:

- health endpoint
- search endpoint
- global search result cap
- invalid root behavior
- folder browse endpoint
- cancel behavior

## Coding Guidelines

- Keep the tool local-first.
- Avoid hardcoded personal or company paths.
- Add configuration through environment variables.
- Keep search disk-friendly by default.
- Prefer small, focused APIs.
- Keep dependencies minimal.
- Update docs when behavior changes.

## Adding File Types

Add new default globs in `server.js`:

```js
const DEFAULT_GLOBS = [
  '*.js',
  '*.ts'
];
```

Then add matching checkboxes in `public/index.html`.

## Adding UI Text

Add translation keys to both dictionaries in `public/app.js`.

Static HTML labels should use:

```html
data-i18n="key"
```

Input placeholders should use:

```html
data-i18n-placeholder="key"
```
