import * as path from 'path';

/**
 * Maps a markdown file under the docs directory to MkDocs site path candidates.
 * Returns undefined when the file is not a docs markdown page.
 */
export function previewPathCandidates(
  workspaceRoot: string | undefined,
  docsDir: string,
  filePath: string | undefined,
): string[] | undefined {
  if (!workspaceRoot || !filePath) {
    return undefined;
  }

  const root = path.resolve(workspaceRoot);
  const file = path.resolve(filePath);
  const relative = path.relative(root, file);
  if (
    relative === '' ||
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    return undefined;
  }

  const posixRelative = relative.split(path.sep).join('/');
  if (!posixRelative.toLowerCase().endsWith('.md')) {
    return undefined;
  }

  const docsPrefix = docsDir
    .split(/[/\\]+/)
    .filter((part) => part.length > 0)
    .join('/');
  const docsWithSlash = docsPrefix === '' ? '' : `${docsPrefix}/`;
  if (docsPrefix !== '' && !posixRelative.startsWith(docsWithSlash) && posixRelative !== docsPrefix) {
    return undefined;
  }
  if (docsPrefix === '' && posixRelative.includes('/')) {
    // empty docs dir would mean workspace root; still allow files at root only when docsDir is empty after normalize — we never pass empty
  }

  const underDocs =
    docsPrefix === ''
      ? posixRelative
      : posixRelative === docsPrefix
        ? ''
        : posixRelative.slice(docsWithSlash.length);

  if (underDocs === '' || underDocs.endsWith('/')) {
    return undefined;
  }

  const withoutExt = underDocs.slice(0, -'.md'.length);
  if (withoutExt === 'index' || withoutExt.endsWith('/index')) {
    const dir = withoutExt === 'index' ? '' : withoutExt.slice(0, -'/index'.length);
    if (dir === '') {
      return ['/', '/index.html'];
    }
    return [`/${dir}/`, `/${dir}/index.html`];
  }

  return [`/${withoutExt}.html`, `/${withoutExt}/`];
}
