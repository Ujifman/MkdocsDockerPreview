## ADDED Requirements

### Requirement: Pull configured image before new container start

When Start Preview starts a new container, the extension MUST pull the configured Docker image before running the container. A failed pull MUST NOT by itself abort Start Preview. After a failed pull, the extension MUST still attempt to start the container. Start MUST succeed when that run succeeds, including when a local copy of the image already exists. Start MUST fail with a clear error only when the container cannot be started. When Start Preview reuses an already-running session, the extension MUST NOT pull and MUST NOT start a new container.

#### Scenario: Pull before run on new start

- **WHEN** the user runs Start Preview and no preview is running
- **AND** the configured image can be pulled
- **THEN** the extension MUST pull that image before starting the container
- **AND** the container MUST then start with that image

#### Scenario: Failed pull still tries run

- **WHEN** the user runs Start Preview and no preview is running
- **AND** pulling the configured image fails
- **THEN** the extension MUST still attempt to start the container
- **AND** if that start succeeds, Start Preview MUST succeed

#### Scenario: Failed pull and failed run

- **WHEN** the user runs Start Preview and no preview is running
- **AND** pulling the configured image fails
- **AND** starting the container also fails
- **THEN** the extension MUST show a clear error
- **AND** the session MUST remain in a non-running state

#### Scenario: Reuse does not pull

- **WHEN** a preview is running and the user runs Start Preview again
- **THEN** the extension MUST NOT pull the image
- **AND** the extension MUST NOT start a new container
