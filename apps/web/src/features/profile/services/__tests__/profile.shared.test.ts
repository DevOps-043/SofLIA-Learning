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

  it('filters profile updates to the allowed fields', () => {
    expect(
      pickAllowedProfileUpdates({
        first_name: 'Ada',
        email: 'ada@example.com',
        bio: 'Engineer',
        type_rol: 'Data Lead',
        date_of_birth: '1990-05-10',
        gender: 'female'
      })
    ).toEqual({
      first_name: 'Ada',
      bio: 'Engineer',
      type_rol: 'Data Lead',
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
          bio: 'Engineer',
          type_rol: 'Data Lead'
        }
      )
    ).toEqual(['last_name', 'type_rol'])
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
