import type { TFunction } from 'i18next';
import { Check } from 'lucide-react';
import type { LearnActivity } from '../../types';

interface CompletionBadgeProps {
  activity: LearnActivity;
  t: TFunction<'learn'>;
}

export function CompletionBadge({ activity, t }: CompletionBadgeProps) {
  if (activity.activity_type === 'quiz') {
    return null;
  }

  if (activity.is_completed || activity.latest_submission_summary?.completionSatisfied) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
        <Check className="h-2.5 w-2.5" /> {t('activities.completed')}
      </span>
    );
  }

  if (activity.latest_submission_summary?.status === 'needs_revision') {
    return (
      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
        {t('activities.needsRevision')}
      </span>
    );
  }

  return null;
}
