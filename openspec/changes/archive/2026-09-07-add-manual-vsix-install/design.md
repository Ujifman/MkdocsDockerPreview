## Context

See proposal.md for motivation. `package.json` already has `vscode:prepublish` → `compile`, and `.vscodeignore` already excludes source, tests, OpenSpec, and maps. `.gitignore` already ignores `*.vsix`. There is no packaging script, no `@vscode/vsce` dependency, no LICENSE, and no `repository` field. README documents F5 / Extension Development Host only.

This change is tooling and docs. No production TypeScript, Docker, or settings.

## Goals / Non-Goals

**Goals:**

- One npm script that produces a `.vsix` from this repo without Marketplace credentials.
- README steps to build that file and install it via **Install from VSIX** (VS Code and Cursor).
- Keep F5 / Host docs; they remain the development path.

**Non-Goals:**

- Marketplace / Open VSX publish, CI release, signing, icon, or inventing a LICENSE/repository just to silence vsce.
- Custom `.ps1` / `.sh` wrappers around npm.
- Changing extension runtime code or adding Mocha tests that invoke vsce.

## Decisions

### 1. Local `@vscode/vsce` and `npm run package`

- **Choice:** Add `@vscode/vsce` as a `devDependency`. Add `"package": "vsce package --no-dependencies --allow-missing-repository --skip-license"`. Document `npm install` then `npm run package`.
- **Why:** vsce is the supported packager. A local binary keeps versions in lockfile. `vscode:prepublish` already compiles before pack. `--no-dependencies` matches this extension (no runtime npm deps). `--allow-missing-repository` and `--skip-license` keep packaging non-interactive without adding files this change does not own. Output is `mkdocs-docker-preview-<version>.vsix` at the repo root (already gitignored).
- **Alternatives:** Global `vsce` — not reproducible. Custom shell script — duplicates npm. `npx @vscode/vsce` without a lockfile pin — version drift. Adding LICENSE/repository now — extra product decisions, not required for sideload.

### 2. README: sideload section, not a rewrite of F5

- **Choice:** Add a section **Install without the Marketplace** after the existing Host section. Steps: `npm install`, `npm run package`, then Extensions → **Install from VSIX…** (or `code --install-extension <file>.vsix`). Note that Cursor uses the same Install from VSIX path. State that F5 is still for development.
- **Why:** Host and sideload are different jobs. Mixing them in one list would send developers to pack a VSIX when they only need F5.
- **Alternatives:** Replace Host docs — loses the debug workflow. A separate INSTALL.md — extra file for a short procedure.

### 3. Tighten `.vscodeignore` for pack contents

- **Choice:** Keep the current ignore list. Add `fixtures/**` so the sample MkDocs site is not shipped. Do not pack `node_modules` (vsce + `--no-dependencies`).
- **Why:** `.vscodeignore` already drops `src/`, `tests/`, `out-test/`, OpenSpec, and maps. `fixtures/` is only for Extension Host debugging.
- **Alternatives:** Leave fixtures in the VSIX — larger, unused at runtime. A `files` field in `package.json` — second include/exclude mechanism vsce already covers with `.vscodeignore`.

### 4. Verification without a vsce unit test

- **Choice:** During apply, run `npm run package` and confirm a `.vsix` appears. Run `npm test` to keep the suite green. No Mocha case that shells out to vsce.
- **Why:** Packaging is a CLI side effect. Hitting vsce from unit tests would be slow and environment-dependent. Existing tests still guard runtime code.
- **Alternatives:** Snapshot the vsix file list in Mocha — brittle and needs vsce on every test run.

## Risks / Trade-offs

| Risk | Mitigation |
| --- | --- |
| vsce interactive prompt or hard fail on missing license/repository | `--skip-license` and `--allow-missing-repository` on the script |
| Accidental commit of `.vsix` | Already in `.gitignore`; do not force-add |
| VSIX includes fixtures, tests, or `out-test/` | `.vscodeignore`; confirm pack file list if vsce prints it |
| Users confuse F5 with sideload | Separate README section; Host section stays first for developers |
| `@vscode/vsce` is a large devDependency | Acceptable; pin in lockfile; not shipped in the VSIX |

## Migration Plan

Additive: new script, new devDependency, README section, ignore tweak. Rollback is removing those four. No setting or Docker migration. Existing Host workflow is unchanged.

## Open Questions

None.
