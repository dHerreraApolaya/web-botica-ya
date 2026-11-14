import { Pool } from 'pg';
import type { ApiConfig } from '../config.js';

export function createPool(config: ApiConfig): Pool {
  return new Pool({
    host: config.BOTICAYA_DB_HOST,
    port: config.BOTICAYA_DB_PORT,
    database: config.BOTICAYA_DB_NAME,
    user: config.BOTICAYA_DB_USER,
    password: config.BOTICAYA_DB_PASSWORD,
    ssl: config.BOTICAYA_DB_SSL ? { rejectUnauthorized: true } : false,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: 10000,
    application_name: 'api-botica-ya-express',
  });
}
