## MODIFIED Requirements

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

## ADDED Requirements

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
