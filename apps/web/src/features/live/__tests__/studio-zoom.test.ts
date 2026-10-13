// @vitest-environment node
import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
vi.mock('../server', () => ({ LiveError: class extends Error {}, checked: (value: { data: unknown }) => value.data }));
vi.mock('../zoom.server', () => ({ zoomRequest: vi.fn() }));
import { signMeetingSdk } from '../studio-zoom.server';

describe('firma de ingreso Meeting SDK', () => {
  it.each([true, false])('firma rol derivado %s con expiración mínima y HMAC de servidor', (host) => {
    const signature = signMeetingSdk('12345678901', host, 'sdk-publico', 'secreto-de-prueba', Date.parse('2026-10-12T20:00:00Z'));
    const [header, payload, mac] = signature.split('.');
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    expect(claims.role).toBe(host ? 1 : 0); expect(claims.mn).toBe('12345678901');
    expect(claims.exp - claims.iat).toBe(1800); expect(claims.tokenExp).toBe(claims.exp);
    expect(mac).toBe(createHmac('sha256', 'secreto-de-prueba').update(`${header}.${payload}`).digest('base64url'));
    expect(signature).not.toContain('secreto-de-prueba');
  });
});
