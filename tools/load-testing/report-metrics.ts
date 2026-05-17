import fs from 'node:fs'
import readline from 'node:readline'

import type { MutableEndpointStats } from './report-metrics.types'
import type { EndpointStats, RequestMetric } from './types'

function isEdge403Html(metric: RequestMetric) {
  return (
    metric.status === 403 &&
    typeof metric.error === 'string' &&
    metric.error.toLowerCase().includes('<!doctype html>')
  )
}

function percentile(values: number[], p: number) {
  if (values.length === 0) return 0
  const index = Math.ceil((p / 100) * values.length) - 1
  return values[Math.max(0, Math.min(index, values.length - 1))]
}

function createStats(metric: RequestMetric): MutableEndpointStats {
  return {
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
    edge403Html: 0,
    timeouts: 0,
    bytes: 0,
    durations: [],
  }
}

function addMetric(stats: MutableEndpointStats, metric: RequestMetric) {
  stats.count += 1
  if (metric.ok) stats.ok += 1
  else stats.failed += 1
  if (metric.status >= 400 && metric.status < 500) stats.status4xx += 1
  if (metric.status === 401) stats.status401 += 1
  if (metric.status >= 500) stats.status5xx += 1
  if (metric.status === 429) stats.status429 += 1
  if (isEdge403Html(metric)) stats.edge403Html += 1
  if (metric.status === 0 || metric.error?.toLowerCase().includes('abort')) {
    stats.timeouts += 1
  }
  stats.bytes += metric.bytes
  stats.durations.push(metric.durationMs)
}

function toEndpointStats(stats: MutableEndpointStats): EndpointStats {
  const sorted = stats.durations.sort((left, right) => left - right)
  const totalDuration = sorted.reduce((total, value) => total + value, 0)

  return {
    ...stats,
    minMs: sorted[0] || 0,
    maxMs: sorted[sorted.length - 1] || 0,
    avgMs: stats.count > 0 ? totalDuration / stats.count : 0,
    p50Ms: percentile(sorted, 50),
    p90Ms: percentile(sorted, 90),
    p95Ms: percentile(sorted, 95),
    p99Ms: percentile(sorted, 99),
  }
}

export async function readMetrics(filePath: string) {
  const byEndpoint = new Map<string, MutableEndpointStats>()
  let firstAt: string | undefined
  let lastAt: string | undefined

  if (!fs.existsSync(filePath)) return { endpoints: [], firstAt, lastAt }

  const lineReader = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Number.POSITIVE_INFINITY,
  })

  for await (const line of lineReader) {
    if (!line.trim()) continue
    const metric = JSON.parse(line) as RequestMetric
    firstAt ||= metric.startedAt
    lastAt = metric.endedAt
    const key = `${metric.flow}|${metric.name}|${metric.method}|${new URL(metric.url).pathname}`
    const stats = byEndpoint.get(key) || createStats(metric)
    addMetric(stats, metric)
    byEndpoint.set(key, stats)
  }

  const endpoints = Array.from(byEndpoint.values())
    .map(toEndpointStats)
    .sort((left, right) => right.count - left.count)

  return { endpoints, firstAt, lastAt }
}
