'use client'

import { FileQuestion, Video } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { UserLessonDetail } from '../types'
import { USER_PROGRESS_LESSON_ICONS } from './user-progress.constants'

interface UserProgressLessonRowProps {
  lesson: UserLessonDetail
  index: number
}

export function UserProgressLessonRow({ lesson, index }: UserProgressLessonRowProps) {
  const { t } = useTranslation('admin')
  const status = USER_PROGRESS_LESSON_ICONS[lesson.status] ?? USER_PROGRESS_LESSON_ICONS.not_started
  const StatusIcon = status.icon

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_72px_64px_48px] items-center gap-3 rounded-2xl px-2 py-2 hover:bg-slate-50 dark:hover:bg-white/5">
      <div className="flex items-center gap-2"><StatusIcon className={`h-4 w-4 ${status.className}`} /><p className="truncate text-sm text-slate-900 dark:text-white"><span className="mr-1 text-slate-400">{index}.</span>{lesson.lessonTitle}</p></div>
      <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><Video className="h-3 w-3" />{lesson.videoProgress}%</span>
      <span className="text-xs text-slate-500 dark:text-slate-400"><FileQuestion className="mr-1 inline h-3 w-3" />{lesson.quizCompleted ? t(lesson.quizPassed ? 'userStats.progressModal.quizPassed' : 'userStats.progressModal.quizFailed') : '—'}</span>
      <span className="text-right text-xs text-slate-500 dark:text-slate-400">{lesson.timeSpentMinutes ? `${lesson.timeSpentMinutes}m` : '—'}</span>
    </div>
  )
}
