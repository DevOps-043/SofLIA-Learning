// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), profile: vi.fn(), current: vi.fn(), proof: vi.fn(), membership: vi.fn(), verify: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ auth: { getUser: mocks.getUser }, from: (table: string) => { const chain = { select: () => chain, eq: () => chain, limit: () => chain, maybeSingle: table === 'users' ? mocks.profile : mocks.membership }; return chain; } }) }));
vi.mock('@/lib/supabase/auth-server', () => ({ createAuthActionClient: async () => ({ auth: { verifyOtp: mocks.verify } }) }));
vi.mock('@/features/auth/services/session.service', () => ({ SessionService: { getCurrentUser: mocks.current } }));
vi.mock('@/features/auth/services/desktop-sso.service', () => ({ generateDesktopAccessProof: mocks.proof, hasActiveMembership: mocks.membership }));
vi.mock('@/lib/auth/auth-rate-limit', () => ({ applyAuthRateLimit: () => null }));
import { POST } from '../route';
function request(replace = false, origin?: string, token = 't'.repeat(48)) {
  return new NextRequest('https://learning.test/api/auth/hub-session', { method: 'POST', headers: { 'X-PulseHub-Session': '1', Authorization: `Bearer ${token}`, ...(origin ? { Origin: origin } : {}) }, body: JSON.stringify({ replace }) });
}
beforeEach(() => {
  vi.resetAllMocks(); mocks.getUser.mockResolvedValue({ data: { user: { id: 'hub-user' } }, error: null });
  mocks.profile.mockResolvedValue({ data: { id: 'hub-user', is_banned: false }, error: null });
  mocks.current.mockResolvedValue(null); mocks.membership.mockResolvedValue({ data: { id: 'membership' }, error: null }); mocks.proof.mockResolvedValue({ tokenHash: 'proof' });
  mocks.verify.mockResolvedValue({ data: { user: { id: 'hub-user' } }, error: null });
});
describe('Conexión de Learning desde PulseHub', () => {
  it('admite el origen HTTPS público cuando el proxy reconstruye una URL interna HTTP', async () => {
    const req = new NextRequest('http://127.0.0.1:3000/api/auth/hub-session', { method: 'POST', headers: { Host: 'learning.test', Origin: 'https://learning.test', 'X-PulseHub-Session': '1' }, body: '{"replace":false}' });
    expect((await POST(req)).status).toBe(401); expect(mocks.getUser).not.toHaveBeenCalled();
    req.headers.set('origin', 'https://learning.test.evil.test');
    expect((await POST(req)).status).toBe(403);
  });
  it('verifica el bearer y crea sesión nativa sin devolver credenciales', async () => {
    const response = await POST(request()); expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, userId: 'hub-user' });
    expect(mocks.verify).toHaveBeenCalledWith({ token_hash: 'proof', type: 'magiclink' });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.cookies.get('pulsehub_session')?.httpOnly).toBe(true);
  });
  it('rechaza peticiones cruzadas y credenciales inválidas antes de emitir la sesión', async () => {
    expect((await POST(request(false, 'https://evil.test'))).status).toBe(403); expect(mocks.getUser).not.toHaveBeenCalled();
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: {} });
    expect((await POST(request())).status).toBe(401); expect(mocks.proof).not.toHaveBeenCalled();
  });
  it.each([true, false])('respeta otra cuenta y requiere reemplazo explícito: %s', async replace => {
    mocks.current.mockResolvedValue({ id: 'otra-cuenta' });
    const result = await POST(request(replace)); expect(result.status).toBe(200);
    expect(mocks.verify).toHaveBeenCalledTimes(replace ? 1 : 0);
  });
  it('rechaza suspensión, falta de membresía y un resultado con otra identidad', async () => {
    mocks.profile.mockResolvedValueOnce({ data: { id: 'hub-user', is_banned: true }, error: null });
    expect((await POST(request())).status).toBe(403);
    mocks.membership.mockResolvedValueOnce({ data: null, error: null }); expect((await POST(request())).status).toBe(403);
    expect(mocks.verify).not.toHaveBeenCalled();
    mocks.verify.mockResolvedValue({ data: { user: { id: 'otro' } }, error: null }); expect((await POST(request())).status).toBe(503);
  });
  it.each(['{', 'null', '{"replace":"yes"}', 'x'.repeat(129)])('rechaza cuerpos inválidos antes de consultar Auth: %s', async body => {
    const req = new NextRequest('https://learning.test/api/auth/hub-session', { method: 'POST', headers: { 'X-PulseHub-Session': '1', Authorization: `Bearer ${'t'.repeat(48)}` }, body });
    expect((await POST(req)).status).toBe(400); expect(mocks.getUser).not.toHaveBeenCalled();
  });
});
