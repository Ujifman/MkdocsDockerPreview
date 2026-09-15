import { createHash } from 'crypto';
import { CONTAINER_PORT } from './defaults';
import { splitArgs } from './splitArgs';

export const PREVIEW_MANAGED_LABEL = 'com.mkdocs-docker-preview=1';
export const PREVIEW_WORKSPACE_LABEL_KEY = 'com.mkdocs-docker-preview.workspace';

export interface DockerRunSpecInput {
  workspacePath: string;
  workdir: string;
  entrypoint: string;
  image: string;
  substitutedServeCommand: string;
}

export function workspaceLabelValue(workspacePath: string): string {
  return createHash('sha256').update(workspacePath).digest('hex').slice(0, 16);
}

export function buildDockerRunArgs(input: DockerRunSpecInput): string[] {
  const serveArgs = splitArgs(input.substitutedServeCommand);
  const workspaceHash = workspaceLabelValue(input.workspacePath);
  return [
    'run',
    '-d',
    '--rm',
    '--label',
    PREVIEW_MANAGED_LABEL,
    '--label',
    `${PREVIEW_WORKSPACE_LABEL_KEY}=${workspaceHash}`,
    '-p',
    `127.0.0.1::${CONTAINER_PORT}`,
    '-v',
    `${input.workspacePath}:${input.workdir}`,
    '-w',
    input.workdir,
    '--entrypoint',
    input.entrypoint,
    input.image,
    ...serveArgs,
  ];
}
