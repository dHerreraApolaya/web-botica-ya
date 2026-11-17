import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
const script = new URL('./check-sensitive-files.mjs', import.meta.url).pathname;
for (const [file, expected] of [
  ['.env', 1],
  ['nested/.env.production', 1],
  ['private.key', 1],
  ['.env.example', 0],
  ['src/config.ts', 0],
]) {
  test(`checks staged path ${file}`, () => {
    const cwd = mkdtempSync(join(tmpdir(), 'boticaya-path-'));
    try {
      execFileSync('git', ['init', '-q'], { cwd });
      mkdirSync(join(cwd, 'nested'), { recursive: true });
      mkdirSync(join(cwd, 'src'), { recursive: true });
      writeFileSync(join(cwd, file), 'fictional fixture');
      execFileSync('git', ['add', '--', file], { cwd });
      assert.equal(spawnSync(process.execPath, [script, '--staged'], { cwd }).status, expected);
      assert.equal(spawnSync(process.execPath, [script], { cwd }).status, expected);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
}
