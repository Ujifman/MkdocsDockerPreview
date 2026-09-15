## Why

Authors need to preview internal-style MkDocs sites (plugins, forks such as properdocs) inside VS Code without installing Python/MkDocs on the host. A first working preview loop unblocks daily editing; this repo ships the extension plus a small MkDocs fixture for local Extension Host testing.

## What Changes

- Scaffold a VS Code extension under `src/` (TypeScript, activation, commands, settings contribution).
- Add workspace settings for Docker image, entrypoint, serve command, container workdir, and MkDocs config filename.
- Add **Start Preview** and **Stop Preview** commands that run `mkdocs`/`properdocs` serve inside Docker with the workspace mounted.
- Publish container port **8000** to a **random host port** bound to localhost; open VS Code **Simple Browser** at that URL.
- Restart the container when Start is invoked while a preview is already running.
- Stop and remove the preview container on Stop, workspace close, and extension deactivate (`docker run --rm`).
- Update README and OpenSpec project context to match the agreed defaults.
- Document how to try the extension locally in VS Code/Cursor (Extension Development Host); open `fixtures/sample-mkdocs` so the Host does not reuse the extension-source window.

## Non-goals

- Custom Webview chrome, editor↔preview path sync, or multi-root workspace orchestration.
- Searching for config files outside the workspace root (filename override only).
- Host-side MkDocs; dynamic container-IP access without port publish; host port settings.
- Image pull progress UI; named container orphan reaping after hard process kills (optional later).

## Capabilities

### New Capabilities

- `preview-settings`: VS Code settings for image, entrypoint, serve command (with `{configFile}`), workdir, and config filename; validation of blank image and missing config file.
- `docker-preview-session`: Start/Stop/restart lifecycle, Docker run args (mount, `--rm`, entrypoint, random host port), port discovery, cleanup on dispose/workspace close/deactivate.
- `preview-browser`: Open Simple Browser to the discovered localhost preview URL after a successful start (and after restart).

### Modified Capabilities

- (none — no existing specs)

## Impact

- New extension package under `src/` (and usual VS Code extension manifest at repo root as required by VS Code; production/test logic stays under `src/`).
- Settings: `dockerImage` (default `docker-public.example.com/docs/properdocs:latest`), `entrypoint` (`/bin/bash`), `serveCommand` (properdocs serve with `{configFile}`), `workdir` (`/build`), `configFileName` (`mkdocs.yml`).
- Container always serves on **8000** inside; host uses an ephemeral published port on `127.0.0.1`.
- Docs: README settings, Docker example, and **Try the extension locally** (F5 / Extension Development Host).
- Dev ergonomics: `.vscode/launch.json` opens `fixtures/sample-mkdocs` (separate path so VS Code/Cursor do not focus the already-open extension folder).
- Tests: unit tests with mocked Docker/process I/O only; manual smoke via Docker CLI and/or Extension Host against the sample fixture (or another MkDocs folder not already open).
