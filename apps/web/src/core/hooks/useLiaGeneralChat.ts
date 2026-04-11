'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { SofLIAMessage } from '../types/lia.types';
import { useLanguage } from '../providers/I18nProvider';
import { useOrganizationStore } from '../stores/organizationStore';
import { prepareLiaBugContext } from '../reporting/lia-chat-reporting';
import type { LiaImageAttachment } from '../reporting/report-problem.contract';

type LegacyAuthUser = {
  id?: string;
  first_name?: string;
  cargo_rol?: string;
  job_title?: string;
  nombre?: string;
  type_rol?: string;
};

export interface UseLiaGeneralChatReturn {
  messages: SofLIAMessage[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (
    message: string,
    isSystemMessage?: boolean,
    pageContext?: Record<string, unknown>,
    attachments?: LiaImageAttachment[]
  ) => Promise<void>;
  clearHistory: () => void;
  loadConversation: (conversationId: string) => Promise<void>;
  currentConversationId: string | null;
}

function normalizeGeneralMessage(
  message: string,
  attachments: LiaImageAttachment[]
): string {
  const trimmedMessage = message.trim();

  if (trimmedMessage) {
    return trimmedMessage;
  }

  if (attachments.length > 0) {
    return 'Quiero compartir una imagen como evidencia visual para que me ayudes a revisar este caso.';
  }

  return '';
}

export function useLiaGeneralChat(
  initialMessage?: string | null
): UseLiaGeneralChatReturn {
  const { user } = useAuth();
  const { language } = useLanguage();
  const currentOrganization = useOrganizationStore(
    (state) => state.currentOrganization
  );
  const legacyUser = user as LegacyAuthUser | null;
  const [messages, setMessages] = useState<SofLIAMessage[]>(
    initialMessage !== null && initialMessage !== undefined && initialMessage !== ''
      ? [
          {
            id: 'initial',
            role: 'assistant',
            content: initialMessage,
            timestamp: new Date(),
          },
        ]
      : []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const conversationIdRef = useRef<string | null>(null);

  const sendMessage = useCallback(
    async (
      message: string,
      isSystemMessage: boolean = false,
      pageContext?: Record<string, unknown>,
      attachments: LiaImageAttachment[] = []
    ) => {
      const normalizedMessage = normalizeGeneralMessage(message, attachments);

      if (!normalizedMessage || isLoading) return;

      if (!isSystemMessage) {
        const userMessage: SofLIAMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: normalizedMessage,
          timestamp: new Date(),
          attachments,
        };

        setMessages((prev) => [...prev, userMessage]);
      }

      setIsLoading(true);
      setError(null);

      try {
        const {
          isBugReport,
          sessionSnapshot,
          enrichedMetadata,
          recordingStatus,
        } = await prepareLiaBugContext(normalizedMessage, attachments.length > 0);

        if (!conversationIdRef.current) {
          conversationIdRef.current = crypto.randomUUID();
        }

        const response = await fetch('/api/lia/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: conversationIdRef.current,
            messages: [
              ...messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
                attachments:
                  msg.role === 'user' && msg.attachments?.length
                    ? msg.attachments
                    : undefined,
              })),
              {
                role: 'user',
                content: normalizedMessage,
                attachments: attachments.length > 0 ? attachments : undefined,
              },
            ],
            context: {
              userName: legacyUser?.first_name || legacyUser?.nombre,
              userRole:
                legacyUser?.job_title ||
                legacyUser?.cargo_rol ||
                legacyUser?.type_rol,
              userId: user?.id,
              organizationId: currentOrganization?.id,
              currentPage:
                typeof window !== 'undefined'
                  ? window.location.pathname
                  : undefined,
              ...(pageContext || {}),
            },
            sessionSnapshot,
            enrichedMetadata,
            isBugReport,
            recordingStatus: isBugReport ? recordingStatus : undefined,
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error('Error en la comunicación con SofLIA');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';
        const assistantId = (Date.now() + 1).toString();

        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
          },
        ]);

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (!line.startsWith('data: ')) {
                continue;
              }

              try {
                const data = JSON.parse(line.slice(6)) as {
                  content?: string;
                };

                if (data.content) {
                  assistantContent += data.content;
                  setMessages((prev) =>
                    prev.map((entry) =>
                      entry.id === assistantId
                        ? { ...entry, content: assistantContent }
                        : entry
                    )
                  );
                }
              } catch {
                // Ignorar errores de parsing del stream.
              }
            }
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err : new Error('Error desconocido');
        setError(errorMessage);

        const errorResponse: SofLIAMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorResponse]);
      } finally {
        setIsLoading(false);
      }
    },
    [currentOrganization?.id, isLoading, legacyUser, messages, user, language]
  );

  const loadConversation = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/lia/conversations/${conversationId}/messages`
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || 'Error cargando conversación');
      }

      const data = (await response.json()) as {
        messages?: Array<{
          id: string;
          role: 'user' | 'assistant';
          content: string;
          timestamp: string;
        }>;
      };

      const formattedMessages: SofLIAMessage[] = (data.messages || []).map(
        (msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
        })
      );

      setMessages(formattedMessages);
      conversationIdRef.current = conversationId;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err : new Error('Error desconocido');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    if (conversationIdRef.current && user) {
      try {
        await fetch('/api/lia/end-conversation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: conversationIdRef.current,
            completed: true,
          }),
        });
      } catch (closeError) {
        console.error(
          '[SofLIA Analytics] Error cerrando conversación:',
          closeError
        );
      }

      conversationIdRef.current = null;
    }

    setMessages(
      initialMessage !== null &&
        initialMessage !== undefined &&
        initialMessage !== ''
        ? [
            {
              id: 'initial',
              role: 'assistant',
              content: initialMessage,
              timestamp: new Date(),
            },
          ]
        : []
    );
    setError(null);
  }, [initialMessage, user]);

  useEffect(() => {
    return () => {
      if (conversationIdRef.current && user) {
        const data = JSON.stringify({
          conversationId: conversationIdRef.current,
          completed: false,
        });

        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon('/api/lia/end-conversation', data);
        }
      }
    };
  }, [user]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory,
    loadConversation,
    currentConversationId: conversationIdRef.current,
  };
}
