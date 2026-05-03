-- =============================================================================
-- Migration: load_test_connection_snapshot
-- Purpose:   RPC function used by the load-testing harness
--            (tools/load-testing/collect-metrics.ts) to capture a point-in-time
--            snapshot of PostgreSQL connection & performance metrics.
--            Without this function the load-test report shows a warning but
--            still completes; with it, the report includes DB-level data.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.load_test_connection_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'captured_at',       now(),

    -- Active connections by state
    'connections',       (
      SELECT jsonb_build_object(
        'total',         count(*),
        'active',        count(*) FILTER (WHERE state = 'active'),
        'idle',          count(*) FILTER (WHERE state = 'idle'),
        'idle_in_tx',    count(*) FILTER (WHERE state = 'idle in transaction'),
        'waiting',       count(*) FILTER (WHERE wait_event_type IS NOT NULL AND state = 'active')
      )
      FROM pg_stat_activity
      WHERE datname = current_database()
    ),

    -- Connection limits
    'limits',            (
      SELECT jsonb_build_object(
        'max_connections',            current_setting('max_connections')::int,
        'superuser_reserved',         current_setting('superuser_reserved_connections')::int,
        'used_connections',           (SELECT count(*) FROM pg_stat_activity),
        'available_connections',      current_setting('max_connections')::int
                                        - current_setting('superuser_reserved_connections')::int
                                        - (SELECT count(*) FROM pg_stat_activity)
      )
    ),

    -- Database-wide stats
    'db_stats',          (
      SELECT jsonb_build_object(
        'xact_commit',       xact_commit,
        'xact_rollback',     xact_rollback,
        'blks_read',         blks_read,
        'blks_hit',          blks_hit,
        'cache_hit_ratio',   CASE WHEN blks_hit + blks_read = 0
                               THEN 1.0
                               ELSE round(blks_hit::numeric / (blks_hit + blks_read), 4)
                             END,
        'tup_returned',      tup_returned,
        'tup_fetched',       tup_fetched,
        'tup_inserted',      tup_inserted,
        'tup_updated',       tup_updated,
        'tup_deleted',       tup_deleted,
        'deadlocks',         deadlocks,
        'temp_files',        temp_files,
        'temp_bytes',        temp_bytes
      )
      FROM pg_stat_database
      WHERE datname = current_database()
    ),

    -- Longest-running queries (top 5)
    'long_queries',      (
      SELECT COALESCE(jsonb_agg(row_data), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'pid',          pid,
          'state',        state,
          'duration_ms',  EXTRACT(EPOCH FROM (now() - query_start)) * 1000,
          'wait_event',   COALESCE(wait_event_type || '/' || wait_event, 'none'),
          'query_preview', LEFT(query, 120)
        ) AS row_data
        FROM pg_stat_activity
        WHERE datname  = current_database()
          AND state    = 'active'
          AND pid     != pg_backend_pid()
        ORDER BY query_start ASC
        LIMIT 5
      ) sub
    ),

    -- Table I/O hotspots (top 10 by seq scans — helps find missing indexes under load)
    'table_io_hotspots', (
      SELECT COALESCE(jsonb_agg(row_data), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'table',       schemaname || '.' || relname,
          'seq_scan',    seq_scan,
          'idx_scan',    COALESCE(idx_scan, 0),
          'n_live_tup',  n_live_tup,
          'n_dead_tup',  n_dead_tup
        ) AS row_data
        FROM pg_stat_user_tables
        ORDER BY seq_scan DESC
        LIMIT 10
      ) sub
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute to the service_role so the load-test harness can call it.
-- anon/authenticated should NOT have access.
GRANT EXECUTE ON FUNCTION public.load_test_connection_snapshot() TO service_role;
REVOKE EXECUTE ON FUNCTION public.load_test_connection_snapshot() FROM anon, authenticated;

COMMENT ON FUNCTION public.load_test_connection_snapshot() IS
  'Returns a JSON snapshot of PostgreSQL connection pool, DB stats, long queries '
  'and table I/O hotspots. Used exclusively by the load-testing harness.';
