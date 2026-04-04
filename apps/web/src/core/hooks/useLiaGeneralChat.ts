'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { SofLIAMessage } from '../types/lia.types';
import { useLanguage } from '../providers/I18nProvider';
import { sessionRecorder } from '../../lib/rrweb/session-recorder';
import type { EnrichedMetadata } from '../../lib/rrweb/session-recorder';

type LiaRecordingStatus = 'active' | 'inactive' | 'restarted' | 'unavailable' | 'error';

type LiaChatMetadata = EnrichedMetadata & {
  recordingInfo: EnrichedMetadata['recordingInfo'] & {
    status?: LiaRecordingStatus;
    error?: string;
  };
};

type LegacyAuthUser = {
  id?: string;
  first_name?: string;
  cargo_rol?: string;
  job_title?: string;
  nombre?: string;
  type_rol?: string;
};

function buildLiaChatMetadata(
  recordingStatus: LiaRecordingStatus,
  session?: Parameters<typeof sessionRecorder.getEnrichedMetadata>[0],
  errorMessage?: string
): LiaChatMetadata {
  const metadata = sessionRecorder.getEnrichedMetadata(session ?? null);

  return {
    ...metadata,
    recordingInfo: {
      ...metadata.recordingInfo,
      status: recordingStatus,
      ...(errorMessage ? { error: errorMessage } : {}),
    },
  };
}

export interface UseLiaGeneralChatReturn {
  messages: SofLIAMessage[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (message: string, isSystemMessage?: boolean, pageContext?: Record<string, unknown>) => Promise<void>;
  clearHistory: () => void;
  loadConversation: (conversationId: string) => Promise<void>;
  currentConversationId: string | null;
}

export function useLiaGeneralChat(initialMessage?: string | null): UseLiaGeneralChatReturn {
  const { user } = useAuth();
  const { language } = useLanguage();
  const legacyUser = user as LegacyAuthUser | null;
  const [messages, setMessages] = useState<SofLIAMessage[]>(
    initialMessage !== null && initialMessage !== undefined && initialMessage !== ''
      ? [
          {
            id: 'initial',
            role: 'assistant',
            content: initialMessage,
            timestamp: new Date()
          }
        ]
      : []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Analytics: Mantener conversationId en referencia para persistencia
  const conversationIdRef = useRef<string | null>(null);

  const sendMessage = useCallback(async (
    message: string,
    isSystemMessage: boolean = false,
    pageContext?: Record<string, unknown>
  ) => {
    if (!message.trim() || isLoading) return;

    if (!isSystemMessage) {
      const userMessage: SofLIAMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message.trim(),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
    }

    setIsLoading(true);
    setError(null);

    try {
      // Detectar si el mensaje sugiere un reporte de bug con más palabras clave
      const bugKeywords = /error|bug|falla|problema|no funciona|no carga|rompi|broken|crash|colgó|lento|cuelga|no responde|pantalla en blanco|500|404|timeout|se cayó/i;
      const isBugReport = bugKeywords.test(message.toLowerCase());
      
      // Preparar session data solo si es probable reporte de bug
      let sessionSnapshot: string | undefined;
      let enrichedMetadata: LiaChatMetadata | undefined;
      let recordingStatus: LiaRecordingStatus = 'unavailable';
      
      if (isBugReport && sessionRecorder) {
        try {
          // Log detallado para debugging
          
          // Verificar que los métodos existen antes de llamarlos
          const hasRequiredMethods = 
            typeof sessionRecorder.isRrwebAvailable === 'function' &&
            typeof sessionRecorder.isActive === 'function' &&
            typeof sessionRecorder.captureSnapshot === 'function';
          
          if (!hasRequiredMethods) {
            console.warn('[SofLIA Chat] ⚠️ sessionRecorder no tiene los métodos requeridos');
            recordingStatus = 'error';
          }
          // Verificar si rrweb está disponible
          else if (!sessionRecorder.isRrwebAvailable()) {
            console.warn('[SofLIA Chat] ⚠️ rrweb no está disponible en este navegador');
            recordingStatus = 'unavailable';
          } 
          // Verificar si la grabación está activa
          else if (!sessionRecorder.isActive()) {
            console.warn('[SofLIA Chat] ⚠️ La grabación no está activa, intentando reiniciar...');
            
            // Intentar reiniciar la grabación
            try {
              await sessionRecorder.startRecording(180000); // 3 minutos
              recordingStatus = 'restarted';
              
              // Esperar un momento para capturar al menos el estado inicial
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (restartError) {
              console.error('[SofLIA Chat] ❌ No se pudo reiniciar la grabación:', restartError);
              recordingStatus = 'error';
            }
          } else if (typeof sessionRecorder.isPaused === 'function' && sessionRecorder.isPaused()) {
            // Si está pausada por inactividad, reanudarla
            if (typeof sessionRecorder.resume === 'function') {
              sessionRecorder.resume();
            }
            recordingStatus = 'active';
          } else {
            recordingStatus = 'active';
          }
          
          // Intentar capturar snapshot si la grabación está disponible
          const snapshot = sessionRecorder.captureSnapshot();
          
          if (snapshot && snapshot.events.length > 0) {
            // Usar compresión para reducir tamaño 60-80%
            sessionSnapshot = await sessionRecorder.exportSessionCompressed(snapshot);
            // Incluir metadata enriquecida del entorno
            enrichedMetadata = buildLiaChatMetadata(recordingStatus, snapshot);
          } else {
            console.warn('[SofLIA Chat] ⚠️ No hay eventos en el snapshot');
            // Generar metadata mínima sin grabación
            enrichedMetadata = buildLiaChatMetadata(recordingStatus);
          }
        } catch (err) {
          console.warn('[SofLIA Chat] ⚠️ Error capturando snapshot:', err);
          recordingStatus = 'error';
          
          // Generar metadata mínima en caso de error
          enrichedMetadata = buildLiaChatMetadata(
            recordingStatus,
            null,
            err instanceof Error ? err.message : 'Unknown error'
          );
        }
      }
      
      // Generar ID de conversación si no existe
      if (!conversationIdRef.current) {
        conversationIdRef.current = crypto.randomUUID();
      }

      // Usar la nueva API de LIA (similar a ARIA en IRIS)
      const response = await fetch('/api/lia/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversationIdRef.current,
          messages: [
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            { role: 'user', content: message }
          ],
          context: {
            userName: legacyUser?.first_name || legacyUser?.nombre,
            userRole: legacyUser?.job_title || legacyUser?.cargo_rol || legacyUser?.type_rol,
            userId: user?.id,
            currentPage: typeof window !== 'undefined' ? window.location.pathname : undefined,
            ...(pageContext || {}),
          },
          // Datos de grabación de sesión (comprimido)
          sessionSnapshot,
          // Metadata enriquecida del entorno
          enrichedMetadata,
          // Indicar si está probablemente reportando un bug
          isBugReport,
          // Estado de la grabación para el servidor
          recordingStatus: isBugReport ? recordingStatus : undefined,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Error en la comunicación con SofLIA');
      }

      // Procesar streaming de respuesta
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantId = (Date.now() + 1).toString();

      // Crear mensaje vacío para ir llenando
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant' as const,
        content: '',
        timestamp: new Date(),
      }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  assistantContent += data.content;
                  // Actualizar mensaje en tiempo real
                  setMessages(prev => 
                    prev.map(m => 
                      m.id === assistantId 
                        ? { ...m, content: assistantContent }
                        : m
                    )
                  );
                }
              } catch {
                // Ignorar errores de parsing
              }
            }
          }
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Error desconocido');
      setError(errorMessage);
      
      const errorResponse: SofLIAMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, legacyUser, messages, user, language]);

  const loadConversation = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/lia/conversations/${conversationId}/messages`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || 'Error cargando conversación');
      }

      const data = await response.json();
      
      const formattedMessages: SofLIAMessage[] = (data.messages || []).map((msg: { id: string; role: string; content: string; timestamp: string }) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }));

      setMessages(formattedMessages);
      conversationIdRef.current = conversationId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Error desconocido');
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
            completed: true
          }),
        });
      } catch (error) {
        console.error('[SofLIA Analytics] Error cerrando conversación:', error);
      }
      
      conversationIdRef.current = null;
    }
    
    setMessages(
      initialMessage !== null && initialMessage !== undefined && initialMessage !== ''
        ? [
            {
              id: 'initial',
              role: 'assistant',
              content: initialMessage,
              timestamp: new Date()
            }
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
          completed: false
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
