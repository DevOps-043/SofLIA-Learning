// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { consumeLiaChatStreamBuffer } from '@/core/services/lia-chat-stream.service';

// Solo el contexto HTTP vacío se simula. Supabase, la configuración guardada,
// el gateway, OpenAI, el formateador y el parser SSE son reales. No se crea una
// sesión ni se guarda historial de un usuario para ejecutar esta prueba.
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, getAll: () => [], set: () => {} }),
  headers: async () => new Headers(),
}));

const enabled = process.env.SOFLIA_LIVE_SMOKE === '1';
if (enabled) process.loadEnvFile('.env.local');
afterEach(() => vi.unstubAllEnvs());

describe.skipIf(!enabled)('SofLIA: conversación con servicios reales', () => {
  it('aplica el contador distribuido en producción y rechaza el exceso con 429', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { checkDistributedRateLimit } = await import('@/core/lib/rate-limit/rate-limit.distributed');
    const request = new NextRequest('https://soflia.test/api/lia/chat', {
      method: 'POST', headers: { 'user-agent': `soflia-smoke-${crypto.randomUUID()}` },
    });
    const results = await Promise.all(Array.from({ length: 3 }, () =>
      checkDistributedRateLimit(request, { maxRequests: 2, windowMs: 60_000 }, 'ai-chat'),
    ));
    expect(results.filter((result) => result.success)).toHaveLength(2);
    expect(results.find((result) => !result.success)?.response?.status).toBe(429);
  }, 30_000);

  it('responde por JSON y mantiene el contexto en el siguiente turno por SSE con 6-luna', async () => {
    const { getAiModelSettings } = await import('@/lib/ai/model-settings/ai-model-settings.server.service');
    const settings = await getAiModelSettings('lia_general');
    expect(settings.model).toBe('gpt-6-luna');
    expect(settings.provider).toBe('openai');
    const { POST } = await import('../route');
    const marker = `LUNA-${crypto.randomUUID().slice(0, 8)}`;
    const firstMessage = { role: 'user', content: `Hola SofLIA. El código de mi ejercicio es ${marker}. Confírmalo en una frase.` };
    const first = await POST(new NextRequest('https://soflia.test/api/lia/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [firstMessage], stream: false }),
    }), undefined);
    expect(first.status).toBe(200);
    const payload = await first.json();
    expect(payload.message.content).toContain(marker);

    const second = await POST(new NextRequest('https://soflia.test/api/lia/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [firstMessage, payload.message, { role: 'user', content: '¿Cuál es el código de mi ejercicio? Responde solo con el código.' }],
        stream: true,
      }),
    }), undefined);
    expect(second.status).toBe(200);
    expect(second.headers.get('content-type')).toContain('text/event-stream');
    const reader = second.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let content = '';
    let completed = false;
    // El cierre lo indica reader.read(), no el número de eventos SSE.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const chunk = await reader.read();
      buffer += chunk.done ? decoder.decode() : decoder.decode(chunk.value, { stream: true });
      const parsed = consumeLiaChatStreamBuffer(chunk.done ? `${buffer}\n\n` : buffer);
      buffer = parsed.remainingBuffer;
      for (const event of parsed.events) {
        content += event.content ?? '';
        completed ||= event.done === true;
      }
      if (chunk.done) break;
    }
    expect(completed).toBe(true);
    expect(content).toContain(marker);
  }, 120_000);
});
