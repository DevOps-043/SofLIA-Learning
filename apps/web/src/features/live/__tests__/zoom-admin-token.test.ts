// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
const call = vi.hoisted(() => vi.fn());
vi.mock('@/lib/resilience/circuit-breaker', () => ({ fetchWithCircuitBreaker: call }));
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); call.mockReset(); });
describe('token administrativo compartido para una clase', () => {
  it('une las solicitudes OAuth concurrentes sin repetir operaciones REST', async () => {
    vi.stubEnv('ZOOM_ACCOUNT_ID','account'); vi.stubEnv('ZOOM_CLIENT_ID','client'); vi.stubEnv('ZOOM_CLIENT_SECRET','test-only');
    call.mockImplementation(async (name: string) => name === 'zoom-oauth'
      ? new Response(JSON.stringify({ access_token: 'test-token', expires_in: 3600 }))
      : new Response(JSON.stringify({ join_url: 'https://zoom.us/j/123' })));
    const { zoomRequest } = await import('../zoom.server');
    await Promise.all(Array.from({ length: 20 }, () => zoomRequest('/meetings/123')));
    expect(call.mock.calls.filter((args) => args[0] === 'zoom-oauth')).toHaveLength(1);
    expect(call.mock.calls.filter((args) => args[0] === 'zoom-api')).toHaveLength(20);
  });
});
