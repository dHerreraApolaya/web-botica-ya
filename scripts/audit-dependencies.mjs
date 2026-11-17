import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const exception = Object.freeze({
  advisory: 'GHSA-fc5q-39xc-vjpf',
  package: 'picomatch',
  version: '4.0.7',
  owner: 'dHerreraApolaya',
  expiresAt: '2026-11-25T05:00:00.000Z',
});

function advisories(report) {
  if (!report || typeof report !== 'object' || !report.advisories || Array.isArray(report.advisories) ||
      typeof report.advisories !== 'object' || !report.metadata?.vulnerabilities || report.error) {
    throw new Error('Invalid dependency audit response');
  }
  const entries = Object.values(report.advisories);
  for (const severity of ['high', 'critical']) {
    const count = report.metadata.vulnerabilities[severity];
    if (!Number.isInteger(count) || count < 0 || entries.filter(item => item.severity === severity).length !== count) {
      throw new Error('Incomplete dependency audit response');
    }
  }
  if (entries.some(item => !['info', 'low', 'moderate', 'high', 'critical'].includes(item.severity))) {
    throw new Error('Unknown dependency audit severity');
  }
  return entries;
}

export function evaluateAudit(full, production, { branch, now, devDependencies }) {
  const all = advisories(full);
  const runtime = advisories(production);
  const high = item => ['high', 'critical'].includes(item.severity);
  if (runtime.some(high)) throw new Error('High or critical runtime dependency vulnerability');
  const accepted = [];
  for (const item of all.filter(high)) {
    const pathsAllowed = Array.isArray(item.findings) && item.findings.length > 0 && item.findings.every(finding =>
      finding.version === exception.version && Array.isArray(finding.paths) && finding.paths.length > 0 &&
      finding.paths.every(path => {
        if (typeof path !== 'string') return false;
        const direct = path.split(' > ')[1];
        return direct && Object.keys(devDependencies).some(name => direct.startsWith(`${name}@`));
      }));
    if (branch !== 'pre-develop' || !Number.isFinite(now.getTime()) || now >= new Date(exception.expiresAt) ||
        item.github_advisory_id !== exception.advisory || item.module_name !== exception.package ||
        item.severity !== 'high' || !pathsAllowed || runtime.some(entry => entry.github_advisory_id === exception.advisory)) {
      throw new Error('Unaccepted or expired dependency vulnerability');
    }
    accepted.push(exception.advisory);
  }
  return accepted;
}

function runAudit(args) {
  const result = spawnSync('pnpm', ['audit', '--json', ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.error || result.signal || ![0, 1].includes(result.status)) throw new Error('Dependency audit could not complete');
  const report = JSON.parse(result.stdout);
  advisories(report);
  console.log(JSON.stringify({ scope: args.includes('--prod') ? 'runtime' : 'complete', ...report }, null, 2));
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const full = runAudit([]);
    const runtime = runAudit(['--prod']);
    const localBranch = spawnSync('git', ['branch', '--show-current'], { encoding: 'utf8' });
    const branch = process.env.GITHUB_BASE_REF || process.env.GITHUB_REF_NAME || localBranch.stdout?.trim();
    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    const accepted = evaluateAudit(full, runtime, { branch, now: new Date(), devDependencies: manifest.devDependencies ?? {} });
    console.log(accepted.length ? `Temporary demo exception: ${accepted.join(', ')}; owner=${exception.owner}; expires=${exception.expiresAt}` : 'No high or critical dependency vulnerabilities');
  } catch {
    console.error('Dependency audit gate failed: unavailable/invalid audit, unaccepted finding, or expired exception.');
    process.exitCode = 1;
  }
}
