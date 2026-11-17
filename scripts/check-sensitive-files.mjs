import { execFileSync } from 'node:child_process';
const staged = process.argv.includes('--staged');
const args = staged ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'] : ['ls-files', '-z'];
const files = execFileSync('git', args, { encoding: 'utf8' }).split('\0').filter(Boolean);
const blocked = files.filter((file) => {
  const name = file.split('/').at(-1);
  return (/^\.env(?:\.|$)/i.test(name) && name !== '.env.example') ||
    /\.(pem|key|p12|pfx|jks|keystore)$/i.test(name) ||
    /^(id_rsa|id_ed25519|credentials\.json|service-account.*\.json)$/i.test(name);
});
if (blocked.length) {
  console.error('Sensitive file paths blocked. Keep credentials outside Git; use empty examples.');
  process.exitCode = 1;
}
