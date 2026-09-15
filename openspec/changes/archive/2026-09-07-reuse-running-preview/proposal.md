## Why

Closing the Simple Browser tab does not stop the Docker serve container. Running Start Preview again currently restarts: it stops that container and starts a new one. Accidental tab close plus Start again therefore churns containers, can briefly leave two running, and is slower than just reopening the preview URL. The Explorer item is also named **Open MkDocs Preview** while the palette command is **Start Preview**, so the same action looks like two different commands.

## What Changes

- **BREAKING:** Start Preview (palette and Explorer) MUST NOT start a second container when a preview is already running for this VS Code window. It MUST reopen Simple Browser at the existing preview URL instead of stop+start.
- Guarantee at most one preview container per VS Code window. Stop Preview remains the way to tear down; a later Start then creates a new container.
- Align the user-visible command name: Explorer context menu and Command Palette both use **Start Preview** (palette still prefixed with the extension category).
- README: Start reuses a running session; Explorer item name matches the palette command.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `docker-preview-session`: Replace restart-on-Start with reuse-on-Start; one preview container per VS Code window.
- `preview-browser`: Opening Simple Browser when Start is invoked against an already-running session (existing URL, no new container).
- `explorer-preview-menu`: Explorer item title becomes **Start Preview**; choosing it while a preview is running reopens the browser like palette Start.

## Impact

- `src/previewController.ts` and `src/previewSession.ts`: Start short-circuits when `running` (reuse URL, skip `docker run`).
- `src/previewController.test.ts` / `src/previewSession.test.ts`: replace restart-on-second-Start tests with reuse tests.
- `package.json` command titles (and possibly `category`); `src/extension.ts` only if wiring must share one title.
- README command list and try-out steps.
- Unit tests mock Docker; no real daemon. No new npm dependencies. No new VS Code settings. Docker image, serve command, workdir, and port 8000 stay unchanged.

## Non-goals

- Detecting a dead container that the session still thinks is running (health check / docker inspect on every Start).
- Restarting automatically when settings or the clicked config file differ from the running session; Stop then Start covers that.
- Stopping preview containers belonging to other VS Code windows.
- Merging palette and Explorer into a single command id (titles sync; Explorer can keep a hidden palette entry so the URI argument still works).
- Changing Docker image, serve command, workdir, or published port 8000.
