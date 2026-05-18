import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock, insertPayloads } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  insertPayloads: [] as Array<Record<string, unknown>>,
}))

vi.mock('../../../../lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
  },
  hash: vi.fn().mockResolvedValue('hashed-password'),
}))

vi.mock('../password-breach-check.server', () => ({
  validatePasswordIsNotBreached: vi.fn().mockResolvedValue(null),
}))

function createRegisterFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData()
  const values = {
    firstName: 'Ada',
    lastName: 'Lovelace',
    username: 'adalovelace',
    email: 'ada@example.com',
    confirmEmail: 'ada@example.com',
    password: 'Password1234!',
    confirmPassword: 'Password1234!',
    countryCode: 'MX',
    phoneNumber: '5512345678',
    acceptTerms: 'true',
    ...overrides,
  }

  Object.entries(values).forEach(([key, value]) => {
    formData.append(key, value)
  })

  return formData
}

function createSupabaseMock() {
  const usersTable = {
    select: vi.fn(() => ({
      or: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    insert: vi.fn((payload: Record<string, unknown>) => {
      insertPayloads.push(payload)
      return {
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: payload.id },
            error: null,
          }),
        })),
      }
    }),
  }

  return {
    from: vi.fn((tableName: string) => {
      if (tableName === 'users') {
        return usersTable
      }

      throw new Error(`Unexpected table ${tableName}`)
    }),
  }
}

describe('registerAction', () => {
  beforeEach(() => {
    insertPayloads.length = 0
    createClientMock.mockResolvedValue(createSupabaseMock())
  })

  it('inserts optional demographics when provided', async () => {
    const { registerAction } = await import('../register')

    const result = await registerAction(
      createRegisterFormData({
        dateOfBirth: '1990-05-10',
        gender: 'female',
      }),
    )

    expect(result).toMatchObject({ success: true })
    expect(insertPayloads[0]).toMatchObject({
      date_of_birth: '1990-05-10',
      gender: 'female',
    })
  })

  it('allows omitted demographics for public registration', async () => {
    const { registerAction } = await import('../register')

    const result = await registerAction(createRegisterFormData())

    expect(result).toMatchObject({ success: true })
    expect(insertPayloads[0]).toMatchObject({
      date_of_birth: null,
      gender: null,
    })
  })
})
