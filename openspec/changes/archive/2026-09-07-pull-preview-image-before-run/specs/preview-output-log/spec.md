## MODIFIED Requirements

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
