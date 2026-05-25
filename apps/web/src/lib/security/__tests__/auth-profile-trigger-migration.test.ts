import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationPath = resolve(
  process.cwd(),
  '../../supabase/migrations/20260525150000_never_block_auth_user_creation_from_profile_trigger.sql',
)

describe('auth profile trigger migration', () => {
  it('keeps the auth.users trigger conflict-safe and profile-minimal', () => {
    const migration = readFileSync(migrationPath, 'utf8')

    expect(migration).toContain('create or replace function public.handle_auth_user_created()')
    expect(migration).toContain("fallback_username := 'u_'")
    expect(migration).toContain('where username = candidate_username')
    expect(migration).toContain('lower(new.email) ~*')
    expect(migration).toContain('safe_email := lower(new.email)')
    expect(migration).toContain('exception')
    expect(migration).toContain('raise warning')
    expect(migration).toContain('on conflict (id) do update')
    expect(migration).not.toContain("new.raw_user_meta_data ->> 'username'")
    expect(migration).not.toContain('password_hash')
  })

  it('removes legacy public.users password_hash trigger guards', () => {
    const guardMigration = readFileSync(
      resolve(
        process.cwd(),
        '../../supabase/migrations/20260525152000_remove_legacy_password_hash_profile_guard.sql',
      ),
      'utf8',
    )

    expect(guardMigration).toContain('alter column password_hash drop not null')
    expect(guardMigration).toContain("tgrelid = 'public.users'::regclass")
    expect(guardMigration).toContain("ilike '%password_hash%'")
    expect(guardMigration).toContain('drop trigger if exists')
  })

  it('adds idempotency indexes for invitation redemption', () => {
    const invitationMigration = readFileSync(
      resolve(
        process.cwd(),
        '../../supabase/migrations/20260525154000_invitation_membership_idempotency.sql',
      ),
      'utf8',
    )

    expect(invitationMigration).toContain(
      'on public.organization_users (organization_id, user_id)',
    )
    expect(invitationMigration).toContain(
      'on public.bulk_invite_registrations (bulk_invite_link_id, user_id)',
    )
    expect(invitationMigration).toContain('on public.user_invitations (token)')
    expect(invitationMigration).toContain("where status = 'pending'")
  })
})
