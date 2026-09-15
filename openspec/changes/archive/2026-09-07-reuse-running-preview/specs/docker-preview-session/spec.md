## REMOVED Requirements

### Requirement: Restart on explicit Start

**Reason**: Restarting on every Start churned Docker containers when the user only needed the Simple Browser tab back (for example after closing it by accident).

**Migration**: Start Preview reuses the running session and reopens the existing preview URL. To replace the container (new settings or a different config file), run Stop Preview and then Start Preview.

## ADDED Requirements

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

## MODIFIED Requirements

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
