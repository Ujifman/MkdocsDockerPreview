## Context

See proposal.md for motivation. The session already calls `docker stop` from `PreviewController.dispose()`, subscription dispose, workspace-folder change, and `deactivate()`. Those paths are async (`void controller.dispose()` in subscriptions; `await` only in `deactivate()`). VS Code can kill the extension host on window close before `docker stop` (default 10s grace) finishes, so `--rm` never runs and the container stays up.

Production and tests stay under `src/`. Docker and process spawn remain injected seams; unit tests never talk to a real daemon.

## Goals / Non-Goals

**Goals:**

- Closing the window (and deactivate / workspace close) always issues a stop that can outlive the dying extension host.
- In-process stop is fast enough to complete when VS Code *does* wait (`docker stop -t 0`).
- Next activate of the same workspace stops leftovers from a previous window.
- One stop implementation used by Stop Preview, dispose, and leftover cleanup.

**Non-Goals:**

- Coordinating two VS Code windows previewing the same workspace (already one session per host).
- Changing image, serve command, workdir, port 8000, or adding settings.
- Graceful MkDocs shutdown (preview does not need a 10s SIGTERM wait).

## Decisions

### 1. Detached `docker stop -t 0` on host exit, not only awaited `deactivate`

- **Choice:** When the extension disposes (subscriptions, workspace folder change, `deactivate`), synchronously spawn `docker stop -t 0 <containerId>` with `detached: true`, `stdio: 'ignore'`, `windowsHide: true`, then `unref()`. Also `await` the existing in-process stop when the host is still alive. `docker stop` is idempotent if both run.
- **Why:** `void controller.dispose()` is abandoned when the process dies. A detached child can finish after the window is gone. `-t 0` sends SIGKILL immediately so stop fits VS Code’s short deactivation window.
- **Alternatives:** Await `docker stop` only in `deactivate` — already fails in practice. `process.on('exit')` — too late to spawn. `docker kill` — same effect as `-t 0`, less consistent with the existing `stop` command.

### 2. Label preview containers so leftovers are findable

- **Choice:** Add Docker labels on `docker run`: `com.mkdocs-docker-preview=1` and `com.mkdocs-docker-preview.workspace=<hex hash of workspace path>`. Hash the path (short SHA-256 hex) so Windows drive letters and backslashes do not break `--filter`.
- **Why:** If shutdown never ran, in-memory and even persisted ids can be missing. Labels let activate query `docker ps -q --filter label=...` and stop those ids. `--rm` is unchanged.
- **Alternatives:** Persist only container id in `workspaceState` — lost if crash happens before write, and shared storage is awkward. Named containers — collisions across windows; labels compose with `--rm`.

### 3. Sweep leftovers on activate, scoped to this workspace

- **Choice:** After constructing the runner, if a workspace folder is open, `docker ps -q --filter label=com.mkdocs-docker-preview.workspace=<hash>` then `docker stop -t 0` each id. Failures and Docker-unavailable are swallowed so activate never throws. Skip the sweep when no folder is open.
- **Why:** Recovers the “close window, container still running” case the next time the user opens the project. Scoping by workspace avoids stopping another window’s preview of a *different* folder.
- **Alternatives:** Sweep all `com.mkdocs-docker-preview=1` containers — would kill another open window’s preview. Sweep only on Start Preview — leaves orphans until the user starts again.

### 4. Inject a detached-spawn seam; keep `ExecFn` for awaited commands

- **Choice:** Keep `ExecFn` for `run` / `port` / `ps` / `stop`. Add a tiny `SpawnDetachedFn` used only for shutdown stop. Production implementation is `child_process.spawn` + `unref()`. Tests pass a fake that records args.
- **Why:** `ExecFn` waits for exit; shutdown cannot wait. Mirrors the existing `FollowFn` split. DIP: no `vscode` or real Docker in unit tests.
- **Alternatives:** One spawn API with a `detached` flag — extra branching. Fire-and-forget `ExecFn` without waiting — still tied to the dying event loop.

### 5. Same fast stop for the Stop command

- **Choice:** Change `DockerCliRunner.stop` to `docker stop -t 0 <id>` for Stop Preview, dispose, leftover sweep, and port-parse failure cleanup.
- **Why:** One code path; preview servers do not need graceful drain. Tests already assert `['stop', containerId]` and will expect `['stop', '-t', '0', containerId]`.
- **Alternatives:** Fast stop only on shutdown — two stop behaviors for no user-visible gain.

## Risks / Trade-offs

| Risk | Mitigation |
| --- | --- |
| VS Code kills the host without calling `deactivate` | Subscription `dispose` starts the detached stop synchronously; activate sweep is the backstop |
| Detached `docker` process becomes a brief extra process | `unref()` + `-t 0`; it exits as soon as Docker accepts the stop |
| Two windows on the same workspace: activate in one stops the other’s leftover-looking container | Accept for v1; the extension already has one preview session per host and one workspace root |
| Label filter misses pre-change containers (no labels) | Those are a one-time leftover; user Stop or a manual `docker stop` is enough; new runs are labeled |
| Sweep on activate if Docker is down | Catch and ignore; do not fail activate or show a toast |

## Migration Plan

No settings or command changes. Existing Start/Stop UX stays the same aside from a faster stop. README gets one sentence: closing the VS Code window stops the preview container; a leftover from a killed window is stopped on the next activate.

## Open Questions

None. Window close uses detached stop plus leftover sweep; no new setting to keep the container alive.
