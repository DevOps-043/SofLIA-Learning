import type { TFunction } from 'i18next';
import { InteractiveActivityRenderer } from '../InteractiveActivityRenderer';
import { SofliaDialogueActivityRenderer } from '../SofliaDialogueActivityRenderer';
import { QuizActivityBlock } from './QuizActivityBlock';
import { ReadingActivityContent } from './ReadingActivityContent';
import type { LearnActivity, LessonQuizStatusItem } from '../../types';

interface ActivityRendererSwitchProps {
  activity: LearnActivity;
  canZoomIn: boolean;
  canZoomOut: boolean;
  contentZoom: number;
  hasActivityContent: boolean;
  isInteractive: boolean;
  isQuiz: boolean;
  isSofliaDialogue: boolean;
  lessonId: string;
  onQuizSubmitted: () => void | Promise<void>;
  onRequestQuizFeedback: (
    prompt: string,
    source?: { activityId?: string | null; materialId?: string | null },
  ) => void | Promise<void>;
  onTriggerLiaFeedback: (prompt: string) => void | Promise<void>;
  quizInfo?: LessonQuizStatusItem;
  slug: string;
  t: TFunction<'learn'>;
  zoomIn: () => void;
  zoomOut: () => void;
}

export function ActivityRendererSwitch(props: ActivityRendererSwitchProps) {
  const { activity, isInteractive, isQuiz, isSofliaDialogue } = props;

  if (isQuiz) {
    return <QuizActivityBlock {...props} />;
  }
  if (isSofliaDialogue) {
    return (
      <SofliaDialogueActivityRenderer
        activity={activity}
        lessonId={props.lessonId}
        onSessionUpdated={props.onQuizSubmitted}
        slug={props.slug}
      />
    );
  }
  if (isInteractive) {
    return (
      <InteractiveActivityRenderer
        activity={activity}
        lessonId={props.lessonId}
        onSubmissionSaved={props.onQuizSubmitted}
        slug={props.slug}
      />
    );
  }
  if (props.hasActivityContent) {
    return <ReadingActivityContent {...props} />;
  }

  return null;
}
