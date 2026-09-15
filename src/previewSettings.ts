import {
  DEFAULT_CONFIG_FILE_NAME,
  DEFAULT_DOCS_DIR,
  DEFAULT_DOCKER_IMAGE,
  DEFAULT_DOCKER_PULL_PARAMS,
  DEFAULT_ENTRYPOINT,
  DEFAULT_SERVE_COMMAND,
  DEFAULT_WORKDIR,
} from './defaults';

export interface PreviewSettings {
  dockerImage: string;
  entrypoint: string;
  serveCommand: string;
  workdir: string;
  configFileName: string;
  docsDir: string;
  dockerPullParams: string;
}

export interface ConfigurationReader {
  get<T>(key: string, defaultValue: T): T;
}

export type ValidationResult =
  | { ok: true; settings: PreviewSettings; substitutedServeCommand: string }
  | { ok: false; error: string };

export function normalizeDocsDir(value: string): string {
  const trimmed = value.trim();
  return trimmed === '' ? DEFAULT_DOCS_DIR : trimmed;
}

export function readPreviewSettings(config: ConfigurationReader): PreviewSettings {
  return {
    dockerImage: config.get('dockerImage', DEFAULT_DOCKER_IMAGE),
    entrypoint: config.get('entrypoint', DEFAULT_ENTRYPOINT),
    serveCommand: config.get('serveCommand', DEFAULT_SERVE_COMMAND),
    workdir: config.get('workdir', DEFAULT_WORKDIR),
    configFileName: config.get('configFileName', DEFAULT_CONFIG_FILE_NAME),
    docsDir: normalizeDocsDir(config.get('docsDir', DEFAULT_DOCS_DIR)),
    dockerPullParams: config.get('dockerPullParams', DEFAULT_DOCKER_PULL_PARAMS).trim(),
  };
}

export function substituteConfigFile(
  serveCommand: string,
  configFileName: string,
): string {
  return serveCommand.split('{configFile}').join(configFileName);
}

export function validateForStart(
  settings: PreviewSettings,
  workspaceRoot: string,
  fileExists: (filePath: string) => boolean,
  joinPath: (root: string, name: string) => string,
): ValidationResult {
  const dockerImage = settings.dockerImage.trim();
  if (!dockerImage) {
    return { ok: false, error: 'Docker image is required. Set mkdocsDockerPreview.dockerImage.' };
  }

  const configPath = joinPath(workspaceRoot, settings.configFileName);
  if (!fileExists(configPath)) {
    return {
      ok: false,
      error: `MkDocs config file not found: ${configPath}`,
    };
  }

  return {
    ok: true,
    settings: { ...settings, dockerImage },
    substitutedServeCommand: substituteConfigFile(
      settings.serveCommand,
      settings.configFileName,
    ),
  };
}
