import type { TFunction } from 'i18next';
import { Activity, BookOpen, ChevronDown, FileText } from 'lucide-react';
import { ActivityTypeBadge, QuizStatusBadges } from './ActivityCardHeaderBadges';
import { CompletionBadge } from './CompletionBadge';
import type { LearnActivity, LessonQuizStatusItem } from '../../types';

interface ActivityCardHeaderProps {
  activity: LearnActivity;
  aiActivityCompleted: boolean;
  isCollapsed: boolean;
  isQuiz: boolean;
  isSofliaActivity: boolean;
  onToggle: (activityId: string) => void;
  quizInfo?: LessonQuizStatusItem;
  t: TFunction<'learn'>;
}

export function ActivityCardHeader({
  activity,
  aiActivityCompleted,
  isCollapsed,
  isQuiz,
  isSofliaActivity,
  onToggle,
  quizInfo,
  t
}: ActivityCardHeaderProps) {
  return (
    <button
      onClick={(event) => {
        event.stopPropagation();
        onToggle(activity.activity_id);
      }}
      className="flex w-full items-center gap-3 px-4 py-3"
    >
      <ActivityIcon activity={activity} isQuiz={isQuiz} isSofliaActivity={isSofliaActivity} />
      <div className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
            {activity.activity_title}
          </span>
          {activity.is_required && <RequiredBadge label={t('activities.required')} />}
          <ActivityTypeBadge activity={activity} isSofliaActivity={isSofliaActivity} t={t} />
          <QuizStatusBadges activity={activity} quizInfo={quizInfo} t={t} />
          <CompletionBadge
            t={t}
            activity={aiActivityCompleted ? { ...activity, is_completed: true } : activity}
          />
        </div>
      </div>
      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform dark:text-white/30 ${!isCollapsed ? 'rotate-180' : ''}`} />
    </button>
  );
}

function ActivityIcon({
  activity,
  isQuiz,
  isSofliaActivity
}: Pick<ActivityCardHeaderProps, 'activity' | 'isQuiz' | 'isSofliaActivity'>) {
  const iconClass = 'h-4 w-4 text-gray-500 dark:text-white/60';

  return (
    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${isSofliaActivity ? 'overflow-hidden border border-accent/25 bg-accent/10 dark:bg-accent/15' : 'bg-gray-100 dark:bg-white/5'}`}>
      {isSofliaActivity ? (
        <img src="/lia-avatar.webp" alt="SofLIA" className="h-full w-full object-cover" />
      ) : isQuiz ? (
        <FileText className={iconClass} />
      ) : activity.activity_type === 'reading' ? (
        <BookOpen className={iconClass} />
      ) : (
        <Activity className={iconClass} />
      )}
    </div>
  );
}

function RequiredBadge({ label }: { label: string }) {
  return (
    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
      {label}
    </span>
  );
}
