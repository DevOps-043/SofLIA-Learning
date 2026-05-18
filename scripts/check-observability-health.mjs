import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const baseUrl = process.env.OBSERVABILITY_BASE_URL || process.env.LOAD_BASE_URL
const dashboardToken = process.env.OBSERVABILITY_DASHBOARD_TOKEN
const allowDegraded = process.env.OBSERVABILITY_ALLOW_DEGRADED === 'true'
const outputJson = process.env.OBSERVABILITY_OUTPUT_JSON || 'observability-results/health.json'
const outputMarkdown = process.env.OBSERVABILITY_OUTPUT_MD || 'observability-results/health.md'

function requireBaseUrl() {
  if (!baseUrl) {
    throw new Error('OBSERVABILITY_BASE_URL or LOAD_BASE_URL is required')
  }
}

async function fetchJson(pathname, token) {
  const response = await fetch(new URL(pathname, baseUrl), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  const text = await response.text()

  return {
    ok: response.ok,
    status: response.status,
    payload: text ? JSON.parse(text) : null,
  }
}

function isHealthy(result) {
  if (!result.ok) return false
  const status = result.payload?.status
  if (status === 'ok') return true
  return allowDegraded && status === 'degraded'
}

function renderMarkdown(results) {
  return [
    '# Observability Health Check',
    '',
    `Base URL: ${baseUrl}`,
    `Generated at: ${new Date().toISOString()}`,
    `Allow degraded: ${allowDegraded}`,
    '',
    '| Endpoint | HTTP | App status | Result |',
    '|---|---:|---|---|',
    ...results.map((result) => [
      `| ${result.path}`,
      result.status,
      result.payload?.status || 'n/d',
      isHealthy(result) ? 'pass' : 'fail',
      '|',
    ].join(' | ')),
    '',
  ].join('\n')
}

function writeResultFiles(results) {
  mkdirSync(dirname(outputJson), { recursive: true })
  mkdirSync(dirname(outputMarkdown), { recursive: true })
  writeFileSync(outputJson, JSON.stringify({
    baseUrl,
    generatedAt: new Date().toISOString(),
    allowDegraded,
    results,
  }, null, 2))
  writeFileSync(outputMarkdown, renderMarkdown(results))
}

requireBaseUrl()

const checks = [
  { path: '/api/health' },
  { path: '/api/observability/health', token: dashboardToken },
]
const results = []

for (const check of checks) {
  results.push({
    path: check.path,
    ...(await fetchJson(check.path, check.token)),
  })
}

writeResultFiles(results)

const failed = results.filter((result) => !isHealthy(result))
if (failed.length > 0) {
  throw new Error(`Observability health check failed for: ${failed.map((result) => result.path).join(', ')}`)
}
