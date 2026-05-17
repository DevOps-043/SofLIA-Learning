import { useState } from 'react';
import type { TFunction } from 'i18next';
import type { LearnActivity } from '../../types';

interface UseAiActivityCompletionParams {
  activity: LearnActivity;
  isAlreadyCompleted: boolean;
  onQuizSubmitted: () => void | Promise<void>;
  t: TFunction<'learn'>;
}

export function useAiActivityCompletion({
  activity,
  isAlreadyCompleted,
  onQuizSubmitted,
  t
}: UseAiActivityCompletionParams) {
  const [aiCompletionCompleted, setAiCompletionCompleted] = useState(false);
  const [aiCompletionSaving, setAiCompletionSaving] = useState(false);
  const [aiCompletionError, setAiCompletionError] = useState<string | null>(null);
  const aiActivityCompleted = Boolean(isAlreadyCompleted || aiCompletionCompleted);

  const markAiChatActivityCompleted = async (conversationId?: string | null) => {
    if (aiActivityCompleted || aiCompletionSaving) {
      return;
    }

    try {
      setAiCompletionSaving(true);
      setAiCompletionError(null);
      await completeAiActivity(activity, conversationId, t);
      setAiCompletionCompleted(true);
      void Promise.resolve(onQuizSubmitted()).catch(() => undefined);
    } catch (error) {
      setAiCompletionError(
        error instanceof Error ? error.message : t('activities.aiCompletionError')
      );
    } finally {
      setAiCompletionSaving(false);
    }
  };

  return { aiActivityCompleted, aiCompletionError, aiCompletionSaving, markAiChatActivityCompleted };
}

async function completeAiActivity(
  activity: LearnActivity,
  conversationId: string | null | undefined,
  t: TFunction<'learn'>
) {
  const response = await fetch('/api/lia/complete-activity', {
    body: JSON.stringify({
      activityType: activity.activity_id,
      conversationId,
      generatedOutput: {
        source: 'course_ai_chat_activity_user_message',
        title: activity.activity_title,
        type: activity.activity_type
      },
      requireUserMessage: true
    }),
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST'
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(
      typeof payload.error === 'string' ? payload.error : t('activities.aiCompletionError')
    );
  }
}
