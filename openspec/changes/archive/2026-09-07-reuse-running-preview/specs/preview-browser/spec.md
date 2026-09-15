## MODIFIED Requirements

### Requirement: Open Simple Browser on start

After a successful Start Preview, the extension MUST open VS Code Simple Browser to the preview URL (`http://127.0.0.1:<hostPort>`). When Start Preview is invoked while a preview is already running, the extension MUST open Simple Browser to that session’s existing URL (no new container).

#### Scenario: Browser opens after successful start

- **WHEN** Start Preview completes successfully and a host port has been discovered
- **THEN** the extension MUST open Simple Browser at `http://127.0.0.1:<hostPort>`

#### Scenario: Browser reopens when preview already running

- **WHEN** a preview is running and the user runs Start Preview again
- **THEN** the extension MUST open Simple Browser at the existing preview URL
- **AND** the extension MUST NOT open a URL for a newly started container

#### Scenario: Browser opens after restart

- **WHEN** the user runs Stop Preview and then Start Preview
- **AND** a new container’s host port is discovered
- **THEN** the extension MUST open Simple Browser at the new preview URL

#### Scenario: No browser on failed start

- **WHEN** Start Preview fails before a preview URL is available
- **THEN** the extension MUST NOT open Simple Browser for that failed attempt
