## ADDED Requirements

### Requirement: Docker pull params setting

The extension MUST contribute a workspace/user setting for extra arguments passed to `docker pull` when Start Preview pulls the configured image. The default MUST be `--platform=linux/amd64`. Empty or whitespace-only values MUST be treated as no extra arguments.

#### Scenario: Default pull params pin linux/amd64

- **WHEN** the user has not overridden the Docker pull params setting
- **THEN** the extension MUST use `--platform=linux/amd64` as extra `docker pull` arguments when starting preview

#### Scenario: Custom pull params are used

- **WHEN** the user sets the Docker pull params setting to `--quiet`
- **THEN** the extension MUST use `--quiet` as extra `docker pull` arguments when starting preview

#### Scenario: Blank pull params mean no extra arguments

- **WHEN** the Docker pull params setting is empty or whitespace-only
- **THEN** the extension MUST pass no extra arguments to `docker pull` beyond the image name
