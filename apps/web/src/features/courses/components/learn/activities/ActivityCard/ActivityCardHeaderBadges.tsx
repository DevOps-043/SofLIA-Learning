import type { TFunction } from 'i18next';
import { Check } from 'lucide-react';
import type { LearnActivity, LessonQuizStatusItem } from '../../types';

interface ActivityTypeBadgeProps {
  activity: LearnActivity;
  isSofliaActivity: boolean;
  t: TFunction<'learn'>;
}

interface QuizStatusBadgesProps {
  activity: LearnActivity;
  quizInfo?: LessonQuizStatusItem;
  t: TFunction<'learn'>;
}

export function ActivityTypeBadge({
  activity,
  isSofliaActivity,
  t
}: ActivityTypeBadgeProps) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-[10px] font-medium ${isSofliaActivity ? '' : 'capitalize border-gray-200/70 bg-gray-100/70 text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-white/40'}`}
      style={isSofliaActivity ? {
        borderColor: 'color-mix(in srgb, var(--learn-accent) 20%, transparent)',
        backgroundColor: 'color-mix(in srgb, var(--learn-accent) 10%, transparent)',
        color: 'var(--learn-accent)',
      } : undefined}
    >
      {isSofliaActivity ? t('activities.sofliaActivityType') : activity.activity_type}
    </span>
  );
}

export function QuizStatusBadges({ activity, quizInfo, t }: QuizStatusBadgesProps) {
  if (!activity.is_required || !quizInfo) {
    return null;
  }

  if (quizInfo.isPassed) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100/70 px-2 py-1 text-[10px] font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
        <Check className="h-2.5 w-2.5" /> {t('activities.completed')}
      </span>
    );
  }

  if (!quizInfo.isCompleted) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100/70 px-2 py-1 text-[10px] font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
      {t('activities.attempted')} {quizInfo.percentage}%
    </span>
  );
}
