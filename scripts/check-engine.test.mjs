import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const script = new URL('./check-engine.js', import.meta.url).href;
for (const [version, expected] of [
  ['20.20.0', 1],
  ['22.16.0', 1],
  ['22.18.9', 1],
  ['22.19.0', 1],
  ['22.20.0', 1],
  ['22.22.1', 1],
  ['22.22.2', 0],
  ['24.15.0', 0],
]) {
  test(`checks the configured engine against Node ${version}`, () => {
    const code = `Object.defineProperty(process.versions,'node',{value:${JSON.stringify(version)}});await import(${JSON.stringify(script)});`;
    const result = spawnSync(process.execPath, ['--input-type=module', '--eval', code], {
      encoding: 'utf8',
    });
    assert.equal(result.status, expected);
    if (expected) assert.match(result.stderr, /nvm use/);
  });
}
