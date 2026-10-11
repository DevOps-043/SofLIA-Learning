import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ marked: true, signOut: vi.fn(), revokeAll: vi.fn(), setCookie: vi.fn() }));
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => name === 'pulsehub_session' && mocks.marked ? { value: '1' } : undefined, set: mocks.setCookie, delete: vi.fn() }),
  headers: vi.fn(),
}));
vi.mock('@/lib/supabase/auth-server', () => ({ createAuthActionClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'hub-user' } } }), signOut: mocks.signOut } }) }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { auth: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/auth/refreshToken.service', () => ({ RefreshTokenService: { revokeAllUserTokens: mocks.revokeAll } }));
vi.mock('@/features/auth/services/session-legacy.service', () => ({
  buildLegacySessionRecord: vi.fn(), cacheLegacySessionUser: vi.fn(), findActiveLegacySessionUser: vi.fn(), getCachedLegacySessionUser: vi.fn(), revokeLegacySession: vi.fn(),
}));
import { SessionService } from '@/features/auth/services/session.service';
beforeEach(() => { vi.clearAllMocks(); mocks.marked = true; });
describe('Logout de una sesión web conectada por PulseHub', () => {
  it('revoca solo la sesión web y conserva el escritorio y sus otros dispositivos', async () => {
    await SessionService.destroySession();
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(mocks.revokeAll).not.toHaveBeenCalled();
    expect(mocks.setCookie).toHaveBeenCalledWith('pulsehub_session', '', expect.objectContaining({ maxAge: 0 }));
  });
  it('conserva el alcance previo de logout para sesiones web ajenas al canje', async () => {
    mocks.marked = false; await SessionService.destroySession();
    expect(mocks.signOut).toHaveBeenCalledWith(undefined);
    expect(mocks.revokeAll).toHaveBeenCalledWith('hub-user', 'user_logout');
  });
});
