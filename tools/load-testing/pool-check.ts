import fs from 'node:fs/promises'

import { getConfig } from './config'
import { snapshotsPath } from './files'
import { readEnv } from './env'

const DEFAULT_POOL_CONNECTION_BUDGET = 200
const POOL_BUDGET_WARNING_RATIO = 0.8

interface CheckResult {
  name: string
  status: 'pass' | 'warn' | 'fail'
  message: string
}

interface PoolSnapshotSummary {
  activeConnections?: number
  totalConnections?: number
  tooManyConnections: boolean
}

function addResult(results: CheckResult[], result: CheckResult) {
  results.push(result)
}

function maskPostgresUrl(value: string) {
  try {
    const url = new URL(value)
    url.username = url.username ? '***' : ''
    url.password = url.password ? '***' : ''
    return url.toString()
  } catch {
    return 'invalid-url'
  }
}

function readPostgresUrl(name: string, results: CheckResult[]) {
  const value = readEnv(name)
  if (!value) {
    addResult(results, {
      name,
      status: 'fail',
      message: `${name} is required for task 4.1 verification.`,
    })
    return undefined
  }

  try {
    return new URL(value)
  } catch {
    addResult(results, {
      name,
      status: 'fail',
      message: `${name} must be a valid Postgres URL.`,
    })
    return undefined
  }
}

function validatePooledUrl(url: URL, results: CheckResult[]) {
  const isPoolerPort = url.port === '6543'
  const looksLikeSupavisor = url.hostname.includes('pooler') || url.hostname.includes('supavisor')

  addResult(results, {
    name: 'SUPABASE_DB_URL_POOLED',
    status: isPoolerPort || looksLikeSupavisor ? 'pass' : 'fail',
    message: `${maskPostgresUrl(url.toString())} must point to Supavisor transaction pooling, normally port 6543.`,
  })
}

function validateDirectUrl(url: URL, results: CheckResult[]) {
  const isDirectPort = url.port === '5432' || url.port === ''
  const looksLikePooler = url.hostname.includes('pooler') || url.port === '6543'

  addResult(results, {
    name: 'SUPABASE_DB_URL_DIRECT',
    status: isDirectPort && !looksLikePooler ? 'pass' : 'fail',
    message: `${maskPostgresUrl(url.toString())} must point to direct Postgres for migrations only, normally port 5432.`,
  })
}

function collectNamedNumbers(value: unknown, names: Set<string>, found: number[] = []) {
  if (!value || typeof value !== 'object') return found

  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'number' && names.has(key)) {
      found.push(item)
    } else if (typeof item === 'string' && names.has(key)) {
      const parsed = Number(item)
      if (Number.isFinite(parsed)) found.push(parsed)
    } else if (item && typeof item === 'object') {
      collectNamedNumbers(item, names, found)
    }
  }

  return found
}

function containsTooManyConnections(value: unknown): boolean {
  if (typeof value === 'string') return value.toLowerCase().includes('too many connections')
  if (!value || typeof value !== 'object') return false

  return Object.values(value).some(containsTooManyConnections)
}

async function readLatestPoolSnapshot(resultDir: string): Promise<PoolSnapshotSummary | undefined> {
  try {
    const raw = await fs.readFile(snapshotsPath(resultDir), 'utf8')
    const latest = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .at(-1)
    if (!latest) return undefined

    const parsed: unknown = JSON.parse(latest)
    const activeConnections = collectNamedNumbers(
      parsed,
      new Set(['active_connections', 'activeConnections', 'active_db_connections', 'numbackends']),
    ).at(-1)
    const totalConnections = collectNamedNumbers(
      parsed,
      new Set(['total_connections', 'totalConnections', 'current_connections']),
    ).at(-1)

    return {
      activeConnections,
      totalConnections,
      tooManyConnections: containsTooManyConnections(parsed),
    }
  } catch {
    return undefined
  }
}

async function main() {
  const config = getConfig()
  const requireSnapshot = readEnv('LOAD_POOL_REQUIRE_SNAPSHOT') === 'true'
  const results: CheckResult[] = []
  const pooledUrl = readPostgresUrl('SUPABASE_DB_URL_POOLED', results)
  const directUrl = readPostgresUrl('SUPABASE_DB_URL_DIRECT', results)

  if (pooledUrl) validatePooledUrl(pooledUrl, results)
  if (directUrl) validateDirectUrl(directUrl, results)
  if (pooledUrl && directUrl) {
    addResult(results, {
      name: 'pooler-url-separation',
      status: pooledUrl.toString() !== directUrl.toString() ? 'pass' : 'fail',
      message: 'Pooled and direct Postgres URLs must be different.',
    })
  }

  const snapshot = await readLatestPoolSnapshot(config.resultDir)
  if (!snapshot) {
    addResult(results, {
      name: 'load-test-pool-snapshot',
      status: requireSnapshot ? 'fail' : 'warn',
      message: `No DB snapshot found in ${snapshotsPath(config.resultDir)}. Run load:metrics after a 1,000 req/s staging load test.`,
    })
  } else if (snapshot.tooManyConnections) {
    addResult(results, {
      name: 'load-test-pool-snapshot',
      status: 'fail',
      message: 'Latest snapshot contains a Postgres "too many connections" signal.',
    })
  } else {
    const observedConnections = snapshot.activeConnections ?? snapshot.totalConnections
    const connectionLimit = Number(readEnv('LOAD_DB_CONNECTION_BUDGET') || DEFAULT_POOL_CONNECTION_BUDGET)
    const warningLimit = connectionLimit * POOL_BUDGET_WARNING_RATIO

    addResult(results, {
      name: 'load-test-pool-snapshot',
      status:
        observedConnections === undefined
          ? requireSnapshot ? 'fail' : 'pass'
          : observedConnections <= warningLimit ? 'pass' : 'fail',
      message:
        observedConnections === undefined
          ? 'Snapshot exists but does not include DB connection metrics from load_test_connection_snapshot.'
          : `Observed ${observedConnections} active/total DB connections; budget warning limit is ${warningLimit}.`,
    })
  }

  const failed = results.filter((result) => result.status === 'fail')
  const warned = results.filter((result) => result.status === 'warn')

  process.stdout.write(`${JSON.stringify({ failed: failed.length, warned: warned.length, results }, null, 2)}\n`)
  if (failed.length > 0) process.exit(1)
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Pool check failed'}\n`)
  process.exit(1)
})
