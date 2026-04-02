import type { LiaConversationItem } from '../types';

const LIA_HISTORY_ENDPOINT = '/api/lia/conversations';

interface LiaConversationHistoryApiResponse {
  conversations?: LiaConversationItem[];
  pagination?: {
    total?: number;
    hasMore?: boolean;
  };
}

export interface LiaConversationHistoryPage {
  conversations: LiaConversationItem[];
  totalConversations: number;
  hasMore: boolean;
}

export async function fetchLiaConversationHistory(
  page: number,
  limit: number
): Promise<LiaConversationHistoryPage> {
  const offset = page * limit;
  const response = await fetch(`${LIA_HISTORY_ENDPOINT}?limit=${limit}&offset=${offset}`);

  if (!response.ok) {
    throw new Error('Error fetching history');
  }

  const data = (await response.json()) as LiaConversationHistoryApiResponse;
  const conversations = Array.isArray(data.conversations) ? data.conversations : [];

  return {
    conversations,
    totalConversations: data.pagination?.total ?? conversations.length,
    hasMore: Boolean(data.pagination?.hasMore),
  };
}

export async function renameLiaConversation(conversationId: string, title: string): Promise<boolean> {
  const response = await fetch(LIA_HISTORY_ENDPOINT, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, title }),
  });

  return response.ok;
}

export interface DeleteLiaConversationResult {
  ok: boolean;
  error?: string;
}

export async function deleteLiaConversation(conversationId: string): Promise<DeleteLiaConversationResult> {
  const response = await fetch(`/api/lia/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.ok) {
    return { ok: true };
  }

  const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
  return {
    ok: false,
    error: errorData.error || 'Error desconocido',
  };
}
