## 1. Label preview containers (TDD)

- [x] 1.1 Write a failing test in `src/dockerRunSpec.test.ts`: `buildDockerRunArgs` includes `--label com.mkdocs-docker-preview=1` and `--label com.mkdocs-docker-preview.workspace=<hex hash of workspacePath>`; same path always hashes the same; Windows and POSIX paths are hashed as given
- [x] 1.2 Add the labels (and a small hash helper under `src/`) to `buildDockerRunArgs` until that test passes; keep `-d --rm` and port 8000 unchanged

## 2. Fast in-process stop (TDD)

- [x] 2.1 Write a failing test in `src/dockerCliRunner.test.ts`: `stop` invokes `docker stop -t 0 <containerId>` (not bare `docker stop <id>`)
- [x] 2.2 Change `DockerCliRunner.stop` to `docker stop -t 0` until that test passes; existing start/port-failure cleanup still uses the same stop path

## 3. Detached shutdown stop (TDD)

- [x] 3.1 Write failing tests: `DockerCliRunner` accepts an injected `SpawnDetachedFn`; `stopInBackground(containerId)` calls it with `docker stop -t 0 <containerId>` and does not wait; `PreviewSession` exposes a sync shutdown that calls `stopInBackground` when a container id is known and is a no-op when idle (fake runner, no real Docker)
- [x] 3.2 Add `SpawnDetachedFn` / `stopInBackground` and session sync shutdown until those tests pass; production spawn uses `detached: true`, `stdio: 'ignore'`, `windowsHide: true`, then `unref()`

## 4. Leftover sweep on activate (TDD)

- [x] 4.1 Write failing tests on the runner: given `docker ps -q --filter label=com.mkdocs-docker-preview.workspace=<hash>` stdout with one or more ids, leftover cleanup stops each with `docker stop -t 0`; empty ps is a no-op; Docker-unavailable or stop failure does not throw
- [x] 4.2 Implement leftover cleanup on `DockerCliRunner` until those tests pass (no real daemon)

## 5. Extension wiring and docs

- [x] 5.1 In `src/extension.ts`, on activate sweep leftovers for `workspaceFolders[0]` (skip if no folder); subscription dispose, workspace-folder change, and `deactivate` call session sync shutdown first then async dispose; verify existing Start/Stop still work
- [x] 5.2 Add a short README note: closing the VS Code window stops the preview container; a leftover from a killed window is stopped on the next activate
- [x] 5.3 Run the full unit-test suite (`npm test`) and fix until green
