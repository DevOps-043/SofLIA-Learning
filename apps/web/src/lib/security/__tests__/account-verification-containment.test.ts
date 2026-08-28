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
    expect(authBridge).not.toContain('email_confirm: true')
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
