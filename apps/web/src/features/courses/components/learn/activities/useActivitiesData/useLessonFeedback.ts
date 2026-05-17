import { useCallback, useEffect, useState } from 'react';
import type { LessonFeedback } from './types';

function parseLessonFeedback(payload: { feedback_type?: unknown }): LessonFeedback {
  return payload.feedback_type === 'like' || payload.feedback_type === 'dislike'
    ? payload.feedback_type
    : null;
}

export function useLessonFeedback(lessonId: string | undefined, slug: string) {
  const [lessonFeedback, setLessonFeedback] = useState<LessonFeedback>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    async function loadLessonFeedback() {
      if (!lessonId || !slug) {
        setLessonFeedback(null);
        return;
      }

      try {
        const response = await fetch(`/api/courses/${slug}/lessons/${lessonId}/feedback`, {
          credentials: 'include',
        });

        setLessonFeedback(response.ok ? parseLessonFeedback(await response.json()) : null);
      } catch {
        setLessonFeedback(null);
      }
    }

    void loadLessonFeedback();
  }, [lessonId, slug]);

  const handleLessonFeedback = useCallback(
    async (feedbackType: Exclude<LessonFeedback, null>) => {
      if (!lessonId || !slug || feedbackLoading) {
        return;
      }

      setFeedbackLoading(true);

      try {
        const response = await fetch(`/api/courses/${slug}/lessons/${lessonId}/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ feedback_type: feedbackType }),
        });

        if (response.ok) {
          setLessonFeedback(parseLessonFeedback(await response.json()));
        }
      } finally {
        setFeedbackLoading(false);
      }
    },
    [feedbackLoading, lessonId, slug]
  );

  return { feedbackLoading, handleLessonFeedback, lessonFeedback };
}
