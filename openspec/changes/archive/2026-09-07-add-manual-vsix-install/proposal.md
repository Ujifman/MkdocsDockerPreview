## Why

The README only explains the Extension Development Host (F5). People who want this extension in a normal VS Code window cannot get it from the Marketplace, and the repo does not tell them how to build an installable `.vsix` and sideload it.

## What Changes

- Add a documented, repeatable way to package this repo into a `.vsix` (npm script plus `@vscode/vsce`, no Marketplace credentials).
- Document in README how to build that file and install it in VS Code (and Cursor if the same Install from VSIX path applies) without publishing.
- Keep Docker image, serve command, workdir, port 8000, and VS Code settings unchanged.

## Capabilities

### New Capabilities

- None. Packaging and docs only; no product capability.

### Modified Capabilities

- None. Preview, settings, and session requirements do not change. This change sets `skip_specs: true`.

## Impact

- `package.json` scripts and a packaging devDependency (`@vscode/vsce`).
- README: a sideload section distinct from F5 / Extension Development Host.
- `.vscodeignore` only if the current ignore list would ship tests, source, or OpenSpec files in the VSIX.
- `.gitignore` already ignores `*.vsix`. No Docker, network, or settings changes.

## Non-goals

- Publishing to the Visual Studio Marketplace, Open VSX, or any private gallery.
- CI/CD that builds or attaches a VSIX on every commit.
- Signing, icons, marketplace badges, or publisher-account setup.
- Changing extension runtime behavior, commands, or settings.
- Replacing the existing F5 / Extension Development Host workflow.
