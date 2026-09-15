## Why

Start Preview opens the preview tab as soon as Docker publishes a host port. MkDocs/properdocs still needs time to build the site (longer on large repos), so the first load shows a broken page and the user must refresh after serve logs `Documentation built...`. Reopening an already-running preview does not have this problem and should stay instant.

## What Changes

- On a **new** container start, open the preview tab immediately and show a loading state until container logs contain `Documentation built...`, then show the live preview URL.
- When Start Preview **reuses** a running session, skip the loading wait and open the live preview URL immediately.
- README: first open after Start waits for the site to be built; reuse still opens at once.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `preview-browser`: New-start preview tab shows a loader until serve reports the docs are built; reuse of a running session opens the live URL immediately.

## Impact

- `src/` preview start and log-follow path: detect `Documentation built...` on streamed container logs before showing the live URL; reuse path unchanged (no wait).
- Preview surface may need a host-owned loading view (Simple Browser cannot show a custom loader). Keep Docker I/O injectable so tests mock logs, not a real daemon.
- `src/*.test.ts` for controller, log follow / ready detection, and the preview opener.
- README start/try-out text: loader on first start; immediate open when already running.
- No new VS Code settings. Docker image, serve command, workdir, and port 8000 stay unchanged.

## Non-goals

- HTTP polling the preview URL until it returns 200.
- A configurable ready-string, timeout setting, or automatic reload loop after the first show.
- Changing Docker image, serve command, workdir, or published port 8000.
- Detecting a dead container that the session still thinks is running.
- Replacing Output-channel log streaming; this change only watches that stream for the built marker.
