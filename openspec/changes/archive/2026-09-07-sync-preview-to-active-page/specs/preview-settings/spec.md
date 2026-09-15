## ADDED Requirements

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
