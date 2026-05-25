import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvConfig } from '@next/env'
import { createClient } from '@supabase/supabase-js'

interface LegacyUserRow {
  cargo_rol: string | null
  display_name: string | null
  email: string | null
  email_verified: boolean | null
  first_name: string | null
  id: string
  is_banned: boolean | null
  last_name: string | null
  password_hash: string | null
  profile_picture_url: string | null
  username: string | null
}

interface MigrationStats {
  audit: LegacyUserAudit
  authAlreadyPresent: number
  created: number
  createdPasswordless: number
  dryRun: boolean
  errors: Array<{ email: string | null; id: string; message: string }>
  skippedMissingEmail: number
  skippedMissingPasswordHash: number
  scanned: number
}

interface LegacyUserAudit {
  bannedUsers: number
  duplicateEmails: Array<{ email: string; total: number }>
  duplicateNormalizedUsernames: Array<{ total: number; username: string }>
  invalidPasswordHashes: number
  missingEmails: number
  missingPasswordHashes: number
  oauthOnlyUsers: number
  passwordUsers: number
  totalUsers: number
}

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..')

loadMigrationEnv()

async function main() {
  const args = new Set(process.argv.slice(2))
  const apply = args.has('--apply')
  const includePasswordless = args.has('--include-passwordless')
  const limit = readNumberArg('--limit')
  const offset = readNumberArg('--offset') ?? 0
  const dryRun = !apply
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const users = await loadLegacyUsers(supabase, limit, offset)
  const audit = buildLegacyUserAudit(users)
  if (args.has('--audit')) {
    process.stdout.write(`${JSON.stringify(audit, null, 2)}\n`)
    return
  }

  const stats: MigrationStats = {
    audit,
    authAlreadyPresent: 0,
    created: 0,
    createdPasswordless: 0,
    dryRun,
    errors: [],
    scanned: users.length,
    skippedMissingEmail: 0,
    skippedMissingPasswordHash: 0,
  }

  for (const user of users) {
    const email = normalizeEmail(user.email)
    if (!email) {
      stats.skippedMissingEmail += 1
      continue
    }

    const existing = await supabase.auth.admin.getUserById(user.id)
    if (existing.data.user) {
      stats.authAlreadyPresent += 1
      continue
    }

    const hasValidPasswordHash =
      Boolean(user.password_hash) && BCRYPT_HASH_PATTERN.test(user.password_hash ?? '')

    if (!hasValidPasswordHash && !includePasswordless) {
      stats.skippedMissingPasswordHash += 1
      continue
    }

    if (dryRun) {
      stats.created += 1
      if (!hasValidPasswordHash) {
        stats.createdPasswordless += 1
      }
      continue
    }

    const { data, error } = await supabase.auth.admin.createUser({
      app_metadata: {
        legacy_user_id: user.id,
        migration_source: 'public.users',
        role: user.cargo_rol ?? 'Usuario',
      },
      email,
      email_confirm: true,
      id: user.id,
      ...(hasValidPasswordHash ? { password_hash: user.password_hash } : {}),
      user_metadata: {
        display_name: user.display_name,
        first_name: user.first_name,
        last_name: user.last_name,
        legacy_email_verified: user.email_verified,
        profile_picture_url: user.profile_picture_url,
        username: user.username,
      },
    })

    if (error || data.user?.id !== user.id) {
      stats.errors.push({
        email,
        id: user.id,
        message:
          formatAuthAdminError(error) ||
          `Auth id mismatch: ${data.user?.id ?? 'missing'}`,
      })
      continue
    }

    stats.created += 1
    if (!hasValidPasswordHash) {
      stats.createdPasswordless += 1
    }
  }

  process.stdout.write(`${JSON.stringify(stats, null, 2)}\n`)
  if (stats.errors.length > 0) {
    process.exitCode = 1
  }
}

function formatAuthAdminError(
  error:
    | {
        code?: string
        message?: string
        name?: string
        status?: number
      }
    | null
    | undefined,
) {
  if (!error) {
    return null
  }

  const details = [
    error.name ? `name=${error.name}` : null,
    typeof error.status === 'number' ? `status=${error.status}` : null,
    error.code ? `code=${error.code}` : null,
    error.message ? `message=${error.message}` : null,
  ].filter(Boolean)

  return details.join(', ')
}

function loadMigrationEnv() {
  loadEnvConfig(REPO_ROOT)

  const webAppDir = path.join(REPO_ROOT, 'apps', 'web')
  if (existsSync(webAppDir)) {
    loadEnvConfig(webAppDir)
  }
}

function buildLegacyUserAudit(users: LegacyUserRow[]): LegacyUserAudit {
  const duplicateEmails = collectDuplicates(
    users
      .map((user) => normalizeEmail(user.email))
      .filter((email): email is string => Boolean(email)),
  )
  const duplicateNormalizedUsernames = collectDuplicates(
    users
      .map((user) => user.username?.trim().toLowerCase() ?? '')
      .filter(Boolean),
  )

  return {
    bannedUsers: users.filter((user) => user.is_banned).length,
    duplicateEmails: duplicateEmails.map(([email, total]) => ({ email, total })),
    duplicateNormalizedUsernames: duplicateNormalizedUsernames.map(
      ([username, total]) => ({ total, username }),
    ),
    invalidPasswordHashes: users.filter(
      (user) => Boolean(user.password_hash) && !BCRYPT_HASH_PATTERN.test(user.password_hash ?? ''),
    ).length,
    missingEmails: users.filter((user) => !normalizeEmail(user.email)).length,
    missingPasswordHashes: users.filter((user) => !user.password_hash).length,
    oauthOnlyUsers: users.filter((user) => !user.password_hash).length,
    passwordUsers: users.filter((user) => Boolean(user.password_hash)).length,
    totalUsers: users.length,
  }
}

function collectDuplicates(values: string[]) {
  const counts = new Map<string, number>()
  values.forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  })

  return Array.from(counts.entries()).filter(([, total]) => total > 1)
}

async function loadLegacyUsers(
  supabase: ReturnType<typeof createClient>,
  limit: number | undefined,
  offset: number,
) {
  let query = supabase
    .from('users')
    .select(
      [
        'id',
        'username',
        'email',
        'password_hash',
        'email_verified',
        'cargo_rol',
        'first_name',
        'last_name',
        'display_name',
        'profile_picture_url',
        'is_banned',
      ].join(','),
    )
    .order('created_at', { ascending: true })

  if (typeof limit === 'number') {
    query = query.range(offset, offset + limit - 1)
  }

  const { data, error } = await query.returns<LegacyUserRow[]>()
  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

function normalizeEmail(email: string | null) {
  const normalized = email?.trim().toLowerCase()
  return normalized || null
}

function readNumberArg(name: string) {
  const raw = process.argv.find((arg) => arg.startsWith(`${name}=`))
  if (!raw) return undefined

  const value = Number(raw.slice(name.length + 1))
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid ${name} value`)
  }

  return value
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`migrate-legacy-users-to-supabase-auth failed: ${message}\n`)
  process.exitCode = 1
})
