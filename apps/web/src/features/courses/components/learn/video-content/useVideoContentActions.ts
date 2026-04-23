import { hasIncompleteActivities } from '@/features/courses/hooks/lessonNavigation.utils';
import type { VideoContentProps } from './VideoContent.types';

type VideoContentActionParams = Pick<
  VideoContentProps,
  | 'activities'
  | 'canCompleteLesson'
  | 'hasActivities'
  | 'lesson'
  | 'markLessonAsCompleted'
  | 'onCannotComplete'
  | 'onCourseCompleted'
  | 'onNavigateNext'
  | 'setActiveTab'
>;

export function useVideoContentActions({
  activities,
  canCompleteLesson,
  hasActivities,
  lesson,
  markLessonAsCompleted,
  onCannotComplete,
  onCourseCompleted,
  onNavigateNext,
  setActiveTab,
}: VideoContentActionParams) {
  const handleCompletionAction = async () => {
    if (!lesson.lesson_id || !canCompleteLesson(lesson.lesson_id)) {
      onCannotComplete();
      return;
    }

    const success = await markLessonAsCompleted(lesson.lesson_id);
    if (success) onCourseCompleted();
  };

  const handleAdvanceAction = () => {
    if (hasActivities && hasIncompleteActivities(activities)) {
      setActiveTab('activities');
      return;
    }

    onNavigateNext();
  };

  return { handleAdvanceAction, handleCompletionAction };
}
