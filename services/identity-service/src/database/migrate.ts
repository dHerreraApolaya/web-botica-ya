import { Pool } from 'pg';
import { loadEnvironment } from '../config/environment.js';
import { migrations } from './migrations.js';

const migrate = async (): Promise<void> => {
  const pool = new Pool({ connectionString: loadEnvironment().DATABASE_URL });
  try {
    await pool.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())'
    );
    const appliedResult = await pool.query<{ id: string }>('SELECT id FROM schema_migrations');
    const applied = new Set(appliedResult.rows.map((row) => row.id));

    for (const migration of migrations) {
      if (applied.has(migration.id)) continue;
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(migration.sql);
        await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [migration.id]);
        await client.query('COMMIT');
      } catch (error: unknown) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
};

void migrate();
