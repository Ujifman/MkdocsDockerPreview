## ADDED Requirements

### Requirement: Open Simple Browser on start

After a successful Start Preview (including a restart), the extension MUST open VS Code Simple Browser to the discovered preview URL (`http://127.0.0.1:<hostPort>`).

#### Scenario: Browser opens after successful start

- **WHEN** Start Preview completes successfully and a host port has been discovered
- **THEN** the extension MUST open Simple Browser at `http://127.0.0.1:<hostPort>`

#### Scenario: Browser opens after restart

- **WHEN** Start Preview restarts a running session and the new container’s host port is discovered
- **THEN** the extension MUST open Simple Browser at the new preview URL

#### Scenario: No browser on failed start

- **WHEN** Start Preview fails before a preview URL is available
- **THEN** the extension MUST NOT open Simple Browser for that failed attempt
