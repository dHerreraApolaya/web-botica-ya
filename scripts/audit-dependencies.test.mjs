import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAudit } from './audit-dependencies.mjs';
const finding = { github_advisory_id: 'GHSA-fc5q-39xc-vjpf', module_name: 'picomatch', severity: 'high', findings: [{ version: '4.0.7', paths: ['. > vitest@5.0.3 > picomatch@4.0.7'] }] };
const report = entries => ({ advisories: Object.fromEntries(entries.map((entry, i) => [i, entry])), metadata: { vulnerabilities: { high: entries.filter(entry => entry.severity === 'high').length, critical: entries.filter(entry => entry.severity === 'critical').length } } });
const options = { branch: 'pre-develop', now: new Date('2026-11-17T22:00:00Z'), devDependencies: { vitest: '5.0.3' } };
test('accepts only the owned temporary development exception on pre-develop', () => {
  assert.deepEqual(evaluateAudit(report([finding]), report([]), options), ['GHSA-fc5q-39xc-vjpf']);
  assert.deepEqual(evaluateAudit(report([]), report([]), options), []);
});
for (const [name, entry, runtime, overrides] of [
  ['main branch', finding, [], { branch: 'main' }],
  ['develop branch', finding, [], { branch: 'develop' }],
  ['expiry', finding, [], { now: new Date('2026-11-25T05:00:00Z') }],
  ['invalid clock', finding, [], { now: new Date('invalid') }],
  ['different advisory', { ...finding, github_advisory_id: 'GHSA-other' }, [], {}],
  ['different package', { ...finding, module_name: 'other' }, [], {}],
  ['critical escalation', { ...finding, severity: 'critical' }, [], {}],
  ['different version', { ...finding, findings: [{ version: '4.0.8', paths: finding.findings[0].paths }] }, [], {}],
  ['missing paths', { ...finding, findings: [] }, [], {}],
  ['runtime path', { ...finding, findings: [{ version: '4.0.7', paths: ['. > express@5.3.0 > picomatch@4.0.7'] }] }, [], {}],
  ['runtime vulnerability', finding, [finding], {}],
  ['additional high finding', { ...finding, github_advisory_id: 'GHSA-second' }, [], {}],
]) test(`rejects ${name}`, () => assert.throws(() => evaluateAudit(report([entry]), report(runtime), { ...options, ...overrides })));
test('fails closed on audit errors or incomplete reports', () => {
  for (const invalid of [null, {}, { error: 'registry unavailable' }, { ...report([]), metadata: { vulnerabilities: { high: 1, critical: 0 } } }]) {
    assert.throws(() => evaluateAudit(invalid, report([]), options));
    assert.throws(() => evaluateAudit(report([]), invalid, options));
  }
});
