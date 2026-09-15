## Purpose

Gives users a dedicated VS Code Output channel named MkdocsDockerPreview so extension events, Docker CLI output, and live container/serve logs are visible while diagnosing preview start, serve, and stop.

## Requirements

### Requirement: Dedicated Output channel

The extension MUST create a VS Code Output channel named `MkdocsDockerPreview` when it activates. The channel MUST appear in the Output tab dropdown of the bottom panel under that exact name.

#### Scenario: Channel available after activation

- **WHEN** the extension activates
- **THEN** an Output channel named `MkdocsDockerPreview` MUST exist

#### Scenario: Channel disposed on deactivate

- **WHEN** the extension deactivates
- **THEN** the extension MUST dispose the `MkdocsDockerPreview` Output channel

### Requirement: Show channel on start and error

The extension MUST reveal the `MkdocsDockerPreview` Output channel when a preview start is attempted and when an error is written to the channel. Revealing the channel MUST preserve editor focus.

#### Scenario: Channel shown on start attempt

- **WHEN** the user runs Start Preview
- **THEN** the extension MUST show the `MkdocsDockerPreview` Output channel
- **AND** the user's editor focus MUST be preserved

#### Scenario: Channel shown on logged error

- **WHEN** the extension writes an error line to the Output channel
- **THEN** the extension MUST show the `MkdocsDockerPreview` Output channel
- **AND** the user's editor focus MUST be preserved

### Requirement: Extension lifecycle events are logged

The extension MUST append human-readable lines to the `MkdocsDockerPreview` channel for preview lifecycle events: start attempt, validation failure, successful start with the preview URL, stop, restart, and unexpected errors. Each line MUST include an ISO-8601 timestamp and a severity of `INFO` or `ERROR`.

#### Scenario: Successful start is logged

- **WHEN** Start Preview succeeds and a preview URL is discovered
- **THEN** the channel MUST contain an INFO line that the preview started
- **AND** the channel MUST contain that preview URL

#### Scenario: Validation failure is logged

- **WHEN** Start Preview fails validation (no workspace, missing config file, or blank image)
- **THEN** the channel MUST contain an ERROR line with the same message shown to the user
- **AND** the extension MUST still show the existing error toast

#### Scenario: Stop is logged

- **WHEN** the user runs Stop Preview while a preview is running
- **THEN** the channel MUST contain an INFO line that the preview stopped

#### Scenario: Restart is logged

- **WHEN** the user runs Start Preview while a preview is already running
- **THEN** the channel MUST contain an INFO line that the previous preview is stopping
- **AND** the channel MUST then contain start lines for the new preview

### Requirement: Docker CLI output is logged

The extension MUST write each Docker CLI invocation used for preview (the command and arguments) to the `MkdocsDockerPreview` channel. Non-empty stdout and stderr from that invocation MUST be appended. A non-zero exit MUST be logged as ERROR with the command's output. A failed `docker pull` MUST be logged that way and MUST NOT show an error toast by itself; Start Preview MUST continue to `docker run`. Other failed Docker CLI commands used for preview (including `docker run`) MUST still show the existing error toast.

#### Scenario: Successful docker run is logged

- **WHEN** Start Preview runs `docker run` successfully
- **THEN** the channel MUST contain an INFO line with the docker command and arguments
- **AND** the channel MUST contain the container id from stdout when present

#### Scenario: Successful docker pull is logged

- **WHEN** Start Preview pulls the configured image successfully
- **THEN** the channel MUST contain an INFO line with the docker pull command and arguments
- **AND** the channel MUST contain non-empty stdout or stderr from that pull when present

#### Scenario: Failed docker pull is logged without aborting start

- **WHEN** Start Preview's `docker pull` fails
- **THEN** the channel MUST contain an ERROR line describing the pull failure
- **AND** the channel MUST contain the command's stderr or stdout when present
- **AND** the extension MUST NOT show an error toast for that pull failure alone
- **AND** the extension MUST still attempt `docker run`

#### Scenario: Docker failure output is logged

- **WHEN** a Docker CLI command used for preview other than a best-effort pull fails, or Docker is unavailable for `docker run`
- **THEN** the channel MUST contain an ERROR line describing the failure
- **AND** the channel MUST contain the command's stderr or stdout when present
- **AND** the extension MUST still show the existing error toast

### Requirement: Docker pull extra arguments are logged

When Start Preview pulls the configured image and extra Docker pull params are set, the `MkdocsDockerPreview` channel MUST log an INFO line that includes those extra arguments along with `docker pull` and the image name.

#### Scenario: Successful pull logs extra arguments

- **WHEN** Start Preview pulls the configured image successfully
- **AND** the Docker pull params setting is `--platform=linux/amd64`
- **THEN** the channel MUST contain an INFO line with the docker pull command, `--platform=linux/amd64`, and the image name

### Requirement: Container serve logs are streamed

While a preview container is running, the extension MUST stream that container's stdout and stderr (MkDocs/properdocs serve output) into the `MkdocsDockerPreview` channel. Streaming MUST stop when the preview stops, the workspace closes, or the extension deactivates. Failure to follow logs MUST be logged as ERROR and MUST NOT stop an otherwise successful preview.

#### Scenario: Serve output appears while running

- **WHEN** a preview container is running and it writes to stdout or stderr
- **THEN** those lines MUST appear in the `MkdocsDockerPreview` channel

#### Scenario: Streaming stops on Stop

- **WHEN** a preview is running with log streaming and the user runs Stop Preview
- **THEN** the extension MUST stop following that container's logs

#### Scenario: Follow failure does not abort preview

- **WHEN** Start Preview starts a container successfully but following container logs fails
- **THEN** the preview session MUST remain running
- **AND** the channel MUST contain an ERROR line that log follow failed

### Requirement: Fresh log for each start

When Start Preview begins a new container (including a restart), the extension MUST clear the `MkdocsDockerPreview` channel before writing that start's lines so a previous run's output is not mixed with the new run.

#### Scenario: Channel cleared on start

- **WHEN** the user runs Start Preview
- **THEN** the extension MUST clear the `MkdocsDockerPreview` channel before writing new start lines

### Requirement: Missing preview page is logged

When the active editor is a markdown file under the docs directory but that file has no page on the preview server, the extension MUST append an INFO line to the `MkdocsDockerPreview` channel naming the file (or mapped URL). The line MUST NOT be an ERROR. The extension MUST NOT show an error toast for this case.

#### Scenario: Missing page writes an info line

- **WHEN** a preview is live
- **AND** the active editor is a docs markdown file with no page on the preview server
- **THEN** the channel MUST contain an INFO line that the page was not found
- **AND** the extension MUST NOT show an error toast

#### Scenario: Non-markdown editor does not log a missing page

- **WHEN** a preview is live
- **AND** the user makes a non-markdown file the active editor
- **THEN** the extension MUST NOT write a missing-page line for that switch
