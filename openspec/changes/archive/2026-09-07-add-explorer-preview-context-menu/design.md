## Context

See proposal.md for motivation. Start/Stop already live as `mkdocsDockerPreview.start` / `.stop`. Start always mounts the workspace folder and substitutes `{configFile}` from `mkdocsDockerPreview.configFileName`. Explorer has no contribution yet. `package.json` uses empty `activationEvents`; contributed commands still activate the extension when invoked.

## Goals / Non-Goals

**Goals:**

- Show **Open MKDocs Preview** on Explorer right-click for `mkdocs.yml` and `properdoc.yml` only.
- Reuse the existing start path (Docker run, port 8000, Simple Browser, Output channel).
- When the click supplies a file URI, substitute `{configFile}` with that file’s path relative to the workspace root for this start only.
- Keep Command Palette Start using the `configFileName` setting.

**Non-Goals:**

- New settings, Docker image/serve/workdir/port changes, or an Explorer Stop item.
- Editor-tab, title-bar, or folder context menus.
- Remounting a subdirectory as the container workdir.

## Decisions

### 1. Dedicated Explorer command, same start handler

- **Choice:** Contribute `mkdocsDockerPreview.openFromExplorer` with title **Open MKDocs Preview**. Hide it from the Command Palette (`when: false`). Register it to the same `startPreview` path as Start, passing the Explorer resource URI. Keep `mkdocsDockerPreview.start` title and palette behavior as they are.
- **Why:** Context menus use the command `title`. A second command is the smallest way to show the short label without renaming Start Preview in the palette.
- **Alternatives:** Reuse Start and change its title — palette wording changes. Title override per menu — not supported on the contributed `explorer/context` item.

### 2. `when` clause on exact filenames

- **Choice:** `resourceFilename == 'mkdocs.yml' || resourceFilename == 'properdoc.yml'` on `explorer/context`. Group `navigation`.
- **Why:** Matches the requested files only; no extra names (`mkdocs.yaml`, `properdocs.yml`).
- **Alternatives:** `resourceExtname == '.yml'` — too broad. Glob language — unnecessary.

### 3. Clicked file becomes `{configFile}` for that start

- **Choice:** Resolve a POSIX-relative path from the workspace root to the URI (`path.relative`, then `\\` → `/`). Pass that string into the existing `validateForStart` / `substituteConfigFile` path as an override. Do not write the setting. Palette Start still uses `configFileName`.
- **Why:** Clicking `properdoc.yml` must serve that file even when the setting is still `mkdocs.yml`. Relative path keeps the current workspace mount. Nested configs (`subdir/mkdocs.yml`) work without remounting.
- **Alternatives:** Ignore the URI and always use the setting — menu on `properdoc.yml` would be misleading. Mount the file’s parent directory — changes Docker layout for a discoverability feature.

### 4. Small resolver, not a new controller type

- **Choice:** Pure helper (e.g. `configFileFromWorkspaceUri(workspaceRoot, filePath)`) used by `PreviewController.startPreview(filePath?)`. Invalid/outside-workspace paths fail with the same toast + log path as other validation errors.
- **Why:** DIP; unit tests cover relative-path and rejection cases without `vscode`. Controller stays the start orchestrator.
- **Alternatives:** Parse URI only in `extension.ts` — harder to test. New session type — overkill.

### 5. Tests

- Helper tests: root `mkdocs.yml` / `properdoc.yml`, nested relative path, path outside workspace, missing file (existing validation).
- Controller tests: start with override uses that name in the substituted serve command; start without argument still uses the setting.
- Do not attempt to unit-test `package.json` `when` clauses (contribution metadata). README documents the right-click path.

## Risks / Trade-offs

| Risk | Mitigation |
| --- | --- |
| Windows `resourceFilename` case vs exact `when` | Keep exact names as specified; Explorer on Windows usually preserves the on-disk name |
| Nested config served from workspace mount may confuse MkDocs if `docs_dir` is relative to the yml | Same as running `-f subdir/mkdocs.yml` from repo root; do not remount in this change |
| Two commands confuse docs | Palette docs stay Start/Stop; README adds one Explorer bullet |
| URI missing when command is run from palette via the hidden id | Hidden from palette; handler treats missing URI like Start (use setting) |

## Migration Plan

Additive contribution and optional start argument. No setting migration. README: right-click `mkdocs.yml` or `properdoc.yml` → **Open MKDocs Preview**.

## Open Questions

None. Filenames are exactly `mkdocs.yml` and `properdoc.yml` as requested.
