## Why

Closing a VS Code window sometimes leaves the MkDocs preview container running. The session is already supposed to stop on deactivate and workspace close, but those paths are async and VS Code can exit before `docker stop` finishes. Orphaned containers keep serving, hold ports, and confuse the next preview start. We need a stop that actually completes when the window goes away.

## What Changes

- Treat VS Code window close / extension-host exit as a required stop of the preview container, not a best-effort side effect of `deactivate`.
- Stop the container with a shutdown path that can finish (or outlive) the dying extension host, instead of only awaiting `docker stop` in-process.
- On the next activate, find and stop leftover preview containers from a previous window so orphans never persist across reloads.
- Keep Start / Stop / restart, `--rm`, port 8000, image, serve command, and settings unchanged.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `docker-preview-session`: Strengthen cleanup so closing the VS Code window always stops the preview container; add recovery that stops leftover containers when the extension activates again.

## Impact

- `src/extension.ts` shutdown and activate wiring (awaited deactivate is not enough today).
- `src/dockerCliRunner.ts` / `src/dockerRunSpec.ts` if containers need a label or a faster stop so they can be found and killed after a crash.
- `src/previewSession.ts` / `src/previewController.ts` only if session identity must be persisted across activate.
- Unit tests mock Docker; no real daemon. No new npm dependencies. No new VS Code settings.

## Non-goals

- Stopping containers started by other tools or other VS Code windows that are still open.
- Changing Docker image, serve command, workdir, or published port 8000.
- A user setting to leave the container running after window close.
- Docker Compose, named containers as a UI feature, or a system-wide Docker prune.
