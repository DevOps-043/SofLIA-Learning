import { describe, expect, it } from 'vitest'
import {
  buildAnalyticsIdentityMaps,
  buildAnalyticsPrimaryUserIdMap,
  expandAnalyticsUserIds,
  getAnalyticsRelatedIdsForUserIds,
  getAnalyticsUserRelatedIds,
  normalizeAnalyticsUserId,
} from '../analytics-identity.service'

describe('analytics-identity.service', () => {
  const identities = [
    { id: 'user-1', email: 'ana@example.com' },
    { id: 'user-1b', email: 'ana@example.com' },
    { id: 'user-2', email: 'mario@example.com' },
  ]
  const primaryUsers = [
    { user_id: 'user-1', email: 'ana@example.com' },
    { user_id: 'user-2', email: 'mario@example.com' },
  ]

  it('builds lookup maps by email and user id', () => {
    const maps = buildAnalyticsIdentityMaps(identities)

    expect(maps.emailByUserId.get('user-1')).toBe('ana@example.com')
    expect(maps.userIdsByEmail.get('ana@example.com')).toEqual(['user-1', 'user-1b'])
  })

  it('expands seed user ids with alternate ids discovered by email', () => {
    expect(expandAnalyticsUserIds(['user-1'], identities)).toEqual([
      'user-1',
      'user-1b',
      'user-2',
    ])
  })

  it('resolves all related ids for a user email with fallback behavior', () => {
    const maps = buildAnalyticsIdentityMaps(identities)

    expect(getAnalyticsUserRelatedIds('ana@example.com', 'user-1', maps)).toEqual([
      'user-1',
      'user-1b',
    ])
    expect(getAnalyticsUserRelatedIds(null, 'user-1', maps)).toEqual(['user-1'])
  })

  it('expands team member ids into all related ids tied to the same emails', () => {
    const maps = buildAnalyticsIdentityMaps(identities)

    expect(getAnalyticsRelatedIdsForUserIds(['user-1', 'user-2'], maps)).toEqual([
      'user-1',
      'user-1b',
      'user-2',
    ])
  })

  it('maps alternate uuids to the primary organization user id', () => {
    const primaryUserIdMap = buildAnalyticsPrimaryUserIdMap(primaryUsers, identities)

    expect(primaryUserIdMap.get('user-1')).toBe('user-1')
    expect(primaryUserIdMap.get('user-1b')).toBe('user-1')
    expect(normalizeAnalyticsUserId('user-1b', primaryUserIdMap)).toBe('user-1')
    expect(normalizeAnalyticsUserId('missing', primaryUserIdMap)).toBeNull()
  })
})
