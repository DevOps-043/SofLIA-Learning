import { describe, expect, it } from 'vitest'
import type {
  OrganizationUserWithProfileRow,
  PendingInvitationRow,
} from '../business-users-server/types'
import {
  buildOrganizationStats,
  buildOrganizationUserInsertData,
  buildOrganizationUserUpdateData,
  buildUserInsertData,
  buildUserUpdateData,
  hasHierarchyAutoAssignEnabled,
  mapCreateOrganizationUserError,
  mapOrganizationUserRecord,
  normalizeOrganizationRole,
  normalizeOrganizationStatus,
  shouldAutoAssignToDefaultTeam,
  validateCreateBusinessUserRequest,
} from '../business-users-server/helpers'

describe('business-users-server.helpers', () => {
  it('maps organization users with organization metadata and defaults', () => {
    const row: OrganizationUserWithProfileRow = {
      organization_id: 'org-1',
      user_id: 'user-1',
      role: 'admin',
      job_title: 'Ventas',
      status: 'active',
      joined_at: '2026-04-01T00:00:00.000Z',
      users: {
        id: 'user-1',
        username: 'ada',
        email: 'ada@example.com',
        first_name: 'Ada',
        last_name: 'Lovelace',
        display_name: null,
        cargo_rol: null,
        email_verified: true,
        profile_picture_url: null,
        bio: null,
        location: null,
        phone: null,
        points: null,
        last_login_at: null,
        created_at: '2026-03-01T00:00:00.000Z',
        updated_at: '2026-03-02T00:00:00.000Z',
      },
    }

    expect(mapOrganizationUserRecord(row)).toEqual(
      expect.objectContaining({
        id: 'user-1',
        organization_id: 'org-1',
        cargo_rol: 'Business',
        job_title: 'Ventas',
        points: 0,
        org_role: 'admin',
        org_status: 'active',
      }),
    )
  })

  it('builds organization stats with pending invitations and bulk link usage', () => {
    const invitations: PendingInvitationRow[] = [{ role: 'owner' }, { role: 'member' }]

    expect(
      buildOrganizationStats(
        [
          { role: 'admin', status: 'active' },
          { role: 'member', status: 'invited' },
          { role: 'member', status: 'suspended' },
        ],
        invitations,
        [{ current_uses: 2 }, { current_uses: null }],
      ),
    ).toEqual({
      total: 5,
      active: 1,
      invited: 3,
      suspended: 1,
      admins: 2,
      members: 3,
      bulk_link_usage: 2,
    })
  })

  it('builds insert and update payloads without undefined fields', () => {
    expect(
      buildUserInsertData(
        {
          username: 'ada',
          email: 'ada@example.com',
          password: 'secret123',
          job_title: 'Ventas',
          first_name: 'Ada',
          last_name: 'Lovelace',
          display_name: 'Ada',
        },
        'hash',
      ),
    ).toEqual({
      username: 'ada',
      email: 'ada@example.com',
      first_name: 'Ada',
      last_name: 'Lovelace',
      display_name: 'Ada',
      cargo_rol: 'Business',
      password_hash: 'hash',
    })

    expect(
      buildOrganizationUserInsertData(
        'org-1',
        'user-1',
        {
          username: 'ada',
          email: 'ada@example.com',
          password: 'secret123',
          job_title: 'Ventas ',
          org_role: 'admin',
        },
        'creator-1',
        '2026-04-01T00:00:00.000Z',
      ),
    ).toEqual({
      organization_id: 'org-1',
      user_id: 'user-1',
      role: 'admin',
      job_title: 'Ventas',
      status: 'active',
      invited_by: 'creator-1',
      invited_at: '2026-04-01T00:00:00.000Z',
      joined_at: '2026-04-01T00:00:00.000Z',
    })

    expect(
      buildUserUpdateData({
        display_name: 'Ada',
        email: 'ada@example.com',
        location: 'CDMX',
      }),
    ).toEqual({
      display_name: 'Ada',
      email: 'ada@example.com',
      location: 'CDMX',
    })

    expect(
      buildOrganizationUserUpdateData({
        org_role: 'owner',
        org_status: 'suspended',
        job_title: 'Direccion',
      }),
    ).toEqual({
      role: 'owner',
      status: 'suspended',
      job_title: 'Direccion',
    })
  })

  it('normalizes enum-like values and exposes hierarchy flags', () => {
    expect(normalizeOrganizationRole('owner')).toBe('owner')
    expect(normalizeOrganizationRole('weird')).toBe('member')
    expect(normalizeOrganizationStatus('removed')).toBe('removed')
    expect(normalizeOrganizationStatus('unknown')).toBe('active')
    expect(shouldAutoAssignToDefaultTeam('member')).toBe(true)
    expect(shouldAutoAssignToDefaultTeam('admin')).toBe(false)
    expect(hasHierarchyAutoAssignEnabled({ auto_assign_new_users: true })).toBe(true)
    expect(hasHierarchyAutoAssignEnabled({ auto_assign_new_users: false })).toBe(false)
  })

  it('maps duplicate-key postgres errors to user friendly messages', () => {
    expect(
      mapCreateOrganizationUserError({
        code: '23505',
        constraint: 'users_email_key',
      })?.message,
    ).toContain('correo electronico')

    expect(
      mapCreateOrganizationUserError({
        code: '23505',
        constraint: 'users_username_key',
      })?.message,
    ).toContain('nombre de usuario')

    expect(mapCreateOrganizationUserError({ code: '22001' })).toBeNull()
  })

  it('validates required create fields', () => {
    expect(() =>
      validateCreateBusinessUserRequest({
        username: 'ada',
        email: 'ada@example.com',
        password: '123',
        job_title: 'Ventas',
      }),
    ).toThrow('al menos 6 caracteres')

    expect(() =>
      validateCreateBusinessUserRequest({
        username: 'ada',
        email: 'ada@example.com',
        password: 'secret123',
        job_title: '   ',
      }),
    ).toThrow('cargo/puesto')
  })
})
