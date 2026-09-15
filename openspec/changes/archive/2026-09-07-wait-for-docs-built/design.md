## Context

See proposal.md for motivation. After `docker run` and host-port discovery, `PreviewController` immediately opens Simple Browser at `http://127.0.0.1:<port>`. Container logs are already followed into the Output channel (`docker logs -f --timestamps`), but start does not wait for MkDocs/properdocs to finish the first build.

Reuse of a running session already reopens the live URL without a new container. Docker image, serve command, workdir, and port 8000 stay unchanged.

Simple Browser can only show a URL; it cannot host a loading state. The preview tab must be a host-owned view so the loader and the live site can share one panel.

## Goals / Non-Goals

**Goals:**

- Open a preview tab as soon as a new start has a preview URL; show a loader until streamed serve logs contain `Documentation built`; then load the live URL in that same tab.
- Reuse path: skip the loader and load the existing live URL immediately.
- If log follow never starts, still load the live URL (do not leave the user on a spinner forever).
- TDD with mocked Docker and a fake preview view; never wait on a real HTTP fetch.

**Non-Goals:**

- HTTP polling the preview port.
- Configurable ready marker, timeout setting, or reload loop.
- Keeping Simple Browser as the live surface (replaced by the preview webview so loader and site are one tab).
- Changing session reuse, leftover cleanup, or Output-channel streaming.

## Decisions

### 1. One webview panel: loader HTML, then iframe to the preview URL

- **Choice:** Replace `simpleBrowser.show` with a VS Code webview panel (`mkdocsDockerPreview.preview`). `showLoading()` sets static HTML (spinner + short “Building documentation…” copy). `showLive(url)` updates the same panel to an iframe whose `src` is the preview URL, with CSP `frame-src` allowing `http://127.0.0.1:*` and `http://localhost:*`. Reuse calls `showLive` only. Failed start never creates or reveals the panel.
- **Why:** The user asked for a tab that is open during the wait. One panel avoids a loader tab plus a second Simple Browser tab. Simple Browser has no loader API.
- **Alternatives:** Delay Simple Browser until the marker — no tab during wait. Loader webview then `simpleBrowser.show` — two tabs / flicker. Tiny local HTTP loader — extra server, not the simplest thing.

### 2. Wait on the existing log-follow stream, not on HTTP

- **Choice:** After `session.start` returns the URL, the controller shows the loader, then awaits `waitForServeReady()` on the Docker/log boundary. That promise resolves when concatenated follow chunks contain `Documentation built` (covers `Documentation built in 1.23 seconds` and timestamp-prefixed `docker logs` lines). Keep a small carry-over string so the marker can split across chunks. If `startLogFollow` fails, resolve immediately. If Stop runs during the wait, do not call `showLive`.
- **Why:** The user named that log line as the ready signal; follow is already running. Matching a substring keeps the check tiny and testable without a network.
- **Alternatives:** Poll `http://127.0.0.1:<port>` until 200 — extra I/O, flaky in unit tests, not what was asked. Wait inside `DockerCliRunner.start` before returning the URL — controller could not open the loader first.

### 3. Seams: preview view + ready wait, not vscode in unit tests

- **Choice:** Replace `BrowserOpener.open(url)` with a small `PreviewView`: `showLoading()` and `showLive(url)`. Add `waitForServeReady(): Promise<void>` next to the runner/follow path (session can forward it). `DockerCliRunner` notifies the waiter from the same stdout/stderr callbacks that call `logger.append`. Export a pure helper to detect the marker for tests. `MockRunner.waitForServeReady` is a deferred the test resolves (or a resolved promise for “follow unavailable”).
- **Why:** DIP; controller tests assert call order (`showLoading` → wait → `showLive` vs reuse `showLive` only) without vscode or Docker.
- **Alternatives:** Controller parses logger output — couples UX to Output formatting. Only production `followDockerLogs` knows about the marker — hard to unit-test the wait.

### 4. Tests

- **Choice:** Controller: new start records `showLoading` then `showLive` after the waiter resolves; reuse never calls `showLoading`; failed start calls neither; stop during wait skips `showLive`. Marker helper: matches across chunks and with docker timestamps; no match until the full phrase exists. Runner: follow chunks that include `Documentation built` complete `waitForServeReady`; follow-setup failure completes it without waiting.
- **Why:** Maps 1:1 to the preview-browser scenarios. Mocks stay at Docker and the preview view.

## Risks / Trade-offs

| Risk | Mitigation |
| --- | --- |
| Serve image never prints `Documentation built` | Default properdocs/MkDocs does. Log-follow failure still shows the live URL. No timeout setting (non-goal); user can Stop. |
| Iframe in a webview may restrict livereload / cookies vs Simple Browser | Allow localhost `frame-src`; keep scripts enabled on the panel. If livereload breaks in smoke, fall back is a follow-up, not this change. |
| Marker split across log chunks | Carry the tail of the last chunk into the next scan. |
| User Stops while the loader is showing | Abort the wait; do not `showLive`. |
| Replacing Simple Browser surprises people who liked the built-in browser chrome | Same editor tab role; README says preview tab with loader then site. |

## Migration Plan

Behavior-only. No settings migration. README: first Start shows a loading preview until logs contain `Documentation built`; Start while running still opens the live site immediately. Rollback is reverting the preview view and the wait.

## Open Questions

None.
