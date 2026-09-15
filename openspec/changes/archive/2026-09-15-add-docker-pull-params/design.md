## Context

See proposal.md for motivation. Today `DockerCliRunner.start(dockerArgs, image)` always runs `docker pull <image>` before `docker run`. Extra CLI flags cannot be configured, so Apple Silicon hosts cannot pass `--platform=linux/amd64` and the Chrome-based default image fails to pull. Settings already live on `PreviewSettings` (`src/previewSettings.ts`); `serveCommand` is a string that `splitArgs` turns into argv at run-arg build time. Pull remains best-effort (logged, non-fatal). Reuse and leftover cleanup do not pull.

## Goals / Non-Goals

**Goals:**

- Read `mkdocsDockerPreview.dockerPullParams` (default `--platform=linux/amd64`) and pass the split argv into the existing pull: `docker pull <extra...> <image>`.
- Keep Docker I/O on the runner; keep settings on the host settings layer.
- Default extra args when the setting is omitted; no extra args when the setting is blank.

**Non-Goals:**

- Changing `buildDockerRunArgs`, image default, serve command, workdir, or port 8000.
- Passing extra args to any Docker command other than pull.
- Host-arch detection or OS-specific defaults.

## Decisions

### 1. String setting, split with existing `splitArgs`

- **Choice:** Contribute `mkdocsDockerPreview.dockerPullParams` as a string (same shape as `serveCommand`). Store the trimmed string on `PreviewSettings`. Treat `''` after trim as no extra args. Split with `splitArgs` immediately before pull so `--platform=linux/amd64` is one token and `--platform linux/amd64` is two.
- **Why:** One setting matches how users type Docker flags. `splitArgs` already exists and is tested via `dockerRunSpec`. Empty string is the opt-out for native-arch pulls.
- **Alternatives:** A `string[]` VS Code setting — worse to edit. Hard-code `--platform` only on darwin/arm64 — violates “setting with a default,” and Linux/Windows users of the same image still want amd64. Parse with `.split(/\s+/)` — breaks quoted tokens that `splitArgs` already handles.

### 2. Third `start` argument: already-split pull argv

- **Choice:** Extend `DockerRunner.start` to `start(dockerArgs, image, pullArgs: string[])`. `DockerCliRunner.pullImage` runs `['pull', ...pullArgs, image]` and keeps swallowing errors after `execSafe` logs them. `PreviewSession.start` and `PreviewController` pass `splitArgs(validation.settings.dockerPullParams)`. Default `pullArgs` to `[]` so existing runner unit tests that omit extras still mean “pull image only.”
- **Why:** The runner already owns Docker CLI and must not read VS Code config (DIP). Passing argv avoids parsing inside the runner. A third positional arg is the smallest change to the current two-arg start path. Reuse still returns before `runner.start`.
- **Alternatives:** Options object `{ image, pullArgs }` — extra type for one field. Runner reads settings — couples I/O to VS Code. Append extras onto `dockerArgs` — those are `docker run` args. `docker pull --platform=...` inside the controller — duplicates the pull seam.

### 3. Default constant + package.json contribution

- **Choice:** Add `DEFAULT_DOCKER_PULL_PARAMS = '--platform=linux/amd64'` next to the other defaults. `readPreviewSettings` uses `config.get('dockerPullParams', DEFAULT_DOCKER_PULL_PARAMS)` then trims. Contribute the same default in `package.json` so the Settings UI shows it.
- **Why:** Image default already uses this pair (`defaults.ts` + `package.json`). Tests can assert the constant instead of a magic string in many places.
- **Alternatives:** Default only in `package.json` — tests and `config.get` fallback would drift. Default only in code — Settings UI would show empty.

### 4. Tests

- **Choice:** `tests/previewSettings.test.ts`: default, custom, blank/whitespace. `tests/dockerCliRunner.test.ts`: pull argv is `['pull', ...extras, image]`; omitted extras stay `['pull', image]`; extra args appear in the INFO log line; failed pull with extras still runs. Mock runners in session/controller tests accept the third argument; controller start asserts default extras are forwarded; reuse still does not call `runner.start`.
- **Why:** Maps to the new settings, session, and log scenarios. No real Docker.

## Risks / Trade-offs

| Risk | Mitigation |
| --- | --- |
| Default `--platform=linux/amd64` forces amd64 on every host, including native arm64 Linux | Document the setting; blank value opts out. The default image is amd64/Chrome anyway. |
| `--platform` on pull but not run: `docker run` might still pick another local arch | Out of scope. After a successful platform-specific pull, Docker typically uses that local image; users can add run flags in a later change if needed. |
| Invalid flags in the setting | Pull stays best-effort; Docker’s error is logged; start still tries `docker run`. |
| Existing runner tests that omit the third arg | Default `pullArgs` to `[]` so they keep asserting `['pull', image]`. |

## Migration Plan

New setting with a non-empty default. Users without an override get `--platform=linux/amd64` on pull. To restore “pull with no extra flags,” set `dockerPullParams` to an empty string. README / MARKETPLACE: add the setting and show `docker pull --platform=linux/amd64 <image>` in the equivalent command. Rollback is reverting the setting and the extra `start` argument.

## Open Questions

None.
