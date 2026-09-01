import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

function readWorkspaceFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8')
}

describe('business sensitive-flow lockdown', () => {
  it('keeps invitation persistence server-only and explicitly authorized', () => {
    const runtime = readWorkspaceFile(
      'src/features/auth/actions/invitation/runtime.ts',
    )
    expect(runtime).toContain('createAdminClient()')
    expect(runtime).toContain('requireBusiness({ organizationId })')
    expect(runtime).toContain('!auth.isOrgAdmin')
    expect(runtime).toContain(
      'createInvitationRepository(securityClient, sessionClient)',
    )
  })

  it('does not let bearer invite links grant owner access', () => {
    const schema = readWorkspaceFile(
      'src/app/api/_schemas/invite-link-create.schema.ts',
    )
    const roleResolver = readWorkspaceFile(
      'src/features/auth/actions/invitation/shared.ts',
    )
    expect(schema).toMatch(/z\.literal\(['"]member['"]\)/)
    expect(roleResolver).toContain("return 'member'")
    expect(roleResolver).not.toMatch(/return ['"](?:admin|owner)['"]/)
  })

  it('guards course purchases in the database and keeps browser roles read-only', () => {
    const handler = readWorkspaceFile(
      'src/app/api/business/courses/purchase-handler.ts',
    )
    const migration = readWorkspaceFile(
      '../../supabase/migrations/20260901120000_secure_organization_course_purchase_guard.sql',
    )
    expect(handler).toContain(".eq('approval_status', 'approved')")
    expect(handler).not.toMatch(
      /\.from\(['"](?:payment_methods|transactions)['"]\)/,
    )
    expect(migration).toContain('pg_advisory_xact_lock')
    expect(migration).toContain('organization_course_period_limit_reached')
    expect(migration).toMatch(
      /revoke insert, update, delete, truncate, references, trigger[\s\S]+from public, anon, authenticated/i,
    )
  })
})
