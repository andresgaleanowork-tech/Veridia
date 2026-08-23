// Database monitoring utility
import { query } from '../config/db.js';
import { createLogger } from '../utils/logger.js';

const monitorLogger = createLogger('MONITOR');

export interface DbMetrics {
  activeConnections: number;
  totalConnections: number;
  slowQueries: number;
  cacheHitRatio: number;
  databaseSize: string;
  uptime: string;
}

export async function getDbMetrics(): Promise<DbMetrics> {
  try {
    const [activeRes, totalRes, slowRes, cacheRes, sizeRes, uptimeRes] = await Promise.all([
      query("SELECT count(*) as active FROM pg_stat_activity WHERE state = 'active'"),
      query("SELECT count(*) as total FROM pg_stat_activity"),
      query("SELECT count(*) as slow FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '5 seconds'"),
      query("SELECT round(100.0 * sum(blks_hit) / nullif(sum(blks_hit) + sum(blks_read), 0), 2) as ratio FROM pg_stat_database"),
      query("SELECT pg_size_pretty(pg_database_size(current_database())) as size"),
      query("SELECT now() - pg_postmaster_start_time() as uptime"),
    ]);

    return {
      activeConnections: parseInt(activeRes.rows[0]?.active || '0'),
      totalConnections: parseInt(totalRes.rows[0]?.total || '0'),
      slowQueries: parseInt(slowRes.rows[0]?.slow || '0'),
      cacheHitRatio: parseFloat(cacheRes.rows[0]?.ratio || '0'),
      databaseSize: sizeRes.rows[0]?.size || '0 bytes',
      uptime: uptimeRes.rows[0]?.uptime || '0',
    };
  } catch (error) {
    monitorLogger.error('Failed to get DB metrics', { error: (error as Error).message });
    return {
      activeConnections: 0,
      totalConnections: 0,
      slowQueries: 0,
      cacheHitRatio: 0,
      databaseSize: '0 bytes',
      uptime: '0',
    };
  }
}

export async function checkDbHealth(): Promise<{ healthy: boolean; metrics: DbMetrics }> {
  const metrics = await getDbMetrics();
  const healthy = metrics.activeConnections < 50 && metrics.slowQueries < 5;
  return { healthy, metrics };
}