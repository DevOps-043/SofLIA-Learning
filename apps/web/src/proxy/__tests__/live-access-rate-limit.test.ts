// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { resolveRouteRateLimitPolicy } from '../rate-limits';

describe('presupuesto de acceso a una clase', () => {
  it.each(['access', 'workspace', 'catalog'])('permite %s para un grupo tras NAT sin consumir el presupuesto de login', (action) => {
    const access = resolveRouteRateLimitPolicy(new NextRequest(`https://learning.test/api/auth/live/${action}`, { method: 'POST' }));
    const login = resolveRouteRateLimitPolicy(new NextRequest('https://learning.test/api/auth/desktop/exchange', { method: 'POST' }));
    expect(access?.prefix).toBe('live-access');
    expect(access?.config.maxRequests).toBeGreaterThanOrEqual(300);
    expect(login?.prefix).toBe('auth');
    expect(login?.config.maxRequests).toBe(5);
  });
  it('conserva el presupuesto de autenticación para rutas ajenas', () => {
    const unknown = resolveRouteRateLimitPolicy(new NextRequest('https://learning.test/api/auth/live/catalog/otra-ruta', { method: 'POST' }));
    expect(unknown?.prefix).toBe('auth');
  });
});
