import type { TFunction } from 'i18next';
import { ActivityPromptsSection } from './ActivityPromptsSection';
import { ActivityRendererSwitch } from './ActivityRendererSwitch';
import type { LearnActivity, LessonQuizStatusItem } from '../../types';

interface ActivityCardBodyProps {
  activity: LearnActivity;
  aiActivityCompleted: boolean;
  aiCompletionError: string | null;
  aiCompletionSaving: boolean;
  canZoomIn: boolean;
  canZoomOut: boolean;
  contentZoom: number;
  hasActivityContent: boolean;
  isAiChat: boolean;
  isInteractive: boolean;
  isQuiz: boolean;
  isSofliaDialogue: boolean;
  lessonId: string;
  markAiChatActivityCompleted: (conversationId?: string | null) => void | Promise<void>;
  onQuizSubmitted: () => void | Promise<void>;
  onRequestQuizFeedback: (
    prompt: string,
    source?: { activityId?: string | null; materialId?: string | null },
  ) => void | Promise<void>;
  onStartAiChat: (activity: LearnActivity, callback: (conversationId?: string | null) => void | Promise<void>) => void;
  onTriggerLiaFeedback: (prompt: string) => void | Promise<void>;
  quizInfo?: LessonQuizStatusItem;
  shouldShowActivityCard: boolean;
  slug: string;
  t: TFunction<'learn'>;
  zoomIn: () => void;
  zoomOut: () => void;
}

export function ActivityCardBody(props: ActivityCardBodyProps) {
  const { activity, shouldShowActivityCard, t } = props;

  return (
    <div className="border-t border-gray-100 px-4 pb-4 dark:border-white/5">
      {activity.activity_description && (
        <p className="mb-3 mt-3 text-xs leading-relaxed text-gray-500 dark:text-white/40">
          {activity.activity_description}
        </p>
      )}

      {shouldShowActivityCard && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-white/5 dark:bg-white/[0.02]">
          <ActivityRendererSwitch {...props} />
        </div>
      )}

      <ActivityPromptsSection activity={activity} t={t} />
    </div>
  );
}
