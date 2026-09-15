## Purpose

Lets users start MkDocs Docker Preview from the Explorer by right-clicking a recognized MkDocs config file, without using the Command Palette.

## ADDED Requirements

### Requirement: Open MKDocs Preview Explorer item

The extension MUST contribute an Explorer context-menu item titled `Open MKDocs Preview`. The item MUST appear when the user right-clicks a file whose name is `mkdocs.yml` or `properdoc.yml`. The item MUST NOT appear for other filenames.

#### Scenario: Menu on mkdocs.yml

- **WHEN** the user right-clicks a file named `mkdocs.yml` in the Explorer
- **THEN** the context menu MUST include `Open MKDocs Preview`

#### Scenario: Menu on properdoc.yml

- **WHEN** the user right-clicks a file named `properdoc.yml` in the Explorer
- **THEN** the context menu MUST include `Open MKDocs Preview`

#### Scenario: Menu hidden for other files

- **WHEN** the user right-clicks a file that is not named `mkdocs.yml` or `properdoc.yml`
- **THEN** the context menu MUST NOT include `Open MKDocs Preview`

### Requirement: Choosing the item starts preview

Choosing `Open MKDocs Preview` from the Explorer MUST start the Docker MkDocs preview for the current workspace (same lifecycle as Start Preview: container, localhost URL, Simple Browser).

#### Scenario: Right-click starts preview

- **WHEN** the user chooses `Open MKDocs Preview` on a matching config file in a valid workspace
- **THEN** the extension MUST start the preview session
- **AND** the extension MUST open the preview in Simple Browser when start succeeds
