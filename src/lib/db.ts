/**
 * PostgreSQL Database Connection Pool
 * Manages database connections for the GeoChat application
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Singleton pool instance
let pool: Pool | null = null;

/**
 * Get or create the PostgreSQL connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'geochat',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || '',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error if connection takes more than 2 seconds
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    console.log('✅ PostgreSQL connection pool created');
  }

  return pool;
}

/**
 * Execute a query with the pool
 */
export async function query<T extends Record<string, any> = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    console.log('Query executed', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Query error', { text, error });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return await pool.connect();
}

/**
 * Close the pool (useful for graceful shutdown)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ PostgreSQL connection pool closed');
  }
}

/**
 * Transaction helper
 * Automatically handles BEGIN, COMMIT, and ROLLBACK
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Health check - test database connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    console.log('✅ Database health check passed:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
}
