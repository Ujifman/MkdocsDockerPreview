## Purpose

Keeps the live MkDocs preview on the page that matches the markdown file the user is editing, and leaves the iframe alone when that file has no served page.

## Requirements

### Requirement: Active docs markdown maps to a preview page

While a preview is live, the extension MUST treat the active editor as a preview page only when it is a markdown file under the configured docs directory (relative to the workspace root). The docs directory MUST come from the docs-directory setting (default `docs`). Nested markdown files under that directory MUST map to the corresponding nested site path.

#### Scenario: Nested markdown under the default docs directory

- **WHEN** a preview is live
- **AND** the docs directory setting is the default `docs`
- **AND** the active editor is `docs/guide/intro.md` in the workspace
- **AND** that file’s page exists on the preview server
- **THEN** the preview tab MUST show that page (not the site root)

#### Scenario: Custom docs directory

- **WHEN** a preview is live
- **AND** the docs directory setting is `documentation`
- **AND** the active editor is `documentation/api.md` in the workspace
- **AND** that file’s page exists on the preview server
- **THEN** the preview tab MUST show that page

#### Scenario: site_url pathname is part of the preview path

- **WHEN** a preview is live
- **AND** the MkDocs config `site_url` pathname is `/somedocs/mkdocs`
- **AND** the active editor is `docs/stands.md` in the workspace
- **AND** that file’s page exists on the preview server
- **THEN** the preview tab MUST show the page at `/somedocs/mkdocs/stands.html` or `/somedocs/mkdocs/stands/` (not `/stands.html`)

#### Scenario: Markdown outside the docs directory is not a page

- **WHEN** a preview is live and already showing a page
- **AND** the active editor is a markdown file outside the configured docs directory
- **THEN** the preview tab MUST keep showing the last page

### Requirement: Follow the active editor continuously

While a preview session is running and the preview tab is still open, the extension MUST update the preview page whenever the active editor changes to a different docs markdown file whose page exists. Following MUST NOT steal editor focus and MUST NOT bring the preview tab forward on each editor change.

#### Scenario: Switching between docs markdown files

- **WHEN** a preview is live showing the page for `docs/a.md`
- **AND** the user makes `docs/b.md` the active editor
- **AND** `docs/b.md` has a page on the preview server
- **THEN** the preview tab MUST show the page for `docs/b.md`

#### Scenario: Follow does not reopen a closed preview tab

- **WHEN** a preview session is running
- **AND** the user has closed the preview tab
- **AND** the user changes the active editor
- **THEN** the extension MUST NOT open a new preview tab

### Requirement: Keep the last page when there is no matching served page

If the active editor is not a markdown file, has no mapped preview page, or the mapped URL does not exist on the preview server, the extension MUST leave the preview on the last page it successfully showed. The extension MUST NOT show an error toast for a missing page.

#### Scenario: Non-markdown editor keeps the last page

- **WHEN** a preview is live showing a page
- **AND** the user makes a non-markdown file the active editor
- **THEN** the preview tab MUST keep showing the last page
- **AND** the extension MUST NOT show an error toast

#### Scenario: Missing served page keeps the last page

- **WHEN** a preview is live showing a page
- **AND** the user makes a docs markdown file the active editor
- **AND** that file has no page on the preview server
- **THEN** the preview tab MUST keep showing the last page
- **AND** the extension MUST NOT show an error toast

#### Scenario: Focusing the preview or another non-editor UI keeps the last page

- **WHEN** a preview is live showing a page
- **AND** there is no active text editor (for example the preview tab or terminal is focused)
- **THEN** the preview tab MUST keep showing the last page
