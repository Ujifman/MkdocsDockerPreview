import { DockerRunner } from './dockerRunner';

export type SessionState = 'idle' | 'starting' | 'running' | 'stopping';

export class PreviewSession {
  private stateValue: SessionState = 'idle';
  private containerId: string | undefined;
  private previewUrlValue: string | undefined;
  private serveWaitGeneration = 0;

  constructor(private readonly runner: DockerRunner) {}

  get state(): SessionState {
    return this.stateValue;
  }

  get previewUrl(): string | undefined {
    return this.previewUrlValue;
  }

  async start(
    dockerArgs: string[],
    image: string,
    pullArgs: string[] = [],
  ): Promise<string> {
    if (this.stateValue === 'running' && this.previewUrlValue) {
      return this.previewUrlValue;
    }
    if (this.containerId) {
      await this.stop();
    }

    this.stateValue = 'starting';
    try {
      const handle = await this.runner.start(dockerArgs, image, pullArgs);
      this.containerId = handle.containerId;
      this.previewUrlValue = handle.previewUrl;
      this.stateValue = 'running';
      return handle.previewUrl;
    } catch (error) {
      this.containerId = undefined;
      this.previewUrlValue = undefined;
      this.stateValue = 'idle';
      throw error;
    }
  }

  async waitForServeReady(): Promise<void> {
    if (this.stateValue !== 'running') {
      throw new Error('Serve wait aborted');
    }
    const generation = this.serveWaitGeneration;
    await this.runner.waitForServeReady();
    if (generation !== this.serveWaitGeneration) {
      throw new Error('Serve wait aborted');
    }
  }

  async stop(): Promise<void> {
    this.serveWaitGeneration += 1;
    if (!this.containerId) {
      this.stateValue = 'idle';
      this.previewUrlValue = undefined;
      return;
    }

    const id = this.containerId;
    this.stateValue = 'stopping';
    try {
      await this.runner.stop(id);
    } catch {
      // Best-effort stop: treat as stopped even if docker fails.
    } finally {
      this.containerId = undefined;
      this.previewUrlValue = undefined;
      this.stateValue = 'idle';
    }
  }

  stopInBackground(): void {
    this.serveWaitGeneration += 1;
    if (!this.containerId) {
      return;
    }
    this.runner.stopInBackground(this.containerId);
  }
}
