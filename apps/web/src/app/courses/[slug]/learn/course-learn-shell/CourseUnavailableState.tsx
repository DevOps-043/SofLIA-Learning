'use client'

import { Lock } from 'lucide-react'
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'
import { LearningPathItemsList } from './LearningPathItemsList'

export function CourseUnavailableState({ logic }: { logic: LearnPageLogicResult }) {
  if (logic.learningPathBlockState?.learningPath) return <LearningPathBlockedState logic={logic} />

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <h1 className="mb-4 text-3xl font-bold text-primary dark:text-white" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>{logic.t('errors.courseNotFound')}</h1>
        <p className="mb-8 text-gray-500 dark:text-white/80" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>{logic.t('errors.courseNotFoundMessage')}</p>
        <button onClick={() => logic.router.push('/dashboard')} className="rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary">{logic.t('navigation.backToCourses')}</button>
      </div>
    </div>
  )
}

function LearningPathBlockedState({ logic }: { logic: LearnPageLogicResult }) {
  const state = logic.learningPathBlockState
  const learningPath = state?.learningPath
  const nextAvailableCourse = learningPath?.items.find((item) => item.isUnlocked && !item.isCompleted && item.slug)
  if (!state || !learningPath) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12 dark:bg-gray-900">
      <div className="w-full max-w-2xl rounded-3xl border border-amber-500/20 bg-white p-8 shadow-[0_24px_80px_rgba(10,37,64,0.08)] dark:bg-gray-900">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600"><Lock className="h-7 w-7" /></div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.28em] text-amber-600">{logic.t('learningPath.badge')}</p>
        <h1 className="mt-3 text-3xl font-bold text-primary dark:text-white">{logic.t('learningPath.blockedTitle')}</h1>
        <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-white/75">{state.message}</p>
        <div className="mt-6 rounded-2xl border border-accent/20 bg-accent/5 p-4">
          <h2 className="text-sm font-semibold text-primary dark:text-white">{learningPath.title}</h2>
          <p className="mt-1 text-xs text-gray-600 dark:text-white/60">{logic.t('leftPanel.learningPath.completedCount', { completed: learningPath.completedItemsCount, total: learningPath.totalItemsCount })}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"><div className="h-full rounded-full bg-accent" style={{ width: `${learningPath.progressPercentage}%` }} /></div>
          <LearningPathItemsList logic={logic} />
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          {nextAvailableCourse?.slug ? <button onClick={() => logic.router.push(`/courses/${nextAvailableCourse.slug}/learn`)} className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary">{logic.t('learningPath.availableCta')}</button> : null}
          <button onClick={() => logic.router.push('/dashboard')} className="rounded-xl border border-black/10 px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-black/[0.03] dark:border-white/10 dark:text-white dark:hover:bg-white/[0.04]">{logic.t('navigation.backToCourses')}</button>
        </div>
      </div>
    </div>
  )
}
