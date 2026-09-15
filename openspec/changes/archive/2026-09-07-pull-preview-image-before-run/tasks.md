## 1. Pull before run on the Docker runner (TDD)

- [x] 1.1 Write failing tests in `tests/dockerCliRunner.test.ts`: `start(dockerArgs, image)` issues `docker pull <image>` before `docker run`; a non-zero pull still runs and can succeed; a successful pull logs INFO with the pull command; a failed pull logs ERROR with pull output and does not throw from `start` when run succeeds; run failure after a failed pull still throws. Existing start tests MUST pass the image argument. Confirm the new tests fail (no real Docker).
- [x] 1.2 Change `DockerRunner.start` to `start(dockerArgs, image)` and implement best-effort `docker pull <image>` at the start of `DockerCliRunner.start` (log via existing `execSafe`, swallow pull errors, then keep the current run/port path) until those tests pass.

## 2. Session and controller pass the image (TDD)

- [x] 2.1 Write failing tests in `tests/previewSession.test.ts`: `start(dockerArgs, image)` forwards that image to `runner.start`; a second start while running does not call `runner.start`. Update `MockRunner` to the new signature. Confirm the new assertions fail, then forward `image` from `PreviewSession.start` until they pass.
- [x] 2.2 Update `PreviewController` to pass `validation.settings.dockerImage` into `session.start`, and update `tests/previewController.test.ts` mocks until those tests compile and pass. Reuse-while-running MUST still not call `runner.start`.

## 3. Docs and suite

- [x] 3.1 Update README: Start Preview pulls the configured image before a new container; a failed pull is written to the `MkdocsDockerPreview` Output channel; start continues and succeeds if a local image can still run.
- [x] 3.2 Run the full unit-test suite (`npm test`) and fix until green
