import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const guard = join(projectRoot, 'scripts/prevent-main-push.sh');
const oid = '1'.repeat(40);
const previousOid = '2'.repeat(40);
const zeroOid = '0'.repeat(40);
const update = (localRef, remoteRef, localOid = oid, remoteOid = previousOid) =>
  `${localRef} ${localOid} ${remoteRef} ${remoteOid}\n`;

const cases = [
  {
    name: 'allows a feature update',
    input: update('refs/heads/feature/user', 'refs/heads/feature/user'),
    status: 0,
  },
  {
    name: 'blocks a direct main update',
    input: update('refs/heads/main', 'refs/heads/main'),
    status: 1,
  },
  {
    name: 'blocks a feature refspec targeting main',
    input: update('refs/heads/feature/user', 'refs/heads/main'),
    status: 1,
  },
  { name: 'blocks HEAD targeting main', input: update('HEAD', 'refs/heads/main'), status: 1 },
  {
    name: 'blocks creation of main',
    input: update('HEAD', 'refs/heads/main', oid, zeroOid),
    status: 1,
  },
  {
    name: 'blocks deletion of main',
    input: update('(delete)', 'refs/heads/main', zeroOid),
    status: 1,
  },
  {
    name: 'allows deletion of a feature branch',
    input: update('(delete)', 'refs/heads/feature/user', zeroOid),
    status: 0,
  },
  {
    name: 'blocks main within a multi-ref push',
    input:
      update('refs/heads/feature/user', 'refs/heads/feature/user') +
      update('HEAD', 'refs/heads/main'),
    status: 1,
  },
  { name: 'allows a tag named main', input: update('refs/tags/main', 'refs/tags/main'), status: 0 },
  {
    name: 'allows main as source when destination is a feature',
    input: update('refs/heads/main', 'refs/heads/feature/repair'),
    status: 0,
  },
  { name: 'allows a push with no updated refs', input: '', status: 0 },
];

for (const scenario of cases) {
  test(scenario.name, () => {
    const result = spawnSync('sh', [guard], { input: scenario.input, encoding: 'utf8' });
    assert.ifError(result.error);
    assert.equal(result.status, scenario.status, result.stderr);
    if (scenario.status !== 0)
      assert.match(result.stderr, /main solo recibe cambios mediante pull request/);
    else assert.equal(result.stderr, '');
  });
}

test('Husky installs and invokes the guard without a real push or network access', () => {
  const sandboxRoot = mkdtempSync(join(tmpdir(), 'botica-push-guard-'));
  const repository = join(sandboxRoot, 'repository');
  mkdirSync(repository);
  const env = {
    ...process.env,
    HUSKY: '1',
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    XDG_CONFIG_HOME: join(sandboxRoot, 'config'),
  };
  const run = (command, args, input = '') => {
    const result = spawnSync(command, args, { cwd: repository, env, input, encoding: 'utf8' });
    assert.ifError(result.error);
    return result;
  };
  try {
    assert.equal(run('git', ['init', '--quiet']).status, 0);
    mkdirSync(join(repository, '.husky'));
    mkdirSync(join(repository, 'scripts'));
    cpSync(join(projectRoot, '.husky/pre-push'), join(repository, '.husky/pre-push'), {
      recursive: true,
    });
    cpSync(guard, join(repository, 'scripts/prevent-main-push.sh'), { recursive: true });
    const installed = run(process.execPath, [join(projectRoot, 'node_modules/husky/bin.js')]);
    assert.equal(installed.status, 0, installed.stderr);
    assert.equal(installed.stdout, '');
    assert.equal(
      run('git', ['config', '--local', '--get', 'core.hooksPath']).stdout.trim(),
      '.husky/_'
    );
    const blocked = run(
      'sh',
      ['.husky/_/pre-push', 'origin', 'https://example.test/repository.git'],
      update('HEAD', 'refs/heads/main')
    );
    assert.equal(blocked.status, 1, blocked.stderr);
    assert.match(blocked.stderr, /Push bloqueado/);
    const allowed = run(
      'sh',
      ['.husky/_/pre-push', 'origin', 'https://example.test/repository.git'],
      update('HEAD', 'refs/heads/feature/safe')
    );
    assert.equal(allowed.status, 0, allowed.stderr);
  } finally {
    rmSync(sandboxRoot, { recursive: true, force: true });
  }
});
