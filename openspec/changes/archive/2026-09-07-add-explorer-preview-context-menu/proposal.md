## Why

Start Preview today lives only in the Command Palette. Users who do not know how to run VS Code commands cannot discover the extension from the files they already recognize (`mkdocs.yml`, `properdoc.yml`). A right-click action in the Explorer is the obvious next entry point now that Start/Stop already work.

## What Changes

- Contribute an Explorer context-menu item **Open MKDocs Preview** that appears when the user right-clicks a file named `mkdocs.yml` or `properdoc.yml`.
- Choosing that item starts the existing Docker preview (same Start behavior: mount workspace, serve, open Simple Browser).
- When started from the context menu, use the clicked file as the MkDocs config for that start (`{configFile}` substitution), instead of the `configFileName` setting.
- Command Palette Start Preview is unchanged: it still uses `mkdocsDockerPreview.configFileName`.
- No new settings, no change to Docker image, serve command template, workdir, or port 8000.

## Capabilities

### New Capabilities

- `explorer-preview-menu`: Explorer context menu **Open MKDocs Preview** on `mkdocs.yml` and `properdoc.yml`.

### Modified Capabilities

- `docker-preview-session`: Start Preview MAY be invoked with a selected config file URI; that start MUST use the clicked file as `{configFile}` while still mounting the workspace folder.

## Impact

- `package.json` contributes `explorer/context` (and the menu title).
- `src/extension.ts` registers the start command so it accepts an optional Explorer URI argument.
- `src/previewController.ts` (and tests) pass an override config file name/path into the existing start/validation path.
- README documents the right-click entry point.
- No new npm dependencies. Unit tests mock VS Code URIs and the filesystem; no real Docker.

## Non-goals

- Context menus on other files, folders, editor tabs, or the editor title bar.
- Extra names such as `mkdocs.yaml` or `properdocs.yml` unless they match `mkdocs.yml` / `properdoc.yml` exactly.
- Multi-root workspaces beyond the current first-folder Start behavior.
- Changing Docker image, serve command template, workdir, or port 8000.
- A separate Stop item in the Explorer menu.
- Changing Command Palette titles beyond what is needed for the Explorer label.
