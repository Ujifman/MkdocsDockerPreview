## Why

When preview start or Docker/MkDocs fail, users only see a short toast. There is no Output channel, so docker CLI output, container/serve logs, and extension lifecycle events are invisible. Debugging a bad image, missing plugin, or serve crash is guesswork. We need that output now because the extension already runs a real Docker serve path and those failures are otherwise untraceable.

## What Changes

- Add a VS Code Output channel named `MkdocsDockerPreview` in the Output tab of the bottom panel.
- Write extension lifecycle and preview events there (activate, start, stop, restart, dispose, validation failures, errors).
- Write Docker CLI command results (the invoked command plus stdout/stderr) to the same channel.
- Stream the running container’s logs (MkDocs/properdocs serve output) into the same channel for the life of the preview session.
- Show the channel when a preview starts and when an error is logged, without replacing existing error toasts.
- No new VS Code settings, no change to Docker image, serve command, workdir, or port 8000.

## Capabilities

### New Capabilities

- `preview-output-log`: Dedicated Output channel `MkdocsDockerPreview` for extension events, Docker CLI output, and live container/serve logs.

### Modified Capabilities

- (none) Existing start/stop/port/browser/settings requirements stay the same. Logging is additive.

## Impact

- `src/extension.ts` creates and disposes the Output channel and wires it into the controller.
- `src/previewController.ts` and `src/previewSession.ts` emit lifecycle and error lines through a small logger seam (injected; mocked in tests).
- `src/dockerCliRunner.ts` logs docker invocations and streams `docker logs` while the container is running.
- No new npm dependencies. Uses `vscode.window.createOutputChannel`.
- Unit tests mock the Output channel and Docker I/O; no real daemon.

## Non-goals

- Log-level settings, file logs, or telemetry.
- Replacing error toasts or Simple Browser.
- Switching `docker run` from detached (`-d`) to attached.
- A custom Terminal profile or Debug Console output.
- Filtering, search UI, or multiple channels (extension vs Docker).
