## 1. Config path from Explorer URI (TDD)

- [x] 1.1 Write failing tests in `src/` for a workspace-relative config helper: root `mkdocs.yml` and `properdoc.yml` return that filename; nested `subdir/mkdocs.yml` returns `subdir/mkdocs.yml` with forward slashes; a path outside the workspace is rejected
- [x] 1.2 Implement the helper under `src/` until those tests pass (no `vscode` import)

## 2. Start with config override (TDD)

- [x] 2.1 Write failing tests in `src/previewController.test.ts`: `startPreview` with a workspace `properdoc.yml` path substitutes `properdoc.yml` even when the setting is `mkdocs.yml`; `startPreview` with a nested path substitutes the relative POSIX path and still mounts the workspace; `startPreview` with no path still uses `configFileName`; a path outside the workspace shows an error and does not start a container
- [x] 2.2 Extend `PreviewController.startPreview` (and validation) to accept an optional file path and apply the helper until those tests pass

## 3. Explorer contribution and wiring

- [x] 3.1 In `package.json`, contribute command `mkdocsDockerPreview.openFromExplorer` titled `Open MKDocs Preview`, hide it from the Command Palette, and add `explorer/context` with `when` `resourceFilename == 'mkdocs.yml' || resourceFilename == 'properdoc.yml'` (group `navigation`)
- [x] 3.2 In `src/extension.ts`, register that command to `startPreview` with the Explorer URI `fsPath` when present; palette Start remains argument-less
- [x] 3.3 Document the Explorer right-click on `mkdocs.yml` / `properdoc.yml` in README.md

## 4. Verify

- [x] 4.1 Run the full unit-test suite (`npm test`) and fix until green
