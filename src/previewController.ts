import * as path from 'path';
import { configFileFromWorkspaceUri } from './configFileFromUri';
import { buildDockerRunArgs } from './dockerRunSpec';
import { PageProbe } from './pageProbe';
import { previewPathCandidates } from './previewPathFromMarkdown';
import { PreviewLogger } from './previewLogger';
import { PreviewSession } from './previewSession';
import {
  ConfigurationReader,
  readPreviewSettings,
  validateForStart,
} from './previewSettings';
import { prefixSitePath, siteUrlPathPrefixFromYaml } from './siteUrlPrefix';
import { splitArgs } from './splitArgs';

export interface ShowLiveOptions {
  reveal?: boolean;
}

export interface PreviewView {
  showLoading(): Promise<void> | void;
  showLive(url: string, options?: ShowLiveOptions): Promise<void> | void;
  isOpen(): boolean;
}

export interface PreviewControllerDeps {
  session: PreviewSession;
  readConfig: ConfigurationReader;
  previewView: PreviewView;
  showError: (message: string) => void;
  getWorkspaceRoot: () => string | undefined;
  getActiveEditorPath: () => string | undefined;
  fileExists: (filePath: string) => boolean;
  readTextFile?: (filePath: string) => string | undefined;
  pageProbe: PageProbe;
  logger: PreviewLogger;
}

export class PreviewController {
  private syncGeneration = 0;
  private lastShownUrl: string | undefined;
  private resolvedConfigFileName: string | undefined;

  constructor(private readonly deps: PreviewControllerDeps) {}

  async startPreview(configFilePath?: string): Promise<void> {
    if (this.deps.session.state === 'running' && this.deps.session.previewUrl) {
      this.deps.logger.info('Preview already running; reopening browser');
      await this.showLiveSynced(this.deps.session.previewUrl, { reveal: true });
      return;
    }

    this.deps.logger.clear();
    this.deps.logger.show();
    this.deps.logger.info('Starting MkDocs Docker Preview');

    const workspaceRoot = this.deps.getWorkspaceRoot();
    if (!workspaceRoot) {
      this.fail('Open a workspace folder to start MkDocs preview.');
      return;
    }

    const settings = readPreviewSettings(this.deps.readConfig);
    if (configFilePath) {
      const fromUri = configFileFromWorkspaceUri(workspaceRoot, configFilePath);
      if (!fromUri.ok) {
        this.fail(fromUri.error);
        return;
      }
      settings.configFileName = fromUri.configFileName;
    }
    const validation = validateForStart(
      settings,
      workspaceRoot,
      this.deps.fileExists,
      path.join,
    );
    if (!validation.ok) {
      this.fail(validation.error);
      return;
    }

    this.resolvedConfigFileName = validation.settings.configFileName;

    const dockerArgs = buildDockerRunArgs({
      workspacePath: workspaceRoot,
      workdir: validation.settings.workdir,
      entrypoint: validation.settings.entrypoint,
      image: validation.settings.dockerImage,
      substitutedServeCommand: validation.substitutedServeCommand,
    });

    try {
      const previewUrl = await this.deps.session.start(
        dockerArgs,
        validation.settings.dockerImage,
        splitArgs(validation.settings.dockerPullParams),
      );
      this.deps.logger.info(`Preview started at ${previewUrl}`);
      await this.deps.previewView.showLoading();
      try {
        await this.deps.session.waitForServeReady();
      } catch (error) {
        if (isAbort(error)) {
          return;
        }
        throw error;
      }
      await this.showLiveSynced(previewUrl, { reveal: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.fail(message);
    }
  }

  async syncToActiveEditor(): Promise<void> {
    if (this.deps.session.state !== 'running' || !this.deps.session.previewUrl) {
      return;
    }
    if (!this.deps.previewView.isOpen()) {
      return;
    }
    await this.navigateToActivePage(this.deps.session.previewUrl, {
      reveal: false,
      fallbackToBase: false,
    });
  }

  async stopPreview(): Promise<void> {
    const wasRunning = this.deps.session.state === 'running';
    await this.deps.session.stop();
    this.lastShownUrl = undefined;
    this.resolvedConfigFileName = undefined;
    if (wasRunning) {
      this.deps.logger.info('Preview stopped');
    }
  }

  async dispose(): Promise<void> {
    await this.stopPreview();
  }

  stopInBackground(): void {
    this.deps.session.stopInBackground();
  }

  private async showLiveSynced(
    baseUrl: string,
    options: ShowLiveOptions,
  ): Promise<void> {
    await this.navigateToActivePage(baseUrl, {
      reveal: options.reveal !== false,
      fallbackToBase: true,
    });
  }

  private async navigateToActivePage(
    baseUrl: string,
    options: { reveal: boolean; fallbackToBase: boolean },
  ): Promise<void> {
    const generation = ++this.syncGeneration;
    const workspaceRoot = this.deps.getWorkspaceRoot();
    const settings = readPreviewSettings(this.deps.readConfig);
    const sitePrefix = this.sitePathPrefix(workspaceRoot, settings.configFileName);
    const rootUrl = joinPreviewUrl(baseUrl, prefixSitePath('/', sitePrefix));
    const editorPath = this.deps.getActiveEditorPath();
    const candidates = previewPathCandidates(
      workspaceRoot,
      settings.docsDir,
      editorPath,
    );

    if (!candidates) {
      if (options.fallbackToBase) {
        await this.showIfCurrent(generation, rootUrl, { reveal: options.reveal });
      }
      return;
    }

    for (const sitePath of candidates) {
      if (generation !== this.syncGeneration) {
        return;
      }
      const url = joinPreviewUrl(baseUrl, prefixSitePath(sitePath, sitePrefix));
      const exists = await this.deps.pageProbe.exists(url);
      if (generation !== this.syncGeneration) {
        return;
      }
      if (exists) {
        await this.showIfCurrent(generation, url, { reveal: options.reveal });
        return;
      }
    }

    if (generation !== this.syncGeneration) {
      return;
    }

    this.deps.logger.info(
      `Preview page not found for ${editorPath ?? 'active editor'}; keeping current page`,
    );
    if (options.fallbackToBase) {
      await this.showIfCurrent(generation, rootUrl, { reveal: options.reveal });
    }
  }

  private sitePathPrefix(
    workspaceRoot: string | undefined,
    fallbackConfigFileName: string,
  ): string {
    if (!workspaceRoot || !this.deps.readTextFile) {
      return '';
    }
    const configName = this.resolvedConfigFileName ?? fallbackConfigFileName;
    const text = this.deps.readTextFile(path.join(workspaceRoot, configName));
    if (text === undefined) {
      return '';
    }
    return siteUrlPathPrefixFromYaml(text);
  }

  private async showIfCurrent(
    generation: number,
    url: string,
    options: ShowLiveOptions,
  ): Promise<void> {
    if (generation !== this.syncGeneration) {
      return;
    }
    const reveal = options.reveal !== false;
    if (url === this.lastShownUrl && !reveal) {
      return;
    }
    await this.deps.previewView.showLive(url, options);
    this.lastShownUrl = url;
  }

  private fail(message: string): void {
    this.deps.logger.error(message);
    this.deps.showError(message);
  }
}

export function joinPreviewUrl(baseUrl: string, sitePath: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  if (sitePath === '/' || sitePath === '') {
    return base;
  }
  return `${base}${sitePath.startsWith('/') ? sitePath : `/${sitePath}`}`;
}

function isAbort(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /aborted/i.test(message);
}
