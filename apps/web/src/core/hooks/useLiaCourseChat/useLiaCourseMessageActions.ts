import { useCallback } from 'react';
import type { MutableRefObject } from 'react';
import type { CourseLessonContext, SofLIAMessage } from '../../types/lia.types';
import { normalizeCourseMessage } from './messages';
import type { SubmitCourseMessageParams } from './types';

interface UseLiaCourseMessageActionsParams {
  isLoading: boolean;
  messages: SofLIAMessage[];
  abortControllerRef: MutableRefObject<AbortController | null>;
  setIsLoading: (isLoading: boolean) => void;
  submitMessage: (params: SubmitCourseMessageParams) => Promise<void>;
}

export function useLiaCourseMessageActions({
  isLoading,
  messages,
  abortControllerRef,
  setIsLoading,
  submitMessage,
}: UseLiaCourseMessageActionsParams) {
  const sendMessage = useCallback(
    async (
      message: string,
      courseContext?: CourseLessonContext,
      workshopContext?: CourseLessonContext,
      isSystemMessage = false
    ) => submitMessage({ message, courseContext, workshopContext, isSystemMessage }),
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
      if (!normalizedMessage || isLoading) return;

      const messageIndex = messages.findIndex(
        (entry) => entry.id === messageId && entry.role === 'user'
      );
      if (messageIndex < 0) return;

      const baseMessages = messages.slice(0, messageIndex);
      await submitMessage({
        message: normalizedMessage,
        courseContext,
        workshopContext,
        baseMessages,
        optimisticMessages: [
          ...baseMessages,
          { ...messages[messageIndex], content: normalizedMessage, timestamp: new Date() },
        ],
      });
    },
    [isLoading, messages, submitMessage]
  );

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  }, [abortControllerRef, setIsLoading]);

  return { sendMessage, editMessageAndRegenerate, stop };
}
