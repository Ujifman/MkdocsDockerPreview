import * as assert from 'assert';
import * as path from 'path';
import { previewPathCandidates } from '../src/previewPathFromMarkdown';

describe('previewPathFromMarkdown', () => {
  const workspaceRoot = path.resolve('/ws');

  it('maps a page under docs to .html and directory URL candidates', () => {
    const file = path.join(workspaceRoot, 'docs', 'page.md');
    assert.deepStrictEqual(previewPathCandidates(workspaceRoot, 'docs', file), [
      '/page.html',
      '/page/',
    ]);
  });

  it('maps docs/index.md to / and /index.html', () => {
    const file = path.join(workspaceRoot, 'docs', 'index.md');
    assert.deepStrictEqual(previewPathCandidates(workspaceRoot, 'docs', file), [
      '/',
      '/index.html',
    ]);
  });

  it('maps nested index.md and nested pages', () => {
    const indexFile = path.join(workspaceRoot, 'docs', 'guide', 'index.md');
    assert.deepStrictEqual(
      previewPathCandidates(workspaceRoot, 'docs', indexFile),
      ['/guide/', '/guide/index.html'],
    );

    const pageFile = path.join(workspaceRoot, 'docs', 'guide', 'intro.md');
    assert.deepStrictEqual(
      previewPathCandidates(workspaceRoot, 'docs', pageFile),
      ['/guide/intro.html', '/guide/intro/'],
    );
  });

  it('uses a custom docs directory', () => {
    const file = path.join(workspaceRoot, 'documentation', 'api.md');
    assert.deepStrictEqual(
      previewPathCandidates(workspaceRoot, 'documentation', file),
      ['/api.html', '/api/'],
    );
  });

  it('returns undefined for non-markdown, outside docs, or missing workspace', () => {
    assert.strictEqual(
      previewPathCandidates(
        workspaceRoot,
        'docs',
        path.join(workspaceRoot, 'docs', 'page.txt'),
      ),
      undefined,
    );
    assert.strictEqual(
      previewPathCandidates(
        workspaceRoot,
        'docs',
        path.join(workspaceRoot, 'README.md'),
      ),
      undefined,
    );
    assert.strictEqual(
      previewPathCandidates(undefined, 'docs', path.join(workspaceRoot, 'docs', 'a.md')),
      undefined,
    );
  });

  it('normalizes Windows separators to posix site paths', () => {
    const file = 'D:\\proj\\docs\\nested\\page.md';
    const root = 'D:\\proj';
    assert.deepStrictEqual(previewPathCandidates(root, 'docs', file), [
      '/nested/page.html',
      '/nested/page/',
    ]);
  });
});
