export const SETTINGS_SECTION = 'mkdocsDockerPreview';

export const DEFAULT_DOCKER_IMAGE = 'ujifman/properdocs-material:latest';
export const DEFAULT_ENTRYPOINT = '/bin/bash';
export const DEFAULT_SERVE_COMMAND =
  '-c "properdocs serve -f {configFile} -a 0.0.0.0:8000"';
export const DEFAULT_WORKDIR = '/build';
export const DEFAULT_CONFIG_FILE_NAME = 'mkdocs.yml';
export const DEFAULT_DOCS_DIR = 'docs';
export const DEFAULT_DOCKER_PULL_PARAMS = '--platform=linux/amd64';

export const CONTAINER_PORT = 8000;
