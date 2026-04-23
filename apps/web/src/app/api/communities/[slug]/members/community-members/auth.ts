export async function getCurrentSessionUser() {
  const { SessionService } = await import('@/features/auth/services/session.service')
  return SessionService.getCurrentUser()
}
