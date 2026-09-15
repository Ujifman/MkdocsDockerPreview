## Context

VS Code extension implemented under `src/` with Mocha unit tests. Default preview image is an internal registry (`docker-public.example.com/docs/properdocs:latest`). Preview must work on Windows, Linux, and macOS via Docker Desktop or Engine — no host MkDocs install.

Local debugging uses `fixtures/sample-mkdocs` as the Extension Development Host workspace so the Host window stays separate from the extension source folder (editors reuse one window per folder path).

Constraints from product rules: production logic under `src/`; inject Docker/process boundaries for TDD; never call a real Docker daemon in unit tests.

## Goals / Non-Goals

**Goals:**

- Start/stop/restart a Dockerized MkDocs (properdocs) serve against the open workspace.
- Show the site in VS Code Simple Browser via a localhost URL on an ephemeral published host port.
- Tear down containers on Stop, workspace close, and extension deactivate (`--rm`).
- Configurable image, entrypoint, serve command, workdir, and config filename with agreed defaults.
- Document and support local try-out via Extension Development Host without closing the extension-source window.

**Non-Goals:**

- Custom Webview; config search outside workspace root; container-IP networking without publish; host MkDocs fallback.

## Decisions

### 1. Extension layout and test runner

- **Choice:** TypeScript VS Code extension; logic under `src/`; Mocha unit tests with mocks.
- **Why:** Matches VS Code norms and XP TDD.
- **Alternatives:** JavaScript only — rejected (typing helps Docker/session seams).

### 2. Separate session state from Docker I/O

- **Choice:** `PreviewSession` (lifecycle/state) depends on a `DockerRunner` interface (`start`, `stop`, published-port discovery via start result). Production impl shells out to `docker` CLI.
- **Why:** DIP; unit tests mock the runner; UI/commands stay thin.
- **Alternatives:** Dockerode SDK — deferred (extra dependency; CLI is enough for v1).

### 3. Docker run shape

```
docker run -d --rm
  -p 127.0.0.1::8000
  -v <workspace>:<workdir>
  -w <workdir>
  --entrypoint <entrypoint>
  <image>
  <serveCommand args after {configFile} substitution>
```

- Container always listens on **8000**.
- Host port is ephemeral; bind **127.0.0.1** only.
- After start, discover mapping (`docker port` / inspect) → `http://127.0.0.1:<port>`.
- Always `--rm` so stop removes the container.

**Why not container IP:** unreachable from host on Docker Desktop (Windows/macOS). Published port is the portable approach.

### 4. Settings defaults

| Setting | Default |
|---------|---------|
| `dockerImage` | `docker-public.example.com/docs/properdocs:latest` |
| `entrypoint` | `/bin/bash` |
| `serveCommand` | `-c "properdocs serve -f {configFile} -a 0.0.0.0:8000"` |
| `workdir` | `/build` |
| `configFileName` | `mkdocs.yml` |

- Config file MUST exist at `<workspaceRoot>/<configFileName>` only (no search paths).
- `{configFile}` replaced with that filename before argv assembly.
- Blank `dockerImage` (after trim) → Start fails with a clear error.
- Public Hub alternatives (`ysebastia/properdocs`, `qligier/properdocs-materialx`) were tried; the internal registry image matches internal properdocs + bash and is the shipped default.

### 5. Serve command as argument list after image

- **Choice:** Treat `serveCommand` as a string that is split into argv passed after the image (bash receives `-c` and the script). Document that users needing complex quoting should adjust settings carefully; implement a small, tested splitter.
- **Why:** Matches `docker run ... image -c "..."` with entrypoint bash.
- **Alternatives:** Empty entrypoint + direct `properdocs` argv — rejected for agreed `/bin/bash` default.

### 6. Preview surface

- **Choice:** VS Code Simple Browser API after successful start/restart.
- **Why:** Embedded, no custom Webview; cross-platform.
- **Alternatives:** External browser / custom Webview — deferred.

### 7. Restart and cleanup

- Explicit **Start** while running → stop current container, then start new, reopen Simple Browser to new URL (port may change).
- **Stop**, workspace folder close, and `deactivate` → stop container (best-effort; ignore if already gone).
- Hard OS kill may orphan containers — accept for v1; optional named reaping later.

### 8. Manifest vs `src/`

- VS Code requires `package.json`, and typically build output, at extension root. **All author-written production and unit-test source** lives under `src/`. Root holds only packaging/config required by the toolchain.

### 9. Extension Development Host workspace

- **Choice:** Default launch config opens `${workspaceFolder}/fixtures/sample-mkdocs` while `--extensionDevelopmentPath` stays the extension root. Optional “empty window” launch for opening any other MkDocs folder.
- **Why:** VS Code/Cursor reuse a single window per absolute folder path; opening the extension repo again in the Host focuses the editor window and drops the Host UX.
- **Alternatives:** Second clone of the repo; dogfood root `mkdocs.yml` in the Host — rejected as the default because of the same-path window collision.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Windows volume path / Docker Desktop mount quirks | Manual smoke; unit tests mock paths; document Docker requirement |
| Serve not ready when Simple Browser opens | Accept possible first load miss; user refreshes (livereload). Optional wait/retry later |
| `serveCommand` string splitting edge cases | Document default; keep splitter simple; tests cover the default string |
| Orphans after hard kill | `--rm` + stop on deactivate; named containers later if needed |
| Private registry reachability | Default uses the internal `docker-public` registry; override `dockerImage` when needed |
| Same-folder Host focus steal | Launch opens `fixtures/sample-mkdocs`; document in README |

## Migration Plan

N/A for greenfield. Keep README/`openspec/config.yaml` aligned with shipped defaults and local try-out steps.

## Open Questions

None blocking.
