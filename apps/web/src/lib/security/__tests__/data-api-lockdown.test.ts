import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationPath = path.resolve(
  process.cwd(),
  '../../supabase/migrations/20260827120000_emergency_data_api_lockdown.sql',
)
const migration = fs.readFileSync(migrationPath, 'utf8').toLowerCase()
const adminVideoUploadClient = fs.readFileSync(
  path.resolve(
    process.cwd(),
    'src/features/admin/components/video-provider-selector/video-provider-selector.service.ts',
  ),
  'utf8',
)
const certificatePdfService = fs.readFileSync(
  path.resolve(
    process.cwd(),
    'src/features/certificates/services/certificate-pdf.server.ts',
  ),
  'utf8',
)

describe('emergency Data API lockdown migration', () => {
  it('revokes browser access to credential-bearing tables', () => {
    for (const table of [
      'password_reset_tokens',
      'refresh_tokens',
      'user_session',
      'oauth_accounts',
      'payment_methods',
      'user_invitations',
    ]) {
      expect(migration).toContain(`'${table}'`)
    }
    expect(migration).toContain('revoke all on table public.%i from public, anon, authenticated')
    expect(migration).toContain("'password_reset_tokens',\n    'refresh_tokens',\n    'user_session'")
    expect(migration).toContain("execute format('delete from public.%i', credential_table)")
  })

  it('makes report evidence private and removes unsafe storage policies', () => {
    expect(migration).toContain("where id = 'reportes-screenshots'")
    expect(migration).toContain("set public = false")
    expect(migration).toContain("where schemaname = 'storage'")
    expect(migration).toContain("drop policy %i on storage.objects")
    expect(migration).not.toContain('policy_expression')
    expect(adminVideoUploadClient).not.toMatch(/\.storage\s*\.from\(/)
    expect(adminVideoUploadClient).toContain("fetch('/api/admin/upload/course-videos'")
  })

  it('keeps certificate PDFs behind the ownership-checked download API', () => {
    expect(migration).toContain("where id = 'certificates'")
    expect(migration).toMatch(
      /set public = false,[\s\S]*?where id = 'certificates'/,
    )
    expect(certificatePdfService).not.toContain("from('certificates').getPublicUrl")
    expect(certificatePdfService).toContain(
      '/api/certificates/${encodeURIComponent(certificateId)}/download',
    )
  })

  it('locks destructive RPCs to service role', () => {
    expect(migration).toContain("procedure.prokind in ('f', 'w')")
    expect(migration).toContain("procedure.prokind = 'p'")
    expect(migration).toContain(
      'revoke execute on function %i.%i(%s) from public, anon',
    )
    expect(migration).toContain(
      'revoke execute on function public.delete_user_cascade(uuid) from public, anon, authenticated',
    )
    expect(migration).toContain(
      'grant execute on function public.delete_user_cascade(uuid) to service_role',
    )
    expect(migration).toContain("auth.role()) is distinct from 'service_role'")
    expect(migration).toContain(
      'revoke execute on function public.claim_legacy_course_progress(uuid, uuid, uuid, uuid)',
    )
  })

  it('rebuilds exposed user-data policies and blocks privileged profile fields', () => {
    expect(migration).toContain("'lia_messages'")
    expect(migration).toContain("'organizations'")
    expect(migration).toContain("'user_course_enrollments'")
    expect(migration).toContain("'user_course_certificates'")
    expect(migration).toContain('drop policy %i on %i.%i')
    expect(migration).toContain('grant update (')
    expect(migration).not.toContain('grant select, update on table public.users')
    expect(migration).not.toMatch(/grant update \([^)]*platform_role/s)
    expect(migration).not.toMatch(/grant select \([^)]*password_hash/s)
    expect(migration).toContain('create policy organizations_select_member')
    expect(migration).toContain('create policy users_select_managed_organization')
    expect(migration).toContain('create policy users_select_public_instructor')
    expect(migration).toMatch(/create policy users_select_public_instructor\s+on public\.users for select to anon\s+using/s)
    expect(migration).not.toMatch(/users_select_public_instructor\s+on public\.users for select to anon, authenticated/s)
    expect(migration).not.toMatch(/to anon[^;]*email/s)
    expect(migration).toContain('create policy organizations_update_manager')
    expect(migration).not.toMatch(/grant update \([^)]*subscription_plan/s)
  })

  it('only creates RLS policies on real or partitioned tables', () => {
    expect(migration).toContain("relation.relkind in ('r', 'p')")
    expect(migration).toContain("attribute.attname = 'user_id'")
    expect(migration).not.toContain('select columns.table_name\n    from information_schema.columns')
  })

  it('removes legacy public catalog policies before adding the allowlist', () => {
    expect(migration).toContain('drop_legacy_public_catalog_policies')
    expect(migration).toContain('revoke all on table public.courses from public, anon, authenticated')
    expect(migration).not.toMatch(/drop_legacy_public_catalog_policies[\s\S]*?and \('public' = any\(roles\)/)
    expect(migration).toContain("using (is_active = true and approval_status = 'approved')")
    expect(migration).not.toMatch(/grant select \([^)]*rejection_reason/s)
    expect(migration).not.toMatch(/grant select \([^)]*user_id[^)]*\) on public\.course_reviews/s)
  })

  it('changes future objects to deny-by-default', () => {
    expect(migration).toContain("select viewname as relation_name from pg_views where schemaname = 'public'")
    expect(migration).toContain("select matviewname as relation_name from pg_matviews where schemaname = 'public'")
    expect(migration).toContain(
      'revoke all on table public.%i from public, anon, authenticated',
    )
    expect(migration).toContain(
      'alter default privileges in schema public revoke execute on functions from public, anon, authenticated',
    )
    expect(migration).toContain(
      'alter default privileges in schema public revoke select, insert, update, delete on tables from anon, authenticated',
    )
  })
})
