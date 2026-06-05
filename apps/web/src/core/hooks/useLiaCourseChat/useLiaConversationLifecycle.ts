import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useCallback, useEffect } from 'react';
import type { MutableRefObject } from 'react';
import type { SofLIAMessage } from '../../types/lia.types';
import {
  endLiaConversation,
  fetchLiaConversationMessages,
  sendLiaConversationBeacon,
} from './api';
import { createInitialCourseMessages, formatLoadedMessages } from './messages';

interface UseLiaConversationLifecycleParams {
  user: unknown;
  initialMessage?: string | null;
  conversationIdRef: MutableRefObject<string | null>;
  setMessages: (messages: SofLIAMessage[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
}

export function useLiaConversationLifecycle({
  user,
  initialMessage,
  conversationIdRef,
  setMessages,
  setIsLoading,
  setError,
}: UseLiaConversationLifecycleParams) {
  const loadConversation = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const loadedMessages = await fetchLiaConversationMessages(conversationId);
      setMessages(formatLoadedMessages(loadedMessages));
      conversationIdRef.current = conversationId;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setIsLoading(false);
    }
  }, [conversationIdRef, setError, setIsLoading, setMessages]);

  const clearHistory = useCallback(() => {
    // Capture and clear the ref before any async work
    const conversationIdToClose = conversationIdRef.current;
    conversationIdRef.current = null;

    // Optimistic update: reset UI instantly, no waiting for the network
    setMessages(createInitialCourseMessages(initialMessage));
    setError(null);

    // Fire analytics update in background — purely for DB bookkeeping, not UI-critical
    if (conversationIdToClose && user) {
      endLiaConversation(conversationIdToClose, true).catch((closeError: unknown) => {
        techDebtLogger.error('[SofLIA Analytics] Error cerrando conversación:', closeError);
      });
    }
  }, [conversationIdRef, initialMessage, setError, setMessages, user]);

  useEffect(
    () => () => {
      if (conversationIdRef.current && user) {
        sendLiaConversationBeacon(conversationIdRef.current, false);
      }
    },
    [conversationIdRef, user]
  );

  return { loadConversation, clearHistory };
}
