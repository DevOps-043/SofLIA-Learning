export const USER_AUTH_CACHE_KEY = 'user-auth-cache'

export function clearAuthUserCache(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(USER_AUTH_CACHE_KEY)
  } catch {
    // localStorage can be unavailable in private or restricted contexts.
  }
}
