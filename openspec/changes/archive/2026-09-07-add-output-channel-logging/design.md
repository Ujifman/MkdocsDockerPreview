## Context

See proposal.md for motivation. Preview already starts a detached (`-d --rm`) container via `DockerCliRunner` and surfaces failures only as `showErrorMessage` toasts. `defaultExec` waits until the child exits, so it cannot follow `docker logs -f`. Production and tests stay under `src/`; Docker and VS Code UI remain injected seams.

## Goals / Non-Goals

**Goals:**

- One Output channel named `MkdocsDockerPreview`, created on activate and disposed on deactivate.
- Inject a tiny logger so controller, session, and Docker I/O can write lines without importing `vscode` in unit tests.
- Keep `docker run -d`; stream serve output with `docker logs -f` after start.
- Preserve error toasts; logging is additive.

**Non-Goals:**

- Log-level settings, file sinks, or extra channels.
- Changing run flags, image, serve command, workdir, or port 8000.
- Waiting for serve-ready before opening Simple Browser.

## Decisions

### 1. VS Code OutputChannel as the only sink

- **Choice:** `vscode.window.createOutputChannel('MkdocsDockerPreview')`. `show(true)` to preserve focus. `clear()` at the start of each Start Preview. Dispose with the extension.
- **Why:** Matches the Output tab dropdown; no extra dependency.
- **Alternatives:** Terminal — heavier, looks like a user shell. `console.log` — Debug Console only, hidden in normal use.

### 2. Injected logger, not `vscode` in domain code

- **Choice:** Small `PreviewLogger` in `src/`: `info`, `error`, `append`, `clear`, `show`, `dispose`. Production adapter wraps `OutputChannel` and prefixes `INFO`/`ERROR` plus an ISO-8601 timestamp for extension events. Container/serve chunks use `append` (no extra prefix). `extension.ts` creates the adapter and passes it into the controller and Docker runner.
- **Why:** DIP; Mocha tests assert on a fake logger. Timestamp/severity live in one adapter so callers pass a message only.
- **Alternatives:** Call `OutputChannel` from every module — couples tests to `vscode`. Winston/pino — rejected (dependency for one channel).

### 3. Detached run plus `docker logs -f`

- **Choice:** Leave `docker run -d --rm`. After a successful start, spawn `docker logs -f --timestamps <containerId>` and append chunks to the logger. On stop/dispose: dispose the follow handle, then `docker stop`.
- **Why:** Attaching to `docker run` would block port discovery and mix lifecycle with serve output. `docker logs -f` dumps existing logs then follows, so early serve lines are not lost.
- **Alternatives:** Drop `-d` and parse port from attach — fragile. `docker attach` — stdin/TTY issues. Polling `docker logs` — laggy.

### 4. Streaming spawn as a second Docker process seam

- **Choice:** Keep `ExecFn` for commands that exit (`run`, `port`, `stop`). Add `FollowFn` that returns a disposable handle and pushes stdout/stderr chunks. Production follow uses `child_process.spawn` and kills the child on dispose.
- **Why:** `ExecFn` cannot represent a long-lived process. Two functions keep the existing runner tests simple.
- **Alternatives:** One spawn API with a `follow` flag — more branching. Dockerode — extra dependency, still needs a mock.

### 5. Follow failure is non-fatal

- **Choice:** If `docker logs -f` cannot start, log ERROR and leave the session running. Simple Browser still opens.
- **Why:** Users still get the site; missing logs should not undo a good start.
- **Alternatives:** Fail the whole start — worse UX when only follow is broken.

### 6. Who writes what

| Source | What is logged |
| --- | --- |
| Controller | Clear + show on Start; validation errors; start/stop/restart messages; preview URL; unexpected errors |
| Docker CLI runner | Each invocation (`docker` + args); stdout/stderr; follow chunks; follow failure |

Session stays lifecycle-only; it does not take a logger unless a later slice needs it. Controller already owns user-facing start/stop.

### 7. Test seams

- Fake `PreviewLogger` recording `info`/`error`/`clear`/`show` calls.
- Fake `ExecFn` / `FollowFn`; never a real Docker daemon.
- Controller tests cover lifecycle lines and that toasts still fire.
- Runner tests cover command logging, follow start/stop, and non-fatal follow failure.

## Risks / Trade-offs

| Risk | Mitigation |
| --- | --- |
| `docker logs -f` child leaks after stop | Dispose follow before `docker stop`; also dispose on session stop/deactivate |
| High-volume serve output floods the channel | Accept for v1; OutputChannel is the VS Code-native sink |
| Follow process errors when `--rm` removes the container | Stop follow first; ignore follow exit after dispose |
| Timestamp format differs from `docker logs --timestamps` | Extension lines use ISO-8601; container lines are passed through including Docker's timestamps |
| Clearing on start hides a failed previous run | User can copy before restart; a single channel stays simple |

## Migration Plan

No settings or command changes. Existing Start/Stop behavior is unchanged aside from the new Output channel. README gets a short note: open the Output tab and select `MkdocsDockerPreview`.

## Open Questions

None blocking. Channel name is `MkdocsDockerPreview` as requested (not the display name `MkDocs Docker Preview`).
