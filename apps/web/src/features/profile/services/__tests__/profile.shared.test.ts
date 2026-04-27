import { describe, expect, it } from 'vitest'
import {
  createEmptyUserStats,
  normalizeUserStats,
  pickAllowedProfileUpdates,
  resolveChangedProfileFields,
  resolveProfileColors
} from '../profile.shared'

describe('profile.shared', () => {
  it('returns empty stats when payload is missing', () => {
    expect(normalizeUserStats(null)).toEqual(createEmptyUserStats())
  })

  it('filters profile updates to the allowed fields', () => {
    expect(
      pickAllowedProfileUpdates({
        first_name: 'Ada',
        email: 'ada@example.com',
        bio: 'Engineer',
        github_url: 'https://github.com/ada',
        date_of_birth: '1990-05-10',
        gender: 'female'
      })
    ).toEqual({
      first_name: 'Ada',
      bio: 'Engineer',
      github_url: 'https://github.com/ada',
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
          github_url: 'https://github.com/ada'
        }
      )
    ).toEqual(['last_name', 'github_url'])
  })

  it('forces readable light-mode colors when dashboard styles are white', () => {
    expect(
      resolveProfileColors({
        card_background: '#FFFFFF',
        sidebar_background: '#0F1419',
        text_color: '#FFFFFF'
      })
    ).toMatchObject({
      bgPrimary: '#F1F5F9',
      text: '#0F172A'
    })
  })
})
