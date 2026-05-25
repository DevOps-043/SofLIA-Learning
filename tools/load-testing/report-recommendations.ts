import type { EndpointStats, MetricsSnapshot, RunSummary } from './types'
import { round } from './report-utils'

export function buildRecommendations(
  endpoints: EndpointStats[],
  summary: RunSummary | null,
  snapshots: MetricsSnapshot[],
) {
  const recommendations: string[] = []
  const totals = buildRecommendationTotals(endpoints)
  const errorRate = totals.count > 0 ? totals.failed / totals.count : 0
  const loadLike = !summary || summary.profile === 'load' || summary.profile === 'smoke'

  if (hasAuth401(endpoints)) {
    recommendations.push(`BLOCKER de configuracion: se observaron ${totals.status401} respuestas 401 en endpoints autenticados.`)
  }
  if (totals.status5xx > 0) {
    recommendations.push(`BLOCKER: se observaron ${totals.status5xx} respuestas 5xx. Revisar logs antes del lanzamiento.`)
  }
  if (totals.edge403Html > 0) {
    recommendations.push(`BLOCKER de plataforma: ${totals.edge403Html} respuestas 403 llegaron como HTML de Netlify Edge/CDN.`)
  }
  if (errorRate > 0.01) {
    recommendations.push(`El error rate total fue ${(errorRate * 100).toFixed(2)}%, por encima del objetivo <1%.`)
  }
  if (totals.status429 > 0) {
    recommendations.push(loadLike ? nominal429(totals.status429) : stress429(totals.status429))
  }
  if (totals.timeouts > 0) {
    recommendations.push(`Se observaron ${totals.timeouts} timeouts/abortos. Revisar cold starts y consultas lentas.`)
  }

  addSlowEndpointRecommendations(endpoints, recommendations)
  addSnapshotWarnings(snapshots, recommendations)

  if (recommendations.length === 0) {
    recommendations.push('Sin hallazgos blocker bajo los umbrales configurados. Mantener una corrida soak antes del lanzamiento.')
  }

  return recommendations
}

function buildRecommendationTotals(endpoints: EndpointStats[]) {
  return endpoints.reduce(
    (acc, item) => ({
      count: acc.count + item.count,
      failed: acc.failed + item.failed,
      status401: acc.status401 + item.status401,
      status5xx: acc.status5xx + item.status5xx,
      status429: acc.status429 + item.status429,
      edge403Html: acc.edge403Html + item.edge403Html,
      timeouts: acc.timeouts + item.timeouts,
    }),
    { count: 0, failed: 0, status401: 0, status5xx: 0, status429: 0, edge403Html: 0, timeouts: 0 },
  )
}

function hasAuth401(endpoints: EndpointStats[]) {
  return endpoints.some(
    (endpoint) =>
      endpoint.status401 > 0 &&
      (endpoint.flow === 'auth-core' || endpoint.flow === 'study-planner'),
  )
}

function nominal429(count: number) {
  return `Se observaron ${count} respuestas 429 en carga nominal. Validar pool QA y rate limits.`
}

function stress429(count: number) {
  return `Stress encontro ${count} respuestas 429. Validar runners distribuidos o allowlist antes de concluir capacidad real.`
}

function addSlowEndpointRecommendations(
  endpoints: EndpointStats[],
  recommendations: string[],
) {
  const coreSlow = endpoints.filter(
    (endpoint) =>
      endpoint.flow !== 'lia' &&
      endpoint.url.startsWith('/api/') &&
      (endpoint.p95Ms > 1500 || endpoint.p99Ms > 5000),
  )
  if (coreSlow.length > 0) {
    recommendations.push(`Core API fuera de objetivo en ${coreSlow.length} endpoints. Revisar indices, N+1 queries y cache.`)
  }

  const lia = endpoints.find((endpoint) => endpoint.name === 'lia-chat')
  if (lia && lia.p95Ms > 45000) {
    recommendations.push(`LIA p95=${round(lia.p95Ms)}ms supera el objetivo de 45s. Reducir contexto/tokens o aislar cola.`)
  }
}

function addSnapshotWarnings(
  snapshots: MetricsSnapshot[],
  recommendations: string[],
) {
  const warnings = snapshots.flatMap((snapshot) => snapshot.warnings)
  if (warnings.length > 0) {
    recommendations.push(`Metric snapshots incompletos: ${Array.from(new Set(warnings)).join(' | ')}`)
  }
}
