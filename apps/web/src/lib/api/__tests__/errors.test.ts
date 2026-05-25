import { describe, expect, it } from 'vitest';
import { apiError, internalServerError } from '../errors';

describe('apiError', () => {
  it('returns the standard machine-readable error envelope', async () => {
    const response = apiError('NOT_FOUND', 'Recurso no encontrado.', 404, {
      details: { id: 'missing-id' },
      requestId: 'req-1',
    });

    await expect(response.json()).resolves.toEqual({
      details: { id: 'missing-id' },
      error: 'NOT_FOUND',
      message: 'Recurso no encontrado.',
      requestId: 'req-1',
    });
    expect(response.status).toBe(404);
  });

  it('does not expose details on 5xx responses', async () => {
    const response = apiError('DB_ERROR', 'Error interno del servidor.', 500, {
      details: { unsafe: 'stack trace' },
    });

    await expect(response.json()).resolves.toEqual({
      error: 'DB_ERROR',
      message: 'Error interno del servidor.',
    });
  });

  it('builds the default internal server error envelope', async () => {
    const response = internalServerError('req-2');

    await expect(response.json()).resolves.toEqual({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Error interno del servidor.',
      requestId: 'req-2',
    });
    expect(response.status).toBe(500);
  });

  it('preserves response headers without changing the envelope', async () => {
    const response = apiError('UNAUTHENTICATED', 'Debes iniciar sesion para continuar.', 401, {
      headers: { 'Cache-Control': 'private, no-store' },
    });

    await expect(response.json()).resolves.toEqual({
      error: 'UNAUTHENTICATED',
      message: 'Debes iniciar sesion para continuar.',
    });
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });
});
