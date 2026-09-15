## Why

The configured preview image is typically a moving tag such as `properdocs:latest`. `docker run` uses whatever copy is already on the machine, so authors can keep serving a stale image after the registry was updated. Preview should try to pull the configured image before each new container start so the live site matches the latest available image.

## What Changes

- Before `docker run` on a new Start Preview, the extension MUST run `docker pull` for the configured image.
- If pull succeeds, start MUST use the freshly pulled image.
- If pull fails (offline, registry error, auth, etc.), the extension MUST log the failure in the `MkdocsDockerPreview` Output channel and MUST still attempt `docker run`.
- Start MUST succeed when a local copy of the image already exists, even after a failed pull.
- Start MUST still fail with a clear error when `docker run` cannot start (no local image and pull failed, Docker unavailable, or other run errors).
- Reuse of an already-running preview MUST NOT pull and MUST NOT start a new container.

## Non-goals

- Pull progress UI, a Terminal pull view, or a cancel-pull command.
- A setting to skip or force pull.
- Pulling when Start Preview only reopens an already-running session.
- Pre-pull on extension activate, or background image refresh while a preview is running.
- Changing the default image, serve command, workdir, or container port 8000.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `docker-preview-session`: New start must pull the configured image before `docker run`; a failed pull is not fatal if a local image can still start the container.
- `preview-output-log`: Pull invocations and pull failures must appear in the `MkdocsDockerPreview` Output channel; a failed pull must not replace the existing start-error toast unless `docker run` itself then fails.

## Impact

- `src/dockerCliRunner.ts` (and the `DockerRunner` seam if needed) pulls the configured image before `docker run`.
- Output-channel logging of `docker pull` command, stdout/stderr, and non-fatal pull errors.
- Unit tests with mocked Docker exec only; no real daemon or registry.
- README: Start Preview pulls the image first; a failed pull is logged and start continues with a local image when one exists.
- No new VS Code settings. Docker image, serve command, workdir, and port 8000 stay as they are.
