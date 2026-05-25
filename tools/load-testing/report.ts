import fsp from 'node:fs/promises'
import path from 'node:path'

import { getConfig } from './config'
import { metricsPath, runSummaryPath, snapshotsPath, writeJson } from './files'
import { buildReportMarkdown } from './report-markdown'
import { readMetrics } from './report-metrics'
import { buildRecommendations } from './report-recommendations'
import { readSnapshots } from './report-snapshots'
import { readJsonFile } from './report-utils'
import type { EndpointStats, RunSummary } from './types'

export async function generateReport(resultDir: string) {
  const summary = await readJsonFile<RunSummary>(runSummaryPath(resultDir))
  const metrics = await readMetrics(metricsPath(resultDir))
  const snapshots = await readSnapshots(snapshotsPath(resultDir))
  const totals = buildTotals(metrics.endpoints)
  const durationMs = summary
    ? new Date(summary.endedAt).getTime() - new Date(summary.startedAt).getTime()
    : 0
  const rps = durationMs > 0 ? totals.count / (durationMs / 1000) : 0
  const recommendations = buildRecommendations(
    metrics.endpoints,
    summary,
    snapshots,
  )
  const slowest = [...metrics.endpoints]
    .sort((left, right) => right.p95Ms - left.p95Ms)
    .slice(0, 15)
  const failing = metrics.endpoints
    .filter((endpoint) => endpoint.failed > 0)
    .sort((left, right) => right.failed - left.failed)
    .slice(0, 15)
  const report = {
    summary,
    totals: { ...totals, errorRate: totals.count > 0 ? totals.failed / totals.count : 0, rps },
    endpoints: metrics.endpoints,
    slowest,
    failing,
    snapshots,
    recommendations,
  }

  await writeJson(path.join(resultDir, 'summary.json'), report)
  await fsp.writeFile(
    path.join(resultDir, 'report.md'),
    buildReportMarkdown({
      resultDir,
      summary,
      firstAt: metrics.firstAt,
      lastAt: metrics.lastAt,
      totals,
      rps,
      slowest,
      failing,
      snapshots,
      recommendations,
    }),
    'utf8',
  )

  return report
}

function buildTotals(endpoints: EndpointStats[]) {
  return endpoints.reduce(
    (acc, item) => ({
      count: acc.count + item.count,
      ok: acc.ok + item.ok,
      failed: acc.failed + item.failed,
      status4xx: acc.status4xx + item.status4xx,
      status401: acc.status401 + item.status401,
      status5xx: acc.status5xx + item.status5xx,
      status429: acc.status429 + item.status429,
      edge403Html: acc.edge403Html + item.edge403Html,
      timeouts: acc.timeouts + item.timeouts,
    }),
    { count: 0, ok: 0, failed: 0, status4xx: 0, status401: 0, status5xx: 0, status429: 0, edge403Html: 0, timeouts: 0 },
  )
}

async function main() {
  const config = getConfig()
  const report = await generateReport(config.resultDir)
  console.log(`Report written to ${path.join(config.resultDir, 'report.md')}`)
  console.log(JSON.stringify(report.totals, null, 2))
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
