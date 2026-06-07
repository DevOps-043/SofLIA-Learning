import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BusinessUser } from '../businessUsers.service'
import {
  buildOrganizationUsersCsvExport,
  buildUsersCsv,
} from '../business-users-export.service'

vi.mock('server-only', () => ({}))

const { getOrganizationUsersMock } = vi.hoisted(() => ({
  getOrganizationUsersMock: vi.fn(),
}))

vi.mock('../businessUsers.server.service', () => ({
  BusinessUsersServerService: {
    getOrganizationUsers: getOrganizationUsersMock,
  },
}))

describe('business-users-export.service', () => {
  beforeEach(() => {
    getOrganizationUsersMock.mockReset()
  })

  it('builds a CSV with all organization users and redacted password values', async () => {
    const users = [
      buildBusinessUser({
        id: 'user-1',
        username: 'ada',
        email: 'ada@example.com',
        first_name: 'Ada',
        last_name: 'Lovelace',
        display_name: 'Ada Lovelace',
        job_title: 'Ventas, Senior',
        org_role: 'admin',
      }),
      buildBusinessUser({
        id: 'user-2',
        username: 'grace',
        email: 'grace@example.com',
        first_name: 'Grace',
        last_name: 'O"Connor',
        display_name: null,
        job_title: 'Operaciones',
        org_role: 'member',
        org_status: 'suspended',
      }),
    ]

    getOrganizationUsersMock.mockResolvedValue(users)

    const csv = await buildOrganizationUsersCsvExport('org-1')

    expect(getOrganizationUsersMock).toHaveBeenCalledWith('org-1')
    expect(csv).toContain('username,email,first_name,last_name,display_name,date_of_birth,gender,job_title,org_role,org_status,password')
    expect(csv).toContain('ada,ada@example.com,Ada,Lovelace,Ada Lovelace,,,\"Ventas, Senior\",admin,active,****************')
    expect(csv).toContain('grace,grace@example.com,Grace,\"O\"\"Connor\",,,,Operaciones,member,suspended,****************')
    expect(csv.match(/\*{16}/g)).toHaveLength(2)
  })

  it('preserves the header when the organization has no users', () => {
    expect(buildUsersCsv([])).toBe(
      '\uFEFFusername,email,first_name,last_name,display_name,date_of_birth,gender,job_title,org_role,org_status,password',
    )
  })

  it('neutralizes spreadsheet formulas in exported user fields', () => {
    const csv = buildUsersCsv([
      buildBusinessUser({
        username: '=cmd',
        email: '+user@example.com',
        first_name: '-Ada',
        last_name: '@Lovelace',
        display_name: ' =SUM(1,1)',
      }),
    ])

    expect(csv).toContain("'=cmd,'+user@example.com,'-Ada,'@Lovelace,\"' =SUM(1,1)\"")
  })
})

function buildBusinessUser(overrides: Partial<BusinessUser>): BusinessUser {
  return {
    id: 'user-id',
    username: 'user',
    email: 'user@example.com',
    cargo_rol: 'Business',
    email_verified: true,
    points: 0,
    created_at: '2026-06-06T00:00:00.000Z',
    updated_at: '2026-06-06T00:00:00.000Z',
    org_status: 'active',
    ...overrides,
  }
}
