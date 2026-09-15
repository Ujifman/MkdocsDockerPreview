import * as assert from 'assert';
import {
  DEFAULT_CONFIG_FILE_NAME,
  DEFAULT_DOCS_DIR,
  DEFAULT_DOCKER_IMAGE,
  DEFAULT_ENTRYPOINT,
  DEFAULT_SERVE_COMMAND,
  DEFAULT_WORKDIR,
} from '../src/defaults';
import {
  ConfigurationReader,
  normalizeDocsDir,
  readPreviewSettings,
  substituteConfigFile,
  validateForStart,
} from '../src/previewSettings';

function mapConfig(values: Record<string, unknown>): ConfigurationReader {
  return {
    get<T>(key: string, defaultValue: T): T {
      return (key in values ? values[key] : defaultValue) as T;
    },
  };
}

describe('previewSettings', () => {
  it('reads design defaults when config is empty', () => {
    const settings = readPreviewSettings(mapConfig({}));
    assert.strictEqual(settings.dockerImage, DEFAULT_DOCKER_IMAGE);
    assert.strictEqual(settings.entrypoint, DEFAULT_ENTRYPOINT);
    assert.strictEqual(settings.serveCommand, DEFAULT_SERVE_COMMAND);
    assert.strictEqual(settings.workdir, DEFAULT_WORKDIR);
    assert.strictEqual(settings.configFileName, DEFAULT_CONFIG_FILE_NAME);
    assert.strictEqual(settings.docsDir, DEFAULT_DOCS_DIR);
  });

  it('uses custom docsDir when set', () => {
    const settings = readPreviewSettings(mapConfig({ docsDir: 'documentation' }));
    assert.strictEqual(settings.docsDir, 'documentation');
  });

  it('treats empty or whitespace docsDir as docs', () => {
    assert.strictEqual(normalizeDocsDir(''), DEFAULT_DOCS_DIR);
    assert.strictEqual(normalizeDocsDir('   '), DEFAULT_DOCS_DIR);
    assert.strictEqual(
      readPreviewSettings(mapConfig({ docsDir: '  ' })).docsDir,
      DEFAULT_DOCS_DIR,
    );
  });

  it('rejects blank docker image', () => {
    const result = validateForStart(
      {
        dockerImage: '   ',
        entrypoint: DEFAULT_ENTRYPOINT,
        serveCommand: DEFAULT_SERVE_COMMAND,
        workdir: DEFAULT_WORKDIR,
        configFileName: DEFAULT_CONFIG_FILE_NAME,
        docsDir: DEFAULT_DOCS_DIR,
      },
      '/ws',
      () => true,
      (root, name) => `${root}/${name}`,
    );
    assert.strictEqual(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /Docker image/i);
    }
  });

  it('rejects missing config file at workspace root', () => {
    const result = validateForStart(
      {
        dockerImage: DEFAULT_DOCKER_IMAGE,
        entrypoint: DEFAULT_ENTRYPOINT,
        serveCommand: DEFAULT_SERVE_COMMAND,
        workdir: DEFAULT_WORKDIR,
        configFileName: 'mkdocs.yml',
        docsDir: DEFAULT_DOCS_DIR,
      },
      '/ws',
      () => false,
      (root, name) => `${root}/${name}`,
    );
    assert.strictEqual(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /\/ws\/mkdocs\.yml/);
    }
  });

  it('substitutes {configFile} in serve command', () => {
    const substituted = substituteConfigFile(
      DEFAULT_SERVE_COMMAND,
      'mkdocs.yml',
    );
    assert.ok(substituted.includes('mkdocs.yml'));
    assert.ok(!substituted.includes('{configFile}'));
  });

  it('uses custom config file name when present', () => {
    const result = validateForStart(
      {
        dockerImage: DEFAULT_DOCKER_IMAGE,
        entrypoint: DEFAULT_ENTRYPOINT,
        serveCommand: DEFAULT_SERVE_COMMAND,
        workdir: DEFAULT_WORKDIR,
        configFileName: 'mkdocs.custom.yml',
        docsDir: DEFAULT_DOCS_DIR,
      },
      '/ws',
      (p) => p === '/ws/mkdocs.custom.yml',
      (root, name) => `${root}/${name}`,
    );
    assert.strictEqual(result.ok, true);
    if (result.ok) {
      assert.ok(result.substitutedServeCommand.includes('mkdocs.custom.yml'));
      assert.ok(!result.substitutedServeCommand.includes('{configFile}'));
    }
  });
});
