import { afterEach, describe, expect, it, vi } from 'vitest';

import { backfillReadingAudio } from '../api';

const originalFetch = global.fetch;

afterEach(() => {
  vi.restoreAllMocks();
  global.fetch = originalFetch;
});

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}

describe('admin TTS audio api client', () => {
  it('paginates backfill requests instead of sending one all-pages job', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        details: [{ language: 'es', queued: 2, resource: 'activities', scanned: 50 }],
        hasMore: true,
        limit: 50,
        nextOffset: 50,
        offset: 0,
        queued: 2,
        scanned: 50,
      }))
      .mockResolvedValueOnce(jsonResponse({
        details: [{ language: 'es', queued: 1, resource: 'activities', scanned: 12 }],
        hasMore: false,
        limit: 50,
        nextOffset: 100,
        offset: 50,
        queued: 1,
        scanned: 12,
      })) as typeof fetch;

    const result = await backfillReadingAudio({ language: 'all', resource: 'all' });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(String(vi.mocked(global.fetch).mock.calls[0][1]?.body));
    const secondBody = JSON.parse(String(vi.mocked(global.fetch).mock.calls[1][1]?.body));

    expect(firstBody).toMatchObject({ allPages: false, limit: 50, offset: 0 });
    expect(secondBody).toMatchObject({ allPages: false, limit: 50, offset: 50 });
    expect(result).toMatchObject({
      hasMore: false,
      pages: 2,
      queued: 3,
      scanned: 62,
    });
  });
});
