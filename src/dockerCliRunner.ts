import { spawn } from 'child_process';
import { CONTAINER_PORT } from './defaults';
import { scanDocumentationBuilt } from './documentationBuilt';
import { ContainerHandle, DockerRunner } from './dockerRunner';
import {
  PREVIEW_WORKSPACE_LABEL_KEY,
  workspaceLabelValue,
} from './dockerRunSpec';
import { PreviewLogger } from './previewLogger';

export type ExecResult = { stdout: string; stderr: string; code: number };

export type ExecFn = (
  command: string,
  args: string[],
) => Promise<ExecResult>;

export type FollowHandle = { dispose(): void };

export type FollowFn = (
  command: string,
  args: string[],
  onStdout: (chunk: string) => void,
  onStderr: (chunk: string) => void,
) => FollowHandle;

export type SpawnDetachedFn = (command: string, args: string[]) => void;

const silentLogger: PreviewLogger = {
  info(): void {
    return;
  },
  error(): void {
    return;
  },
  append(): void {
    return;
  },
  clear(): void {
    return;
  },
  show(): void {
    return;
  },
  dispose(): void {
    return;
  },
};

const noopFollow: FollowFn = () => ({
  dispose(): void {
    return;
  },
});

const noopSpawnDetached: SpawnDetachedFn = () => {
  return;
};

export class DockerUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DockerUnavailableError';
  }
}

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
  settled: boolean;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  promise.catch(() => undefined);
  return { promise, resolve, reject, settled: false };
}

export class DockerCliRunner implements DockerRunner {
  private logFollow: FollowHandle | undefined;
  private serveReady: Deferred<void> | undefined;
  private markerPending = '';

  constructor(
    private readonly exec: ExecFn = defaultExec,
    private readonly logger: PreviewLogger = silentLogger,
    private readonly follow: FollowFn = noopFollow,
    private readonly spawnDetached: SpawnDetachedFn = noopSpawnDetached,
  ) {}

  async waitForServeReady(): Promise<void> {
    if (!this.serveReady) {
      return;
    }
    await this.serveReady.promise;
  }

  async start(
    dockerArgs: string[],
    image: string,
    pullArgs: string[] = [],
  ): Promise<ContainerHandle> {
    this.abortServeReadyWait();
    this.stopLogFollow();
    await this.pullImage(image, pullArgs);
    const runResult = await this.execSafe('docker', dockerArgs);
    const containerId = runResult.stdout.trim();
    if (!containerId) {
      throw new Error(
        `Docker run produced no container id. ${runResult.stderr}`.trim(),
      );
    }

    const portResult = await this.execSafe('docker', [
      'port',
      containerId,
      String(CONTAINER_PORT),
    ]);
    const hostPort = parsePublishedHostPort(portResult.stdout);
    if (hostPort === undefined) {
      await this.stop(containerId).catch(() => undefined);
      throw new Error(
        `Could not parse published host port from: ${portResult.stdout}`,
      );
    }

    this.beginServeReadyWait();
    this.startLogFollow(containerId);

    return {
      containerId,
      previewUrl: `http://127.0.0.1:${hostPort}`,
    };
  }

  async stop(containerId: string): Promise<void> {
    this.abortServeReadyWait();
    this.stopLogFollow();
    await this.execSafe('docker', ['stop', '-t', '0', containerId]);
  }

  stopInBackground(containerId: string): void {
    this.abortServeReadyWait();
    this.stopLogFollow();
    this.spawnDetached('docker', ['stop', '-t', '0', containerId]);
  }

  async stopLeftoversForWorkspace(workspacePath: string): Promise<void> {
    const hash = workspaceLabelValue(workspacePath);
    let ids: string[];
    try {
      const result = await this.execSafe('docker', [
        'ps',
        '-q',
        '--filter',
        `label=${PREVIEW_WORKSPACE_LABEL_KEY}=${hash}`,
      ]);
      ids = result.stdout.split(/\s+/).filter(Boolean);
    } catch {
      return;
    }

    for (const id of ids) {
      await this.stop(id).catch(() => undefined);
    }
  }

  private startLogFollow(containerId: string): void {
    try {
      this.logFollow = this.follow(
        'docker',
        ['logs', '-f', '--timestamps', containerId],
        (chunk) => this.onLogChunk(chunk),
        (chunk) => this.onLogChunk(chunk),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to follow container logs: ${message}`);
      this.resolveServeReady();
    }
  }

  private onLogChunk(chunk: string): void {
    this.logger.append(chunk);
    const scanned = scanDocumentationBuilt(this.markerPending, chunk);
    this.markerPending = scanned.pending;
    if (scanned.ready) {
      this.resolveServeReady();
    }
  }

  private beginServeReadyWait(): void {
    this.markerPending = '';
    this.serveReady = createDeferred();
  }

  private resolveServeReady(): void {
    if (!this.serveReady || this.serveReady.settled) {
      return;
    }
    this.serveReady.settled = true;
    this.serveReady.resolve();
  }

  private abortServeReadyWait(): void {
    if (!this.serveReady || this.serveReady.settled) {
      return;
    }
    this.serveReady.settled = true;
    this.serveReady.reject(new Error('Serve wait aborted'));
  }

  private stopLogFollow(): void {
    this.logFollow?.dispose();
    this.logFollow = undefined;
  }

  private async pullImage(image: string, pullArgs: string[]): Promise<void> {
    try {
      await this.execSafe('docker', ['pull', ...pullArgs, image]);
    } catch {
      // Best-effort: already logged. docker run may still succeed with a local image.
    }
  }

  private async execSafe(command: string, args: string[]): Promise<ExecResult> {
    this.logger.info(formatCommand(command, args));
    let result: ExecResult;
    try {
      result = await this.exec(command, args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const wrapped = new DockerUnavailableError(
        `Docker is unavailable: ${message}`,
      );
      this.logger.error(wrapped.message);
      throw wrapped;
    }

    if (result.code !== 0) {
      const detail = (result.stderr || result.stdout || 'unknown error').trim();
      const failure = isDockerUnavailableMessage(detail)
        ? new DockerUnavailableError(`Docker is unavailable: ${detail}`)
        : new Error(`Docker command failed: ${detail}`);
      this.logger.error(failure.message);
      throw failure;
    }

    const stdout = result.stdout.trim();
    const stderr = result.stderr.trim();
    if (stdout) {
      this.logger.info(stdout);
    }
    if (stderr) {
      this.logger.info(stderr);
    }
    return result;
  }
}

export function parsePublishedHostPort(dockerPortOutput: string): number | undefined {
  // Examples: "127.0.0.1:54321" or "0.0.0.0:54321"
  const match = dockerPortOutput.trim().match(/:(\d+)\s*$/m);
  if (!match) {
    return undefined;
  }
  return Number(match[1]);
}

function formatCommand(command: string, args: string[]): string {
  return [command, ...args].join(' ');
}

function isDockerUnavailableMessage(detail: string): boolean {
  const lower = detail.toLowerCase();
  return (
    lower.includes('cannot connect to the docker daemon') ||
    lower.includes('is the docker daemon running') ||
    lower.includes('error during connect') ||
    lower.includes('docker desktop is unable') ||
    lower.includes('executable file not found')
  );
}

export function followDockerLogs(
  command: string,
  args: string[],
  onStdout: (chunk: string) => void,
  onStderr: (chunk: string) => void,
): FollowHandle {
  const child = spawn(command, args, { windowsHide: true });
  child.stdout.on('data', (chunk: Buffer) => {
    onStdout(chunk.toString());
  });
  child.stderr.on('data', (chunk: Buffer) => {
    onStderr(chunk.toString());
  });
  return {
    dispose() {
      child.kill();
    },
  };
}

export function spawnDetached(command: string, args: string[]): void {
  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();
}

async function defaultExec(command: string, args: string[]): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      reject(error);
    });
    child.on('close', (code) => {
      resolve({ stdout, stderr, code: code ?? 1 });
    });
  });
}
