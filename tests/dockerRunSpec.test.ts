import * as assert from 'assert';
import { createHash } from 'crypto';
import { buildDockerRunArgs } from '../src/dockerRunSpec';
import { splitArgs } from '../src/splitArgs';

function expectedWorkspaceHash(workspacePath: string): string {
  return createHash('sha256').update(workspacePath).digest('hex').slice(0, 16);
}

describe('splitArgs', () => {
  it('splits default bash -c serve command', () => {
    const args = splitArgs(
      '-c "properdocs serve -f mkdocs.yml -a 0.0.0.0:8000"',
    );
    assert.deepStrictEqual(args, [
      '-c',
      'properdocs serve -f mkdocs.yml -a 0.0.0.0:8000',
    ]);
  });
});

describe('buildDockerRunArgs', () => {
  it('builds portable docker run argv', () => {
    const args = buildDockerRunArgs({
      workspacePath: 'D:/repo',
      workdir: '/build',
      entrypoint: '/bin/bash',
      image: 'ujifman/properdocs-material:latest',
      substitutedServeCommand:
        '-c "properdocs serve -f mkdocs.yml -a 0.0.0.0:8000"',
    });

    assert.deepStrictEqual(args, [
      'run',
      '-d',
      '--rm',
      '--label',
      'com.mkdocs-docker-preview=1',
      '--label',
      `com.mkdocs-docker-preview.workspace=${expectedWorkspaceHash('D:/repo')}`,
      '-p',
      '127.0.0.1::8000',
      '-v',
      'D:/repo:/build',
      '-w',
      '/build',
      '--entrypoint',
      '/bin/bash',
      'ujifman/properdocs-material:latest',
      '-c',
      'properdocs serve -f mkdocs.yml -a 0.0.0.0:8000',
    ]);
  });

  it('labels the container with extension id and workspace hash', () => {
    const workspacePath = 'D:/repo';
    const args = buildDockerRunArgs({
      workspacePath,
      workdir: '/build',
      entrypoint: '/bin/bash',
      image: 'img',
      substitutedServeCommand: '-c serve',
    });
    const hash = expectedWorkspaceHash(workspacePath);
    assert.ok(args.includes('--label'));
    assert.ok(args.includes('com.mkdocs-docker-preview=1'));
    assert.ok(args.includes(`com.mkdocs-docker-preview.workspace=${hash}`));
  });

  it('hashes the same workspace path the same way', () => {
    const first = expectedWorkspaceHash('D:/repo');
    const second = expectedWorkspaceHash('D:/repo');
    assert.strictEqual(first, second);
    const argsA = buildDockerRunArgs({
      workspacePath: 'D:/repo',
      workdir: '/build',
      entrypoint: '/bin/bash',
      image: 'img',
      substitutedServeCommand: '-c serve',
    });
    const argsB = buildDockerRunArgs({
      workspacePath: 'D:/repo',
      workdir: '/build',
      entrypoint: '/bin/bash',
      image: 'img',
      substitutedServeCommand: '-c serve',
    });
    assert.deepStrictEqual(argsA, argsB);
    assert.ok(argsA.includes(`com.mkdocs-docker-preview.workspace=${first}`));
  });

  it('hashes Windows and POSIX paths as given', () => {
    const windowsPath = 'D:\\Work\\docs';
    const posixPath = '/home/user/docs';
    const windowsHash = expectedWorkspaceHash(windowsPath);
    const posixHash = expectedWorkspaceHash(posixPath);
    assert.match(windowsHash, /^[0-9a-f]{16}$/);
    assert.match(posixHash, /^[0-9a-f]{16}$/);
    assert.notStrictEqual(windowsHash, posixHash);

    const windowsArgs = buildDockerRunArgs({
      workspacePath: windowsPath,
      workdir: '/build',
      entrypoint: '/bin/bash',
      image: 'img',
      substitutedServeCommand: '-c serve',
    });
    const posixArgs = buildDockerRunArgs({
      workspacePath: posixPath,
      workdir: '/build',
      entrypoint: '/bin/bash',
      image: 'img',
      substitutedServeCommand: '-c serve',
    });
    assert.ok(
      windowsArgs.includes(
        `com.mkdocs-docker-preview.workspace=${windowsHash}`,
      ),
    );
    assert.ok(
      posixArgs.includes(`com.mkdocs-docker-preview.workspace=${posixHash}`),
    );
  });
});
