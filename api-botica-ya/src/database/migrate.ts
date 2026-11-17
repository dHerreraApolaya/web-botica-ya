import { readFile } from 'node:fs/promises';
import { readConfig } from '../config.js';
import { createPool } from './pool.js';

const pool = createPool(readConfig(process.env));
const client = await pool.connect();
try {
  const migration = await readFile(new URL('../../sql/001-orders.sql', import.meta.url), 'utf8');
  await client.query(migration);
  process.stdout.write('Order schema is ready. Existing products were not changed.\n');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
