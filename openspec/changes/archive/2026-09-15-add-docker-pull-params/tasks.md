## 1. Docker pull params setting (TDD)

- [x] 1.1 Write failing tests in `tests/previewSettings.test.ts`: default `dockerPullParams` is `--platform=linux/amd64`; a custom value is returned trimmed; empty or whitespace-only is stored as `''`. Confirm they fail (no real Docker).
- [x] 1.2 Add `DEFAULT_DOCKER_PULL_PARAMS` in `src/defaults.ts`, read/trim `dockerPullParams` on `PreviewSettings`, contribute `mkdocsDockerPreview.dockerPullParams` in `package.json` (default `--platform=linux/amd64`), and update existing `PreviewSettings` object literals in tests until 1.1 passes.

## 2. Extra args on docker pull (TDD)

- [x] 2.1 Write failing tests in `tests/dockerCliRunner.test.ts`: `start(dockerArgs, image, pullArgs)` issues `docker pull` as `['pull', ...pullArgs, image]` before `docker run`; omitted or `[]` pull args stay `['pull', image]`; extra args appear in the INFO log line; a non-zero pull with extras still runs and can succeed. Confirm they fail (no real Docker).
- [x] 2.2 Change `DockerRunner.start` to `start(dockerArgs, image, pullArgs: string[])` with `pullArgs` defaulting to `[]`, and implement `['pull', ...pullArgs, image]` in `DockerCliRunner.pullImage` (keep best-effort swallow after `execSafe`) until those tests pass.

## 3. Session and controller pass pull args (TDD)

- [x] 3.1 Write failing tests in `tests/previewSession.test.ts`: `start` forwards `pullArgs` to `runner.start`; a second start while running still does not call `runner.start`. Update `MockRunner` to the new signature. Confirm the new assertions fail, then forward `pullArgs` from `PreviewSession.start` until they pass.
- [x] 3.2 Write failing controller tests in `tests/previewController.test.ts`: a new start with default settings forwards `['--platform=linux/amd64']`; custom `dockerPullParams` forwards `splitArgs` of that value; blank/whitespace forwards `[]`; reuse-while-running still does not call `runner.start`. Update `MockRunner`, then pass `splitArgs(validation.settings.dockerPullParams)` from `PreviewController` until those tests pass. Mock Docker; never hit a real daemon.

## 4. Docs and suite

- [x] 4.1 Update `README.md` and `MARKETPLACE.md`: add `mkdocsDockerPreview.dockerPullParams` (default `--platform=linux/amd64`, blank means no extra args) and show `docker pull --platform=linux/amd64 ujifman/properdocs-material:latest` in the equivalent Docker example.
- [x] 4.2 Record `dockerPullParams` default `--platform=linux/amd64` in `openspec/config.yaml` planning context so future changes see it.
- [x] 4.3 Run the full unit-test suite (`npm test`) and fix until green.
