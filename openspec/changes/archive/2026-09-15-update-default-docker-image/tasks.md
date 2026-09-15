## 1. Update failing tests to the new default (red)

- [x] 1.1 Update `tests/dockerRunSpec.test.ts` (lines ~28 and ~49) to expect `ujifman/properdocs-material:latest` instead of `docker-public.example.com/docs/properdocs:latest`, and verify `npm test` now fails only on these two assertions (production code still returns the old default).
- [x] 1.2 Update `tests/previewController.test.ts` (the `DEFAULT_DOCKER_IMAGE` assertion around line 545) to expect `ujifman/properdocs-material:latest`, and verify it fails for the same reason.

## 2. Update the default (green)

- [x] 2.1 Change `DEFAULT_DOCKER_IMAGE` in `src/defaults.ts` to `'ujifman/properdocs-material:latest'` and verify `npm test` passes (all tests from section 1 now green).
- [x] 2.2 Change `contributes.configuration.properties["mkdocsDockerPreview.dockerImage"].default` in `package.json` to `ujifman/properdocs-material:latest` and verify `npm run compile` succeeds (JSON is well-formed, no build breakage).

## 3. Update documentation

- [x] 3.1 Update the settings table entry for `mkdocsDockerPreview.dockerImage` in `README.md` (line ~23) to the new default.
- [x] 3.2 Update the "Equivalent Docker command" example in `README.md` (`docker pull` / `docker run` lines ~116-117) to reference `ujifman/properdocs-material:latest`.
- [x] 3.3 Update the `dockerImage default` line in `openspec/config.yaml` (line ~11) so future planning context reflects the new default; verify with `openspec validate --strict` that the doc still parses (rules/context arrays remain valid).

## 4. Verify full suite and change validity

- [x] 4.1 Run `npm test` (full suite) and confirm it is green with no remaining reference to `docker-public.example.com/docs/properdocs:latest` in `src/`, `tests/`, `package.json`, or `README.md` (verify via `grep -rn "docker-public.example.com" src tests package.json README.md` returning no matches).
- [x] 4.2 Run `openspec validate update-default-docker-image --strict` and confirm it passes before archiving.
