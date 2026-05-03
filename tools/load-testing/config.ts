import path from 'node:path';
import fs from 'node:fs';
import type { LoadProfile, LoadProfileName, LoadTestConfig } from './types';

let envFileLoaded = false;

function parseEnvLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return undefined;

  const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!match) return undefined;

  let value = match[2].trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { name: match[1], value };
}

function loadEnvFile() {
  if (envFileLoaded) return;
  envFileLoaded = true;

  const envFile = process.env.LOAD_ENV_FILE || '.env.load-test';
  const envPath = path.resolve(envFile);
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;
    process.env[parsed.name] ||= parsed.value;
  }
}

function readEnv(name: string): string | undefined {
  loadEnvFile();
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function readNumber(name: string, fallback: number): number {
  const raw = readEnv(name);
  if (!raw) return fallback;

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a positive number. Received: ${raw}`);
  }

  return value;
}

function readBoolean(name: string, fallback = false): boolean {
  const raw = readEnv(name);
  if (!raw) return fallback;
  return ['1', 'true', 'yes', 'y'].includes(raw.toLowerCase());
}

function defaultRunId() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, 'Z');
}

function sanitizeRunId(runId: string) {
  return runId.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 48);
}

export function qaPrefix(runId: string) {
  return `qa_load_${sanitizeRunId(runId)}`;
}

export function qaSlug(prefix: string) {
  return prefix.replace(/_/g, '-');
}

export function getConfig(): LoadTestConfig {
  const runId = sanitizeRunId(readEnv('LOAD_RUN_ID') || defaultRunId());
  const prefix = qaPrefix(runId);
  const orgSlug = readEnv('LOAD_TEST_ORG_SLUG') || `${qaSlug(prefix)}-org`;

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
    productionHosts: (readEnv('LOAD_PRODUCTION_HOSTS') || 'soflia.app,www.soflia.app,aprendeyaplica.com,www.aprendeyaplica.com')
      .split(',')
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
    requestTimeoutMs: readNumber('LOAD_REQUEST_TIMEOUT_MS', 65000),
    thinkTimeMs: readNumber('LOAD_THINK_TIME_MS', 750),
    allowUserReuse: readBoolean('LOAD_ALLOW_USER_REUSE'),
  };
}

export function requireBaseUrl(config: LoadTestConfig) {
  if (!config.baseUrl) {
    throw new Error('LOAD_BASE_URL is required for load execution and metric collection.');
  }
}

export function requireSupabaseConfig(config: LoadTestConfig) {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error(
      'LOAD_TEST_SUPABASE_URL and LOAD_TEST_SUPABASE_SERVICE_ROLE_KEY are required for seed/cleanup.'
    );
  }
}

export function assertSafeTarget(config: LoadTestConfig) {
  requireBaseUrl(config);

  const url = new URL(config.baseUrl);
  const hostname = url.hostname.toLowerCase();
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(hostname);
  const looksLikeStaging =
    hostname.includes('staging') ||
    hostname.includes('stage') ||
    hostname.includes('deploy-preview') ||
    hostname.includes('preview');
  const isKnownProduction = config.productionHosts.includes(hostname);

  if (config.allowProduction) {
    return;
  }

  if (isKnownProduction) {
    throw new Error(
      `Refusing to run load tests against production host ${hostname}. Set ALLOW_PRODUCTION_LOAD_TEST=true only for an approved production window.`
    );
  }

  if (!isLocal && !looksLikeStaging && !config.confirmStaging) {
    throw new Error(
      `Target ${hostname} does not look like an isolated staging URL. Set LOAD_CONFIRM_STAGING=true after verifying the target is safe.`
    );
  }
}

export function resolveProfile(name: LoadProfileName, targetVus: number): LoadProfile {
  const profileTarget = Math.max(1, Math.floor(targetVus));

  switch (name) {
    case 'smoke':
      return {
        name,
        maxVus: 20,
        stages: [
          { name: 'ramp-to-20', durationSec: 60, targetVus: 20 },
          { name: 'hold-20', durationSec: 240, targetVus: 20 },
        ],
      };
    case 'load':
      return {
        name,
        maxVus: profileTarget,
        stages: [
          { name: `ramp-to-${profileTarget}`, durationSec: 900, targetVus: profileTarget },
          { name: `hold-${profileTarget}`, durationSec: 1800, targetVus: profileTarget },
          { name: 'recovery', durationSec: 300, targetVus: 0 },
        ],
      };
    case 'stress':
      return {
        name,
        maxVus: 1100,
        stages: [
          { name: 'ramp-to-700', durationSec: 300, targetVus: 700 },
          { name: 'hold-700', durationSec: 600, targetVus: 700 },
          { name: 'hold-900', durationSec: 600, targetVus: 900 },
          { name: 'hold-1100', durationSec: 600, targetVus: 1100 },
          { name: 'recovery', durationSec: 300, targetVus: 0 },
        ],
      };
    case 'spike':
      return {
        name,
        maxVus: profileTarget,
        stages: [
          { name: `spike-to-${profileTarget}`, durationSec: 120, targetVus: profileTarget },
          { name: `hold-${profileTarget}`, durationSec: 600, targetVus: profileTarget },
          { name: 'recovery', durationSec: 120, targetVus: 0 },
        ],
      };
    case 'soak':
      return {
        name,
        maxVus: profileTarget,
        stages: [
          { name: 'ramp-to-350', durationSec: 300, targetVus: Math.min(350, profileTarget) },
          { name: `soak-to-${profileTarget}`, durationSec: 7200, targetVus: profileTarget },
          { name: 'recovery', durationSec: 300, targetVus: 0 },
        ],
      };
  }
}

export function parseProfileName(raw: string | undefined): LoadProfileName {
  const value = raw || 'smoke';
  if (!['smoke', 'load', 'stress', 'spike', 'soak'].includes(value)) {
    throw new Error(`Unknown load profile "${value}". Expected smoke, load, stress, spike, or soak.`);
  }

  return value as LoadProfileName;
}
