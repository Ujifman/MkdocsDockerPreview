## Purpose

Opening a preview tab to the live MkDocs URL after a successful start (with a loading state until serve reports the docs are built) or immediately when reopening an already-running session.

## Requirements

### Requirement: Open Simple Browser on start

After a successful Start Preview, the extension MUST open a preview tab. When a **new** container was started, that tab MUST open as soon as a host port has been discovered, MUST show a loading state until container serve logs contain `Documentation built`, and MUST then show the live preview. The live URL MUST be the MkDocs page for the active docs markdown file when that page exists on the preview server; otherwise it MUST be `http://127.0.0.1:<hostPort>`. When Start Preview is invoked while a preview is already running, the extension MUST open the preview tab immediately (no loading wait, no new container) to that same page-or-root URL.

The live MkDocs site MUST NOT be loaded in the preview tab until the built marker is seen, except when reusing a running session.

#### Scenario: Loader then live URL after new start

- **WHEN** Start Preview starts a new container and a host port has been discovered
- **THEN** the extension MUST open a preview tab immediately
- **AND** the preview tab MUST show a loading state
- **AND** the preview tab MUST NOT load `http://127.0.0.1:<hostPort>` yet

#### Scenario: Live URL after documentation is built

- **WHEN** a preview tab is showing the loading state after a new start
- **AND** container serve logs contain `Documentation built`
- **AND** no markdown file under the docs directory is active
- **THEN** the preview tab MUST show the live preview at `http://127.0.0.1:<hostPort>`

#### Scenario: Live URL is the active docs page after documentation is built

- **WHEN** a preview tab is showing the loading state after a new start
- **AND** container serve logs contain `Documentation built`
- **AND** the active editor is a markdown file under the docs directory
- **AND** that file’s page exists on the preview server
- **THEN** the preview tab MUST show that page at `http://127.0.0.1:<hostPort>/…`

#### Scenario: Browser reopens when preview already running

- **WHEN** a preview is running and the user runs Start Preview again
- **AND** no markdown file under the docs directory is active
- **THEN** the extension MUST open the preview tab at the existing preview URL immediately
- **AND** the extension MUST NOT wait for another `Documentation built` line
- **AND** the extension MUST NOT open a URL for a newly started container

#### Scenario: Browser reopens to the active docs page when preview already running

- **WHEN** a preview is running and the user runs Start Preview again
- **AND** the active editor is a markdown file under the docs directory
- **AND** that file’s page exists on the preview server
- **THEN** the extension MUST open the preview tab at that page immediately
- **AND** the extension MUST NOT wait for another `Documentation built` line
- **AND** the extension MUST NOT open a URL for a newly started container

#### Scenario: Browser opens after restart

- **WHEN** the user runs Stop Preview and then Start Preview
- **AND** a new container’s host port is discovered
- **THEN** the extension MUST open a preview tab with a loading state
- **AND** after container serve logs contain `Documentation built`, the preview tab MUST show the live preview at the page-or-root URL for that start

#### Scenario: No browser on failed start

- **WHEN** Start Preview fails before a preview URL is available
- **THEN** the extension MUST NOT open a preview tab for that failed attempt

#### Scenario: Log follow unavailable still shows live URL

- **WHEN** Start Preview starts a new container and a host port has been discovered
- **AND** container log follow is unavailable so `Documentation built` cannot be observed
- **AND** no markdown file under the docs directory is active
- **THEN** the preview tab MUST still show the live preview at `http://127.0.0.1:<hostPort>`
