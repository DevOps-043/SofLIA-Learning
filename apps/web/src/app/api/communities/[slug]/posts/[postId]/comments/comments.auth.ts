export async function getCurrentCommunityUser() {
  const { SessionService } = await import(
    '../../../../../../../features/auth/services/session.service'
  );

  return SessionService.getCurrentUser();
}
