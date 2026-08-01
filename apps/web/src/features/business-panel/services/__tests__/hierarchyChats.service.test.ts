import { afterEach, describe, expect, it, vi } from 'vitest';
import { getHierarchyChatsApiBase, HierarchyChatsService } from '../hierarchyChats.service';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getHierarchyChatsApiBase', () => {
  it('keeps chat requests inside the organization-scoped API', () => {
    expect(getHierarchyChatsApiBase('acme-mexico')).toBe(
      '/api/acme-mexico/business/hierarchy/chats',
    );
  });

  it('encodes slugs before adding them to the request path', () => {
    expect(getHierarchyChatsApiBase('acme/region north')).toBe(
      '/api/acme%2Fregion%20north/business/hierarchy/chats',
    );
  });

  it('retains the legacy endpoint when no slug is available', () => {
    expect(getHierarchyChatsApiBase()).toBe('/api/business/hierarchy/chats');
  });

  it('sends node chat requests through the organization-scoped route', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, chats: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await HierarchyChatsService.getChats('node', 'node-1', 'vertical', 'sof_lia');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/sof_lia/business/hierarchy/chats?entity_type=node&entity_id=node-1&chat_type=vertical',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('shows the friendly API message when entity verification fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        error: 'CHAT_ENTITY_NOT_FOUND',
        message: 'La entidad especificada no existe en esta organización',
      }),
    }));

    await expect(HierarchyChatsService.getOrCreateChat({
      entity_type: 'node',
      entity_id: 'missing-node',
      chat_type: 'vertical',
    }, 'sof_lia')).rejects.toThrow('La entidad especificada no existe en esta organización');
  });
});
