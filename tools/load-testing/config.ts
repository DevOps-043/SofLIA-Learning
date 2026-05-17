import path from 'node:path'

import { readBoolean, readEnv, readNumber } from './env'
import { parseProfileName, resolveProfile } from './profiles'
import type { LoadTestConfig } from './types'

function defaultRunId() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, 'Z')
}

function sanitizeRunId(runId: string) {
  return runId.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 48)
}

function readPublicFlowMode(): LoadTestConfig['publicFlowMode'] {
  const raw = readEnv('LOAD_PUBLIC_FLOW_MODE') || 'once'
  if (raw === 'once' || raw === 'always') return raw
  throw new Error('LOAD_PUBLIC_FLOW_MODE must be "once" or "always".')
}

export function qaPrefix(runId: string) {
  return `qa_load_${sanitizeRunId(runId)}`
}

export function qaSlug(prefix: string) {
  return prefix.replace(/_/g, '-')
}

export function getConfig(): LoadTestConfig {
  const runId = sanitizeRunId(readEnv('LOAD_RUN_ID') || defaultRunId())
  const prefix = qaPrefix(runId)
  const orgSlug = readEnv('LOAD_TEST_ORG_SLUG') || `${qaSlug(prefix)}-org`

  return {
    baseUrl: readEnv('LOAD_BASE_URL') || '',
    runId,
    targetVus: readNumber('LOAD_TARGET_VUS', 700),
    seedUsers: readNumber('LOAD_SEED_USERS', readNumber('LOAD_TARGET_VUS', 700)),
    aiRatio: readNumber('LOAD_AI_RATIO', 0.05),
    orgSlug,
    resultDir: path.resolve('load-test-results', runId),
    supabaseUrl:
      readEnv('LOAD_TEST_SUPABASE_URL') || readEnv('NEXT_PUBLIC_SUPABASE_URL'),
    supabaseServiceRoleKey:
      readEnv('LOAD_TEST_SUPABASE_SERVICE_ROLE_KEY') ||
      readEnv('SUPABASE_SERVICE_ROLE_KEY'),
    netlifySiteId: readEnv('LOAD_NETLIFY_SITE_ID'),
    netlifyToken: readEnv('LOAD_NETLIFY_TOKEN'),
    dbMetricsRpc: readEnv('LOAD_DB_METRICS_RPC') || 'load_test_connection_snapshot',
    allowProduction: readBoolean('ALLOW_PRODUCTION_LOAD_TEST'),
    confirmStaging: readBoolean('LOAD_CONFIRM_STAGING'),
    productionHosts: readProductionHosts(),
    requestTimeoutMs: readNumber('LOAD_REQUEST_TIMEOUT_MS', 65000),
    thinkTimeMs: readNumber('LOAD_THINK_TIME_MS', 1500),
    thinkTimeJitterMs: readNumber('LOAD_THINK_TIME_JITTER_MS', 1500),
    publicFlowMode: readPublicFlowMode(),
    allowUserReuse: readBoolean('LOAD_ALLOW_USER_REUSE'),
  }
}

function readProductionHosts() {
  return (
    readEnv('LOAD_PRODUCTION_HOSTS') ||
    'soflia.app,www.soflia.app,aprendeyaplica.com,www.aprendeyaplica.com'
  )
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean)
}

export function requireBaseUrl(config: LoadTestConfig) {
  if (!config.baseUrl) {
    throw new Error('LOAD_BASE_URL is required for load execution and metric collection.')
  }
}

export function requireSupabaseConfig(config: LoadTestConfig) {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error(
      'LOAD_TEST_SUPABASE_URL and LOAD_TEST_SUPABASE_SERVICE_ROLE_KEY are required for seed/cleanup.',
    )
  }
}

export function assertSafeTarget(config: LoadTestConfig) {
  requireBaseUrl(config)

  const url = new URL(config.baseUrl)
  const hostname = url.hostname.toLowerCase()
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(hostname)
  const looksLikeStaging =
    hostname.includes('staging') ||
    hostname.includes('stage') ||
    hostname.includes('deploy-preview') ||
    hostname.includes('preview')

  if (config.allowProduction) return
  if (config.productionHosts.includes(hostname)) {
    throw new Error(`Refusing to run load tests against production host ${hostname}.`)
  }
  if (!isLocal && !looksLikeStaging && !config.confirmStaging) {
    throw new Error(
      `Target ${hostname} does not look like an isolated staging URL. Set LOAD_CONFIRM_STAGING=true after verifying the target is safe.`,
    )
  }
}

export { parseProfileName, resolveProfile }
