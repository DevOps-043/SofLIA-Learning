import { describe, expect, it } from 'vitest'
import {
  buildAdminUserInsertPayload,
  buildAdminUserUpdatePayload,
  mapAdminUserCreateError,
  normalizeUsersPagination,
} from '../admin-users/helpers'

describe('admin-users.helpers', () => {
  it('normalizes pagination and clamps limit', () => {
    expect(normalizeUsersPagination({ page: -1, limit: 500, search: '  ada ' })).toMatchObject({
      page: 1,
      limit: 100,
      from: 0,
      to: 99,
      search: 'ada',
    })
  })

  it('builds user insert payload with null-safe optionals', () => {
    const payload = buildAdminUserInsertPayload(
      'user-1',
      {
        username: 'ada',
        email: 'ada@example.com',
        password: 'secret123',
        cargo_rol: 'Administrador',
      },
      'hashed-password',
    )

    expect(payload).toMatchObject({
      id: 'user-1',
      username: 'ada',
      email: 'ada@example.com',
      password_hash: 'hashed-password',
      cargo_rol: 'Administrador',
      first_name: null,
      type_rol: null,
      email_verified: false,
    })
  })

  it('builds update payload and refreshes verification timestamp when needed', () => {
    const payload = buildAdminUserUpdatePayload({
      username: 'ada',
      email_verified: true,
    })

    expect(payload.username).toBe('ada')
    expect(payload.email_verified).toBe(true)
    expect(typeof payload.email_verified_at).toBe('string')
    expect(typeof payload.updated_at).toBe('string')
  })

  it('maps postgres duplicate errors to friendly messages', () => {
    expect(
      mapAdminUserCreateError({
        code: '23505',
        constraint: 'users_email_key',
      }),
    ).toContain('correo electronico')

    expect(
      mapAdminUserCreateError({
        code: '23505',
        message: 'duplicate key value violates username',
      }),
    ).toContain('nombre de usuario')

    expect(mapAdminUserCreateError({ code: '12345' })).toBeNull()
  })
})
