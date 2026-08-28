import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import { resolveReportEvidenceStoragePath } from '../report-evidence.server'

describe('report evidence storage references', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
  })

  it('accepts a safe private storage path', () => {
    expect(resolveReportEvidenceStoragePath('report-user-123.png')).toBe(
      'report-user-123.png',
    )
  })

  it('migrates a legacy public URL only from the configured project and bucket', () => {
    expect(resolveReportEvidenceStoragePath(
      'https://project.supabase.co/storage/v1/object/public/reportes-screenshots/report-user-123.png',
    )).toBe('report-user-123.png')
  })

  it('rejects external origins, other buckets and traversal', () => {
    expect(resolveReportEvidenceStoragePath(
      'https://attacker.test/storage/v1/object/public/reportes-screenshots/report.png',
    )).toBeNull()
    expect(resolveReportEvidenceStoragePath(
      'https://project.supabase.co/storage/v1/object/public/avatars/report.png',
    )).toBeNull()
    expect(resolveReportEvidenceStoragePath('../secret.png')).toBeNull()
  })
})
