## Why

Start Preview always loads the site root, even when the user is editing a markdown page under the docs directory. Switching files does not move the preview, so you must click the nav by hand to see the page you are writing. That is extra work on every edit session.

## What Changes

- After the preview is live, open the MkDocs page that corresponds to the active markdown file under the configured docs directory (not always `/`).
- While a preview is running, follow the active editor continuously: when the user switches to another docs markdown file, navigate the preview to that page.
- If the active tab is not markdown, is outside the docs directory, or the mapped URL is not a real served page, keep the last preview page and write an Output-channel info line (missing page only).
- Add a workspace/user setting for the docs directory so repos that do not use `docs/` still work. Default remains `docs`.

## Capabilities

### New Capabilities

- `preview-editor-sync`: Map the active docs markdown file to a live preview URL, follow editor tab changes, keep the last page when there is no matching served page, and log that miss.

### Modified Capabilities

- `preview-browser`: First live load (new start and reuse) MUST use the page for the current docs markdown file when one exists, not always the site root.
- `preview-settings`: New setting for the docs directory (relative to the workspace root). Default `docs`.
- `preview-output-log`: Log an info line when a mapped preview page does not exist so the iframe is left unchanged.

## Impact

- `src/` preview controller, webview `showLive` path, and `extension.ts` editor-change subscription.
- New injectable seams: docs-dir + active-editor path, markdown-to-preview-path mapper, HTTP existence probe (mocked in unit tests — no real network).
- `package.json` setting `mkdocsDockerPreview.docsDir`.
- README: preview follows the active docs markdown file; missing pages stay put and are logged.
- Docker image, serve command, workdir, and port 8000 stay unchanged.

## Non-goals

- Bidirectional sync (clicking the preview does not open the markdown file).
- Parsing `mkdocs.yml` for `docs_dir` or `use_directory_urls`.
- Explorer context menu on markdown files.
- Scroll-position sync between editor and preview.
- Recreating a closed preview tab when the editor changes.
- Revealing or stealing focus of the preview tab on every editor switch.
