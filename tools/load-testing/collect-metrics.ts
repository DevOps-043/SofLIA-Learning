import fs from 'node:fs/promises';
import { getConfig, requireBaseUrl } from './config';
import { ensureResultDir, snapshotsPath } from './files';
import { createAdminSupabase } from './supabase';
import type { LoadTestConfig, MetricsSnapshot } from './types';

async function readJson(url: string, headers?: Record<string, string>) {
  const response = await fetch(url, { headers });
  const text = await response.text();

  try {
    return {
      ok: response.ok,
      status: response.status,
      data: text ? JSON.parse(text) : null,
    };
  } catch {
    return {
      ok: response.ok,
      status: response.status,
      data: text.slice(0, 1000),
    };
  }
}

export async function collectSnapshot(
  config: LoadTestConfig,
  label = 'manual',
): Promise<MetricsSnapshot> {
  requireBaseUrl(config);

  const warnings: string[] = [];
  const snapshot: MetricsSnapshot = {
    runId: config.runId,
    label,
    capturedAt: new Date().toISOString(),
    warnings,
  };

  try {
    const appMetrics = await readJson(new URL('/api/performance/metrics', config.baseUrl).toString());
    snapshot.app = appMetrics;
    if (!appMetrics.ok) {
      warnings.push(`/api/performance/metrics returned ${appMetrics.status}`);
    }
  } catch (error) {
    warnings.push(`App metrics unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (config.supabaseUrl && config.supabaseServiceRoleKey && config.dbMetricsRpc) {
    try {
      const supabase = createAdminSupabase(config);
      const { data, error } = await (supabase as any).rpc(config.dbMetricsRpc);
      if (error) {
        warnings.push(`Supabase DB metrics RPC "${config.dbMetricsRpc}" unavailable: ${error.message}`);
      } else {
        snapshot.supabase = data;
      }
    } catch (error) {
      warnings.push(`Supabase metrics unavailable: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    warnings.push('Supabase metrics skipped; LOAD_TEST_SUPABASE_URL/SERVICE_ROLE_KEY not configured.');
  }

  if (config.netlifySiteId && config.netlifyToken) {
    try {
      const site = await readJson(
        `https://api.netlify.com/api/v1/sites/${config.netlifySiteId}`,
        { Authorization: `Bearer ${config.netlifyToken}` },
      );
      snapshot.netlify = site;
      if (!site.ok) {
        warnings.push(`Netlify site API returned ${site.status}`);
      }
    } catch (error) {
      warnings.push(`Netlify metrics unavailable: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    warnings.push('Netlify metrics skipped; LOAD_NETLIFY_SITE_ID/TOKEN not configured.');
  }

  return snapshot;
}

export async function appendSnapshot(config: LoadTestConfig, snapshot: MetricsSnapshot) {
  await ensureResultDir(config.resultDir);
  await fs.appendFile(snapshotsPath(config.resultDir), `${JSON.stringify(snapshot)}\n`, 'utf8');
}

async function main() {
  const config = getConfig();
  const label = process.argv[2] || process.env.LOAD_METRICS_LABEL || 'manual';
  const snapshot = await collectSnapshot(config, label);
  await appendSnapshot(config, snapshot);
  console.log(JSON.stringify(snapshot, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
