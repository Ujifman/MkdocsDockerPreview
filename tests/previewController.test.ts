import * as assert from 'assert';
import * as path from 'path';
import {
  DEFAULT_CONFIG_FILE_NAME,
  DEFAULT_DOCKER_IMAGE,
  DEFAULT_ENTRYPOINT,
  DEFAULT_SERVE_COMMAND,
  DEFAULT_WORKDIR,
} from '../src/defaults';
import { DockerRunner } from '../src/dockerRunner';
import { PageProbe } from '../src/pageProbe';
import {
  PreviewController,
  PreviewControllerDeps,
  ShowLiveOptions,
} from '../src/previewController';
import { PreviewLogger } from '../src/previewLogger';
import { PreviewSession } from '../src/previewSession';
import { ConfigurationReader } from '../src/previewSettings';

class MockRunner implements DockerRunner {
  public startCount = 0;
  public stopCount = 0;
  public backgroundStopCount = 0;
  public failWith: Error | undefined;
  public lastArgs: string[] | undefined;
  public lastImage: string | undefined;
  public urls = ['http://127.0.0.1:1111', 'http://127.0.0.1:2222'];

  public waitForServeReadyCount = 0;
  public resolveServeReady: (() => void) | undefined;
  public blockServeReady = false;

  async start(dockerArgs: string[], image: string): Promise<{ containerId: string; previewUrl: string }> {
    this.startCount += 1;
    this.lastArgs = dockerArgs;
    this.lastImage = image;
    if (this.failWith) {
      throw this.failWith;
    }
    const previewUrl = this.urls[this.startCount - 1] ?? this.urls[0];
    return { containerId: `c${this.startCount}`, previewUrl };
  }

  async stop(): Promise<void> {
    this.stopCount += 1;
  }

  stopInBackground(): void {
    this.backgroundStopCount += 1;
  }

  async waitForServeReady(): Promise<void> {
    this.waitForServeReadyCount += 1;
    if (!this.blockServeReady) {
      return;
    }
    await new Promise<void>((resolve) => {
      this.resolveServeReady = resolve;
    });
  }
}

class RecordingPreviewView {
  public loadings = 0;
  public lives: Array<{ url: string; reveal: boolean }> = [];
  public open = true;

  isOpen(): boolean {
    return this.open;
  }

  showLoading(): void {
    this.loadings += 1;
  }

  showLive(url: string, options?: ShowLiveOptions): void {
    this.lives.push({ url, reveal: options?.reveal !== false });
  }
}

class RecordingLogger implements PreviewLogger {
  public infos: string[] = [];
  public errors: string[] = [];
  public clearCount = 0;
  public showCount = 0;

  info(message: string): void {
    this.infos.push(message);
  }

  error(message: string): void {
    this.errors.push(message);
  }

  append(_text: string): void {
    return;
  }

  clear(): void {
    this.clearCount += 1;
  }

  show(): void {
    this.showCount += 1;
  }

  dispose(): void {
    return;
  }
}

class FakePageProbe implements PageProbe {
  public existing = new Set<string>();
  public delays = new Map<string, number>();
  public gate: Map<string, Promise<void>> | undefined;
  public calls: string[] = [];

  async exists(url: string): Promise<boolean> {
    this.calls.push(url);
    const gated = this.gate?.get(url);
    if (gated) {
      await gated;
    }
    const delay = this.delays.get(url) ?? 0;
    if (delay > 0) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, delay);
      });
    }
    return this.existing.has(url);
  }
}

function configReader(): ConfigurationReader {
  return {
    get<T>(_key: string, defaultValue: T): T {
      return defaultValue;
    },
  };
}

async function until(predicate: () => boolean): Promise<void> {
  for (let i = 0; i < 50; i += 1) {
    if (predicate()) {
      return;
    }
    await new Promise<void>((resolve) => {
      setImmediate(resolve);
    });
  }
  throw new Error('timed out waiting for condition');
}

function liveUrls(view: RecordingPreviewView): string[] {
  return view.lives.map((entry) => entry.url);
}

function makeController(
  overrides: Partial<PreviewControllerDeps> & {
    logger?: PreviewLogger;
    activeEditorPath?: string | undefined;
    pageProbe?: FakePageProbe;
  } = {},
): {
  controller: PreviewController;
  logger: RecordingLogger;
  runner: MockRunner;
  previewView: RecordingPreviewView;
  pageProbe: FakePageProbe;
  activeEditor: { path: string | undefined };
} {
  const runner = (overrides.session
    ? undefined
    : new MockRunner()) as MockRunner | undefined;
  const logger =
    overrides.logger instanceof RecordingLogger
      ? overrides.logger
      : new RecordingLogger();
  const previewView =
    overrides.previewView instanceof RecordingPreviewView
      ? overrides.previewView
      : new RecordingPreviewView();
  const pageProbe = overrides.pageProbe ?? new FakePageProbe();
  const activeEditor = {
    path: 'activeEditorPath' in overrides ? overrides.activeEditorPath : undefined,
  };
  const controller = new PreviewController({
    session: overrides.session ?? new PreviewSession(runner!),
    readConfig: overrides.readConfig ?? configReader(),
    previewView: overrides.previewView ?? previewView,
    showError: overrides.showError ?? (() => undefined),
    getWorkspaceRoot: overrides.getWorkspaceRoot ?? (() => '/ws'),
    getActiveEditorPath:
      overrides.getActiveEditorPath ?? (() => activeEditor.path),
    fileExists: overrides.fileExists ?? (() => true),
    readTextFile: overrides.readTextFile,
    pageProbe: overrides.pageProbe ?? pageProbe,
    logger,
  });
  return {
    controller,
    logger,
    runner: runner ?? new MockRunner(),
    previewView,
    pageProbe,
    activeEditor,
  };
}

describe('PreviewController', () => {
  it('shows loading then live URL after waitForServeReady', async () => {
    const runner = new MockRunner();
    runner.blockServeReady = true;
    const previewView = new RecordingPreviewView();
    const errors: string[] = [];
    const controller = new PreviewController({
      session: new PreviewSession(runner),
      readConfig: configReader(),
      previewView,
      showError: (message) => {
        errors.push(message);
      },
      getWorkspaceRoot: () => '/ws',
      getActiveEditorPath: () => undefined,
      fileExists: () => true,
      pageProbe: new FakePageProbe(),
      logger: new RecordingLogger(),
    });

    const started = controller.startPreview();
    await until(() => previewView.loadings === 1);
    assert.strictEqual(previewView.lives.length, 0);
    runner.resolveServeReady?.();
    await started;
    assert.deepStrictEqual(liveUrls(previewView), ['http://127.0.0.1:1111']);
    assert.strictEqual(previewView.lives[0].reveal, true);
    assert.deepStrictEqual(errors, []);
  });

  it('reopens live URL immediately without loading or waiting', async () => {
    const { controller, logger, runner, previewView } = makeController();

    await controller.startPreview();
    runner.waitForServeReadyCount = 0;
    previewView.loadings = 0;
    previewView.lives = [];
    await controller.startPreview();

    assert.deepStrictEqual(liveUrls(previewView), ['http://127.0.0.1:1111']);
    assert.strictEqual(previewView.lives.length, 1);
    assert.strictEqual(previewView.lives[0].reveal, true);
    assert.strictEqual(previewView.loadings, 0);
    assert.strictEqual(runner.waitForServeReadyCount, 0);
    assert.strictEqual(runner.startCount, 1);
    assert.strictEqual(runner.stopCount, 0);
    assert.strictEqual(logger.clearCount, 1);
    assert.strictEqual(runner.lastImage, DEFAULT_DOCKER_IMAGE);
  });

  it('opens the active docs page after serve-ready when the probe succeeds', async () => {
    const pageProbe = new FakePageProbe();
    pageProbe.existing.add('http://127.0.0.1:1111/a.html');
    const { controller, previewView } = makeController({
      pageProbe,
      activeEditorPath: path.join('/ws', 'docs', 'a.md'),
    });

    await controller.startPreview();

    assert.deepStrictEqual(liveUrls(previewView), ['http://127.0.0.1:1111/a.html']);
    assert.strictEqual(previewView.lives[0]?.reveal, true);
  });

  it('prefixes the preview path with site_url from mkdocs.yml', async () => {
    const pageProbe = new FakePageProbe();
    pageProbe.existing.add('http://127.0.0.1:1111/somedocs/mkdocs/a.html');
    const { controller, previewView, activeEditor } = makeController({
      pageProbe,
      activeEditorPath: path.join('/ws', 'docs', 'a.md'),
      readTextFile: () =>
        "site_url: 'http://git.example.com/somedocs/mkdocs/'",
    });

    await controller.startPreview();
    assert.deepStrictEqual(liveUrls(previewView), [
      'http://127.0.0.1:1111/somedocs/mkdocs/a.html',
    ]);

    pageProbe.existing.add('http://127.0.0.1:1111/somedocs/mkdocs/b.html');
    previewView.lives = [];
    activeEditor.path = path.join('/ws', 'docs', 'b.md');
    await controller.syncToActiveEditor();
    assert.deepStrictEqual(liveUrls(previewView), [
      'http://127.0.0.1:1111/somedocs/mkdocs/b.html',
    ]);
  });

  it('falls back to the base URL and logs INFO when no candidate page exists', async () => {
    const pageProbe = new FakePageProbe();
    const errors: string[] = [];
    const { controller, logger, previewView } = makeController({
      pageProbe,
      activeEditorPath: path.join('/ws', 'docs', 'missing.md'),
      showError: (message) => {
        errors.push(message);
      },
    });

    await controller.startPreview();

    assert.deepStrictEqual(liveUrls(previewView), ['http://127.0.0.1:1111']);
    assert.ok(logger.infos.some((line) => /not found/i.test(line)));
    assert.deepStrictEqual(errors, []);
  });

  it('does not probe or log when the active file is not docs markdown', async () => {
    const pageProbe = new FakePageProbe();
    const { controller, logger, previewView } = makeController({
      pageProbe,
      activeEditorPath: path.join('/ws', 'src', 'main.ts'),
    });

    await controller.startPreview();

    assert.deepStrictEqual(liveUrls(previewView), ['http://127.0.0.1:1111']);
    assert.deepStrictEqual(pageProbe.calls, []);
    assert.ok(!logger.infos.some((line) => /not found/i.test(line)));
  });

  it('follows the active editor without revealing the panel', async () => {
    const pageProbe = new FakePageProbe();
    pageProbe.existing.add('http://127.0.0.1:1111/a.html');
    pageProbe.existing.add('http://127.0.0.1:1111/b.html');
    const { controller, previewView, activeEditor } = makeController({
      pageProbe,
      activeEditorPath: path.join('/ws', 'docs', 'a.md'),
    });

    await controller.startPreview();
    previewView.lives = [];
    activeEditor.path = path.join('/ws', 'docs', 'b.md');
    await controller.syncToActiveEditor();

    assert.deepStrictEqual(liveUrls(previewView), ['http://127.0.0.1:1111/b.html']);
    assert.strictEqual(previewView.lives[0]?.reveal, false);
  });

  it('does not showLive on follow when the preview panel is closed', async () => {
    const pageProbe = new FakePageProbe();
    pageProbe.existing.add('http://127.0.0.1:1111/a.html');
    pageProbe.existing.add('http://127.0.0.1:1111/b.html');
    const { controller, previewView, activeEditor } = makeController({
      pageProbe,
      activeEditorPath: path.join('/ws', 'docs', 'a.md'),
    });

    await controller.startPreview();
    previewView.lives = [];
    previewView.open = false;
    activeEditor.path = path.join('/ws', 'docs', 'b.md');
    await controller.syncToActiveEditor();

    assert.deepStrictEqual(previewView.lives, []);
  });

  it('reuses start with the active docs page when the probe succeeds', async () => {
    const pageProbe = new FakePageProbe();
    pageProbe.existing.add('http://127.0.0.1:1111/a.html');
    const { controller, previewView, runner, activeEditor } = makeController({
      pageProbe,
    });

    await controller.startPreview();
    previewView.lives = [];
    activeEditor.path = path.join('/ws', 'docs', 'a.md');
    await controller.startPreview();

    assert.strictEqual(runner.startCount, 1);
    assert.deepStrictEqual(liveUrls(previewView), ['http://127.0.0.1:1111/a.html']);
    assert.strictEqual(previewView.lives[0]?.reveal, true);
  });

  it('ignores a slower probe from an older editor switch', async () => {
    const pageProbe = new FakePageProbe();
    pageProbe.existing.add('http://127.0.0.1:1111/a.html');
    pageProbe.existing.add('http://127.0.0.1:1111/b.html');
    let releaseA: (() => void) | undefined;
    pageProbe.gate = new Map([
      [
        'http://127.0.0.1:1111/a.html',
        new Promise<void>((resolve) => {
          releaseA = resolve;
        }),
      ],
    ]);
    const { controller, previewView, activeEditor } = makeController({
      pageProbe,
      activeEditorPath: path.join('/ws', 'docs', 'a.md'),
    });

    // Start without gating so the first live load can finish.
    pageProbe.gate = undefined;
    await controller.startPreview();
    previewView.lives = [];

    pageProbe.gate = new Map([
      [
        'http://127.0.0.1:1111/a.html',
        new Promise<void>((resolve) => {
          releaseA = resolve;
        }),
      ],
    ]);
    const first = controller.syncToActiveEditor();
    await until(() => pageProbe.calls.includes('http://127.0.0.1:1111/a.html'));
    activeEditor.path = path.join('/ws', 'docs', 'b.md');
    pageProbe.gate = undefined;
    await controller.syncToActiveEditor();
    releaseA?.();
    await first;

    assert.deepStrictEqual(liveUrls(previewView), ['http://127.0.0.1:1111/b.html']);
  });

  it('does not start another container when startPreview is given a config path while running', async () => {
    const workspaceRoot = path.resolve(path.join('tmp', 'mkdocs-ws'));
    const { controller, runner } = makeController({
      getWorkspaceRoot: () => workspaceRoot,
    });

    await controller.startPreview();
    const argsAfterFirst = runner.lastArgs;
    await controller.startPreview(path.join(workspaceRoot, 'properdoc.yml'));

    assert.strictEqual(runner.startCount, 1);
    assert.strictEqual(runner.stopCount, 0);
    assert.deepStrictEqual(runner.lastArgs, argsAfterFirst);
  });

  it('does not open preview when start fails', async () => {
    const runner = new MockRunner();
    runner.failWith = new Error('Docker is unavailable');
    const previewView = new RecordingPreviewView();
    const errors: string[] = [];
    const controller = new PreviewController({
      session: new PreviewSession(runner),
      readConfig: configReader(),
      previewView,
      showError: (message) => {
        errors.push(message);
      },
      getWorkspaceRoot: () => '/ws',
      getActiveEditorPath: () => undefined,
      fileExists: () => true,
      pageProbe: new FakePageProbe(),
      logger: new RecordingLogger(),
    });

    await controller.startPreview();
    assert.strictEqual(previewView.loadings, 0);
    assert.deepStrictEqual(previewView.lives, []);
    assert.match(errors[0], /unavailable/);
  });

  it('does not open preview when config is invalid', async () => {
    const runner = new MockRunner();
    const previewView = new RecordingPreviewView();
    const errors: string[] = [];
    const controller = new PreviewController({
      session: new PreviewSession(runner),
      readConfig: {
        get<T>(key: string, defaultValue: T): T {
          if (key === 'dockerImage') {
            return '' as T;
          }
          return defaultValue;
        },
      },
      previewView,
      showError: (message) => {
        errors.push(message);
      },
      getWorkspaceRoot: () => '/ws',
      getActiveEditorPath: () => undefined,
      fileExists: () => true,
      pageProbe: new FakePageProbe(),
      logger: new RecordingLogger(),
    });

    await controller.startPreview();
    assert.strictEqual(runner.startCount, 0);
    assert.strictEqual(previewView.loadings, 0);
    assert.deepStrictEqual(previewView.lives, []);
    assert.match(errors[0], /Docker image/i);
  });

  it('skips showLive when stop happens during the wait', async () => {
    const runner = new MockRunner();
    runner.blockServeReady = true;
    const previewView = new RecordingPreviewView();
    const controller = new PreviewController({
      session: new PreviewSession(runner),
      readConfig: configReader(),
      previewView,
      showError: () => undefined,
      getWorkspaceRoot: () => '/ws',
      getActiveEditorPath: () => undefined,
      fileExists: () => true,
      pageProbe: new FakePageProbe(),
      logger: new RecordingLogger(),
    });

    const started = controller.startPreview();
    await until(() => previewView.loadings === 1);
    await controller.stopPreview();
    runner.resolveServeReady?.();
    await started;
    assert.strictEqual(previewView.loadings, 1);
    assert.deepStrictEqual(previewView.lives, []);
  });

  it('stop and dispose invoke session stop', async () => {
    const { controller, runner } = makeController();

    await controller.startPreview();
    await controller.stopPreview();
    assert.strictEqual(runner.stopCount, 1);

    await controller.startPreview();
    await controller.dispose();
    assert.strictEqual(runner.stopCount, 2);
  });

  it('stopInBackground forwards to the session without awaiting docker stop', async () => {
    const { controller, runner } = makeController();

    await controller.startPreview();
    controller.stopInBackground();
    assert.strictEqual(runner.backgroundStopCount, 1);
    assert.strictEqual(runner.stopCount, 0);
  });

  it('uses defaults from design in built docker start', async () => {
    assert.strictEqual(DEFAULT_DOCKER_IMAGE, 'ujifman/properdocs-material:latest');
    assert.strictEqual(DEFAULT_ENTRYPOINT, '/bin/bash');
    assert.ok(DEFAULT_SERVE_COMMAND.includes('{configFile}'));
    assert.strictEqual(DEFAULT_WORKDIR, '/build');
    assert.strictEqual(DEFAULT_CONFIG_FILE_NAME, 'mkdocs.yml');
  });

  it('clears and shows the log on start and logs the preview URL', async () => {
    const { controller, logger } = makeController();

    await controller.startPreview();

    assert.strictEqual(logger.clearCount, 1);
    assert.strictEqual(logger.showCount, 1);
    assert.ok(logger.infos.some((line) => line.includes('http://127.0.0.1:1111')));
  });

  it('logs validation errors and still shows the toast', async () => {
    const errors: string[] = [];
    const { controller, logger } = makeController({
      readConfig: {
        get<T>(key: string, defaultValue: T): T {
          if (key === 'dockerImage') {
            return '' as T;
          }
          return defaultValue;
        },
      },
      showError: (message) => {
        errors.push(message);
      },
    });

    await controller.startPreview();

    assert.strictEqual(logger.clearCount, 1);
    assert.strictEqual(logger.showCount, 1);
    assert.strictEqual(logger.errors[0], errors[0]);
    assert.match(errors[0], /Docker image/i);
  });

  it('logs that the preview stopped', async () => {
    const { controller, logger } = makeController();

    await controller.startPreview();
    await controller.stopPreview();

    assert.ok(logger.infos.some((line) => /stopped/i.test(line)));
  });

  it('logs that preview is already running on a second start', async () => {
    const { controller, logger } = makeController();

    await controller.startPreview();
    await controller.startPreview();

    assert.ok(logger.infos.some((line) => /already running/i.test(line)));
    assert.ok(!logger.infos.some((line) => /stopping previous/i.test(line)));
  });

  it('substitutes properdoc.yml from the selected file even when the setting is mkdocs.yml', async () => {
    const workspaceRoot = path.resolve(path.join('tmp', 'mkdocs-ws'));
    const { controller, runner } = makeController({
      getWorkspaceRoot: () => workspaceRoot,
    });

    await controller.startPreview(path.join(workspaceRoot, 'properdoc.yml'));

    const args = (runner.lastArgs ?? []).join(' ');
    assert.ok(args.includes('properdoc.yml'));
    assert.ok(!args.includes('mkdocs.yml'));
  });

  it('substitutes a nested relative path and still mounts the workspace', async () => {
    const workspaceRoot = path.resolve(path.join('tmp', 'mkdocs-ws'));
    const { controller, runner } = makeController({
      getWorkspaceRoot: () => workspaceRoot,
    });

    await controller.startPreview(path.join(workspaceRoot, 'subdir', 'mkdocs.yml'));

    const args = runner.lastArgs ?? [];
    assert.ok(args.join(' ').includes('subdir/mkdocs.yml'));
    assert.ok(args.includes(`${workspaceRoot}:${DEFAULT_WORKDIR}`));
  });

  it('uses configFileName when startPreview is called without a path', async () => {
    const { controller, runner } = makeController();

    await controller.startPreview();

    const args = (runner.lastArgs ?? []).join(' ');
    assert.ok(args.includes(DEFAULT_CONFIG_FILE_NAME));
    assert.strictEqual(runner.lastImage, DEFAULT_DOCKER_IMAGE);
  });

  it('rejects a config file outside the workspace and does not start a container', async () => {
    const workspaceRoot = path.resolve(path.join('tmp', 'mkdocs-ws'));
    const outside = path.join(path.resolve(path.join('tmp', 'other')), 'mkdocs.yml');
    const errors: string[] = [];
    const { controller, runner } = makeController({
      getWorkspaceRoot: () => workspaceRoot,
      showError: (message) => {
        errors.push(message);
      },
    });

    await controller.startPreview(outside);

    assert.strictEqual(runner.startCount, 0);
    assert.match(errors[0], /outside the workspace/i);
  });
});
