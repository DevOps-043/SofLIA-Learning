import { describe, expect, it } from 'vitest'
import {
  buildAdminUserInsertPayload,
  buildAdminUserUpdatePayload,
  mapAdminUserWithAge,
  mapAdminUserCreateError,
  normalizeUsersPagination,
  omitDemographicsFromAudit,
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
        platform_role: 'Administrador',
        date_of_birth: '1990-05-10',
        gender: 'female',
      },
    )

    expect(payload).toMatchObject({
      id: 'user-1',
      username: 'ada',
      email: 'ada@example.com',
      platform_role: 'Administrador',
      first_name: null,
      date_of_birth: '1990-05-10',
      gender: 'female',
      email_verified: true,
    })
    expect(payload).not.toHaveProperty('password_hash')
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

  it('calculates age and keeps demographics out of audit payloads', () => {
    expect(
      mapAdminUserWithAge({
        id: 'user-1',
        username: 'ada',
        email: 'ada@example.com',
        first_name: null,
        last_name: null,
        display_name: null,
        platform_role: 'Usuario',
        email_verified: false,
        profile_picture_url: null,
        date_of_birth: '2000-04-25',
        gender: 'female',
        created_at: null,
        updated_at: null,
        last_login_at: null,
      }).age,
    ).toEqual(expect.any(Number))

    expect(
      omitDemographicsFromAudit({
        email: 'ada@example.com',
        date_of_birth: '2000-04-25',
        gender: 'female',
        age: 26,
      }),
    ).toEqual({ email: 'ada@example.com' })
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
