// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { LiveError } from '@/features/live/errors';
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), org: vi.fn(), actor: vi.fn(), catalog: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ auth: { getUser: mocks.getUser }, from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.org }) }) }) }) }));
vi.mock('@/lib/rate-limit/advanced-rate-limit', () => ({ rateLimitMiddleware: () => null, RateLimitTier: { API_READ: 'read' } }));
vi.mock('@/features/live/server', async () => ({ ...await vi.importActual<typeof import('@/features/live/server')>('@/features/live/server'), liveActorContext: mocks.actor }));
vi.mock('@/features/live/services/catalog.service', () => ({ listLiveCatalog: mocks.catalog }));
import { POST } from '../route';
const input = { organization_slug: 'acme', page: 1, view: 'student' };
function request(body: unknown = input, token = 'verified-token') {
  return new NextRequest('https://learning.test/api/auth/live/catalog', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {}, body: JSON.stringify(body) });
}
beforeEach(() => {
  vi.resetAllMocks(); mocks.getUser.mockResolvedValue({ data: { user: { id: 'student' } }, error: null });
  mocks.org.mockResolvedValue({ data: { id: 'org', is_active: true }, error: null }); mocks.actor.mockResolvedValue({ userId: 'student', orgId: 'org' });
  mocks.catalog.mockResolvedValue({ total: 1, canTeach: false, courses: [{ id: 'course', title: 'IA aplicada' }], instructors: [{ user_id: 'teacher', name: 'Mariana' }], sessions: [{ id: 'session', title: 'Mi clase', description: '', starts_at: '2026-10-11T18:00:00Z', duration_minutes: 60, status: 'live', course_id: 'course', instructor_id: 'teacher', zoom_meeting_id: 'private-id', join_url: 'private-url' }] });
});
describe('agenda autenticada para Hub', () => {
  it('requiere un bearer verificado antes de consultar catálogo', async () => {
    expect((await POST(request(input, ''))).status).toBe(401); expect(mocks.getUser).not.toHaveBeenCalled();
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: {} });
    expect((await POST(request())).status).toBe(401); expect(mocks.catalog).not.toHaveBeenCalled();
  });
  it('rechaza identidad, rol, URL y páginas manipuladas', async () => {
    for (const extra of [{ user_id: 'another' }, { role: 'admin' }, { url: 'https://evil.test' }, { page: -1 }, { view: 'admin' }]) expect((await POST(request({ ...input, ...extra }))).status).toBe(400);
    expect(mocks.catalog).not.toHaveBeenCalled();
  });
  it('revalida membresía y evita consultar organizaciones inactivas', async () => {
    mocks.org.mockResolvedValueOnce({ data: { id: 'org', is_active: false }, error: null }); expect((await POST(request())).status).toBe(403);
    mocks.actor.mockRejectedValueOnce(new LiveError(403, 'Sin membresía')); expect((await POST(request())).status).toBe(403);
    expect(mocks.catalog).not.toHaveBeenCalled();
  });
  it('usa la página solicitada y devuelve metadatos sin acceso privado Zoom', async () => {
    const response = await POST(request()); const body = await response.json();
    expect(response.status).toBe(200); expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(mocks.getUser).toHaveBeenCalledWith('verified-token'); expect(mocks.actor).toHaveBeenCalledWith('student', 'org');
    expect(mocks.catalog.mock.calls[0][1].toString()).toBe('period=upcoming&page=1&view=student');
    expect(body).toMatchObject({ version: 1, user_id: 'student', total: 1, sessions: [{ course_title: 'IA aplicada', instructor_name: 'Mariana', session_type: 'meeting' }] });
    expect(JSON.stringify(body)).not.toContain('private');
  });
  it('no suplanta el rol de instructor y admite catálogos vacíos', async () => {
    mocks.catalog.mockRejectedValueOnce(new LiveError(403, 'Necesitas el rol de instructor'));
    expect((await POST(request({ ...input, view: 'instructor' }))).status).toBe(403);
    mocks.catalog.mockResolvedValueOnce({ total: 0, canTeach: false, sessions: [], courses: [], instructors: [] });
    expect(await (await POST(request())).json()).toMatchObject({ total: 0, sessions: [] });
  });
});
