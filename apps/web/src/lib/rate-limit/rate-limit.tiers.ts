import { RateLimitTier } from './rate-limit.types';

export function getTierFromPath(pathname: string, method: string): RateLimitTier {
  if (
    pathname.includes('/api/auth/') ||
    pathname.includes('/login') ||
    pathname.includes('/register') ||
    pathname.includes('/reset-password')
  ) {
    return RateLimitTier.AUTH;
  }

  if (pathname.includes('/api/admin/')) {
    return RateLimitTier.ADMIN;
  }

  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
    return RateLimitTier.API_MUTATION;
  }

  if (pathname.startsWith('/api/')) {
    return RateLimitTier.API_READ;
  }

  return RateLimitTier.PUBLIC;
}
