export interface AnalyticsIdentityRecord {
  id: string
  email: string | null
}

export interface AnalyticsPrimaryUserRecord {
  user_id: string
  email: string | null
}

export interface AnalyticsIdentityMaps {
  emailByUserId: Map<string, string>
  userIdsByEmail: Map<string, string[]>
}

export function buildAnalyticsIdentityMaps(
  identities: AnalyticsIdentityRecord[],
): AnalyticsIdentityMaps {
  const emailByUserId = new Map<string, string>()
  const userIdsByEmail = new Map<string, string[]>()

  identities.forEach((identity) => {
    if (!identity.email) return

    emailByUserId.set(identity.id, identity.email)

    const existingUserIds = userIdsByEmail.get(identity.email)
    if (existingUserIds) {
      existingUserIds.push(identity.id)
    } else {
      userIdsByEmail.set(identity.email, [identity.id])
    }
  })

  return { emailByUserId, userIdsByEmail }
}

export function expandAnalyticsUserIds(
  seedUserIds: string[],
  identities: AnalyticsIdentityRecord[],
): string[] {
  return Array.from(new Set([...seedUserIds, ...identities.map((identity) => identity.id)]))
}

export function getAnalyticsUserRelatedIds(
  email: string | null | undefined,
  fallbackUserId: string,
  identityMaps: AnalyticsIdentityMaps,
): string[] {
  if (!email) {
    return [fallbackUserId]
  }

  const relatedUserIds = identityMaps.userIdsByEmail.get(email)
  if (!relatedUserIds || relatedUserIds.length === 0) {
    return [fallbackUserId]
  }

  return Array.from(new Set(relatedUserIds))
}

export function getAnalyticsRelatedIdsForUserIds(
  userIds: string[],
  identityMaps: AnalyticsIdentityMaps,
): string[] {
  const relatedUserIds = new Set<string>()

  userIds.forEach((userId) => {
    const email = identityMaps.emailByUserId.get(userId)
    if (!email) {
      relatedUserIds.add(userId)
      return
    }

    const idsForEmail = identityMaps.userIdsByEmail.get(email)
    if (!idsForEmail || idsForEmail.length === 0) {
      relatedUserIds.add(userId)
      return
    }

    idsForEmail.forEach((relatedUserId) => {
      relatedUserIds.add(relatedUserId)
    })
  })

  return Array.from(relatedUserIds)
}

export function buildAnalyticsPrimaryUserIdMap(
  primaryUsers: AnalyticsPrimaryUserRecord[],
  identities: AnalyticsIdentityRecord[],
): Map<string, string> {
  const primaryUserIdByEmail = new Map<string, string>()
  const primaryUserIdByUserId = new Map<string, string>()

  primaryUsers.forEach((user) => {
    primaryUserIdByUserId.set(user.user_id, user.user_id)

    if (user.email) {
      primaryUserIdByEmail.set(user.email, user.user_id)
    }
  })

  identities.forEach((identity) => {
    if (!identity.email) return

    const primaryUserId = primaryUserIdByEmail.get(identity.email)
    if (primaryUserId) {
      primaryUserIdByUserId.set(identity.id, primaryUserId)
    }
  })

  return primaryUserIdByUserId
}

export function normalizeAnalyticsUserId(
  userId: string | null | undefined,
  primaryUserIdMap: Map<string, string>,
): string | null {
  if (!userId) return null

  return primaryUserIdMap.get(userId) || null
}
