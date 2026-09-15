## ADDED Requirements

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

### Requirement: Restart on explicit Start

When Start Preview is invoked while a preview is already running for the workspace, the extension MUST restart: stop the existing container, then start a new one.

#### Scenario: Start while running restarts

- **WHEN** a preview is running and the user explicitly runs Start Preview again
- **THEN** the extension MUST stop the existing container
- **AND** the extension MUST start a new container
- **AND** the new preview URL MAY use a different host port than before

### Requirement: Cleanup on workspace close and deactivate

The extension MUST stop the preview container when the workspace folder is closed and when the extension is deactivated (including VS Code shutdown or reload when deactivate runs).

#### Scenario: Workspace closed

- **WHEN** a preview is running and the workspace folder is closed
- **THEN** the extension MUST stop the preview container

#### Scenario: Extension deactivated

- **WHEN** a preview is running and the extension deactivates
- **THEN** the extension MUST stop the preview container
