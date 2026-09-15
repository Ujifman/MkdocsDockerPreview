## 1. Relocate tests and wire compile

- [x] 1.1 Move all `src/*.test.ts` files to `tests/` (same filenames) and change their imports from `./…` to `../src/…`; verify `src/` contains no `*.test.ts`
- [x] 1.2 Add `tsconfig.test.json` (`include` `src` and `tests`, `rootDir` `.`, `outDir` `out-test`), gitignore `out-test/`, and change `npm test` to `tsc -p tsconfig.test.json` then mocha `out-test/tests/**/*.test.js`; verify `npm test` is green (Mocha must load tests from `out-test/tests`, not zero tests)

## 2. Keep test JS out of the extension package

- [x] 2.1 Add `tests/**` and `out-test/**` (and `tsconfig.test.json` if not already ignored via `**/*.ts` patterns that should stay) to `.vscodeignore`; verify `.vscodeignore` lists `tests/**` and `out-test/**`, and `npm run compile` emits `out/extension.js` with no `out/*.test.js`

## 3. Layout contract in OpenSpec config

- [x] 3.1 Update `openspec/config.yaml` Layout so `src/` is production TypeScript only and `tests/` holds all unit-test source; change design/tasks/apply rules from “all source under `src/`” to “production under `src/`, tests under `tests/`”; verify those files mention `tests/` and no longer require tests to live in `src/`

## 4. Verify

- [x] 4.1 Run the full unit-test suite (`npm test`) and fix until green
