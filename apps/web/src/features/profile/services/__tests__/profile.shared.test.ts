import { describe, expect, it } from 'vitest'
import {
  createEmptyUserStats,
  normalizeUserStats,
  mapUserProfileRow,
  pickAllowedProfileUpdates,
  resolveChangedProfileFields,
  resolveProfileColors
} from '../profile.shared'

describe('profile.shared', () => {
  it('returns empty stats when payload is missing', () => {
    expect(normalizeUserStats(null)).toEqual(createEmptyUserStats())
  })

  it('maps credential editing metadata without exposing password state', () => {
    expect(
      mapUserProfileRow({
        auth_providers: ['google'],
        can_edit_credentials: false,
        created_at: '2026-05-21T00:00:00.000Z',
        id: 'user-1',
      }),
    ).toMatchObject({
      auth_providers: ['google'],
      can_edit_credentials: false,
      id: 'user-1',
    })
  })

  // `type_rol` fue eliminada de la tabla `users` (el cargo vive ahora en
  // `organization_users.job_title`), así que ya no puede colarse en el UPDATE:
  // PostgREST rechazaba la consulta entera con "column does not exist".
  it('filters profile updates to the allowed fields and drops the removed type_rol', () => {
    expect(
      pickAllowedProfileUpdates({
        first_name: 'Ada',
        email: 'ada@example.com',
        bio: 'Engineer',
        type_rol: 'Data Lead',
        date_of_birth: '1990-05-10',
        gender: 'female'
      } as Parameters<typeof pickAllowedProfileUpdates>[0])
    ).toEqual({
      first_name: 'Ada',
      bio: 'Engineer',
      date_of_birth: '1990-05-10',
      gender: 'female'
    })
  })

  it('detects only the profile fields that actually changed', () => {
    expect(
      resolveChangedProfileFields(
        {
          first_name: 'Ada',
          last_name: 'Lovelace',
          bio: 'Engineer'
        },
        {
          first_name: 'Ada',
          last_name: 'Byron',
          bio: 'Engineer'
        }
      )
    ).toEqual(['last_name'])
  })

  it('forces readable light-mode colors when dashboard styles are white', () => {
    expect(
      resolveProfileColors({
        card_background: 'var(--color-bg-light)',
        sidebar_background: 'var(--color-bg-dark)',
        text_color: 'var(--color-bg-light)'
      })
    ).toMatchObject({
      bgPrimary: 'var(--color-gray-100)',
      text: 'var(--color-legacy-0f172a)'
    })
  })
})
