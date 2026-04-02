import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  deleteLiaConversation,
  fetchLiaConversationHistory,
  renameLiaConversation,
} from '../services/lia-side-panel-history.service';

describe('lia-side-panel-history.service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes paginated history payloads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          conversations: [{ conversation_id: '1', conversation_title: 'Hola', started_at: '2026-04-01' }],
          pagination: { total: 31, hasMore: true },
        }),
      })
    );

    await expect(fetchLiaConversationHistory(1, 20)).resolves.toEqual({
      conversations: [{ conversation_id: '1', conversation_title: 'Hola', started_at: '2026-04-01' }],
      totalConversations: 31,
      hasMore: true,
    });
  });

  it('returns boolean status for title updates', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    await expect(renameLiaConversation('abc', 'Nuevo titulo')).resolves.toBe(true);
  });

  it('surfaces delete errors safely', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'No autorizado' }),
      })
    );

    await expect(deleteLiaConversation('abc')).resolves.toEqual({
      ok: false,
      error: 'No autorizado',
    });
  });
});
