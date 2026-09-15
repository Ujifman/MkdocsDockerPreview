## 1. Packaging script

- [x] 1.1 Add `@vscode/vsce` as a devDependency and a `package` script `vsce package --no-dependencies --allow-missing-repository --skip-license`; verify `npm install` succeeds and `package.json` lists both
- [x] 1.2 Add `fixtures/**` to `.vscodeignore`; verify the ignore file lists `fixtures/**` and still excludes `src/`, `tests/`, and `out-test/`

## 2. README sideload steps

- [x] 2.1 Add an **Install without the Marketplace** section to README.md after the Extension Development Host section: `npm install`, `npm run package`, then Extensions → **Install from VSIX…** (and `code --install-extension`); keep the F5 Host steps; verify README names `npm run package` and Install from VSIX and still documents F5

## 3. Verify

- [x] 3.1 Run `npm run package` and confirm a `mkdocs-docker-preview-*.vsix` file is created at the repo root without prompting for license or repository
- [x] 3.2 Run the full unit-test suite (`npm test`) and fix until green
