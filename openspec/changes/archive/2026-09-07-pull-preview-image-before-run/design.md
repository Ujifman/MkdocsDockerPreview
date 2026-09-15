## Context

See proposal.md for motivation. Today `PreviewSession.start` calls `DockerRunner.start(dockerArgs)` and `DockerCliRunner` runs `docker run` immediately. The configured image (default `.../properdocs:latest`) is only a `docker run` argument, so a local cache can hide registry updates. Docker CLI output already goes to the `MkdocsDockerPreview` channel via `execSafe`; the controller shows a toast only when `session.start` throws.

Reuse of a running session still returns without Docker. Leftover cleanup on activate does not start a preview and must not pull.

## Goals / Non-Goals

**Goals:**

- On a new container start, run `docker pull <configured image>` before `docker run`.
- Treat pull failure as logged, non-fatal; still run. Toast only if run fails.
- Keep pull on the Docker I/O boundary so unit tests mock `ExecFn` only.

**Non-Goals:**

- Streaming pull progress, a setting to skip pull, or pulling on reuse/activate.
- Changing `buildDockerRunArgs`, image default, serve command, workdir, or port 8000.

## Decisions

### 1. Best-effort pull inside `DockerCliRunner.start`, image passed explicitly

- **Choice:** Extend `DockerRunner.start` to `start(dockerArgs, image)`. `DockerCliRunner.start` runs `docker pull <image>`, swallows pull failure after `execSafe` has logged it, then keeps the existing `docker run` / port-discovery path. `PreviewSession.start` and `PreviewController` pass `validation.settings.dockerImage` (already known when building run args). Reuse still returns before that call.
- **Why:** The runner already owns Docker CLI. Passing the image avoids parsing `dockerArgs`. One start path keeps the controller free of pull vs run branching.
- **Alternatives:** Parse image out of `dockerArgs` — brittle (entrypoint vs test stubs). A separate `pullImage` on the runner plus a controller call — extra seam for the same sequence. `docker run --pull=always` — a failed pull aborts run; we need run to proceed with a local image.

### 2. Swallow every pull error, including Docker-unavailable

- **Choice:** After logging, do not rethrow from pull. `docker run` still throws `DockerUnavailableError` or a normal command error; the controller toast stays tied to that throw.
- **Why:** Matches “if pull fails, log and try to start.” Unavailable Docker fails on run the same way as today.
- **Alternatives:** Rethrow `DockerUnavailableError` from pull to skip run — faster fail, but a different path than the user asked for. Show a toast on pull failure — noisy when offline start still works.

### 3. Buffered `exec`, not live pull follow

- **Choice:** Use the existing `exec`/`execSafe` for `docker pull` (command line immediately; stdout/stderr when the process exits). Do not `follow` pull output.
- **Why:** No progress UI. Same logging as other one-shot Docker commands. Follow is already used for container logs.
- **Alternatives:** Stream pull to the Output channel — nicer for long pulls, more moving parts than this change needs.

### 4. Tests

- **Choice:** `tests/dockerCliRunner.test.ts`: new start issues `docker pull <image>` before `docker run`; pull non-zero still runs and can succeed; pull logs INFO on success and ERROR on failure without throwing; run failure after a failed pull still throws. Update existing start tests that assume the first exec is `run`. Mock runners used by session/controller tests accept the extra `image` argument; reuse tests assert no Docker calls.
- **Why:** Maps to the new session and log scenarios. No real daemon or registry.

## Risks / Trade-offs

| Risk | Mitigation |
| --- | --- |
| First start is slower while pull runs | Expected; Output shows the pull command. No timeout setting (non-goal). User can Stop. |
| Long pull looks idle after the command line | Accept buffered exec; live progress is a follow-up. |
| Stale digest if registry lies or tag is not latest | Pull is best-effort; `:latest` is still a tag. |
| Private registry auth failure | Logged; local image can still start. |

## Migration Plan

Behavior-only. No settings migration. README: Start Preview pulls the configured image first; a failed pull is logged and start continues with a local image when one exists. Rollback is reverting the start/pull sequence.

## Open Questions

None.
