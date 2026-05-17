'use client'

import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'

export function LearningPathItemsList({ logic }: { logic: LearnPageLogicResult }) {
  const learningPath = logic.learningPathBlockState?.learningPath
  if (!learningPath) return null

  return (
    <div className="mt-4 space-y-2">
      {learningPath.items.map((item) => (
        <div key={`${item.courseId}-${item.position}`} className={`rounded-xl border px-3 py-2 text-xs ${item.isCurrent ? 'border-amber-500/30 bg-amber-500/10' : item.isUnlocked ? 'border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/5' : 'border-black/5 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.03]'}` }>
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-gray-900 dark:text-white/90">{item.position}. {item.title}</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500 dark:text-white/50">
              {item.isCompleted ? logic.t('leftPanel.learningPath.status.completed') : item.isUnlocked ? logic.t('leftPanel.learningPath.status.available') : logic.t('leftPanel.learningPath.status.locked')}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
