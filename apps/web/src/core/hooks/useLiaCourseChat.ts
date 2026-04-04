'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { CourseLessonContext, SofLIAMessage } from '../types/lia.types';
import { useLanguage } from '../providers/I18nProvider';

interface LiaCourseChatUserProfile {
  nombre?: string;
  type_rol?: string;
  area?: string;
  tamano_empresa?: string;
}

export interface UseLiaCourseChatReturn {
  messages: SofLIAMessage[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (message: string, courseContext?: CourseLessonContext, workshopContext?: CourseLessonContext, isSystemMessage?: boolean) => Promise<void>;
  clearHistory: () => void;
  loadConversation: (conversationId: string) => Promise<void>;
  currentConversationId: string | null;
}

export function useLiaCourseChat(initialMessage?: string | null): UseLiaCourseChatReturn {
  const { user } = useAuth();
  const { language } = useLanguage();
  const userProfile = user as (typeof user & LiaCourseChatUserProfile) | null;
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
  
  // ✅ ANALYTICS: Mantener conversationId en referencia para persistencia
  const conversationIdRef = useRef<string | null>(null);
  
  // ✅ ACTIVIDADES: Tracking de tiempo de inicio de actividad
  const activityStartTimeRef = useRef<number | null>(null);

  // ✅ ACTIVIDADES: Función para registrar actividad completada (Course Specific)
  const registerCompletedActivity = useCallback(async (
    activityType: string,
    generatedOutput?: unknown
  ) => {
    if (!user) return;
    
    try {
      const timeSpentSeconds = activityStartTimeRef.current 
        ? Math.floor((Date.now() - activityStartTimeRef.current) / 1000)
        : 0;
      
      await fetch('/api/lia/complete-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversationIdRef.current,
          activityType,
          generatedOutput,
          timeSpentSeconds
        }),
      });

      activityStartTimeRef.current = null;
    } catch (error) {
      console.error('[SofLIA Analytics] Error registrando actividad:', error);
    }
  }, [user]);

  const sendMessage = useCallback(async (
    message: string,
    courseContext?: CourseLessonContext,
    workshopContext?: CourseLessonContext,
    isSystemMessage: boolean = false
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

    // ✅ ACTIVIDADES: Iniciar tracking si es mensaje de usuario
    if (!isSystemMessage && !activityStartTimeRef.current) {
        activityStartTimeRef.current = Date.now();
    }

    const activeContext = courseContext || workshopContext;

    try {
      const response = await fetch('/api/lia/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            { role: 'user', content: message }
          ],
          context: {
            userName: userProfile?.first_name || userProfile?.nombre,
            userRole: userProfile?.type_rol || userProfile?.cargo_rol, // Priorizar type_rol (cargo real) sobre cargo_rol (rol sistema)
            userCheck: {
               // Datos adicionales de usuario para personalización (si useAuth los tuviera extendidos)
               area: userProfile?.area,
               companySize: userProfile?.tamano_empresa
            },
            // Mapeo del contexto de lección usando activeContext
            currentLessonContext: activeContext ? {
              lessonId: activeContext.lessonId,
              lessonTitle: activeContext.lessonTitle,
              transcript: activeContext.transcriptContent,
              summary: activeContext.summaryContent,
              description: activeContext.lessonDescription
            } : undefined,
            // Mapeo del contexto de actividad using activeContext
            currentActivityContext: activeContext?.activitiesContext?.currentActivityFocus ? {
              title: activeContext.activitiesContext.currentActivityFocus.title,
              type: activeContext.activitiesContext.currentActivityFocus.type,
              description: activeContext.activitiesContext.currentActivityFocus.description
            } : undefined
          },
          stream: false // Usar modo JSON simple por compatibilidad con este hook
        }),
      });

      if (!response.ok) {
        throw new Error('Error en la comunicación con SofLIA');
      }

      const data = await response.json();
      
      // Actualizar ID de conversación si es nuevo (aunque este endpoint no siempre devuelve conversationId)
      if (data.conversationId) {
        conversationIdRef.current = data.conversationId;
      }

      // Soportar respuesta del nuevo endpoint (data.message.content) o fallback
      const responseText = data.message?.content || data.response;

      if (responseText) {
        const assistantMessage: SofLIAMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseText,
          timestamp: new Date(),
          generatedNanoBanana: data.generatedNanoBanana
        };

        setMessages(prev => [...prev, assistantMessage]);
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
  }, [isLoading, messages, user, language]);

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

  return useMemo(() => ({
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory,
    loadConversation,
    currentConversationId: conversationIdRef.current,
  }), [messages, isLoading, error, sendMessage, clearHistory, loadConversation]);
}
