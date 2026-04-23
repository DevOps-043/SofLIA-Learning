interface AuthenticatedPostStatsUser {
  id: string;
}

export async function getAuthenticatedPostStatsUser() {
  const { SessionService } = await import(
    '@/features/auth/services/session.service'
  );
  const user = await SessionService.getCurrentUser();

  return user as AuthenticatedPostStatsUser | null;
}
