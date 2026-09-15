## Context

See proposal.md for motivation. Today `PreviewController.startPreview` always builds Docker run args and calls `PreviewSession.start`. `PreviewSession.start` stops a running container before starting a new one. Closing Simple Browser does not change session state, so a second Start is a full restart.

Explorer uses a second command id (`mkdocsDockerPreview.openFromExplorer`) whose `title` is `Open MkDocs Preview`, hidden from the palette. Palette Start is `MkDocs Docker Preview: Start Preview`. Context menus show `title` only; the palette can show `category: title`.

One `PreviewSession` already exists per extension host (one VS Code window). Docker image, serve command, workdir, and port 8000 stay unchanged.

## Goals / Non-Goals

**Goals:**

- Make “session already running” a Start no-op for Docker: reopen Simple Browser at `session.previewUrl`.
- Keep that invariant in the session so `start` while `running` cannot spawn a second container.
- Align Explorer and palette labels to **Start Preview** without collapsing command ids.
- TDD with mocked Docker; do not clear the Output channel on reuse (serve logs stay).

**Non-Goals:**

- Health-checking the container on Start; auto-restart if it died under us.
- Switching config or settings on a running session (Stop then Start).
- Merging `mkdocsDockerPreview.start` and `mkdocsDockerPreview.openFromExplorer`.

## Decisions

### 1. Reuse in the controller; session refuses a second start

- **Choice:** `PreviewController.startPreview`: if `session.state === 'running'` and `previewUrl` is set, log that preview is already running, `openBrowser.open(previewUrl)`, return. Do not `clear()` the Output channel, do not validate settings, do not call `session.start`. Change `PreviewSession.start` so that if already `running` with a URL, it returns that URL and does not call the runner (no stop, no new `docker run`).
- **Why:** Controller owns UX (browser, logs). Session owns the one-container invariant so any caller of `start` cannot start a second container. Skipping validation on reuse avoids blocking reopen because a setting became invalid after start.
- **Alternatives:** Only the controller short-circuits — session still restarts if `start` is called; easy to violate the spec. Session-only reuse — controller would still clear the log and re-validate. Restart when Explorer config differs — more than asked; Stop then Start is enough.

### 2. Same visible title, two command ids

- **Choice:** Palette command: `category` `MkDocs Docker Preview`, `title` `Start Preview`. Explorer command: `title` `Start Preview`, still hidden from the palette. Keep passing the Explorer URI into `startPreview`.
- **Why:** VS Code context menus do not show `category`; both UIs then read as Start Preview. Two ids stay because Explorer needs the resource URI and the palette command must stay argument-less for `{configFile}` from settings.
- **Alternatives:** One command on both menus — palette Start would need to ignore a URI when invoked from the palette (works, but proposal kept two ids). Long palette string as Explorer title — noisy in the context menu.

### 3. Tests

- **Choice:** Replace “second Start restarts / new URL” tests with: second Start does not call runner `start`/`stop`, same URL, browser opened twice with that URL. Explorer override tests stay for the idle path; add Explorer-while-running does not change Docker args. Session: `start` while running returns the existing URL and does not stop.
- **Why:** Matches the new scenarios; mocks stay at the `DockerRunner` boundary.
- **Alternatives:** Only controller tests — would miss the session invariant.

## Risks / Trade-offs

| Risk | Mitigation |
| --- | --- |
| User expects Start to pick up new settings or a different yml | Spec: Stop then Start; README one line |
| Session thinks it is running but the container is gone | Out of scope; Stop then Start; leftover cleanup on activate stays as today |
| Clearing the log on reuse would wipe live serve output | Do not `clear()` or treat as a fresh start on the reuse path |
| Two commands still exist after title sync | README lists one Start Preview action (palette and Explorer) |

## Migration Plan

Behavior change only: second Start no longer restarts. No setting migration. README: Start reopens the browser if already running; Explorer item is **Start Preview**. Rollback is reverting the Start short-circuit and titles.

## Open Questions

None.
