import { describe, expect, it, vi } from 'vitest';

import { getLiaChatErrorMessage, readLiaChatRequestError } from '../lia-chat-error.service';
import { postLiaCourseMessage } from '../../hooks/useLiaCourseChat/api';
import { createAssistantErrorMessage } from '../../hooks/useLiaCourseChat/messages';

describe('SofLIA chat request errors', () => {
  it('distinguishes unavailable request protection from an AI credential failure', async () => {
    const limiter = await readLiaChatRequestError(Response.json(
      { error: 'RATE_LIMIT_SERVICE_UNAVAILABLE' }, { status: 503 },
    ));
    const credentials = await readLiaChatRequestError(Response.json(
      { error: 'AI_PROVIDER_KEY_MISSING' }, { status: 503 },
    ));

    expect(limiter.status).toBe(503);
    expect(limiter.code).toBe('RATE_LIMIT_SERVICE_UNAVAILABLE');
    expect(getLiaChatErrorMessage(limiter)).toContain('un minuto');
    expect(getLiaChatErrorMessage(credentials)).toContain('administrador');
  });

  it('preserves the specific error through the course chat API and message builder', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(
      { error: 'RATE_LIMIT_SERVICE_UNAVAILABLE' }, { status: 503 },
    )));
    try {
      const error = await postLiaCourseMessage({}, new AbortController().signal).catch((error) => error);
      expect(createAssistantErrorMessage(error).content).toContain('un minuto');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it.each([401, 429])('returns actionable text for HTTP %i', async (status) => {
    const error = await readLiaChatRequestError(Response.json({}, { status }));
    expect(getLiaChatErrorMessage(error)).toContain(status === 401 ? 'Inicia sesión' : 'Espera un minuto');
  });

  it('does not expose arbitrary provider errors or HTML outage pages', async () => {
    for (const response of [
      Response.json({ error: 'Provider failed: sk-secret' }, { status: 500 }),
      new Response('<html>sk-secret</html>', { status: 503 }),
      Response.json(null, { status: 500 }),
    ]) {
      const error = await readLiaChatRequestError(response);
      expect(error.code).toBeNull();
      expect(getLiaChatErrorMessage(error)).toContain('ocurrió un error');
      expect(getLiaChatErrorMessage(error)).not.toContain('sk-secret');
    }
    expect(getLiaChatErrorMessage(new Error('sk-secret'))).not.toContain('sk-secret');
  });
});
