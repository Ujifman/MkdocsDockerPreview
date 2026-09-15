## Context

See proposal.md for motivation. Preview already owns a webview (`showLoading` / `showLive(url)`), a localhost base URL after port discovery, and an Output-channel logger. `showLive` always loads the base URL. There is no editor subscription and no docs-directory setting. `mkdocs.yml` in real repos may contain Python YAML tags, so this change does not parse it.

Unit tests must mock Docker and the network (AGENTS.md). Existence checks go through an injected probe.

## Goals / Non-Goals

**Goals:**

- Resolve the active editor to a page URL under the session base URL, using a configurable docs directory.
- Navigate only when a candidate URL exists on the live server; otherwise keep the last page and log INFO.
- Follow `onDidChangeActiveTextEditor` for the life of a running session while the preview panel is open.
- TDD with a fake editor path, fake probe, and existing fake `PreviewView`.

**Non-Goals:**

- Parsing `docs_dir` / `use_directory_urls` from YAML.
- Changing iframe HTML via `postMessage` (replacing `showLive` HTML is enough).
- Bidirectional preview → editor sync.

## Decisions

### 1. Docs directory is a setting, default `docs`

- **Choice:** `mkdocsDockerPreview.docsDir`, string, default `docs`, relative to the workspace root. Trim; blank → `docs`. No YAML parse.
- **Why:** Abstract repos can set `documentation` or `src/docs` without a Python-tag YAML parser. Matches existing settings style (`configFileName`).
- **Alternatives:** Infer `docs_dir` from `mkdocs.yml` — brittle on this project’s fixtures. Heuristic search for any `docs/` — wrong on multi-folder repos.

### 2. Pure mapper returns URL candidates, not a single path

- **Choice:** Given workspace root, docs dir, and file path, return `undefined` unless the file is `*.md` inside the docs dir. Otherwise return candidate site paths (posix, leading `/`):
  - `index.md` at docs root: `/`, `/index.html`
  - `dir/index.md`: `/dir/`, `/dir/index.html`
  - `dir/page.md`: `/dir/page.html`, `/dir/page/`
  Prefix every candidate (and the site-root fallback) with the pathname from `site_url` in the resolved MkDocs config (e.g. `http://host/somedocs/mkdocs/` → `/somedocs/mkdocs/stands.html`). Read only the `site_url:` line; do not parse the rest of the YAML.
- **Why:** MkDocs `use_directory_urls` is true or false per repo. Trying `.html` and directory URLs avoids a second setting. Index aliases match how serve exposes the homepage. Many repos set `site_url` with a path prefix; serve then exposes pages under that path, so `/stands.html` 404s.
- **Alternatives:** One setting for URL style — extra config for a 404 the probe already handles. Guess only `.html` — 404s on default MkDocs. Full YAML parse — fixtures use Python tags. Ignore `site_url` — the bug this change hit.

### 3. Injected page probe; 2xx means the page exists

- **Choice:** `PageProbe.exists(url: string): Promise<boolean>`. Production: HTTP GET to `127.0.0.1` with a short timeout (about 1s); status 2xx → true; 404, errors, timeout → false. Controller tries candidates in mapper order and navigates to the first true. If none, `logger.info` (file or URL) and skip `showLive`. Never `showError` / `logger.error` for this.
- **Why:** Nav-excluded or unbuilt markdown is a missing page, not a mapping bug. INFO avoids revealing the Output channel (that happens on ERROR). Tests pass a fake probe — no real network.
- **Alternatives:** Navigate blindly — user asked to keep the last page. HEAD only — some servers mishandle HEAD; GET is the safe check. Treat Material HTML 404 pages that still return 200 — accept as a known miss; MkDocs serve typically returns 404.

### 4. Controller syncs after live and on every editor change

- **Choice:** One `syncToActiveEditor()` used after the first live load (new start and reuse) and from an injected “active editor changed” hook. No-op unless session is `running` with a preview URL. Skip silently when there is no mapped file (non-markdown, outside docs dir, no editor). Skip `showLive` when the chosen URL equals the last shown URL.
- **Why:** Same rules for start and follow. Avoids reloading the iframe (and killing livereload) when the user switches away and back to the same page.
- **Alternatives:** Only sync at start — user asked to follow continuously. Duplicate logic in `extension.ts` — harder to test.

### 5. Stale probes must not win

- **Choice:** Increment a generation token per sync. When a probe finishes, ignore the result if the token is no longer current.
- **Why:** Fast tab switching can complete an older GET after a newer one.
- **Alternatives:** AbortController only — still need to ignore late arrivals if abort is missed.

### 6. PreviewView: optional reveal, and “is the panel open?”

- **Choice:** Extend `showLive(url, options?: { reveal?: boolean })` with `reveal` defaulting to `true` (start/reuse). Follow calls `showLive(url, { reveal: false })`. Add `isOpen(): boolean` (webview panel still exists). Follow no-ops when `isOpen()` is false so a closed tab is not recreated. `ensurePanel` stays for Start only.
- **Why:** Today every `showLive` `reveal()`s the panel. Doing that on each tab switch steals the editor group. Recreating a disposed panel on editor change would fight the user who closed the preview.
- **Alternatives:** Always reveal — noisy. `postMessage` to set `iframe.src` — extra webview protocol for a later polish.

### 7. `extension.ts` is the VS Code adapter

- **Choice:** Inject `getActiveEditorPath: () => string | undefined` from `vscode.window.activeTextEditor?.document.uri.fsPath`. Subscribe to `onDidChangeActiveTextEditor` and call the controller. Docs dir is read through the existing `ConfigurationReader` on each sync so a setting change applies without restart.
- **Why:** Keeps `vscode` out of controller tests, same as workspace root and `fileExists`.
- **Alternatives:** Pass the Uri into start only — cannot follow later.

### 8. Tests

- Mapper: in/out of docs dir, custom dir, `index.md`, nested paths, non-`.md`, Windows separators → posix site paths.
- Controller: after ready, active `docs/a.md` + probe true → `showLive` page URL; probe all false → info log, live URL stays base; non-md → no extra live and no missing-page log; editor change to another page → `showLive` without reveal; `isOpen` false → no `showLive`; reuse start uses the active page.
- Settings: default `docs`; custom; blank → `docs`.
- Fake probe and fake editor path only.

## Risks / Trade-offs

| Risk | Mitigation |
| --- | --- |
| First candidate 404s, second would 200 — extra GET latency | Two GETs, ~1s timeout each; typical case hits the first |
| Probe during a rebuild returns 404 then the page appears | User can switch away and back; no retry loop (non-goal) |
| Replacing webview HTML flashes on each page change | Skip identical URLs; `postMessage` later if smoke is ugly |
| `docsDir` wrong → every md is “outside docs” and never follows | Default `docs` matches most repos; README names the setting |
| GET to localhost from the extension host is blocked | Same machine as the published port; if it fails, treat as missing and log |

## Migration Plan

- Add `mkdocsDockerPreview.docsDir` with default `docs`. Existing users keep current mapping root.
- README: preview follows the active docs markdown file; missing pages stay put and are logged as INFO.
- Rollback: revert the change; preview again always opens the site root.

## Open Questions

None. URL style is handled by candidate probing; docs location is the new setting.
