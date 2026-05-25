import type { TFunction } from 'i18next';
import { QuizRenderer } from '../../QuizRenderer';
import { resolveQuizPayload } from '../utils';
import { QuizFallback } from './QuizFallback';
import type { LearnActivity, LessonQuizStatusItem } from '../../types';

interface QuizActivityBlockProps {
  activity: LearnActivity;
  lessonId: string;
  onQuizSubmitted: () => void | Promise<void>;
  onTriggerLiaFeedback: (prompt: string) => void | Promise<void>;
  quizInfo?: LessonQuizStatusItem;
  slug: string;
  t: TFunction<'learn'>;
}

export function QuizActivityBlock({
  activity,
  lessonId,
  onQuizSubmitted,
  onTriggerLiaFeedback,
  quizInfo,
  slug,
  t
}: QuizActivityBlockProps) {
  const quizPayload = resolveQuizPayload(activity.activity_content);

  if (!quizPayload) {
    return (
      <QuizFallback
        message={t('activities.quizError')}
        rawContent={activity.activity_content}
      />
    );
  }

  return (
    <QuizRenderer
      quizData={quizPayload.questions}
      totalPoints={quizPayload.totalPoints}
      quizStatusItem={quizInfo}
      lessonId={lessonId}
      slug={slug}
      activityId={activity.activity_id}
      onTriggerLiaFeedback={(prompt) => {
        void onTriggerLiaFeedback(prompt);
      }}
      onQuizSubmitted={() => {
        void onQuizSubmitted();
      }}
    />
  );
}
