import * as path from 'path';

export type ConfigFileFromUriResult =
  | { ok: true; configFileName: string }
  | { ok: false; error: string };

export function configFileFromWorkspaceUri(
  workspaceRoot: string,
  filePath: string,
): ConfigFileFromUriResult {
  const root = path.resolve(workspaceRoot);
  const file = path.resolve(filePath);
  const relative = path.relative(root, file);
  if (
    relative === '' ||
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    return {
      ok: false,
      error: `MkDocs config file is outside the workspace: ${filePath}`,
    };
  }

  return {
    ok: true,
    configFileName: relative.split(path.sep).join('/'),
  };
}
