import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import { getConfig } from './config';
import { metricsPath, runSummaryPath, snapshotsPath, writeJson } from './files';
import type { EndpointStats, MetricsSnapshot, RequestMetric, RunSummary } from './types';

interface MutableStats {
  flow: string;
  name: string;
  method: string;
  url: string;
  count: number;
  ok: number;
  failed: number;
  status4xx: number;
  status401: number;
  status5xx: number;
  status429: number;
  timeouts: number;
  bytes: number;
  durations: number[];
}

function percentile(values: number[], p: number) {
  if (values.length === 0) return 0;
  const index = Math.ceil((p / 100) * values.length) - 1;
  return values[Math.max(0, Math.min(index, values.length - 1))];
}

function toEndpointStats(stats: MutableStats): EndpointStats {
  const sorted = stats.durations.sort((a, b) => a - b);
  const totalDuration = sorted.reduce((total, value) => total + value, 0);

  return {
    flow: stats.flow,
    name: stats.name,
    method: stats.method,
    url: stats.url,
    count: stats.count,
    ok: stats.ok,
    failed: stats.failed,
    status4xx: stats.status4xx,
    status401: stats.status401,
    status5xx: stats.status5xx,
    status429: stats.status429,
    timeouts: stats.timeouts,
    bytes: stats.bytes,
    minMs: sorted[0] || 0,
    maxMs: sorted[sorted.length - 1] || 0,
    avgMs: stats.count > 0 ? totalDuration / stats.count : 0,
    p50Ms: percentile(sorted, 50),
    p90Ms: percentile(sorted, 90),
    p95Ms: percentile(sorted, 95),
    p99Ms: percentile(sorted, 99),
  };
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await fsp.readFile(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

async function readMetrics(filePath: string) {
  const byEndpoint = new Map<string, MutableStats>();
  let firstAt: string | undefined;
  let lastAt: string | undefined;

  if (!fs.existsSync(filePath)) {
    return { endpoints: [] as EndpointStats[], firstAt, lastAt };
  }

  const lineReader = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Number.POSITIVE_INFINITY,
  });

  for await (const line of lineReader) {
    if (!line.trim()) continue;
    const metric = JSON.parse(line) as RequestMetric;
    firstAt ||= metric.startedAt;
    lastAt = metric.endedAt;

    const key = `${metric.flow}|${metric.name}|${metric.method}|${new URL(metric.url).pathname}`;
    const existing = byEndpoint.get(key) || {
      flow: metric.flow,
      name: metric.name,
      method: metric.method,
      url: new URL(metric.url).pathname,
      count: 0,
      ok: 0,
      failed: 0,
      status4xx: 0,
      status401: 0,
      status5xx: 0,
      status429: 0,
      timeouts: 0,
      bytes: 0,
      durations: [],
    };

    existing.count += 1;
    if (metric.ok) existing.ok += 1;
    else existing.failed += 1;
    if (metric.status >= 400 && metric.status < 500) existing.status4xx += 1;
    if (metric.status === 401) existing.status401 += 1;
    if (metric.status >= 500) existing.status5xx += 1;
    if (metric.status === 429) existing.status429 += 1;
    if (metric.status === 0 || metric.error?.toLowerCase().includes('abort')) existing.timeouts += 1;
    existing.bytes += metric.bytes;
    existing.durations.push(metric.durationMs);
    byEndpoint.set(key, existing);
  }

  const endpoints = Array.from(byEndpoint.values())
    .map(toEndpointStats)
    .sort((a, b) => b.count - a.count);

  return { endpoints, firstAt, lastAt };
}

async function readSnapshots(filePath: string): Promise<MetricsSnapshot[]> {
  if (!fs.existsSync(filePath)) return [];
  const raw = await fsp.readFile(filePath, 'utf8');
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as MetricsSnapshot);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function buildRecommendations(endpoints: EndpointStats[], summary: RunSummary | null, snapshots: MetricsSnapshot[]) {
  const recommendations: string[] = [];
  const totals = endpoints.reduce(
    (acc, item) => {
      acc.count += item.count;
      acc.failed += item.failed;
      acc.status401 += item.status401;
      acc.status5xx += item.status5xx;
      acc.status429 += item.status429;
      acc.timeouts += item.timeouts;
      return acc;
    },
    { count: 0, failed: 0, status401: 0, status5xx: 0, status429: 0, timeouts: 0 },
  );
  const errorRate = totals.count > 0 ? totals.failed / totals.count : 0;

  const auth401 = endpoints.filter((endpoint) =>
    endpoint.status401 > 0 &&
    (endpoint.flow === 'auth-core' || endpoint.flow === 'study-planner')
  );
  if (auth401.length > 0) {
    recommendations.push(
      `BLOCKER de configuracion: se observaron ${totals.status401} respuestas 401 en endpoints autenticados. Verificar que Netlify use el mismo proyecto Supabase que LOAD_TEST_SUPABASE_URL, redeployar y repetir load:seed antes de medir performance.`
    );
  }

  if (totals.status5xx > 0) {
    recommendations.push(`BLOCKER: se observaron ${totals.status5xx} respuestas 5xx. Revisar logs de Netlify Functions y Supabase por endpoint antes del lanzamiento.`);
  }

  if (errorRate > 0.01) {
    recommendations.push(`El error rate total fue ${(errorRate * 100).toFixed(2)}%, por encima del objetivo <1%. Priorizar los endpoints con mas fallos.`);
  }

  const loadLike = !summary || summary.profile === 'load' || summary.profile === 'smoke';
  if (loadLike && totals.status429 > 0) {
    recommendations.push(`Se observaron ${totals.status429} respuestas 429 en carga nominal. Validar que el pool QA usa usuarios/IPs unicos y ajustar rate limits si bloquea trafico legitimo.`);
  }
  if (!loadLike && totals.status429 > 0) {
    recommendations.push(`Stress encontro ${totals.status429} respuestas 429. Si aparecen tambien en paginas publicas, es probable que el borde/CDN este limitando trafico desde una sola IP de prueba; validar con runners distribuidos o ventana/allowlist de Netlify antes de concluir capacidad real de usuarios.`);
  }

  if (totals.timeouts > 0) {
    recommendations.push(`Se observaron ${totals.timeouts} timeouts/abortos. Revisar cold starts, consultas lentas y maxDuration de endpoints dinamicos.`);
  }

  const coreSlow = endpoints.filter((endpoint) =>
    endpoint.flow !== 'lia' &&
    endpoint.url.startsWith('/api/') &&
    (endpoint.p95Ms > 1500 || endpoint.p99Ms > 5000)
  );
  if (coreSlow.length > 0) {
    recommendations.push(`Core API fuera de objetivo en ${coreSlow.length} endpoints. Revisar indices, N+1 queries y cache privado/stale-while-revalidate.`);
  }

  const lia = endpoints.find((endpoint) => endpoint.name === 'lia-chat');
  if (lia && lia.p95Ms > 45000) {
    recommendations.push(`LIA p95=${round(lia.p95Ms)}ms supera el objetivo de 45s y se acerca al limite de Netlify Functions sincrono. Reducir contexto, tokens o aislar cola/background para IA.`);
  }

  const snapshotWarnings = snapshots.flatMap((snapshot) => snapshot.warnings);
  if (snapshotWarnings.length > 0) {
    recommendations.push(`Metric snapshots incompletos: ${Array.from(new Set(snapshotWarnings)).join(' | ')}`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Sin hallazgos blocker bajo los umbrales configurados. Mantener una corrida soak antes del lanzamiento.');
  }

  return recommendations;
}

export async function generateReport(resultDir: string) {
  const summary = await readJsonFile<RunSummary>(runSummaryPath(resultDir));
  const metrics = await readMetrics(metricsPath(resultDir));
  const snapshots = await readSnapshots(snapshotsPath(resultDir));
  const totals = metrics.endpoints.reduce(
    (acc, item) => {
      acc.count += item.count;
      acc.ok += item.ok;
      acc.failed += item.failed;
      acc.status4xx += item.status4xx;
      acc.status401 += item.status401;
      acc.status5xx += item.status5xx;
      acc.status429 += item.status429;
      acc.timeouts += item.timeouts;
      return acc;
    },
    { count: 0, ok: 0, failed: 0, status4xx: 0, status401: 0, status5xx: 0, status429: 0, timeouts: 0 },
  );
  const durationMs =
    summary ? new Date(summary.endedAt).getTime() - new Date(summary.startedAt).getTime() : 0;
  const rps = durationMs > 0 ? totals.count / (durationMs / 1000) : 0;
  const recommendations = buildRecommendations(metrics.endpoints, summary, snapshots);

  const slowest = [...metrics.endpoints].sort((a, b) => b.p95Ms - a.p95Ms).slice(0, 15);
  const failing = metrics.endpoints
    .filter((endpoint) => endpoint.failed > 0)
    .sort((a, b) => b.failed - a.failed)
    .slice(0, 15);

  const report = {
    summary,
    totals: {
      ...totals,
      errorRate: totals.count > 0 ? totals.failed / totals.count : 0,
      rps,
    },
    endpoints: metrics.endpoints,
    slowest,
    failing,
    snapshots,
    recommendations,
  };

  await writeJson(path.join(resultDir, 'summary.json'), report);

  const markdown = [
    `# SofLIA Load Test Report - ${summary?.runId || path.basename(resultDir)}`,
    '',
    `- Profile: ${summary?.profile || 'unknown'}`,
    `- Target: ${summary?.baseUrl || 'unknown'}`,
    `- Started: ${summary?.startedAt || metrics.firstAt || 'unknown'}`,
    `- Ended: ${summary?.endedAt || metrics.lastAt || 'unknown'}`,
    `- Max VUs: ${summary?.maxVus || 'unknown'}`,
    `- Requests: ${totals.count}`,
    `- Error rate: ${totals.count > 0 ? ((totals.failed / totals.count) * 100).toFixed(2) : '0.00'}%`,
    `- RPS: ${round(rps)}`,
    `- 401: ${totals.status401}`,
    `- 5xx: ${totals.status5xx}`,
    `- 429: ${totals.status429}`,
    `- Timeouts: ${totals.timeouts}`,
    summary?.aborted ? `- Aborted: yes (${summary.abortReason || 'no reason recorded'})` : '- Aborted: no',
    '',
    '## Recommendations',
    ...recommendations.map((item) => `- ${item}`),
    '',
    '## Slowest Endpoints (p95)',
    '| Flow | Endpoint | Count | p50 | p95 | p99 | Failures |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: |',
    ...slowest.map((item) => `| ${item.flow} | ${item.method} ${item.url} | ${item.count} | ${round(item.p50Ms)}ms | ${round(item.p95Ms)}ms | ${round(item.p99Ms)}ms | ${item.failed} |`),
    '',
    '## Failing Endpoints',
    failing.length === 0
      ? 'No failing endpoints recorded.'
      : '| Flow | Endpoint | Count | Failed | 4xx | 401 | 5xx | 429 | Timeouts |',
    failing.length === 0
      ? ''
      : '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...failing.map((item) => `| ${item.flow} | ${item.method} ${item.url} | ${item.count} | ${item.failed} | ${item.status4xx} | ${item.status401} | ${item.status5xx} | ${item.status429} | ${item.timeouts} |`),
    '',
    '## Snapshot Warnings',
    snapshots.flatMap((snapshot) => snapshot.warnings).length === 0
      ? 'No snapshot warnings recorded.'
      : snapshots.flatMap((snapshot) => snapshot.warnings.map((warning) => `- ${snapshot.label}: ${warning}`)).join('\n'),
    '',
  ].join('\n');

  await fsp.writeFile(path.join(resultDir, 'report.md'), markdown, 'utf8');
  return report;
}

async function main() {
  const config = getConfig();
  const report = await generateReport(config.resultDir);
  console.log(`Report written to ${path.join(config.resultDir, 'report.md')}`);
  console.log(JSON.stringify(report.totals, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
