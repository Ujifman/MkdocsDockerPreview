import * as assert from 'assert';
import { ContainerHandle, DockerRunner } from '../src/dockerRunner';
import { PreviewSession } from '../src/previewSession';

class MockRunner implements DockerRunner {
  public starts: string[][] = [];
  public images: string[] = [];
  public stopped: string[] = [];
  public backgroundStopped: string[] = [];
  public nextHandle: ContainerHandle = {
    containerId: 'abc',
    previewUrl: 'http://127.0.0.1:12345',
  };
  public failStartWith: Error | undefined;
  public waitForServeReadyCount = 0;
  public resolveServeReady: (() => void) | undefined;

  async start(dockerArgs: string[], image: string): Promise<ContainerHandle> {
    this.starts.push(dockerArgs);
    this.images.push(image);
    if (this.failStartWith) {
      throw this.failStartWith;
    }
    return this.nextHandle;
  }

  async stop(containerId: string): Promise<void> {
    this.stopped.push(containerId);
  }

  stopInBackground(containerId: string): void {
    this.backgroundStopped.push(containerId);
  }

  async waitForServeReady(): Promise<void> {
    this.waitForServeReadyCount += 1;
    await new Promise<void>((resolve) => {
      this.resolveServeReady = resolve;
    });
  }
}

describe('PreviewSession', () => {
  it('starts and exposes preview URL', async () => {
    const runner = new MockRunner();
    const session = new PreviewSession(runner);
    const url = await session.start(['run', '-d'], 'example/preview:latest');
    assert.strictEqual(url, 'http://127.0.0.1:12345');
    assert.deepStrictEqual(runner.images, ['example/preview:latest']);
    assert.strictEqual(session.state, 'running');
    assert.strictEqual(session.previewUrl, url);
  });

  it('stops a running container', async () => {
    const runner = new MockRunner();
    const session = new PreviewSession(runner);
    await session.start(['run'], 'img');
    await session.stop();
    assert.deepStrictEqual(runner.stopped, ['abc']);
    assert.strictEqual(session.state, 'idle');
    assert.strictEqual(session.previewUrl, undefined);
  });

  it('stop when idle is a no-op', async () => {
    const runner = new MockRunner();
    const session = new PreviewSession(runner);
    await session.stop();
    assert.deepStrictEqual(runner.stopped, []);
    assert.strictEqual(session.state, 'idle');
  });

  it('reuses the running session on a second start', async () => {
    const runner = new MockRunner();
    const session = new PreviewSession(runner);
    await session.start(['run', 'first'], 'img');
    runner.nextHandle = {
      containerId: 'def',
      previewUrl: 'http://127.0.0.1:23456',
    };
    const url = await session.start(['run', 'second'], 'other-image');
    assert.deepStrictEqual(runner.stopped, []);
    assert.strictEqual(runner.starts.length, 1);
    assert.deepStrictEqual(runner.images, ['img']);
    assert.strictEqual(url, 'http://127.0.0.1:12345');
    assert.strictEqual(session.state, 'running');
    assert.strictEqual(session.previewUrl, 'http://127.0.0.1:12345');
  });

  it('returns to idle when start fails', async () => {
    const runner = new MockRunner();
    runner.failStartWith = new Error('Docker is unavailable');
    const session = new PreviewSession(runner);
    await assert.rejects(() => session.start(['run'], 'img'), /unavailable/);
    assert.strictEqual(session.state, 'idle');
    assert.strictEqual(session.previewUrl, undefined);
  });

  it('stopInBackground stops a running container without waiting', async () => {
    const runner = new MockRunner();
    const session = new PreviewSession(runner);
    await session.start(['run'], 'img');
    session.stopInBackground();
    assert.deepStrictEqual(runner.backgroundStopped, ['abc']);
    assert.deepStrictEqual(runner.stopped, []);
  });

  it('stopInBackground when idle is a no-op', () => {
    const runner = new MockRunner();
    const session = new PreviewSession(runner);
    session.stopInBackground();
    assert.deepStrictEqual(runner.backgroundStopped, []);
  });

  it('waitForServeReady calls the runner after start', async () => {
    const runner = new MockRunner();
    const session = new PreviewSession(runner);
    await session.start(['run'], 'img');
    const waiting = session.waitForServeReady();
    assert.strictEqual(runner.waitForServeReadyCount, 1);
    runner.resolveServeReady?.();
    await waiting;
  });

  it('stop while waiting does not treat a later runner ready as success', async () => {
    const runner = new MockRunner();
    const session = new PreviewSession(runner);
    await session.start(['run'], 'img');
    const waiting = session.waitForServeReady();
    await session.stop();
    runner.resolveServeReady?.();
    await assert.rejects(waiting, /aborted/i);
  });
});
