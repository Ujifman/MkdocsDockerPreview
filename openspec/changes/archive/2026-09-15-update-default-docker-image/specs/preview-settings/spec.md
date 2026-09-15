## MODIFIED Requirements

### Requirement: Docker image setting

The extension MUST contribute a workspace/user setting for the Docker image used to run the preview. The default MUST be `ujifman/properdocs-material:latest`.

#### Scenario: Default image is properdocs

- **WHEN** the user has not overridden the Docker image setting
- **THEN** the extension MUST use `ujifman/properdocs-material:latest` when starting preview

#### Scenario: Blank image is rejected

- **WHEN** the user starts preview and the Docker image setting is empty or whitespace-only
- **THEN** the extension MUST NOT start a container
- **AND** the extension MUST show a clear error that the Docker image is required
