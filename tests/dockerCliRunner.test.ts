import * as assert from 'assert';
import {
  DockerCliRunner,
  DockerUnavailableError,
  ExecFn,
  FollowFn,
  SpawnDetachedFn,
  parsePublishedHostPort,
} from '../src/dockerCliRunner';
import { PreviewLogger } from '../src/previewLogger';
import { workspaceLabelValue } from '../src/dockerRunSpec';

class RecordingLogger implements PreviewLogger {
  public infos: string[] = [];
  public errors: string[] = [];
  public appends: string[] = [];

  info(message: string): void {
    this.infos.push(message);
  }

  error(message: string): void {
    this.errors.push(message);
  }

  append(text: string): void {
    this.appends.push(text);
  }

  clear(): void {
    return;
  }

  show(): void {
    return;
  }

  dispose(): void {
    return;
  }
}

function successfulExec(): ExecFn {
  return async (_command, args) => {
    if (args[0] === 'run') {
      return { stdout: 'cid123\n', stderr: '', code: 0 };
    }
    if (args[0] === 'port') {
      return { stdout: '127.0.0.1:49152\n', stderr: '', code: 0 };
    }
    return { stdout: '', stderr: '', code: 0 };
  };
}

describe('parsePublishedHostPort', () => {
  it('parses localhost mapping', () => {
    assert.strictEqual(parsePublishedHostPort('127.0.0.1:54321\n'), 54321);
  });
});

describe('DockerCliRunner', () => {
  it('starts container and builds preview URL from docker port', async () => {
    const calls: Array<{ command: string; args: string[] }> = [];
    const exec: ExecFn = async (command, args) => {
      calls.push({ command, args });
      if (args[0] === 'run') {
        return { stdout: 'cid123\n', stderr: '', code: 0 };
      }
      if (args[0] === 'port') {
        return { stdout: '127.0.0.1:49152\n', stderr: '', code: 0 };
      }
      return { stdout: '', stderr: '', code: 0 };
    };

    const runner = new DockerCliRunner(exec);
    const handle = await runner.start(['run', '-d', '--rm', 'img'], 'img');
    assert.strictEqual(handle.containerId, 'cid123');
    assert.strictEqual(handle.previewUrl, 'http://127.0.0.1:49152');
    assert.strictEqual(calls[0].command, 'docker');
    assert.deepStrictEqual(calls[0].args, ['pull', 'img']);
    assert.deepStrictEqual(calls[1].args, ['run', '-d', '--rm', 'img']);
    assert.deepStrictEqual(calls[2].args, ['port', 'cid123', '8000']);
  });

  it('stops container via docker stop -t 0', async () => {
    const calls: string[][] = [];
    const exec: ExecFn = async (_command, args) => {
      calls.push(args);
      return { stdout: '', stderr: '', code: 0 };
    };
    const runner = new DockerCliRunner(exec);
    await runner.stop('cid123');
    assert.deepStrictEqual(calls[0], ['stop', '-t', '0', 'cid123']);
  });

  it('maps spawn failure to DockerUnavailableError', async () => {
    const exec: ExecFn = async () => {
      throw new Error('spawn docker ENOENT');
    };
    const runner = new DockerCliRunner(exec);
    await assert.rejects(
      () => runner.start(['run'], 'img'),
      (error: unknown) => error instanceof DockerUnavailableError,
    );
  });

  it('maps non-zero docker run to failure', async () => {
    const exec: ExecFn = async () => ({
      stdout: '',
      stderr: 'image not found',
      code: 125,
    });
    const runner = new DockerCliRunner(exec);
    await assert.rejects(() => runner.start(['run'], 'img'), /image not found/);
  });

  it('pulls the image before docker run', async () => {
    const calls: string[][] = [];
    const exec: ExecFn = async (_command, args) => {
      calls.push(args);
      if (args[0] === 'run') {
        return { stdout: 'cid123\n', stderr: '', code: 0 };
      }
      if (args[0] === 'port') {
        return { stdout: '127.0.0.1:49152\n', stderr: '', code: 0 };
      }
      return { stdout: '', stderr: '', code: 0 };
    };
    const runner = new DockerCliRunner(exec);
    await runner.start(['run', '-d', '--rm', 'img'], 'example/preview:latest');
    assert.deepStrictEqual(calls[0], ['pull', 'example/preview:latest']);
    assert.strictEqual(calls[1][0], 'run');
  });

  it('inserts extra pull args before the image', async () => {
    const calls: string[][] = [];
    const exec: ExecFn = async (_command, args) => {
      calls.push(args);
      if (args[0] === 'run') {
        return { stdout: 'cid123\n', stderr: '', code: 0 };
      }
      if (args[0] === 'port') {
        return { stdout: '127.0.0.1:49152\n', stderr: '', code: 0 };
      }
      return { stdout: '', stderr: '', code: 0 };
    };
    const runner = new DockerCliRunner(exec);
    await runner.start(
      ['run', '-d', '--rm', 'img'],
      'example/preview:latest',
      ['--platform=linux/amd64'],
    );
    assert.deepStrictEqual(calls[0], [
      'pull',
      '--platform=linux/amd64',
      'example/preview:latest',
    ]);
    assert.strictEqual(calls[1][0], 'run');
  });

  it('omits extra pull args when they are empty', async () => {
    const calls: string[][] = [];
    const exec: ExecFn = async (_command, args) => {
      calls.push(args);
      if (args[0] === 'run') {
        return { stdout: 'cid123\n', stderr: '', code: 0 };
      }
      if (args[0] === 'port') {
        return { stdout: '127.0.0.1:49152\n', stderr: '', code: 0 };
      }
      return { stdout: '', stderr: '', code: 0 };
    };
    const runner = new DockerCliRunner(exec);
    await runner.start(['run', '-d', '--rm', 'img'], 'img', []);
    assert.deepStrictEqual(calls[0], ['pull', 'img']);
  });

  it('still runs when pull fails', async () => {
    const calls: string[][] = [];
    const exec: ExecFn = async (_command, args) => {
      calls.push(args);
      if (args[0] === 'pull') {
        return { stdout: '', stderr: 'network error', code: 1 };
      }
      if (args[0] === 'run') {
        return { stdout: 'cid123\n', stderr: '', code: 0 };
      }
      if (args[0] === 'port') {
        return { stdout: '127.0.0.1:49152\n', stderr: '', code: 0 };
      }
      return { stdout: '', stderr: '', code: 0 };
    };
    const runner = new DockerCliRunner(exec);
    const handle = await runner.start(['run', '-d', '--rm', 'img'], 'img');
    assert.strictEqual(handle.containerId, 'cid123');
    assert.strictEqual(calls[0][0], 'pull');
    assert.strictEqual(calls[1][0], 'run');
  });

  it('logs docker command, args, and container id on successful run', async () => {
    const logger = new RecordingLogger();
    const runner = new DockerCliRunner(successfulExec(), logger);
    await runner.start(['run', '-d', '--rm', 'img'], 'img');
    assert.ok(
      logger.infos.some((line) => line.includes('docker') && line.includes('run')),
    );
    assert.ok(logger.infos.some((line) => line.includes('cid123')));
  });

  it('logs ERROR with stderr when docker fails and still throws', async () => {
    const logger = new RecordingLogger();
    const exec: ExecFn = async () => ({
      stdout: '',
      stderr: 'image not found',
      code: 125,
    });
    const runner = new DockerCliRunner(exec, logger);
    await assert.rejects(() => runner.start(['run'], 'img'), /image not found/);
    assert.ok(logger.errors.some((line) => /image not found/.test(line)));
  });

  it('logs INFO with the pull command on a successful pull', async () => {
    const logger = new RecordingLogger();
    const exec: ExecFn = async (_command, args) => {
      if (args[0] === 'pull') {
        return { stdout: 'Status: Downloaded newer image\n', stderr: '', code: 0 };
      }
      return successfulExec()(_command, args);
    };
    const runner = new DockerCliRunner(exec, logger);
    await runner.start(['run', '-d', '--rm', 'img'], 'img');
    assert.ok(
      logger.infos.some((line) => line.includes('docker') && line.includes('pull') && line.includes('img')),
    );
    assert.ok(logger.infos.some((line) => line.includes('Downloaded newer image')));
  });

  it('logs INFO with extra pull args on a successful pull', async () => {
    const logger = new RecordingLogger();
    const exec: ExecFn = async (_command, args) => {
      if (args[0] === 'pull') {
        return { stdout: 'Status: Downloaded newer image\n', stderr: '', code: 0 };
      }
      return successfulExec()(_command, args);
    };
    const runner = new DockerCliRunner(exec, logger);
    await runner.start(
      ['run', '-d', '--rm', 'img'],
      'img',
      ['--platform=linux/amd64'],
    );
    assert.ok(
      logger.infos.some(
        (line) =>
          line.includes('docker') &&
          line.includes('pull') &&
          line.includes('--platform=linux/amd64') &&
          line.includes('img'),
      ),
    );
  });

  it('still runs when pull with extras fails', async () => {
    const calls: string[][] = [];
    const exec: ExecFn = async (_command, args) => {
      calls.push(args);
      if (args[0] === 'pull') {
        return { stdout: '', stderr: 'network error', code: 1 };
      }
      if (args[0] === 'run') {
        return { stdout: 'cid123\n', stderr: '', code: 0 };
      }
      if (args[0] === 'port') {
        return { stdout: '127.0.0.1:49152\n', stderr: '', code: 0 };
      }
      return { stdout: '', stderr: '', code: 0 };
    };
    const runner = new DockerCliRunner(exec);
    const handle = await runner.start(
      ['run', '-d', '--rm', 'img'],
      'img',
      ['--platform=linux/amd64'],
    );
    assert.strictEqual(handle.containerId, 'cid123');
    assert.deepStrictEqual(calls[0], ['pull', '--platform=linux/amd64', 'img']);
    assert.strictEqual(calls[1][0], 'run');
  });

  it('logs ERROR on pull failure and still starts when run succeeds', async () => {
    const logger = new RecordingLogger();
    const exec: ExecFn = async (_command, args) => {
      if (args[0] === 'pull') {
        return { stdout: '', stderr: 'pull access denied', code: 1 };
      }
      return successfulExec()(_command, args);
    };
    const runner = new DockerCliRunner(exec, logger);
    const handle = await runner.start(['run', '-d', '--rm', 'img'], 'img');
    assert.strictEqual(handle.containerId, 'cid123');
    assert.ok(logger.errors.some((line) => /pull access denied/.test(line)));
  });

  it('throws when run fails after a failed pull', async () => {
    const exec: ExecFn = async (_command, args) => {
      if (args[0] === 'pull') {
        return { stdout: '', stderr: 'network error', code: 1 };
      }
      if (args[0] === 'run') {
        return { stdout: '', stderr: 'Unable to find image', code: 125 };
      }
      return { stdout: '', stderr: '', code: 0 };
    };
    const runner = new DockerCliRunner(exec);
    await assert.rejects(
      () => runner.start(['run', '-d', '--rm', 'img'], 'img'),
      /Unable to find image/,
    );
  });

  it('logs ERROR when Docker is unavailable and still throws', async () => {
    const logger = new RecordingLogger();
    const exec: ExecFn = async () => {
      throw new Error('spawn docker ENOENT');
    };
    const runner = new DockerCliRunner(exec, logger);
    await assert.rejects(
      () => runner.start(['run'], 'img'),
      (error: unknown) => error instanceof DockerUnavailableError,
    );
    assert.ok(logger.errors.some((line) => /unavailable|ENOENT/i.test(line)));
  });

  it('follows docker logs after a successful start', async () => {
    const logger = new RecordingLogger();
    const followCalls: Array<{ command: string; args: string[] }> = [];
    const follow: FollowFn = (command, args, onStdout, onStderr) => {
      followCalls.push({ command, args });
      onStdout('Serving on http://0.0.0.0:8000\n');
      onStderr('WARNING - missing plugin\n');
      return { dispose() {} };
    };
    const runner = new DockerCliRunner(successfulExec(), logger, follow);
    await runner.start(['run', '-d', '--rm', 'img'], 'img');
    assert.strictEqual(followCalls.length, 1);
    assert.strictEqual(followCalls[0].command, 'docker');
    assert.deepStrictEqual(followCalls[0].args, [
      'logs',
      '-f',
      '--timestamps',
      'cid123',
    ]);
    assert.ok(logger.appends.includes('Serving on http://0.0.0.0:8000\n'));
    assert.ok(logger.appends.includes('WARNING - missing plugin\n'));
  });

  it('disposes log follow before docker stop', async () => {
    const events: string[] = [];
    const follow: FollowFn = () => ({
      dispose() {
        events.push('follow-dispose');
      },
    });
    const exec: ExecFn = async (_command, args) => {
      if (args[0] === 'stop') {
        events.push('docker-stop');
      }
      return successfulExec()(_command, args);
    };
    const runner = new DockerCliRunner(exec, new RecordingLogger(), follow);
    const handle = await runner.start(['run', '-d', '--rm', 'img'], 'img');
    await runner.stop(handle.containerId);
    assert.deepStrictEqual(events, ['follow-dispose', 'docker-stop']);
  });

  it('keeps the preview running when log follow fails', async () => {
    const logger = new RecordingLogger();
    const follow: FollowFn = () => {
      throw new Error('cannot follow logs');
    };
    const runner = new DockerCliRunner(successfulExec(), logger, follow);
    const handle = await runner.start(['run', '-d', '--rm', 'img'], 'img');
    assert.strictEqual(handle.containerId, 'cid123');
    assert.strictEqual(handle.previewUrl, 'http://127.0.0.1:49152');
    assert.ok(logger.errors.some((line) => /follow/i.test(line)));
  });

  it('stopInBackground spawns docker stop -t 0 without waiting', () => {
    const calls: Array<{ command: string; args: string[] }> = [];
    let returned = false;
    const spawnDetached: SpawnDetachedFn = (command, args) => {
      assert.strictEqual(returned, false, 'must not wait for spawn to finish');
      calls.push({ command, args });
    };
    const runner = new DockerCliRunner(
      successfulExec(),
      new RecordingLogger(),
      () => ({ dispose() {} }),
      spawnDetached,
    );
    runner.stopInBackground('cid123');
    returned = true;
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].command, 'docker');
    assert.deepStrictEqual(calls[0].args, ['stop', '-t', '0', 'cid123']);
  });

  it('stops leftover containers listed by workspace label', async () => {
    const hash = workspaceLabelValue('D:/repo');
    const calls: string[][] = [];
    const exec: ExecFn = async (_command, args) => {
      calls.push(args);
      if (args[0] === 'ps') {
        return { stdout: 'cidA\ncidB\n', stderr: '', code: 0 };
      }
      return { stdout: '', stderr: '', code: 0 };
    };
    const runner = new DockerCliRunner(exec);
    await runner.stopLeftoversForWorkspace('D:/repo');
    assert.deepStrictEqual(calls[0], [
      'ps',
      '-q',
      '--filter',
      `label=com.mkdocs-docker-preview.workspace=${hash}`,
    ]);
    assert.deepStrictEqual(calls[1], ['stop', '-t', '0', 'cidA']);
    assert.deepStrictEqual(calls[2], ['stop', '-t', '0', 'cidB']);
  });

  it('leftover cleanup is a no-op when docker ps returns no ids', async () => {
    const calls: string[][] = [];
    const exec: ExecFn = async (_command, args) => {
      calls.push(args);
      if (args[0] === 'ps') {
        return { stdout: '\n', stderr: '', code: 0 };
      }
      return { stdout: '', stderr: '', code: 0 };
    };
    const runner = new DockerCliRunner(exec);
    await runner.stopLeftoversForWorkspace('D:/repo');
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0][0], 'ps');
  });

  it('leftover cleanup does not throw when Docker is unavailable', async () => {
    const exec: ExecFn = async () => {
      throw new Error('spawn docker ENOENT');
    };
    const runner = new DockerCliRunner(exec);
    await runner.stopLeftoversForWorkspace('D:/repo');
  });

  it('leftover cleanup does not throw when stop fails', async () => {
    const exec: ExecFn = async (_command, args) => {
      if (args[0] === 'ps') {
        return { stdout: 'cidA\n', stderr: '', code: 0 };
      }
      return { stdout: '', stderr: 'cannot stop', code: 1 };
    };
    const runner = new DockerCliRunner(exec);
    await runner.stopLeftoversForWorkspace('D:/repo');
  });

  it('waitForServeReady completes when a follow chunk contains Documentation built', async () => {
    let onStdout: (chunk: string) => void = () => undefined;
    const follow: FollowFn = (_command, _args, stdout) => {
      onStdout = stdout;
      return { dispose() {} };
    };
    const runner = new DockerCliRunner(successfulExec(), new RecordingLogger(), follow);
    await runner.start(['run', '-d', '--rm', 'img'], 'img');

    const ready = runner.waitForServeReady();
    onStdout('INFO    -  Documentation built in 1.23 seconds\n');
    await ready;
  });

  it('waitForServeReady completes immediately when log follow fails', async () => {
    const follow: FollowFn = () => {
      throw new Error('cannot follow logs');
    };
    const runner = new DockerCliRunner(successfulExec(), new RecordingLogger(), follow);
    await runner.start(['run', '-d', '--rm', 'img'], 'img');
    await runner.waitForServeReady();
  });

  it('waitForServeReady does not hang when stop is called during the wait', async () => {
    const follow: FollowFn = () => ({ dispose() {} });
    const runner = new DockerCliRunner(successfulExec(), new RecordingLogger(), follow);
    const handle = await runner.start(['run', '-d', '--rm', 'img'], 'img');
    const waiting = runner.waitForServeReady();
    await runner.stop(handle.containerId);
    await assert.rejects(waiting, /aborted/i);
  });
});
