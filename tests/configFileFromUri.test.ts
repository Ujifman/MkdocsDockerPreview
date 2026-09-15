import * as assert from 'assert';
import * as path from 'path';
import { configFileFromWorkspaceUri } from '../src/configFileFromUri';

const workspaceRoot = path.resolve(path.join('tmp', 'mkdocs-ws'));

describe('configFileFromWorkspaceUri', () => {
  it('returns mkdocs.yml for a root config file', () => {
    const result = configFileFromWorkspaceUri(
      workspaceRoot,
      path.join(workspaceRoot, 'mkdocs.yml'),
    );
    assert.deepStrictEqual(result, { ok: true, configFileName: 'mkdocs.yml' });
  });

  it('returns properdoc.yml for a root config file', () => {
    const result = configFileFromWorkspaceUri(
      workspaceRoot,
      path.join(workspaceRoot, 'properdoc.yml'),
    );
    assert.deepStrictEqual(result, { ok: true, configFileName: 'properdoc.yml' });
  });

  it('returns a nested path with forward slashes', () => {
    const result = configFileFromWorkspaceUri(
      workspaceRoot,
      path.join(workspaceRoot, 'subdir', 'mkdocs.yml'),
    );
    assert.deepStrictEqual(result, {
      ok: true,
      configFileName: 'subdir/mkdocs.yml',
    });
  });

  it('rejects a path outside the workspace', () => {
    const outside = path.join(path.resolve(path.join('tmp', 'other')), 'mkdocs.yml');
    const result = configFileFromWorkspaceUri(workspaceRoot, outside);
    assert.strictEqual(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /outside the workspace/i);
    }
  });
});
