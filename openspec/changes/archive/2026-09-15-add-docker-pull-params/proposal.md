## Why

The default preview image (`ujifman/properdocs-material:latest`) includes Chrome and is published for `linux/amd64`. On Apple Silicon, `docker pull` without an explicit platform fails, so Start Preview never refreshes the image even though `docker pull --platform=linux/amd64` works. Users need a setting for extra pull arguments, defaulting to that platform flag, so pull succeeds out of the box on macOS.

## What Changes

- Add a workspace/user setting `mkdocsDockerPreview.dockerPullParams` (string). Default: `--platform=linux/amd64`.
- When Start Preview pulls the configured image for a new container, the extension MUST pass those extra arguments to `docker pull` (before the image name).
- Empty or whitespace-only `dockerPullParams` MUST mean no extra arguments (opt out of the default platform pin).
- Document the setting and show the default platform flag in the equivalent `docker pull` example.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `preview-settings`: new `dockerPullParams` setting with default `--platform=linux/amd64`; blank/whitespace means no extra pull arguments.
- `docker-preview-session`: new-container pull MUST include the configured extra pull arguments before the image name; reuse still MUST NOT pull.
- `preview-output-log`: the logged `docker pull` invocation MUST include those extra arguments when they are set.

## Impact

- `package.json` — contribute `mkdocsDockerPreview.dockerPullParams`.
- `src/defaults.ts`, `src/previewSettings.ts` — default, read, and normalize the setting.
- `src/dockerRunner.ts`, `src/dockerCliRunner.ts`, `src/previewSession.ts`, `src/previewController.ts` — pass extra pull args into the existing best-effort pull.
- Tests under `tests/` for settings, runner pull argv, and controller/session wiring.
- `README.md`, `MARKETPLACE.md` — settings table and equivalent `docker pull` example.
- `openspec/config.yaml` — record the new default in planning context.
- Docker image name, serve command, workdir, and port 8000 stay unchanged. Extra params apply to `docker pull` only, not `docker run`.

## Non-goals

- Applying `--platform` (or other extra args) to `docker run`, `docker stop`, leftover cleanup, or log follow.
- Detecting host architecture or applying the default only on macOS.
- A separate “skip pull” setting, live pull progress, or changing best-effort pull / no-toast-on-pull-failure behavior.
- Validating Docker flag syntax in the setting; invalid flags fail at the Docker CLI and remain a logged, non-fatal pull error.
