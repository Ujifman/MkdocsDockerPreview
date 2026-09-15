## Purpose

VS Code settings that configure the Docker-backed MkDocs preview (image, entrypoint, serve command, workdir, config file name, docs directory).

## Requirements

### Requirement: Docker image setting

The extension MUST contribute a workspace/user setting for the Docker image used to run the preview. The default MUST be `ujifman/properdocs-material:latest`.

#### Scenario: Default image is properdocs

- **WHEN** the user has not overridden the Docker image setting
- **THEN** the extension MUST use `ujifman/properdocs-material:latest` when starting preview

#### Scenario: Blank image is rejected

- **WHEN** the user starts preview and the Docker image setting is empty or whitespace-only
- **THEN** the extension MUST NOT start a container
- **AND** the extension MUST show a clear error that the Docker image is required

### Requirement: Entrypoint setting

The extension MUST contribute a setting for the container entrypoint. The default MUST be `/bin/bash`.

#### Scenario: Default entrypoint

- **WHEN** the user has not overridden the entrypoint setting
- **THEN** the extension MUST pass `/bin/bash` as the Docker `--entrypoint` when starting preview

### Requirement: Serve command setting with config placeholder

The extension MUST contribute a setting for the serve command arguments passed after the image. The default MUST be `-c "properdocs serve -f {configFile} -a 0.0.0.0:8000"`. Before starting the container, the extension MUST replace every `{configFile}` token with the configured MkDocs config file name.

#### Scenario: Placeholder substitution

- **WHEN** the config file name setting is `mkdocs.yml` and the serve command contains `{configFile}`
- **THEN** the command passed to Docker MUST contain `mkdocs.yml` and MUST NOT contain the literal `{configFile}` token

#### Scenario: Custom serve command

- **WHEN** the user sets a custom serve command string
- **THEN** the extension MUST use that string (after `{configFile}` substitution) when starting preview

### Requirement: Workdir setting

The extension MUST contribute a setting for the container directory where the workspace is mounted and used as the working directory. The default MUST be `/build`.

#### Scenario: Default workdir

- **WHEN** the user has not overridden the workdir setting
- **THEN** the extension MUST mount the workspace at `/build` and MUST set the container working directory to `/build`

### Requirement: Config file name setting

The extension MUST contribute a setting for the MkDocs config file name. The default MUST be `mkdocs.yml`. The extension MUST resolve the config file only as `<workspaceRoot>/<configFileName>` (no subdirectory search).

#### Scenario: Default config at workspace root

- **WHEN** the workspace root contains `mkdocs.yml` and the user has not overridden the config file name
- **THEN** start preview MUST treat the config file as present at the workspace root

#### Scenario: Custom config file name

- **WHEN** the config file name setting is `mkdocs.custom.yml` and that file exists at the workspace root
- **THEN** start preview MUST use `mkdocs.custom.yml` as the resolved config file name for `{configFile}`

#### Scenario: Missing config file

- **WHEN** the user starts preview and `<workspaceRoot>/<configFileName>` does not exist
- **THEN** the extension MUST NOT start a container
- **AND** the extension MUST show a clear error naming the expected path

### Requirement: Docs directory setting

The extension MUST contribute a workspace/user setting for the MkDocs docs directory, relative to the workspace root. The default MUST be `docs`. Start Preview and editor-follow MUST use that directory when deciding whether an active markdown file is a preview page. Empty or whitespace-only values MUST be treated as `docs`.

#### Scenario: Default docs directory is docs

- **WHEN** the user has not overridden the docs directory setting
- **THEN** the extension MUST treat markdown files under `<workspaceRoot>/docs` as preview pages

#### Scenario: Custom docs directory

- **WHEN** the docs directory setting is `documentation`
- **THEN** the extension MUST treat markdown files under `<workspaceRoot>/documentation` as preview pages
- **AND** the extension MUST NOT treat markdown files under `<workspaceRoot>/docs` as preview pages unless they also sit under `documentation`

#### Scenario: Blank docs directory uses the default

- **WHEN** the docs directory setting is empty or whitespace-only
- **THEN** the extension MUST treat markdown files under `<workspaceRoot>/docs` as preview pages

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
