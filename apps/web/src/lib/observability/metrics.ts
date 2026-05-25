export type MetricLabels = Record<string, string | number | boolean | undefined>

export interface MetricsSnapshot {
  counters: Record<string, number>
  durations: Record<string, {
    count: number
    sum: number
    max: number
    avg: number
    p50: number
    p95: number
    p99: number
  }>
}

const counters = new Map<string, number>()
const MAX_DISTRIBUTION_SAMPLES = 1024
const durations = new Map<string, { count: number; sum: number; max: number; samples: number[] }>()

export function incrementCounter(
  name: string,
  labels: MetricLabels = {},
  value = 1,
): void {
  const key = buildMetricKey(name, labels)
  counters.set(key, (counters.get(key) ?? 0) + value)
}

export function observeDurationMs(
  name: string,
  durationMs: number,
  labels: MetricLabels = {},
): void {
  observeDistribution(name, durationMs, labels)
}

export function observeDurationSeconds(
  name: string,
  durationSeconds: number,
  labels: MetricLabels = {},
): void {
  observeDistribution(name, durationSeconds, labels)
}

export function observeDistribution(
  name: string,
  value: number,
  labels: MetricLabels = {},
): void {
  const key = buildMetricKey(name, labels)
  const current = durations.get(key) ?? { count: 0, sum: 0, max: 0, samples: [] }
  const samples = [...current.samples, value].slice(-MAX_DISTRIBUTION_SAMPLES)

  durations.set(key, {
    count: current.count + 1,
    sum: current.sum + value,
    max: Math.max(current.max, value),
    samples,
  })
}

export function getMetricsSnapshot(): MetricsSnapshot {
  return {
    counters: Object.fromEntries(counters),
    durations: Object.fromEntries(
      Array.from(durations.entries()).map(([key, distribution]) => [
        key,
        serializeDistribution(distribution),
      ]),
    ),
  }
}

export function clearMetrics(): void {
  counters.clear()
  durations.clear()
}

function buildMetricKey(name: string, labels: MetricLabels): string {
  const serializedLabels = Object.entries(labels)
    .filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(',')

  return serializedLabels ? `${name}{${serializedLabels}}` : name
}

function serializeDistribution(distribution: {
  count: number
  sum: number
  max: number
  samples: number[]
}) {
  return {
    count: distribution.count,
    sum: roundMetric(distribution.sum),
    max: roundMetric(distribution.max),
    avg: roundMetric(distribution.count > 0 ? distribution.sum / distribution.count : 0),
    p50: percentile(distribution.samples, 0.5),
    p95: percentile(distribution.samples, 0.95),
    p99: percentile(distribution.samples, 0.99),
  }
}

function percentile(values: number[], quantile: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.min(
    sorted.length - 1,
    Math.ceil(sorted.length * quantile) - 1,
  )
  return roundMetric(sorted[index] ?? 0)
}

function roundMetric(value: number): number {
  return Math.round(value * 1000) / 1000
}
