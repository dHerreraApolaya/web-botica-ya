const { createRequire } = require('node:module');
const { randomBytes, X509Certificate } = require('node:crypto');
const net = require('node:net');
const tls = require('node:tls');
const fs = require('node:fs');
const path = require('node:path');
const root = 'D:\\REPOSITORIO_PRACTICAS';
const identity = path.join(root, 'boticaya-identity-service');
const orders = path.join(root, 'boticaya-orders-service');
const { Pool } = createRequire(path.join(orders, 'package.json'))('pg');
const host = 'aws-0-us-east-2.pooler.supabase.com';
const ref = 'vwktgkmmerhedfkwuxrk';
const resultFile = path.join(__dirname, 'services-status.local');
let caFile;

function connection(user, password) {
  const url = new URL('postgresql://' + host + ':5432/postgres');
  url.username = user + '.' + ref;
  url.password = password;
  url.searchParams.set('sslmode', 'verify-full');
  url.searchParams.set('sslrootcert', caFile);
  return url.toString();
}

function trustedCertificates() {
  const configured = process.env.BOTICAYA_SUPABASE_CA_FILE;
  if (!configured) throw new Error('Indica el certificado con -CaPath en connect-services.ps1');
  caFile = fs.realpathSync(configured);
  const pem = fs.readFileSync(caFile, 'utf8');
  const certificates = pem.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
  if (!certificates?.length) throw new Error('El archivo CA debe ser PEM y contener certificados');
  if (!certificates.map((certificate) => new X509Certificate(certificate)).some((certificate) => certificate.ca)) {
    throw new Error('El archivo debe incluir una autoridad certificadora CA');
  }
  return pem;
}

async function verifyTls(ca) {
  await new Promise((resolve, reject) => {
    let secured;
    const socket = net.connect({ host, port: 5432 });
    const timer = setTimeout(() => finish(new Error('TLS connection timeout')), 15000);
    function finish(error) {
      clearTimeout(timer);
      secured?.destroy();
      socket.destroy();
      if (error) reject(error);
      else resolve();
    }
    socket.once('error', finish);
    socket.once('connect', () => {
      const request = Buffer.alloc(8);
      request.writeInt32BE(8, 0);
      request.writeInt32BE(80877103, 4);
      socket.write(request);
    });
    socket.once('data', (response) => {
      if (response.length !== 1 || response[0] !== 83) {
        return finish(new Error('El servidor PostgreSQL no aceptó TLS'));
      }
      secured = tls.connect({
        socket, servername: host, ca, rejectUnauthorized: true, minVersion: 'TLSv1.2',
      });
      secured.once('error', finish);
      secured.once('secureConnect', () => {
        if (!secured.authorized) return finish(new Error('TLS certificate is not authorized'));
        console.log('TLS verificado: CA, cadena de certificados y nombre del servidor.');
        finish();
      });
    });
  });
}

async function main() {
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
    throw new Error('Retira NODE_TLS_REJECT_UNAUTHORIZED=0 antes de continuar');
  }
  await verifyTls(trustedCertificates());
  if (process.argv.includes('--check-tls')) return;
  const password = process.env.BOTICAYA_SUPABASE_ADMIN_PASSWORD;
  if (!password) throw new Error('Missing administrator password');
  delete process.env.BOTICAYA_SUPABASE_ADMIN_PASSWORD;
  const admin = new Pool({
    connectionString: connection('postgres', password),
    connectionTimeoutMillis: 15000,
  });
  const services = [
    { directory: identity, login: 'boticaya_identity_app', group: 'boticaya_identity_backend',
      probe: 'SELECT id FROM public.roles LIMIT 1', deny: 'SELECT id FROM orders.orders LIMIT 1' },
    { directory: orders, login: 'boticaya_orders_app', group: 'boticaya_orders_backend',
      probe: 'SELECT id FROM orders.carts LIMIT 1', deny: 'SELECT id FROM public.users LIMIT 1' },
  ];
  for (const service of services) {
    service.file = path.join(service.directory, '.env');
    service.original = fs.readFileSync(service.file, 'utf8');
    service.secret = randomBytes(32).toString('hex');
  }
  let client;
  try {
    client = await admin.connect();
    await client.query('BEGIN');
    for (const service of services) {
      const exists = await client.query('SELECT 1 FROM pg_roles WHERE rolname=$1', [service.login]);
      if (exists.rowCount) throw new Error('Application role already exists: ' + service.login);
      await client.query('CREATE ROLE ' + service.login +
        " LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD '" +
        service.secret + "'");
      await client.query('GRANT ' + service.group + ' TO ' + service.login);
      await client.query('GRANT CONNECT ON DATABASE postgres TO ' + service.login);
    }
    await client.query('COMMIT');
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    throw error;
  } finally {
    client?.release();
    await admin.end();
  }
  for (const service of services) {
    service.url = connection(service.login, service.secret);
    const pool = new Pool({ connectionString: service.url, connectionTimeoutMillis: 15000 });
    try {
      await pool.query(service.probe);
      let denied = false;
      try { await pool.query(service.deny); } catch (error) {
        if (error.code !== '42501') throw error;
        denied = true;
      }
      if (!denied) throw new Error('Unexpected cross-service access');
    } finally {
      await pool.end();
    }
  }
  try {
    for (const service of services) {
      const lines = service.original.split(/\r?\n/).filter((line) => !/^DATABASE_URL=/.test(line));
      fs.writeFileSync(service.file, lines.join('\n').trimEnd() +
        '\nDATABASE_URL=' + service.url + '\n', { mode: 0o600 });
    }
  } catch (error) {
    for (const service of services) fs.writeFileSync(service.file, service.original);
    throw error;
  }
  fs.writeFileSync(resultFile, 'configured_and_permissions_verified');
  console.log('Conexiones de Identity y Pedidos configuradas. Permisos verificados.');
}

main().catch((error) => {
  fs.writeFileSync(resultFile, 'failed');
  console.error('Configuración fallida:', error.code ?? error.message);
  if (error.code === 'SELF_SIGNED_CERT_IN_CHAIN' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
    console.error('Revisa la CA del proyecto o el bundle de tu red. La verificación SSL permanece activa.');
  }
  process.exitCode = 1;
});
