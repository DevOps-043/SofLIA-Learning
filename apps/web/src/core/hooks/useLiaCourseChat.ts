'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { CourseLessonContext, SofLIAMessage } from '../types/lia.types';
import type { LiaImageAttachment } from '../reporting/report-problem.contract';

import { useLanguage } from '../providers/I18nProvider';
import { useOrganizationStore } from '../stores/organizationStore';


interface LiaCourseChatUserProfile {
  nombre?: string;
  job_title?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
}

interface LiaChatResponsePayload {
  conversationId?: string;
  response?: string;
  generatedNanoBanana?: SofLIAMessage['generatedNanoBanana'];
  message?: {
    content?: string;
    attachments?: LiaImageAttachment[];
  };
}

export interface UseLiaCourseChatReturn {
  messages: SofLIAMessage[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (
    message: string,
    courseContext?: CourseLessonContext,
    workshopContext?: CourseLessonContext,
    isSystemMessage?: boolean
  ) => Promise<void>;
  editMessageAndRegenerate: (
    messageId: string,
    message: string,
    courseContext?: CourseLessonContext,
    workshopContext?: CourseLessonContext
  ) => Promise<void>;
  stop: () => void;
  clearHistory: () => void;
  loadConversation: (conversationId: string) => Promise<void>;
  currentConversationId: string | null;
  getCurrentConversationId: () => string | null;
}

function buildCurrentLessonContext(
  activeContext: CourseLessonContext | undefined,
  activeTab: string | undefined,
  fallbackCurrentPage: string | undefined
) {
  if (!activeContext) {
    return undefined;
  }

  return {
    contextType: activeContext.contextType,
    courseId: activeContext.courseId,
    courseSlug: activeContext.courseSlug,
    courseTitle: activeContext.courseTitle,
    courseDescription: activeContext.courseDescription,
    userRole: activeContext.userRole,
    moduleId: activeContext.moduleId,
    moduleTitle: activeContext.moduleTitle,
    lessonId: activeContext.lessonId,
    lessonTitle: activeContext.lessonTitle,
    transcript: activeContext.transcriptContent,
    summary: activeContext.summaryContent,
    description: activeContext.lessonDescription,
    durationSeconds: activeContext.durationSeconds,
    totalDurationMinutes: activeContext.totalDurationMinutes,
    currentTab: activeTab,
    currentPage: fallbackCurrentPage,
    learningProgress: activeContext.learningProgressContext,
    activities: activeContext.activitiesContext
      ? {
          totalActivities: activeContext.activitiesContext.totalActivities,
          requiredActivities: activeContext.activitiesContext.requiredActivities,
          completedActivities: activeContext.activitiesContext.completedActivities,
          pendingRequiredCount:
            activeContext.activitiesContext.pendingRequiredCount,
          pendingRequiredTitles:
            activeContext.activitiesContext.pendingRequiredTitles,
          items: activeContext.activitiesContext.activityTypes,
          currentActivityFocus:
            activeContext.activitiesContext.currentActivityFocus || undefined,
        }
      : undefined,
    materials: activeContext.materialsContext
      ? {
          totalMaterials: activeContext.materialsContext.totalMaterials,
          requiredMaterials: activeContext.materialsContext.requiredMaterials,
          items: activeContext.materialsContext.materialTypes,
        }
      : undefined,
    quiz: activeContext.quizContext
      ? {
          hasRequiredQuizzes: activeContext.quizContext.hasRequiredQuizzes,
          totalRequiredQuizzes:
            activeContext.quizContext.totalRequiredQuizzes,
          completedQuizzes: activeContext.quizContext.completedQuizzes,
          passedQuizzes: activeContext.quizContext.passedQuizzes,
          allQuizzesPassed: activeContext.quizContext.allQuizzesPassed,
          quizzes: activeContext.quizContext.quizzes,
        }
      : undefined,
    userBehaviorContext: activeContext.userBehaviorContext,
    difficultyDetected: activeContext.difficultyDetected,
  };
}

function buildCurrentActivityContext(activeContext: CourseLessonContext | undefined) {
  const activityFocus = activeContext?.activitiesContext?.currentActivityFocus;

  if (!activityFocus) {
    return undefined;
  }

  return {
    title: activityFocus.title,
    type: activityFocus.type,
    description: activityFocus.description,
    prompts: activityFocus.prompts,
  };
}

function normalizeCourseMessage(
  message: string
): string {
  return message.trim();
}

function createMessageId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useLiaCourseChat(
  initialMessage?: string | null
): UseLiaCourseChatReturn {
  const { user } = useAuth();
  const { language } = useLanguage();
  const currentOrganization = useOrganizationStore(
    (state) => state.currentOrganization
  );
  const userProfile = user as (typeof user & LiaCourseChatUserProfile) | null;
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
  const abortControllerRef = useRef<AbortController | null>(null);

  const submitMessage = useCallback(
    async ({
      message,
      courseContext,
      workshopContext,
      isSystemMessage = false,
      baseMessages,
      optimisticMessages,
    }: {
      message: string;
      courseContext?: CourseLessonContext;
      workshopContext?: CourseLessonContext;
      isSystemMessage?: boolean;
      baseMessages?: SofLIAMessage[];
      optimisticMessages?: SofLIAMessage[];
    }) => {
      const normalizedMessage = normalizeCourseMessage(message);

      if (!normalizedMessage || isLoading) {
        return;
      }

      const requestHistory = baseMessages ?? messages;

      if (!isSystemMessage) {
        const userMessage: SofLIAMessage = {
          id: createMessageId(),
          role: 'user',
          content: normalizedMessage,
          timestamp: new Date(),
        };

        setMessages(optimisticMessages ?? [...requestHistory, userMessage]);
      }

      setIsLoading(true);
      setError(null);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const activeContext = courseContext || workshopContext;
      const fallbackCurrentPage =
        activeContext?.currentPage ||
        (typeof window !== 'undefined' ? window.location.pathname : undefined);
      const activeTab =
        activeContext?.currentTab ||
        activeContext?.learningProgressContext?.currentTab;

      try {
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
              ...requestHistory.map((entry) => ({
                role: entry.role,
                content: entry.content,
              })),
              {
                role: 'user',
                content: normalizedMessage,
              },
            ],
            context: {
              userId: user?.id,
              userName: userProfile?.first_name 
                ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim() 
                : (userProfile?.display_name || userProfile?.nombre),
              userJobTitle: userProfile?.job_title,
              organizationId: currentOrganization?.id,
              currentPage: fallbackCurrentPage,
              currentTab: activeTab,
              pageType: activeContext
                ? activeContext.contextType === 'workshop'
                  ? 'workshop_lesson'
                  : 'course_lesson'
                : undefined,
              currentLessonContext: buildCurrentLessonContext(
                activeContext,
                activeTab,
                fallbackCurrentPage
              ),
              currentActivityContext:
                buildCurrentActivityContext(activeContext),
            },
            stream: false,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error('Error en la comunicación con SofLIA');
        }

        const data = (await response.json()) as LiaChatResponsePayload;

        if (data.conversationId) {
          conversationIdRef.current = data.conversationId;
        }

        const responseText = data.message?.content || data.response;

        if (responseText) {
          const assistantMessage: SofLIAMessage = {
            id: createMessageId(),
            role: 'assistant',
            content: responseText,
            timestamp: new Date(),
            generatedNanoBanana: data.generatedNanoBanana,
            attachments: data.message?.attachments,
          };

          setMessages((prev) => [...prev, assistantMessage]);
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          console.log('Generación abortada por el usuario');
          return;
        }

        const errorMessage =
          err instanceof Error ? err : new Error('Error desconocido');
        setError(errorMessage);

        const errorResponse: SofLIAMessage = {
          id: createMessageId(),
          role: 'assistant',
          content:
            'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorResponse]);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [currentOrganization?.id, isLoading, messages, user, userProfile, language]
  );

  const sendMessage = useCallback(
    async (
      message: string,
      courseContext?: CourseLessonContext,
      workshopContext?: CourseLessonContext,
      isSystemMessage: boolean = false
    ) => {
      await submitMessage({
        message,
        courseContext,
        workshopContext,
        isSystemMessage,
      });
    },
    [submitMessage]
  );

  const editMessageAndRegenerate = useCallback(
    async (
      messageId: string,
      message: string,
      courseContext?: CourseLessonContext,
      workshopContext?: CourseLessonContext
    ) => {
      const normalizedMessage = normalizeCourseMessage(message);

      if (!normalizedMessage || isLoading) {
        return;
      }

      const messageIndex = messages.findIndex(
        (entry) => entry.id === messageId && entry.role === 'user'
      );

      if (messageIndex < 0) {
        return;
      }

      const baseMessages = messages.slice(0, messageIndex);
      const editedUserMessage: SofLIAMessage = {
        ...messages[messageIndex],
        content: normalizedMessage,
        timestamp: new Date(),
      };

      await submitMessage({
        message: normalizedMessage,
        courseContext,
        workshopContext,
        baseMessages,
        optimisticMessages: [...baseMessages, editedUserMessage],
      });
    },
    [isLoading, messages, submitMessage]
  );

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

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
          attachments?: LiaImageAttachment[];
        }>;
      };

      const formattedMessages: SofLIAMessage[] = (data.messages || []).map(
        (msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          attachments: msg.attachments,
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

  const getCurrentConversationId = useCallback(() => {
    return conversationIdRef.current;
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

  return useMemo(
    () => ({
      messages,
      isLoading,
      error,
      sendMessage,
      editMessageAndRegenerate,
      stop,
      clearHistory,
      loadConversation,
      currentConversationId: conversationIdRef.current,
      getCurrentConversationId,
    }),
    [
      messages,
      isLoading,
      error,
      sendMessage,
      editMessageAndRegenerate,
      stop,
      clearHistory,
      loadConversation,
      getCurrentConversationId,
    ]
  );
}
