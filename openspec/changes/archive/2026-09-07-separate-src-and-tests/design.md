## Context

See proposal.md for motivation. Today `tsconfig.json` compiles all of `src/` (including `*.test.ts`) to `out/`. `package.json` `main` is `./out/extension.js`; `npm test` runs `mocha "out/**/*.test.js"`. `openspec/config.yaml` tells agents to put production *and* tests under `src/` only.

A single `tsc` with `include: ["src", "tests"]` and `rootDir: "."` would emit `out/src/extension.js` and break `main`. Production compile and test compile must stay separate.

## Goals / Non-Goals

**Goals:**

- `src/` contains only production `.ts`; `tests/` contains all `*.test.ts`.
- `openspec/config.yaml` states that split (layout context and design/tasks/apply rules).
- `npm run compile` still emits `out/extension.js` (no test JS in `out/`).
- `npm test` compiles tests separately and runs the same Mocha suite.

**Non-Goals:**

- `tsx` / `ts-node`, path aliases, or TypeScript project references.
- Nested `tests/` trees, renaming test files, or changing test assertions.
- Product behavior, Docker, settings, or `AGENTS.md`.

## Decisions

### 1. Config is the layout contract

- **Choice:** Update `openspec/config.yaml` Layout so `src/` is production only and `tests/` is all unit-test source. Change design/tasks/apply rules from “all source under `src/`” to “production under `src/`, tests under `tests/`”.
- **Why:** Agents follow that file. Stating the split without changing the rules would put the next test back in `src/`.
- **Alternatives:** Only move files — config would still forbid `tests/`. Only edit config — the tree would contradict the contract.

### 2. Two tsconfigs, not one `out/` tree

- **Choice:** Keep production `tsconfig.json` as `rootDir: "src"`, `outDir: "out"`, `include: ["src/**/*"]`. Add `tsconfig.test.json` that includes `src` and `tests`, `rootDir: "."`, `outDir: "out-test"`. Mocha runs `out-test/tests/**/*.test.js`. Gitignore `out-test/`. Ignore `tests/**` and `out-test/**` in `.vscodeignore`.
- **Why:** Production `main` stays `./out/extension.js`. Test JS never lands in `out/`, so it is not packed by `!out/**/*.js`. No new dependencies.
- **Alternatives:** One tsconfig with `rootDir: "."` — breaks `main`. Mocha + `tsx` — extra runtime. Project references — more machinery than eight test files need.

### 3. Flat `tests/` and relative imports

- **Choice:** Move each `src/<name>.test.ts` to `tests/<name>.test.ts`. Change sibling imports (`./previewSettings`) to `../src/previewSettings`. Leave production files in place.
- **Why:** `src/` is already flat. Mirroring that is the smallest move. Relative imports work with CommonJS emit; aliases need extra tooling.
- **Alternatives:** `tests/src/...` — useless nesting. Import compiled `../out/...` — tests depend on a production compile that does not type-check against source.

### 4. Same Mocha, mechanical test move

- **Choice:** Keep Mocha and Node `assert`. Do not rewrite cases. After the move, `npm test` must be green before the change is done.
- **Why:** This is a layout refactor. Feedback comes from the existing suite, not new product tests.
- **Alternatives:** Rewrite tests while moving — mixes two reasons to change.

## Risks / Trade-offs

| Risk | Mitigation |
| --- | --- |
| `tsc` `rootDir` error if tests compile with `rootDir: "tests"` while importing `src/` | Test tsconfig uses `rootDir: "."` and emits under `out-test/` |
| Agents keep adding `src/*.test.ts` | Config layout + design/tasks/apply rules all name `tests/` |
| `out-test/` committed or packed | `.gitignore` and `.vscodeignore` |
| Import path typos after the move | Full `npm test` before done |

## Migration Plan

Move the eight test files, fix imports, add `tsconfig.test.json`, point `npm test` at `out-test/tests/**/*.test.js`, update ignore files and `openspec/config.yaml`. Rollback is the reverse move plus restoring the old Mocha glob. No setting or Docker migration.

## Open Questions

None.
