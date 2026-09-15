## Why

Unit tests sit next to production files under `src/`, so the product tree is half tests and compiled `out/*.test.js` can ship in the VSIX. OpenSpec config currently *requires* that mix. We need the convention written down and the repo to match it: production in `src/`, tests in `tests/`.

## What Changes

- State in `openspec/config.yaml` that `src/` is production TypeScript only and `tests/` holds all unit-test source.
- Move existing `src/*.test.ts` files to a top-level `tests/` folder (same flat names).
- Compile and run tests from `tests/` without putting test JavaScript into `out/`.
- Point `npm test` at the new test location.
- Keep Docker image, serve command, workdir, port 8000, and VS Code settings unchanged.

## Capabilities

### New Capabilities

- None. Layout and tooling only; no product capability.

### Modified Capabilities

- None. Preview, settings, and session requirements do not change. This change sets `skip_specs: true`.

## Impact

- Eight colocated `src/*.test.ts` files move to `tests/`.
- `tsconfig.json` / test compile, `package.json` `test` script, `.gitignore`, and `.vscodeignore`.
- `openspec/config.yaml` layout and the design/tasks/apply rules that currently say “all source under `src/`”.
- No new npm dependencies. No Docker, network, or settings changes.

## Non-goals

- Switching Mocha to `tsx` / `ts-node` or adding path aliases.
- Nesting `tests/` beyond a flat mirror of today’s `src/`.
- Changing assertion library, test names, or production behavior.
- Rewriting archived OpenSpec task paths.
- Editing `AGENTS.md` (layout lives in OpenSpec config).
