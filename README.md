# MkDocs Docker Preview

VS Code extension that previews an MkDocs repository inside the editor by running serve in Docker (for example properdocs), so you can swap images/plugins without installing Python/MkDocs on the host.

## Commands

- **MkDocs Docker Preview: Start Preview** — start the Docker serve container and open a preview tab. Before a new container starts, the extension pulls the configured Docker image so you get the latest tag when the registry is reachable. If pull fails, that error is written to the **MkdocsDockerPreview** Output channel and start still tries `docker run` (which succeeds when a local copy of the image already exists). The tab shows a loader until serve logs contain `Documentation built`, then loads the live site. If the active editor is a markdown file under the docs directory and that page exists, the preview opens on that page instead of the site root. While the preview is running, switching docs markdown tabs updates the preview page. If a preview is already running in this window, Start Preview opens the live site immediately instead of pulling or starting another container. Run **Stop Preview** and then Start Preview to replace the container (new settings or a different config file).
- **MkDocs Docker Preview: Stop Preview** — stop the preview container
- Explorer right-click on `mkdocs.yml` or `properdoc.yml` also shows **Start Preview** (same action as the palette command; uses the clicked file as `{configFile}` when no preview is running).

The workspace folder is mounted into the container. Container port **8000** is published to a **random localhost port** on the host; the extension inspects the mapping and opens `http://127.0.0.1:<port>` (or a docs page under that origin) in the preview tab.

If the active markdown file has no corresponding page on the serve site, the preview keeps the last page and writes an INFO line to the Output channel. Non-markdown tabs and files outside the docs directory also leave the preview on the last page. When `site_url` in the MkDocs config has a path (for example `/somedocs/mkdocs/`), that prefix is included in the preview URL.

Containers are started with `--rm` and stopped when you run Stop, close the workspace, or close the VS Code window. If a window is killed before stop finishes, leftover preview containers for that workspace are stopped the next time the extension activates.

Extension events, Docker CLI output, and live MkDocs/properdocs serve logs appear in the **Output** tab (bottom panel). Select **MkdocsDockerPreview** in the dropdown.

## Settings

| Setting                              | Default                                                 |
| ------------------------------------ | ------------------------------------------------------- |
| `mkdocsDockerPreview.dockerImage`    | `ujifman/properdocs-material:latest`                    |
| `mkdocsDockerPreview.entrypoint`     | `/bin/bash`                                             |
| `mkdocsDockerPreview.serveCommand`   | `-c "properdocs serve -f {configFile} -a 0.0.0.0:8000"` |
| `mkdocsDockerPreview.workdir`        | `/build`                                                |
| `mkdocsDockerPreview.configFileName` | `mkdocs.yml`                                            |
| `mkdocsDockerPreview.docsDir`        | `docs`                                                  |

- `{configFile}` in `serveCommand` is replaced with `configFileName` for Command Palette Start Preview.
- Explorer **Start Preview** uses the clicked file (path relative to the workspace) as `{configFile}` for that start when no preview is already running.
- The config file must exist under the workspace folder.
- A blank `dockerImage` is rejected at Start. Each new start pulls this image first; a failed pull is logged and does not by itself abort start.
- `docsDir` is the folder (relative to the workspace root) whose markdown files map to preview pages. Empty values fall back to `docs`.

## Structure

- `src/` — extension source and unit tests
- `out/` — compiled JavaScript (build output)
- `fixtures/sample-mkdocs/` — small MkDocs site opened by the Extension Development Host

## Try the extension locally (VS Code or Cursor)

This is how you run the extension like an installed one, without publishing to the Marketplace. The editor opens an **Extension Development Host** window with the extension loaded.

**Prerequisites:** Node.js, npm, and Docker (Desktop or Engine) running.

### Why not open this repo folder in the Host?

VS Code / Cursor normally keep **one window per folder path**. If the Extension Host tries to open the same folder you already have here, the editor switches back to this window. So debugging uses a **separate** folder: `fixtures/sample-mkdocs`.

### Steps

1. Open **this** repository folder in VS Code or Cursor (the window where you edit the extension).
2. Install and build:

   ```bash
   npm install
   npm run compile
   ```

3. Start the Extension Development Host:
   - Press **F5**, or
   - Run **Debug: Start Debugging** and choose **Run Extension**
     (`.vscode/launch.json` compiles, then opens a new Host window on `fixtures/sample-mkdocs`).

4. Stay in the new **`[Extension Development Host]`** window (it should show the sample MkDocs fixture, not this repo):
   - Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) → **MkDocs Docker Preview: Start Preview**.
   - Or in Explorer, right-click `mkdocs.yml` → **Start Preview**.
   - A **MkDocs Preview** tab opens with a loader until serve logs contain `Documentation built`, then shows the live site at `http://127.0.0.1:<random-port>` (or the page for the active docs markdown file when it exists). Switching docs markdown tabs while the preview is open updates the page. If a preview is already running, the live site opens immediately.
   - Open the **Output** tab and select **MkdocsDockerPreview** to watch Docker and serve logs.
   - **MkDocs Docker Preview: Stop Preview** when done (or close/reload the Host window).

5. After code changes in this window, **F5** again (or rebuild and **Developer: Reload Window** in the Host).

### Optional: preview another MkDocs repo

Use launch config **Run Extension (empty window)**, then in the Host: **File → Open Folder…** and pick any MkDocs project that is **not** already open in another window (or open a second clone/path of this repo).

**Note:** `mkdocsDockerPreview.*` settings work in the Host like a normal install (User or Workspace).

## Install without the Marketplace

Use this when you want the extension in a normal VS Code or Cursor window (not the Extension Development Host). For day-to-day development, prefer **F5** above.

**Prerequisites:** Node.js and npm.

1. From this repository root:

   ```bash
   npm install
   npm run package
   ```

   That creates `mkdocs-docker-preview-<version>.vsix` in the repo root (for example `mkdocs-docker-preview-0.1.0.vsix`).

2. Install the VSIX:
   - VS Code or Cursor: **Extensions** view → `…` menu → **Install from VSIX…** → pick the `.vsix` file, or
   - CLI: `code --install-extension mkdocs-docker-preview-0.1.0.vsix` (adjust the filename; for Cursor use `cursor --install-extension` if that CLI is on your PATH).

3. Reload the window if prompted, then use **MkDocs Docker Preview: Start Preview** on any MkDocs workspace (Docker still required to run the preview).

## Development

```bash
npm install
npm test
npm run compile
```

## Equivalent Docker command

What the extension approximates (host port is chosen by Docker):

```powershell
docker pull ujifman/properdocs-material:latest
docker run -d --rm -p 127.0.0.1::8000 -v ${pwd}:/build -w /build --entrypoint /bin/bash ujifman/properdocs-material:latest -c "properdocs serve -f mkdocs.yml -a 0.0.0.0:8000"
```

If `docker pull` fails, the extension still runs the container when a local image is already present.
