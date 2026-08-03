'use client';

import { useTranslation } from 'react-i18next';
import { ActivityCardBody } from './ActivityCard/ActivityCardBody';
import { ActivityCardHeader } from './ActivityCard/ActivityCardHeader';
import { useActivityZoom } from './ActivityCard/useActivityZoom';
import { findQuizStatusItem, getNormalizedActivityContent } from './utils';
import styles from '../ActivitiesExperience.module.css';
import type { ActivityCardProps } from './ActivityCard/types';

export function ActivityCard({
  activity,
  isCollapsed,
  lessonId,
  onQuizSubmitted,
  onRequestQuizFeedback,
  onToggle,
  onTriggerLiaFeedback,
  quizStatus,
  slug
}: ActivityCardProps) {
  const { t } = useTranslation('learn');
  const isSofliaDialogue =
    activity.activity_type === 'ai_chat' ||
    activity.activity_config?.interactionType === 'soflia_dialogue';
  const isSofliaActivity = isSofliaDialogue;
  const isQuiz = activity.activity_type === 'quiz';
  const isInteractive = Boolean(activity.activity_config);
  const normalizedActivityContent = getNormalizedActivityContent(activity);
  const hasActivityContent = normalizedActivityContent.trim().length > 0;
  const shouldShowActivityCard =
    isQuiz || isSofliaDialogue || isInteractive || hasActivityContent;
  const quizInfo = isQuiz
    ? findQuizStatusItem(quizStatus, activity.activity_id, 'activity')
    : undefined;
  const { canZoomIn, canZoomOut, contentZoom, zoomIn, zoomOut } = useActivityZoom();
  return (
    <div
      data-activity-card-id={activity.activity_id}
      className={`${styles.activityCard} ${!isCollapsed ? styles.activityCardOpen : ''}`}
    >
      <ActivityCardHeader
        activity={activity}
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
          canZoomIn={canZoomIn}
          canZoomOut={canZoomOut}
          contentZoom={contentZoom}
          hasActivityContent={hasActivityContent}
          isInteractive={isInteractive}
          isQuiz={isQuiz}
          isSofliaDialogue={isSofliaDialogue}
          lessonId={lessonId}
          onQuizSubmitted={onQuizSubmitted}
          onRequestQuizFeedback={onRequestQuizFeedback}
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
