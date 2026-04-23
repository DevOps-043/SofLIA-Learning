interface AuthenticatedPostReactionUser {
  id: string;
}

export async function getAuthenticatedPostReactionUser() {
  const { SessionService } = await import(
    '@/features/auth/services/session.service'
  );
  const user = await SessionService.getCurrentUser();

  return user as AuthenticatedPostReactionUser | null;
}
