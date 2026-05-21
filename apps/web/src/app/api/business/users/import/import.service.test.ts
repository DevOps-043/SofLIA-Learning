import { performance } from 'node:perf_hooks'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createAdminClient } from '@/lib/supabase/admin'

import { importBusinessUsersFromCsv } from './import.service'

const {
  createAdminClientMock,
  createAuthUserMock,
  deleteAuthUserMock,
} = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  createAuthUserMock: vi.fn(async () => ({ id: 'auth-user' })),
  deleteAuthUserMock: vi.fn(async () => undefined),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('@/features/auth/services/supabase-auth-bridge.service', () => ({
  createSupabaseAuthUserWithLegacyId: createAuthUserMock,
  deleteSupabaseAuthUser: deleteAuthUserMock,
}))

const mockedCreateAdminClient = vi.mocked(createAdminClient)

describe('importBusinessUsersFromCsv', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('imports 100 CSV rows with batched lookups and inserts under 3 seconds', async () => {
    const supabase = createBulkImportSupabaseMock()
    mockedCreateAdminClient.mockReturnValueOnce(supabase.client)
    const csv = buildCsv(100)

    const startedAt = performance.now()
    const importResult = await importBusinessUsersFromCsv({
      fileContent: csv,
      organizationId: 'org-1',
      createdBy: 'admin-1',
    })
    const durationMs = performance.now() - startedAt

    expect(importResult.success).toBe(true)
    if (!importResult.success) return

    expect(importResult.result.success).toBe(100)
    expect(importResult.result.errors).toHaveLength(0)
    expect(supabase.userLookupQueries).toBe(2)
    expect(supabase.insertedUsers).toHaveLength(100)
    expect(supabase.insertedMemberships).toHaveLength(100)
    expect(createAuthUserMock).toHaveBeenCalledTimes(100)
    expect(supabase.insertedUsers[0]).toHaveProperty('id')
    expect(supabase.insertedUsers[0]).not.toHaveProperty('password_hash')
    expect(durationMs).toBeLessThan(3000)
  })
})

function buildCsv(totalRows: number) {
  const rows = Array.from({ length: totalRows }, (_, index) => {
    const row = index + 1
    return [
      `user-${row}`,
      `user-${row}@example.com`,
      `Password-${row}`,
      `Cargo ${row}`,
      'member',
    ].join(',')
  })

  return [
    'username,email,password,job_title,org_role',
    ...rows,
  ].join('\n')
}

function createBulkImportSupabaseMock() {
  const state = {
    userLookupQueries: 0,
    insertedUsers: [] as Array<Record<string, unknown>>,
    insertedMemberships: [] as Array<Record<string, unknown>>,
  }

  const client = {
    from(tableName: string) {
      if (tableName === 'organizations') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { hierarchy_enabled: false, hierarchy_config: null },
                error: null,
              }),
            }),
          }),
        }
      }

      if (tableName === 'users') {
        return {
          select: () => ({
            in: async () => {
              state.userLookupQueries += 1
              return { data: [], error: null }
            },
          }),
          insert: (rows: Array<Record<string, unknown>>) => {
            state.insertedUsers = rows
            return {
              select: async () => ({
                data: rows.map((row, index) => ({
                  id: row.id || `created-user-${index + 1}`,
                  email: row.email,
                  username: row.username,
                })),
                error: null,
              }),
            }
          },
          delete: () => ({
            in: async () => ({ error: null }),
          }),
        }
      }

      if (tableName === 'organization_users') {
        return {
          insert: async (rows: Array<Record<string, unknown>>) => {
            state.insertedMemberships = rows
            return { error: null }
          },
          select: () => ({
            eq: () => ({
              in: async () => ({ data: [], error: null }),
            }),
          }),
        }
      }

      if (tableName === 'organization_node_users') {
        return {
          insert: async () => ({ error: null }),
        }
      }

      throw new Error(`Unexpected table in bulk import test: ${tableName}`)
    },
  } as unknown as ReturnType<typeof createAdminClient>

  return Object.assign(state, { client })
}
