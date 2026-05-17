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

  const clearHistory = useCallback(async () => {
    if (conversationIdRef.current && user) {
      try {
        await endLiaConversation(conversationIdRef.current, true);
      } catch (closeError) {
        console.error('[SofLIA Analytics] Error cerrando conversación:', closeError);
      }
      conversationIdRef.current = null;
    }
    setMessages(createInitialCourseMessages(initialMessage));
    setError(null);
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
