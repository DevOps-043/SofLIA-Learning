export function filterExpiredNotifications<T extends { expires_at?: string | null }>(
  notifications: T[],
  now = new Date(),
) {
  return notifications.filter((notification) => {
    if (!notification.expires_at) {
      return true
    }

    return new Date(notification.expires_at) > now
  })
}

export function attachUsersToNotifications<
  T extends { user_id: string; users?: unknown },
  U extends { id: string },
>(notifications: T[], users: U[]) {
  const usersMap = new Map(users.map((user) => [user.id, user]))

  return notifications.map((notification) => ({
    ...notification,
    users: usersMap.get(notification.user_id) || null,
  }))
}
