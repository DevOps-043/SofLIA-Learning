import { describe, expect, it, vi } from 'vitest'
import { fetchDashboardBaseData } from '../dashboard-base-data'
import { fetchInitialDashboardData } from '@/app/api/business-user/dashboard/dashboard/initial-queries'
import type { DashboardSupabaseClient } from '../dashboard.types'

function client(error: unknown = null) {
  const assignments = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
    returns: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: error ? null : [], error }),
  }
  const certificates = { ...assignments, limit: vi.fn().mockResolvedValue({ data: [], error: null }) }
  return { from: vi.fn((table: string) => table === 'organization_course_assignments' ? assignments : certificates) } as unknown as DashboardSupabaseClient
}

describe.each([
  ['organization route', (db: DashboardSupabaseClient) => fetchDashboardBaseData(db, { userId: 'user', organizationId: 'org', orgSlug: 'org' })],
  ['legacy route', (db: DashboardSupabaseClient) => fetchInitialDashboardData(db, 'user', 'org')],
] as const)('%s assignments', (_name, load) => {
  it('propagates query failures instead of returning an empty successful dashboard', async () => {
    await expect(load(client({ message: 'connection failed' }))).rejects.toThrow('cursos asignados')
  })
  it('allows a genuinely empty assignment result', async () => {
    await expect(load(client())).resolves.toBeDefined()
  })
})
