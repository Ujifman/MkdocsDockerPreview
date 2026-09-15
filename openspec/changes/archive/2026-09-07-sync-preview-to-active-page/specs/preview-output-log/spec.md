## ADDED Requirements

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
