## 1. Logger seam (TDD)

- [x] 1.1 Write failing tests in `src/previewLogger.test.ts`: `info`/`error` write lines with an ISO-8601 timestamp and `INFO`/`ERROR`; `clear`/`show(true)`/`dispose` forward to the channel; inject a fake clock and fake OutputChannel (no real `vscode`)
- [x] 1.2 Implement `PreviewLogger` and the OutputChannel adapter under `src/previewLogger.ts` until those tests pass

## 2. Controller lifecycle logging (TDD)

- [x] 2.1 Write failing tests in `src/previewController.test.ts` with a fake logger: Start Preview clears the channel and shows it with preserve-focus; success logs an INFO line that includes the preview URL; validation failure logs ERROR with the same toast message and still calls `showError`; Stop logs INFO that the preview stopped; Start while running logs INFO that the previous preview is stopping then logs the new start
- [x] 2.2 Inject `PreviewLogger` into `PreviewController` and emit those lifecycle lines until the new tests pass (existing browser/toast tests stay green)

## 3. Docker CLI invocation logging (TDD)

- [x] 3.1 Write failing tests in `src/dockerCliRunner.test.ts` with a fake logger: successful `docker run` logs the command+args as INFO and logs the container id from stdout; failed/unavailable docker logs ERROR including stderr or stdout; the runner still throws the existing errors
- [x] 3.2 Inject `PreviewLogger` into `DockerCliRunner` and log each `ExecFn` invocation until those tests pass (no real Docker)

## 4. Container log follow (TDD)

- [x] 4.1 Write failing tests in `src/dockerCliRunner.test.ts`: after a successful start, a `FollowFn` is called with `docker logs -f --timestamps <containerId>`; stdout/stderr chunks are appended via the logger; `stop` disposes the follow handle then runs `docker stop`; if `FollowFn` throws, start still returns the handle and the logger records an ERROR
- [x] 4.2 Add `FollowFn` (mocked in tests) and production spawn-follow under `src/`; start follow after port discovery and dispose it on stop until those tests pass

## 5. Extension wiring and docs

- [x] 5.1 In `src/extension.ts`, create Output channel `MkdocsDockerPreview` on activate, pass the adapter into the controller and Docker runner, and dispose the channel on deactivate (existing Start/Stop/cleanup still work)
- [x] 5.2 Add a short README note: open the Output tab and select `MkdocsDockerPreview` to see extension and Docker/serve logs
- [x] 5.3 Run the full unit-test suite (`npm test`) and fix until green
