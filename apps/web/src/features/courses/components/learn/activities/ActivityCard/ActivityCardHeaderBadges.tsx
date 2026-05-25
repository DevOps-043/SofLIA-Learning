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
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${isSofliaActivity ? 'border border-accent/20 bg-accent/10 text-primary dark:bg-accent/15 dark:text-accent' : 'capitalize bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-white/40'}`}>
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
      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
        <Check className="h-2.5 w-2.5" /> {t('activities.completed')}
      </span>
    );
  }

  if (!quizInfo.isCompleted) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
      {t('activities.attempted')} {quizInfo.percentage}%
    </span>
  );
}
