import { Lock } from 'lucide-react';
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic';

interface LearningPathBlockedStateProps {
  logic: Pick<LearnPageLogicResult, 'learningPathBlockState' | 'router' | 't'>;
}

export function LearningPathBlockedState({ logic }: LearningPathBlockedStateProps) {
  const blockState = logic.learningPathBlockState;
  if (!blockState?.learningPath) return null;

  const nextAvailableCourse = blockState.learningPath.items.find(
    (item) => item.isUnlocked && !item.isCompleted && item.slug
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1419] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl rounded-3xl border border-amber-500/20 bg-white p-8 shadow-[0_24px_80px_rgba(10,37,64,0.08)] dark:bg-[#111827]">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
          <Lock className="h-7 w-7" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.28em] text-amber-600">
          {logic.t('learningPath.badge')}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[#0A2540] dark:text-white">
          {logic.t('learningPath.blockedTitle')}
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#52606D] dark:text-white/75">
          {blockState.message}
        </p>
        <div className="mt-6 rounded-2xl border border-[#00D4B3]/20 bg-[#00D4B3]/5 p-4">
          <LearningPathProgress logic={logic} />
          <div className="mt-4 space-y-2">
            {blockState.learningPath.items.map((item) => (
              <LearningPathCourseRow item={item} key={`${item.courseId}-${item.position}`} logic={logic} />
            ))}
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          {nextAvailableCourse?.slug ? (
            <button
              className="rounded-xl bg-[#0A2540] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0d2f4d]"
              onClick={() => logic.router.push(`/courses/${nextAvailableCourse.slug}/learn`)}
            >
              {logic.t('learningPath.availableCta')}
            </button>
          ) : null}
          <button
            className="rounded-xl border border-black/10 px-5 py-3 text-sm font-semibold text-[#0A2540] transition-colors hover:bg-black/[0.03] dark:border-white/10 dark:text-white dark:hover:bg-white/[0.04]"
            onClick={() => logic.router.push('/dashboard')}
          >
            {logic.t('navigation.backToCourses')}
          </button>
        </div>
      </div>
    </div>
  );
}

function LearningPathProgress({ logic }: LearningPathBlockedStateProps) {
  const path = logic.learningPathBlockState!.learningPath;
  return (
    <>
      <h2 className="text-sm font-semibold text-[#0A2540] dark:text-white">{path.title}</h2>
      <p className="mt-1 text-xs text-[#52606D] dark:text-white/60">
        {logic.t('leftPanel.learningPath.completedCount', {
          completed: path.completedItemsCount,
          total: path.totalItemsCount,
        })}
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div className="h-full rounded-full bg-[#00D4B3]" style={{ width: `${path.progressPercentage}%` }} />
      </div>
    </>
  );
}

function LearningPathCourseRow({
  item,
  logic,
}: {
  item: NonNullable<LearnPageLogicResult['learningPathBlockState']>['learningPath']['items'][number];
  logic: LearningPathBlockedStateProps['logic'];
}) {
  const statusKey = item.isCompleted ? 'completed' : item.isUnlocked ? 'available' : 'locked';
  return (
    <div className={`rounded-xl border px-3 py-2 text-xs ${item.isCurrent ? 'border-amber-500/30 bg-amber-500/10' : item.isUnlocked ? 'border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/5' : 'border-black/5 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.03]'}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-gray-900 dark:text-white/90">{item.position}. {item.title}</span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500 dark:text-white/50">
          {logic.t(`leftPanel.learningPath.status.${statusKey}`)}
        </span>
      </div>
    </div>
  );
}
