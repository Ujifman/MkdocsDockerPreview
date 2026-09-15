## 1. Ready-marker helper (TDD)

- [x] 1.1 Write failing tests in `src/` for a pure helper that reports ready when text contains `Documentation built`, including timestamp-prefixed `docker logs` lines and a marker split across two chunks, and not ready for unrelated log text
- [x] 1.2 Implement that helper under `src/` until those tests pass (no Docker, no vscode)

## 2. Wait for serve-ready on log follow (TDD)

- [x] 2.1 Write failing tests in `src/dockerCliRunner.test.ts`: after a successful start, `waitForServeReady` completes when a follow chunk contains `Documentation built`; if `FollowFn` throws at start, `waitForServeReady` completes without waiting; `stop` during the wait causes `waitForServeReady` not to hang (reject or complete without treating the site as shown)
- [x] 2.2 Add `waitForServeReady` on the Docker runner, feed follow stdout/stderr through the marker helper, resolve immediately when follow setup fails, and abort the wait on `stop`, until those tests pass (mocked `ExecFn`/`FollowFn` only)

## 3. Session forwards the wait (TDD)

- [x] 3.1 Write failing tests in `src/previewSession.test.ts`: after `start`, `waitForServeReady` calls the runner; `stop` while waiting does not leave a pending wait that later looks like success
- [x] 3.2 Forward `waitForServeReady` from `PreviewSession` and abort it on `stop` until those tests pass

## 4. Controller: loader then live URL (TDD)

- [x] 4.1 In `src/previewController.test.ts`, replace `BrowserOpener.open` with a fake `PreviewView` (`showLoading` / `showLive`). Write failing tests: new start calls `showLoading` then `showLive` only after `waitForServeReady` resolves; reuse while running calls `showLive` immediately and never `showLoading` or `waitForServeReady`; failed start calls neither; `stop` during the wait skips `showLive`
- [x] 4.2 Change `PreviewController` to show the loader after a new start, await `session.waitForServeReady`, then `showLive`; reuse path only `showLive`; skip `showLive` if the wait was aborted, until those tests pass

## 5. Preview webview and docs

- [x] 5.1 Implement the production `PreviewView` as a VS Code webview panel under `src/` (loader HTML, then iframe to the preview URL with localhost `frame-src`); wire it in `src/extension.ts` in place of `simpleBrowser.show`; confirm `simpleBrowser.show` is no longer used for Start Preview
- [x] 5.2 Update README: first Start opens a preview tab with a loader until serve logs contain `Documentation built`, then the live site; Start while already running opens the live site immediately
- [x] 5.3 Run the full unit-test suite (`npm test`) and fix until green
