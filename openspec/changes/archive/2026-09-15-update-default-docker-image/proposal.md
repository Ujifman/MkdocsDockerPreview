## Why

The default `dockerImage` setting (`docker-public.example.com/docs/properdocs:latest`) points at a private, internal registry. The repository is being published to a public GitHub repo, and this default is unreachable — and reveals an internal hostname — to anyone outside the current organization. A publicly pullable default lets the extension work out of the box for external users while still being overridable by anyone using the internal image.

## What Changes

- **BREAKING**: change the default `mkdocsDockerPreview.dockerImage` value from `docker-public.example.com/docs/properdocs:latest` to `ujifman/properdocs-material:latest` in `package.json` configuration, `src/defaults.ts` (`DEFAULT_DOCKER_IMAGE`), and every place the old default is asserted or documented (tests, README, openspec specs/design docs for this capability).
- Users who rely on the old default with no explicit `dockerImage` override will now pull `ujifman/properdocs-material:latest` instead; existing explicit overrides in user/workspace settings are unaffected.
- Update README's settings table and "Equivalent Docker command" example to the new default image.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `preview-settings`: the "Docker image setting" requirement's default value changes from `docker-public.example.com/docs/properdocs:latest` to `ujifman/properdocs-material:latest`.

## Impact

- `package.json` — `contributes.configuration.properties.mkdocsDockerPreview.dockerImage.default`
- `src/defaults.ts` — `DEFAULT_DOCKER_IMAGE`
- `tests/dockerRunSpec.test.ts`, `tests/previewController.test.ts` — assertions on the default image string
- `README.md` — settings table and equivalent `docker pull`/`docker run` example
- `openspec/specs/preview-settings/spec.md` — default value in the requirement/scenario text
- No changes to entrypoint, serve command, workdir, config file name, or container port 8000 behavior.
