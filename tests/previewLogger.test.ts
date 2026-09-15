import * as assert from 'assert';
import { OutputChannelLogger } from '../src/previewLogger';

class FakeChannel {
  public lines: string[] = [];
  public clearCount = 0;
  public showPreserveFocus: boolean[] = [];
  public disposeCount = 0;

  append(value: string): void {
    this.lines.push(value);
  }

  appendLine(value: string): void {
    this.lines.push(value);
  }

  clear(): void {
    this.clearCount += 1;
  }

  show(preserveFocus?: boolean): void {
    this.showPreserveFocus.push(preserveFocus === true);
  }

  dispose(): void {
    this.disposeCount += 1;
  }
}

describe('OutputChannelLogger', () => {
  const now = () => new Date('2026-09-07T09:34:00.000Z');

  it('writes info lines with ISO-8601 timestamp and INFO', () => {
    const channel = new FakeChannel();
    const logger = new OutputChannelLogger(channel, now);

    logger.info('Starting preview');

    assert.deepStrictEqual(channel.lines, [
      '[2026-09-07T09:34:00.000Z] INFO Starting preview',
    ]);
  });

  it('writes error lines with ISO-8601 timestamp and ERROR and shows the channel', () => {
    const channel = new FakeChannel();
    const logger = new OutputChannelLogger(channel, now);

    logger.error('Docker is unavailable');

    assert.deepStrictEqual(channel.lines, [
      '[2026-09-07T09:34:00.000Z] ERROR Docker is unavailable',
    ]);
    assert.deepStrictEqual(channel.showPreserveFocus, [true]);
  });

  it('forwards clear, show(true), and dispose to the channel', () => {
    const channel = new FakeChannel();
    const logger = new OutputChannelLogger(channel, now);

    logger.clear();
    logger.show();
    logger.dispose();

    assert.strictEqual(channel.clearCount, 1);
    assert.deepStrictEqual(channel.showPreserveFocus, [true]);
    assert.strictEqual(channel.disposeCount, 1);
  });

  it('appends container log chunks without timestamp or severity prefix', () => {
    const channel = new FakeChannel();
    const logger = new OutputChannelLogger(channel, now);

    logger.append('INFO    - Serving on http://0.0.0.0:8000\n');

    assert.deepStrictEqual(channel.lines, [
      'INFO    - Serving on http://0.0.0.0:8000\n',
    ]);
  });
});
