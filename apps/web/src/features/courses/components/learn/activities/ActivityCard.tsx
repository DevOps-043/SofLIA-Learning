'use client';

import { useTranslation } from 'react-i18next';
import { ActivityCardBody } from './ActivityCard/ActivityCardBody';
import { ActivityCardHeader } from './ActivityCard/ActivityCardHeader';
import { useActivityZoom } from './ActivityCard/useActivityZoom';
import { useAiActivityCompletion } from './ActivityCard/useAiActivityCompletion';
import { findQuizStatusItem, getNormalizedActivityContent } from './utils';
import type { ActivityCardProps } from './ActivityCard/types';

export function ActivityCard({
  activity,
  isCollapsed,
  lessonId,
  onQuizSubmitted,
  onRequestQuizFeedback,
  onStartAiChat,
  onToggle,
  onTriggerLiaFeedback,
  quizStatus,
  slug
}: ActivityCardProps) {
  const { t } = useTranslation('learn');
  const isSofliaDialogue =
    activity.activity_config?.interactionType === 'soflia_dialogue';
  const isAiChat = activity.activity_type === 'ai_chat' && !isSofliaDialogue;
  const isSofliaActivity = isAiChat || isSofliaDialogue;
  const isQuiz = activity.activity_type === 'quiz';
  const isInteractive = Boolean(activity.activity_config);
  const normalizedActivityContent = getNormalizedActivityContent(activity);
  const hasActivityContent = normalizedActivityContent.trim().length > 0;
  const shouldShowActivityCard =
    isQuiz || isAiChat || isInteractive || hasActivityContent;
  const quizInfo = isQuiz
    ? findQuizStatusItem(quizStatus, activity.activity_id, 'activity')
    : undefined;
  const { canZoomIn, canZoomOut, contentZoom, zoomIn, zoomOut } = useActivityZoom();
  const {
    aiActivityCompleted,
    aiCompletionError,
    aiCompletionSaving,
    markAiChatActivityCompleted
  } = useAiActivityCompletion({
    activity,
    isAlreadyCompleted: Boolean(activity.is_completed),
    onQuizSubmitted,
    t
  });

  return (
    <div
      data-activity-card-id={activity.activity_id}
      className="scroll-mt-6 rounded-lg border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-50 dark:border-white/5 dark:bg-white/[0.02] dark:shadow-none dark:hover:bg-white/[0.04]"
    >
      <ActivityCardHeader
        activity={activity}
        aiActivityCompleted={aiActivityCompleted}
        isCollapsed={isCollapsed}
        isQuiz={isQuiz}
        isSofliaActivity={isSofliaActivity}
        onToggle={onToggle}
        quizInfo={quizInfo}
        t={t}
      />
      {!isCollapsed && (
        <ActivityCardBody
          activity={activity}
          aiActivityCompleted={aiActivityCompleted}
          aiCompletionError={aiCompletionError}
          aiCompletionSaving={aiCompletionSaving}
          canZoomIn={canZoomIn}
          canZoomOut={canZoomOut}
          contentZoom={contentZoom}
          hasActivityContent={hasActivityContent}
          isAiChat={isAiChat}
          isInteractive={isInteractive}
          isQuiz={isQuiz}
          isSofliaDialogue={isSofliaDialogue}
          lessonId={lessonId}
          markAiChatActivityCompleted={markAiChatActivityCompleted}
          onQuizSubmitted={onQuizSubmitted}
          onRequestQuizFeedback={onRequestQuizFeedback}
          onStartAiChat={onStartAiChat}
          onTriggerLiaFeedback={onTriggerLiaFeedback}
          quizInfo={quizInfo}
          shouldShowActivityCard={shouldShowActivityCard}
          slug={slug}
          t={t}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
        />
      )}
    </div>
  );
}
