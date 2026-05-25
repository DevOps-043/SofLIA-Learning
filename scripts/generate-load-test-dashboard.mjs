import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const inputDir = process.argv[2] || 'load-test-results'
const outputFile = process.argv[3] || 'load-test-results/dashboard.md'

function readJsonFiles(directory) {
  try {
    return readdirSync(directory)
      .filter((fileName) => fileName.endsWith('.json'))
      .map((fileName) => ({
        fileName,
        payload: JSON.parse(readFileSync(join(directory, fileName), 'utf8')),
      }))
  } catch {
    return []
  }
}

function value(payload, metricName, key) {
  const raw = payload.metrics?.[metricName]?.values?.[key]
  return typeof raw === 'number' ? raw : null
}

function formatNumber(input, suffix = '') {
  return typeof input === 'number' ? `${input.toFixed(2)}${suffix}` : 'n/d'
}

function inferScenario(fileName) {
  const match = /^k6-(.+)-\d+\.json$/.exec(fileName)
  return match?.[1] || fileName.replace(/\.json$/, '')
}

function rowFromSummary(summary) {
  const checksRate = value(summary.payload, 'checks', 'rate')
  const failedRate = value(summary.payload, 'http_req_failed', 'rate')

  return {
    scenario: inferScenario(summary.fileName),
    requests: value(summary.payload, 'http_reqs', 'count'),
    p50: value(summary.payload, 'http_req_duration', 'med'),
    p95: value(summary.payload, 'http_req_duration', 'p(95)'),
    p99: value(summary.payload, 'http_req_duration', 'p(99)'),
    failedRate,
    checksRate,
  }
}

const rows = readJsonFiles(inputDir).map(rowFromSummary)
const generatedAt = new Date().toISOString()

const markdown = [
  '# k6 Load Test Dashboard',
  '',
  `Generated at: ${generatedAt}`,
  '',
  '| Scenario | Requests | p50 | p95 | p99 | Failed rate | Check rate |',
  '|---|---:|---:|---:|---:|---:|---:|',
  ...(rows.length > 0
    ? rows.map((row) => [
        `| ${row.scenario}`,
        row.requests ?? 'n/d',
        formatNumber(row.p50, ' ms'),
        formatNumber(row.p95, ' ms'),
        formatNumber(row.p99, ' ms'),
        formatNumber(row.failedRate !== null ? row.failedRate * 100 : null, ' %'),
        formatNumber(row.checksRate !== null ? row.checksRate * 100 : null, ' %'),
        '|',
      ].join(' | '))
    : ['| Sin resultados | n/d | n/d | n/d | n/d | n/d | n/d |']),
  '',
  'SLO gate: p95 debe respetar los presupuestos de `TECH_DEBT_REMEDIATION.md` y `http_req_failed` debe mantenerse por debajo del umbral del escenario.',
  '',
].join('\n')

mkdirSync(dirname(outputFile), { recursive: true })
writeFileSync(outputFile, markdown)
