## 1. Session reuses a running container (TDD)

- [x] 1.1 Replace the `PreviewSession` test that expects restart-on-second-`start` with: second `start` returns the same URL, does not call runner `stop` or a second runner `start`, and state stays `running`; confirm the test fails
- [x] 1.2 Change `PreviewSession.start` so a `running` session returns the existing `previewUrl` without calling the runner, until that test passes

## 2. Controller reopens the browser (TDD)

- [x] 2.1 Replace `opens new URL after restart` in `src/previewController.test.ts` with: second `startPreview` opens the same URL, runner `startCount` stays 1 and `stopCount` stays 0, Output `clearCount` stays 1; add a case that `startPreview` with a config path while running does not call the runner again; confirm the tests fail
- [x] 2.2 In `PreviewController.startPreview`, when the session is `running` with a URL, skip `clear`/validation/`session.start`, log that preview is already running, and open Simple Browser at that URL, until those tests pass

## 3. Command titles

- [x] 3.1 In `package.json`, set palette Start to `category` `MkDocs Docker Preview` and `title` `Start Preview`, and set the Explorer command `title` to `Start Preview`; confirm both contributed titles are `Start Preview`
- [x] 3.2 In README.md, document that Start Preview reopens Simple Browser if already running (Stop then Start to replace the container), and that Explorer and palette both use **Start Preview**; confirm those sentences are present

## 4. Verify

- [x] 4.1 Run the full unit-test suite (`npm test`) and fix until green
