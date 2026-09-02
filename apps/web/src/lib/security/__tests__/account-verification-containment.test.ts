import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

function readRepositoryFile(relativePath: string) {
  return fs.readFileSync(path.resolve(process.cwd(), '../..', relativePath), 'utf8')
}

describe('unverified account containment', () => {
  const authConfig = readRepositoryFile('supabase/config.toml')
  const migration = readRepositoryFile(
    'supabase/migrations/20260827123000_unverified_account_containment.sql',
  ).toLowerCase()
  const registerAction = fs.readFileSync(
    path.resolve(process.cwd(), 'src/features/auth/actions/register.ts'),
    'utf8',
  )
  const authBridge = fs.readFileSync(
    path.resolve(
      process.cwd(),
      'src/features/auth/services/supabase-auth-bridge.service.ts',
    ),
    'utf8',
  )
  const oauthCallback = fs.readFileSync(
    path.resolve(
      process.cwd(),
      'src/features/auth/services/oauth-flow/oauth-callback.service.ts',
    ),
    'utf8',
  )
  const emailConfirmationRoute = fs.readFileSync(
    path.resolve(process.cwd(), 'src/app/auth/confirm/route.ts'),
    'utf8',
  )
  const configGuard = readRepositoryFile(
    'scripts/security/check-supabase-auth-verification.mjs',
  )
  const adminUpdateSchema = fs.readFileSync(
    path.resolve(process.cwd(), 'src/lib/schemas/user/update-user.schema.ts'),
    'utf8',
  )
  const apiAdminUpdateSchema = readRepositoryFile(
    'apps/api/src/features/admin/users/types/admin-users.schemas.ts',
  )

  it('disables direct Auth signup and requires email confirmation', () => {
    expect(authConfig).toMatch(/\[auth\][\s\S]*?enable_signup = false/)
    expect(authConfig).toMatch(/\[auth\.email\][\s\S]*?enable_signup = false/)
    expect(authConfig).toMatch(/\[auth\.email\][\s\S]*?enable_confirmations = true/)
  })

  it('never auto-confirms a public registration', () => {
    expect(registerAction).toContain('emailVerified: false')
    expect(registerAction).toContain('sendSupabaseSignupConfirmation')
    expect(authBridge).toContain('email_confirm: profile.email_verified === true')
  })

  it('confirms trusted SSO identities and supports token-hash email callbacks', () => {
    expect(oauthCallback).toContain('confirmEmailFromTrustedSso')
    expect(authBridge).toContain('AUTH_EMAIL_MISMATCH')
    expect(authBridge).toContain('email_confirm: true')
    expect(emailConfirmationRoute).toMatch(
      /searchParams\.get\(["']token_hash["']\)/,
    )
    expect(emailConfirmationRoute).toMatch(/["']email["']/)
    expect(emailConfirmationRoute).toMatch(/["']signup["']/)
  })

  it('detects hosted Auth configuration drift', () => {
    expect(configGuard).toContain('disable_signup=true')
    expect(configGuard).toContain('mailer_autoconfirm=false')
    expect(configGuard).toContain('/auth/v1/settings')
  })

  it('derives the profile badge from Auth and quarantines incident accounts', () => {
    expect(migration).toContain('new.email_confirmed_at is not null')
    expect(migration).toContain("migration_source', '') = 'public.users'")
    expect(migration).toContain('security_incident_unverified_account')
    expect(migration).toContain('update auth.users')
    expect(migration).toContain('banned_until')
    expect(migration).toContain('delete from auth.sessions')
    expect(migration).toContain("'example.com'")
    expect(migration).toContain("'maildrop.cc'")
  })

  it('keeps the incident account set inside one executable block', () => {
    expect(migration).toContain('incident_account_ids uuid[]')
    expect(migration).toContain('array[]::uuid[]')
    expect(migration).toContain('where id = any(incident_account_ids)')
    expect(migration).not.toContain('create temporary table incident_untrusted_accounts')
    expect(migration).not.toContain('select id from incident_untrusted_accounts')
  })

  it('does not let generic admin profile updates forge verification or change email', () => {
    for (const source of [adminUpdateSchema, apiAdminUpdateSchema]) {
      expect(source).not.toMatch(/email_verified\s*:/)
      expect(source).not.toMatch(/^\s*email\s*:/m)
    }
  })
})
