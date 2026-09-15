## MODIFIED Requirements

### Requirement: Open MKDocs Preview Explorer item

The extension MUST contribute an Explorer context-menu item titled `Start Preview`. The item MUST appear when the user right-clicks a file whose name is `mkdocs.yml` or `properdoc.yml`. The item MUST NOT appear for other filenames. The Command Palette command for the same action MUST also be titled `Start Preview` (the palette MAY prefix it with the extension category).

#### Scenario: Menu on mkdocs.yml

- **WHEN** the user right-clicks a file named `mkdocs.yml` in the Explorer
- **THEN** the context menu MUST include `Start Preview`

#### Scenario: Menu on properdoc.yml

- **WHEN** the user right-clicks a file named `properdoc.yml` in the Explorer
- **THEN** the context menu MUST include `Start Preview`

#### Scenario: Menu hidden for other files

- **WHEN** the user right-clicks a file that is not named `mkdocs.yml` or `properdoc.yml`
- **THEN** the context menu MUST NOT include `Start Preview`

#### Scenario: Palette command uses the same title

- **WHEN** the user opens the Command Palette
- **THEN** the start command MUST appear as `Start Preview` (with or without the extension category prefix)

### Requirement: Choosing the item starts preview

Choosing `Start Preview` from the Explorer MUST use the same preview lifecycle as Command Palette Start Preview (container when idle, reuse when already running, localhost URL, Simple Browser).

#### Scenario: Right-click starts preview

- **WHEN** no preview is running
- **AND** the user chooses Start Preview on a matching config file in a valid workspace
- **THEN** the extension MUST start the preview session
- **AND** the extension MUST open the preview in Simple Browser when start succeeds

#### Scenario: Right-click while running reopens browser

- **WHEN** a preview is running
- **AND** the user chooses Start Preview on a matching config file
- **THEN** the extension MUST open Simple Browser at the existing preview URL
- **AND** the extension MUST NOT start a new container
