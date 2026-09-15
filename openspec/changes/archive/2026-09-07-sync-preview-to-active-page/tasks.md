## 1. Docs directory setting (TDD)

- [x] 1.1 Write failing tests in `tests/previewSettings.test.ts`: default `docsDir` is `docs`; a custom value is returned as-is; empty or whitespace-only is treated as `docs`
- [x] 1.2 Add `docsDir` to settings read/normalize and to `package.json` (`mkdocsDockerPreview.docsDir`, default `docs`) until those tests pass

## 2. Markdown path → URL candidates (TDD)

- [x] 2.1 Write failing tests in `tests/` for a pure mapper: `docs/page.md` → `/page.html` and `/page/`; `docs/index.md` → `/` and `/index.html`; nested `index.md` and nested pages; custom docs dir; non-`.md`, outside docs dir, and missing workspace → `undefined`; Windows separators become posix site paths
- [x] 2.2 Implement the mapper under `src/` until those tests pass (no vscode, no HTTP)

## 3. Preview view seams (TDD)

- [x] 3.1 Extend the fake `PreviewView` in `tests/previewController.test.ts` with `isOpen()` and `showLive(url, options?)`; write failing tests that existing start/reuse still `showLive` with reveal (or default reveal) and that follow can call `showLive` with `reveal: false`
- [x] 3.2 Update `PreviewView` / `previewPanel.ts` so `showLive` accepts optional `{ reveal?: boolean }` (default true), `isOpen()` reflects whether the webview panel exists, and follow does not recreate a disposed panel, until those tests pass

## 4. Controller: page-aware live URL and follow (TDD)

- [x] 4.1 Write failing controller tests: after serve-ready, active `docs/a.md` and probe true for a candidate → `showLive` that page URL (not only the base); all candidates false → INFO missing-page log, last `showLive` stays the base URL, no error toast; non-markdown or outside docs dir → no extra `showLive` and no missing-page log; `syncToActiveEditor` / editor-change to another existing page → `showLive` with `reveal: false`; `isOpen()` false → no `showLive`; reuse Start uses the active page when the probe succeeds; a slower probe for an older editor must not override a newer one
- [x] 4.2 Inject `getActiveEditorPath`, `PageProbe`, and `isOpen` into `PreviewController`; implement `syncToActiveEditor` (generation token, candidate probe, INFO on miss, skip identical URL) and call it after first live and on editor change, until those tests pass. Mock the probe; never hit a real network

## 5. Production probe, wiring, docs

- [x] 5.1 Implement the production `PageProbe` (HTTP GET to localhost, short timeout, 2xx = exists) under `src/` with a seam tests can avoid; no unit test should call a real server
- [x] 5.2 Wire `extension.ts`: read `docsDir` via existing config reader; pass `activeTextEditor` path; subscribe to `onDidChangeActiveTextEditor` and call the controller while the session is running
- [x] 5.3 Update README: preview follows the active markdown file under the docs directory setting; missing pages stay on the last page and log INFO; mention `mkdocsDockerPreview.docsDir`
- [x] 5.4 Run the full unit-test suite (`npm test`) and fix until green

## 6. site_url path prefix

- [x] 6.1 Prefix preview page URLs with the pathname from `site_url` in the MkDocs config (line parse only) so pages like `/somedocs/mkdocs/stands.html` resolve; verify unit tests for the parser and controller
