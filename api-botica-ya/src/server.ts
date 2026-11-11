import { createApp } from './app.js';
import { readConfig } from './config.js';
import { createPool } from './database/pool.js';

const config = readConfig(process.env);
const pool = createPool(config);
pool.on('error', () => console.error('Idle database connection failed'));
await pool.query('SELECT 1');
const server = createApp(pool, { ordersEnabled: config.BOTICAYA_ORDERS_ENABLED }).listen(
  config.PORT,
  config.BOTICAYA_HOST,
  () => process.stdout.write(`Express listening on port ${config.PORT}\n`)
);
server.requestTimeout = 15000;
server.headersTimeout = 10000;

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    const timeout = setTimeout(() => process.exit(1), 10000).unref();
    server.close(() => {
      void pool.end().then(() => {
        clearTimeout(timeout);
        process.exit(0);
      });
    });
    server.closeIdleConnections();
  });
}
