import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchWithCircuitBreaker = vi.fn();

vi.mock('@/lib/resilience/circuit-breaker', () => ({
  fetchWithCircuitBreaker: (...args: unknown[]) =>
    fetchWithCircuitBreaker(...(args as [])),
}));

import { GET, dynamic } from '../route';

function githubResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function lastRequestInit(): RequestInit {
  return fetchWithCircuitBreaker.mock.calls[0]?.[2] as RequestInit;
}

function lastRequestHeaders(): Record<string, string> {
  return (lastRequestInit()?.headers ?? {}) as Record<string, string>;
}

const RELEASES = [
  { tag_name: 'v0.9.0', published_at: '2026-08-05T22:31:48Z', assets: [] },
  { tag_name: 'v0.8.0', published_at: '2026-07-17T23:49:46Z', assets: [] },
];

beforeEach(() => {
  fetchWithCircuitBreaker.mockReset();
  delete process.env.GITHUB_TOKEN;
});

afterEach(() => {
  delete process.env.GITHUB_TOKEN;
});

describe('GET /api/releases', () => {
  /**
   * Regresión: la ruta declaraba `revalidate = 600`, así que Next servía una
   * copia congelada de hasta 10 minutos ANTES de que el CDN aplicara su propia
   * ventana. Los dos TTL se sumaban y una release recién publicada tardaba
   * ~25 minutos en aparecer en la página de descargas.
   */
  it('is never statically cached by Next', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('returns the releases with the last version first', async () => {
    fetchWithCircuitBreaker.mockResolvedValue(githubResponse(RELEASES));

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(RELEASES);
  });

  it('declares the CDN window that bounds how stale the page can get', async () => {
    fetchWithCircuitBreaker.mockResolvedValue(githubResponse(RELEASES));

    const response = await GET();

    expect(response.headers.get('Cache-Control')).toBe(
      'public, s-maxage=120, stale-while-revalidate=120',
    );
    expect(response.headers.get('CDN-Cache-Control')).toBe('max-age=120');
  });

  /** La caché de datos de Next sería un tercer TTL fuera del control de las cabeceras. */
  it('never reuses the Next data cache for the GitHub call', async () => {
    fetchWithCircuitBreaker.mockResolvedValue(githubResponse(RELEASES));

    await GET();

    expect(lastRequestInit().cache).toBe('no-store');
  });

  it('authenticates against GitHub only when a token is configured', async () => {
    fetchWithCircuitBreaker.mockResolvedValue(githubResponse(RELEASES));

    await GET();
    expect(lastRequestHeaders().Authorization).toBeUndefined();

    fetchWithCircuitBreaker.mockReset();
    fetchWithCircuitBreaker.mockResolvedValue(githubResponse(RELEASES));
    process.env.GITHUB_TOKEN = 'ghp_example';

    await GET();
    expect(lastRequestHeaders().Authorization).toBe('Bearer ghp_example');
  });

  it('propagates a GitHub failure without caching it', async () => {
    fetchWithCircuitBreaker.mockResolvedValue(
      githubResponse({ message: 'rate limit' }, 403),
    );

    const response = await GET();

    expect(response.status).toBe(403);
    // Un fallo NO lleva la ventana de caché: guardarlo 2 minutos convertiría un
    // 403 puntual de rate limit en dos minutos de página de descargas rota.
    expect(response.headers.get('Cache-Control')).toBeNull();
  });

  it('answers 502 when the provider is unreachable', async () => {
    fetchWithCircuitBreaker.mockRejectedValue(new Error('circuit open'));

    const response = await GET();

    expect(response.status).toBe(502);
  });
});
