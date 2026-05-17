import path from 'node:path'

import type { EndpointStats, MetricsSnapshot, RunSummary } from './types'
import { round } from './report-utils'

interface MarkdownInput {
  resultDir: string
  summary: RunSummary | null
  firstAt?: string
  lastAt?: string
  totals: Record<string, number>
  rps: number
  slowest: EndpointStats[]
  failing: EndpointStats[]
  snapshots: MetricsSnapshot[]
  recommendations: string[]
}

export function buildReportMarkdown(input: MarkdownInput) {
  const summary = input.summary

  return [
    `# SofLIA Load Test Report - ${summary?.runId || path.basename(input.resultDir)}`,
    '',
    `- Profile: ${summary?.profile || 'unknown'}`,
    `- Target: ${summary?.baseUrl || 'unknown'}`,
    `- Started: ${summary?.startedAt || input.firstAt || 'unknown'}`,
    `- Ended: ${summary?.endedAt || input.lastAt || 'unknown'}`,
    `- Max VUs: ${summary?.maxVus || 'unknown'}`,
    `- Requests: ${input.totals.count}`,
    `- Error rate: ${formatErrorRate(input.totals)}`,
    `- RPS: ${round(input.rps)}`,
    `- 401: ${input.totals.status401}`,
    `- 5xx: ${input.totals.status5xx}`,
    `- 429: ${input.totals.status429}`,
    `- Netlify Edge 403 HTML: ${input.totals.edge403Html}`,
    `- Timeouts: ${input.totals.timeouts}`,
    summary?.aborted ? `- Aborted: yes (${summary.abortReason || 'no reason recorded'})` : '- Aborted: no',
    '',
    '## Recommendations',
    ...input.recommendations.map((item) => `- ${item}`),
    '',
    '## Slowest Endpoints (p95)',
    '| Flow | Endpoint | Count | p50 | p95 | p99 | Failures |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: |',
    ...input.slowest.map(endpointRow),
    '',
    '## Failing Endpoints',
    ...failingSection(input.failing),
    '',
    '## Snapshot Warnings',
    snapshotWarnings(input.snapshots),
    '',
  ].join('\n')
}

function endpointRow(item: EndpointStats) {
  return `| ${item.flow} | ${item.method} ${item.url} | ${item.count} | ${round(item.p50Ms)}ms | ${round(item.p95Ms)}ms | ${round(item.p99Ms)}ms | ${item.failed} |`
}

function failingSection(failing: EndpointStats[]) {
  if (failing.length === 0) return ['No failing endpoints recorded.']

  return [
    '| Flow | Endpoint | Count | Failed | 4xx | 401 | 5xx | 429 | Edge 403 | Timeouts |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...failing.map((item) => `| ${item.flow} | ${item.method} ${item.url} | ${item.count} | ${item.failed} | ${item.status4xx} | ${item.status401} | ${item.status5xx} | ${item.status429} | ${item.edge403Html} | ${item.timeouts} |`),
  ]
}

function snapshotWarnings(snapshots: MetricsSnapshot[]) {
  const warnings = snapshots.flatMap((snapshot) =>
    snapshot.warnings.map((warning) => `- ${snapshot.label}: ${warning}`),
  )

  return warnings.length === 0 ? 'No snapshot warnings recorded.' : warnings.join('\n')
}

function formatErrorRate(totals: Record<string, number>) {
  return `${totals.count > 0 ? ((totals.failed / totals.count) * 100).toFixed(2) : '0.00'}%`
}
