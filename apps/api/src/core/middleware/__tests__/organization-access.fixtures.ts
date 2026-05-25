import type { Request } from 'express'
import { vi } from 'vitest'

export const userMaybeSingleMock = vi.fn()
export const membershipMaybeSingleMock = vi.fn()
export const userEqIdMock = vi.fn(() => ({ maybeSingle: userMaybeSingleMock }))
export const userSelectMock = vi.fn(() => ({ eq: userEqIdMock }))
export const membershipEqStatusMock = vi.fn(() => ({
  maybeSingle: membershipMaybeSingleMock,
}))
export const membershipEqUserMock = vi.fn(() => ({ eq: membershipEqStatusMock }))
export const membershipEqOrgMock = vi.fn(() => ({ eq: membershipEqUserMock }))
export const membershipSelectMock = vi.fn(() => ({ eq: membershipEqOrgMock }))

export const fromMock = vi.fn((table: string) => {
  if (table === 'users') return { select: userSelectMock }
  if (table === 'organization_users') return { select: membershipSelectMock }
  throw new Error(`Unexpected table ${table}`)
})

export function resetOrganizationAccessMocks() {
  fromMock.mockClear()
  userSelectMock.mockClear()
  membershipSelectMock.mockClear()
  userEqIdMock.mockClear()
  membershipEqOrgMock.mockClear()
  membershipEqUserMock.mockClear()
  membershipEqStatusMock.mockClear()
  userMaybeSingleMock.mockReset()
  membershipMaybeSingleMock.mockReset()
}

export function createRequest(params?: Record<string, string>) {
  return {
    params: params ?? {},
    user: {
      id: 'user-1',
      email: 'business@example.com',
      role: 'business',
    },
  } as unknown as Request
}
