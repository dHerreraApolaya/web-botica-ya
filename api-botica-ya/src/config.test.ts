import { describe, expect, it } from 'vitest';
import { readConfig } from './config.js';
import { createPool } from './database/pool.js';

const credentials = {
  BOTICAYA_DB_USER: 'test-user',
  BOTICAYA_DB_PASSWORD: 'test-only-placeholder',
};

describe('API configuration', () => {
  it('keeps the Spring connection defaults and requires backend credentials', () => {
    expect(readConfig(credentials)).toMatchObject({
      BOTICAYA_DB_HOST: 'localhost',
      BOTICAYA_DB_PORT: 5432,
      BOTICAYA_DB_NAME: 'boticaya_dev',
      PORT: 8081,
      BOTICAYA_HOST: '127.0.0.1',
      BOTICAYA_DB_SSL: false,
      BOTICAYA_ORDERS_ENABLED: false,
    });
    expect(() => readConfig({})).toThrow('BOTICAYA_DB_USER, BOTICAYA_DB_PASSWORD');
  });

  it.each([
    { PORT: '0' },
    { PORT: '65536' },
    { BOTICAYA_DB_PORT: 'not-a-port' },
    { BOTICAYA_DB_USER: '' },
    { BOTICAYA_DB_PASSWORD: '' },
    { BOTICAYA_DB_SSL: 'yes' },
    { BOTICAYA_ORDERS_ENABLED: '0' },
  ])('rejects malformed configuration without logging secret values: %o', (invalid) => {
    expect(() => readConfig({ ...credentials, ...invalid })).toThrow(
      'Invalid environment variables'
    );
    try {
      readConfig({ ...credentials, ...invalid });
    } catch (error) {
      expect(String(error)).not.toContain(credentials.BOTICAYA_DB_PASSWORD);
    }
  });

  it('configures a bounded pool and certificate validation for remote TLS', async () => {
    const pool = createPool(
      readConfig({
        ...credentials,
        BOTICAYA_DB_HOST: 'database.example.org',
        BOTICAYA_DB_PORT: '5433',
        BOTICAYA_DB_NAME: 'catalog',
        BOTICAYA_DB_SSL: 'true',
        BOTICAYA_ORDERS_ENABLED: 'true',
      })
    );
    expect(pool.options).toMatchObject({
      host: 'database.example.org',
      port: 5433,
      database: 'catalog',
      ssl: { rejectUnauthorized: true },
      max: 10,
      connectionTimeoutMillis: 5000,
      statement_timeout: 10000,
    });
    await pool.end();
    const localPool = createPool(readConfig(credentials));
    expect(localPool.options.ssl).toBe(false);
    await localPool.end();
  });
});
