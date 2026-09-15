## ADDED Requirements

### Requirement: Docker pull extra arguments are logged

When Start Preview pulls the configured image and extra Docker pull params are set, the `MkdocsDockerPreview` channel MUST log an INFO line that includes those extra arguments along with `docker pull` and the image name.

#### Scenario: Successful pull logs extra arguments

- **WHEN** Start Preview pulls the configured image successfully
- **AND** the Docker pull params setting is `--platform=linux/amd64`
- **THEN** the channel MUST contain an INFO line with the docker pull command, `--platform=linux/amd64`, and the image name
