## ADDED Requirements

### Requirement: Start from selected Explorer config file

When Start is invoked from the Explorer with a selected config file, the extension MUST use that file as the MkDocs config for `{configFile}` substitution for that start. The workspace folder MUST still be mounted at the configured workdir. Command Palette Start Preview MUST continue to use the `configFileName` setting.

The selected file MUST be inside the workspace folder. The value substituted for `{configFile}` MUST be the file’s path relative to the workspace root, using forward slashes. If the file is outside the workspace or does not exist, the extension MUST show a clear error and MUST NOT start a container.

#### Scenario: Root properdoc.yml overrides setting

- **WHEN** the user chooses Open MKDocs Preview on workspace-root `properdoc.yml`
- **AND** the `configFileName` setting is `mkdocs.yml`
- **THEN** the serve command MUST contain `properdoc.yml`
- **AND** the serve command MUST NOT use `mkdocs.yml` for that start

#### Scenario: Nested config uses relative path

- **WHEN** the user chooses Open MKDocs Preview on a matching file at `subdir/mkdocs.yml` under the workspace
- **THEN** `{configFile}` MUST be replaced with `subdir/mkdocs.yml`
- **AND** the workspace folder MUST still be mounted at the configured workdir

#### Scenario: Palette Start still uses the setting

- **WHEN** the user runs Start Preview from the Command Palette
- **THEN** `{configFile}` MUST be replaced with the configured `configFileName`

#### Scenario: File outside workspace is rejected

- **WHEN** Start is invoked with a config file path that is not inside the workspace folder
- **THEN** the extension MUST show a clear error
- **AND** the extension MUST NOT start a container
