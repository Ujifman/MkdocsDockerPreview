## Purpose

Lifecycle of the Docker preview session: Start/Stop/reuse (no restart-on-Start), port publish and discovery, and cleanup on dispose.

## Requirements

### Requirement: Start Preview command

The extension MUST provide a command that starts an MkDocs preview by running a Docker container for the current workspace folder.

#### Scenario: Successful start

- **WHEN** the user runs Start Preview with a valid image, existing config file, and available Docker
- **THEN** the extension MUST start a detached container with `--rm`
- **AND** the extension MUST mount the entire workspace folder at the configured workdir
- **AND** the extension MUST publish container port 8000 to an ephemeral host port bound to `127.0.0.1`
- **AND** the extension MUST use the configured entrypoint, image, and substituted serve command

#### Scenario: Docker unavailable

- **WHEN** the user runs Start Preview and the Docker CLI or daemon is unavailable
- **THEN** the extension MUST show a clear error
- **AND** the extension MUST leave the session in a non-running state

#### Scenario: Container start failure

- **WHEN** Docker run fails after Start Preview is invoked
- **THEN** the extension MUST show a clear error
- **AND** the extension MUST leave the session in a non-running state

### Requirement: Ephemeral host port discovery

After a successful container start, the extension MUST discover the host port published for container port 8000 and expose a localhost preview URL of the form `http://127.0.0.1:<hostPort>`.

#### Scenario: Port discovered after start

- **WHEN** a preview container starts successfully with a published mapping for port 8000
- **THEN** the extension MUST resolve the assigned host port
- **AND** the preview URL MUST use `127.0.0.1` and that host port

### Requirement: Stop Preview command

The extension MUST provide a command that stops the active preview container for the workspace.

#### Scenario: Stop running preview

- **WHEN** a preview is running and the user runs Stop Preview
- **THEN** the extension MUST stop the container
- **AND** because the container was started with `--rm`, the container MUST be removed on stop

#### Scenario: Stop when not running

- **WHEN** no preview is running and the user runs Stop Preview
- **THEN** the extension MUST NOT fail hard; it MUST treat the session as already stopped

### Requirement: Reuse running preview on Start

When Start Preview is invoked while a preview is already running for this VS Code window, the extension MUST NOT stop the existing container and MUST NOT start a new one. It MUST keep the current preview URL. At most one preview container MUST run for this window.

This applies to Command Palette Start Preview and to Start Preview invoked from the Explorer. Stop Preview remains the way to tear the session down; a later Start Preview then starts a new container.

#### Scenario: Start while running reopens existing session

- **WHEN** a preview is running and the user runs Start Preview again
- **THEN** the extension MUST NOT stop the existing container
- **AND** the extension MUST NOT start a new container
- **AND** the preview URL MUST stay the same as the running session’s URL

#### Scenario: Explorer Start while running does not start another container

- **WHEN** a preview is running and the user chooses Start Preview on a matching Explorer config file
- **THEN** the extension MUST NOT start a new container
- **AND** the running session’s config and preview URL MUST stay unchanged

#### Scenario: Start after Stop starts a new container

- **WHEN** the user runs Stop Preview and then Start Preview
- **THEN** the extension MUST start a new container
- **AND** the new preview URL MAY use a different host port than before

### Requirement: Cleanup on workspace close and deactivate

The extension MUST stop the preview container when the workspace folder is closed, when the extension is deactivated, and when the VS Code window that owns the preview is closed. Closing the window MUST stop the container even if the extension host exits before an in-process Docker stop can finish. Because containers are started with `--rm`, a successful stop MUST also remove the container.

#### Scenario: Workspace closed

- **WHEN** a preview is running and the workspace folder is closed
- **THEN** the extension MUST stop the preview container

#### Scenario: Extension deactivated

- **WHEN** a preview is running and the extension deactivates
- **THEN** the extension MUST stop the preview container

#### Scenario: Window closed

- **WHEN** a preview is running and the user closes the VS Code window
- **THEN** the extension MUST stop the preview container
- **AND** the container MUST NOT keep running after the window is gone

### Requirement: Stop leftover preview containers on activate

When the extension activates with a workspace folder, it MUST stop leftover preview containers that this extension started for that workspace and that are still running from a previous window or incomplete shutdown. Activate MUST still succeed if Docker is unavailable or leftover stop fails.

#### Scenario: Orphan from a previous window

- **WHEN** the extension activates with a workspace folder
- **AND** a leftover preview container for that workspace is still running
- **THEN** the extension MUST stop that container

#### Scenario: No leftover containers

- **WHEN** the extension activates and no leftover preview container exists for the workspace
- **THEN** activate MUST succeed without error

#### Scenario: Docker unavailable during leftover cleanup

- **WHEN** the extension activates and Docker is unavailable
- **THEN** activate MUST still succeed
- **AND** the extension MUST NOT block on leftover cleanup

### Requirement: Start from selected Explorer config file

When Start is invoked from the Explorer with a selected config file and no preview is running, the extension MUST use that file as the MkDocs config for `{configFile}` substitution for that start. The workspace folder MUST still be mounted at the configured workdir. Command Palette Start Preview MUST continue to use the `configFileName` setting.

The selected file MUST be inside the workspace folder. The value substituted for `{configFile}` MUST be the file’s path relative to the workspace root, using forward slashes. If the file is outside the workspace or does not exist, the extension MUST show a clear error and MUST NOT start a container.

#### Scenario: Root properdoc.yml overrides setting

- **WHEN** no preview is running
- **AND** the user chooses Start Preview on workspace-root `properdoc.yml`
- **AND** the `configFileName` setting is `mkdocs.yml`
- **THEN** the serve command MUST contain `properdoc.yml`
- **AND** the serve command MUST NOT use `mkdocs.yml` for that start

#### Scenario: Nested config uses relative path

- **WHEN** no preview is running
- **AND** the user chooses Start Preview on a matching file at `subdir/mkdocs.yml` under the workspace
- **THEN** `{configFile}` MUST be replaced with `subdir/mkdocs.yml`
- **AND** the workspace folder MUST still be mounted at the configured workdir

#### Scenario: Palette Start still uses the setting

- **WHEN** no preview is running
- **AND** the user runs Start Preview from the Command Palette
- **THEN** `{configFile}` MUST be replaced with the configured `configFileName`

#### Scenario: File outside workspace is rejected

- **WHEN** no preview is running
- **AND** Start is invoked with a config file path that is not inside the workspace folder
- **THEN** the extension MUST show a clear error
- **AND** the extension MUST NOT start a container

### Requirement: Pull configured image before new container start

When Start Preview starts a new container, the extension MUST pull the configured Docker image before running the container. A failed pull MUST NOT by itself abort Start Preview. After a failed pull, the extension MUST still attempt to start the container. Start MUST succeed when that run succeeds, including when a local copy of the image already exists. Start MUST fail with a clear error only when the container cannot be started. When Start Preview reuses an already-running session, the extension MUST NOT pull and MUST NOT start a new container.

#### Scenario: Pull before run on new start

- **WHEN** the user runs Start Preview and no preview is running
- **AND** the configured image can be pulled
- **THEN** the extension MUST pull that image before starting the container
- **AND** the container MUST then start with that image

#### Scenario: Failed pull still tries run

- **WHEN** the user runs Start Preview and no preview is running
- **AND** pulling the configured image fails
- **THEN** the extension MUST still attempt to start the container
- **AND** if that start succeeds, Start Preview MUST succeed

#### Scenario: Failed pull and failed run

- **WHEN** the user runs Start Preview and no preview is running
- **AND** pulling the configured image fails
- **AND** starting the container also fails
- **THEN** the extension MUST show a clear error
- **AND** the session MUST remain in a non-running state

#### Scenario: Reuse does not pull

- **WHEN** a preview is running and the user runs Start Preview again
- **THEN** the extension MUST NOT pull the image
- **AND** the extension MUST NOT start a new container
