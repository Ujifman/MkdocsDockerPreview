## 1. Extension scaffold

- [x] 1.1 Create VS Code extension package at repo root (`package.json`, tsconfig, build) with all author source under `src/`
- [x] 1.2 Add test runner for unit tests under `src/`; verify empty suite runs green
- [x] 1.3 Register activation, placeholder Start/Stop commands, and setting contribution keys (defaults from design)

## 2. Preview settings (TDD)

- [x] 2.1 Write failing tests for reading defaults (`docker-public.example.com/docs/properdocs:latest`, `/bin/bash`, serve command with `{configFile}`, `/build`, `mkdocs.yml`)
- [x] 2.2 Implement settings reader under `src/` until those tests pass
- [x] 2.3 Write failing tests: blank image rejected; missing `<workspaceRoot>/<configFileName>` rejected; `{configFile}` substituted
- [x] 2.4 Implement validation and placeholder substitution until those tests pass

## 3. Docker run spec builder (TDD)

- [x] 3.1 Write failing tests that build Docker run args: `-d --rm`, `-p 127.0.0.1::8000`, `-v workspace:workdir`, `-w workdir`, `--entrypoint`, image, serve argv
- [x] 3.2 Implement run-spec builder under `src/` until tests pass (no real Docker)

## 4. DockerRunner + PreviewSession (TDD)

- [x] 4.1 Define `DockerRunner` interface; write failing tests with a mock for start/stop and published-port discovery → `http://127.0.0.1:<port>`
- [x] 4.2 Implement `PreviewSession` (idle → running → stopped; Start while running restarts) until tests pass
- [x] 4.3 Write failing tests for Docker unavailable and container start failure → error, session not running
- [x] 4.4 Implement failure paths until tests pass
- [x] 4.5 Implement production `DockerCliRunner` under `src/` (spawn `docker`; parse port); keep covered by thin adapter tests with mocked process I/O

## 5. Commands, browser, cleanup

- [x] 5.1 Write failing tests (mocked session/browser) that Start opens Simple Browser only on success; restart opens new URL; failed start does not open browser
- [x] 5.2 Wire Start/Stop commands and Simple Browser opener until tests pass
- [x] 5.3 Write failing tests that dispose/workspace-close/deactivate invoke stop
- [x] 5.4 Wire cleanup on Stop, workspace close, and `deactivate` until tests pass

## 6. Docs and verification

- [x] 6.1 Update README customization and Docker example to match agreed settings/defaults (image, entrypoint, serveCommand, workdir `/build`, configFileName, random host port)
- [x] 6.2 Update `openspec/config.yaml` context defaults to match (remove empty image / `/work`)
- [x] 6.3 Run the full unit-test suite and fix until green
- [x] 6.4 Manual smoke (not automated): Docker CLI serve/stop/`--rm` with an internal registry image; Extension Host via `fixtures/sample-mkdocs`
- [x] 6.5 Add README “Try the extension locally” for VS Code/Cursor Extension Development Host
- [x] 6.6 Add `fixtures/sample-mkdocs` and `.vscode/launch.json` so F5 opens a separate Host workspace (avoids same-folder window reuse)
