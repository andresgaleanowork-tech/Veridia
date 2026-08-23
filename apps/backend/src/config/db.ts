// Database connection pool + Drizzle ORM instance
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema/index.js';
import { createLogger } from '../utils/logger.js';

const { Pool } = pg;
const dbLogger = createLogger('DB');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' || (process.env.NODE_ENV === 'production' && process.env.DB_SSL !== 'false')
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  dbLogger.error('Database pool error', { message: err.message });
});

// Drizzle ORM instance — use this in all new code
export const db = drizzle(pool, { schema });

// Legacy helpers — keep for backward compatibility with middleware/services
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 500) {
    dbLogger.warn('Slow query', { duration: `${duration}ms`, query: text.substring(0, 80) });
  }
  return res;
};

export const transaction = async (callback: (client: pg.PoolClient) => Promise<any>) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

export { pool };
export default db;

type QueryResult<T = any> = { rows: T[] };

export async function queryOne<T>(text: string, params?: any[]): Promise<T | undefined> {
  const res = (await pool.query(text, params)) as unknown as QueryResult<T>;
  return res.rows[0];
}

export async function queryMany<T>(text: string, params?: any[]): Promise<T[]> {
  const res = (await pool.query(text, params)) as unknown as QueryResult<T>;
  return res.rows;
}

export async function executeOne<T>(sql: unknown): Promise<T | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- drizzle execute accepts raw SQL strings
  const res = (await db.execute(sql as any)) as unknown as QueryResult<T>;
  return res.rows[0];
}

export async function executeMany<T>(sql: unknown): Promise<T[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- drizzle execute accepts raw SQL strings
  const res = (await db.execute(sql as any)) as unknown as QueryResult<T>;
  return res.rows;
}