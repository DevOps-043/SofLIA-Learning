'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Award, BookOpen, Calendar, CheckCircle, ChevronDown, ChevronRight, Clock } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { UserCourseProgress } from '../types'
import { USER_PROGRESS_LEVELS, USER_PROGRESS_STATUS } from './user-progress.constants'
import { formatProgressDate, formatStudyHours } from './user-progress.formatters'
import { UserProgressLessonRow } from './UserProgressLessonRow'

interface UserProgressCourseCardProps {
  course: UserCourseProgress
}

export function UserProgressCourseCard({ course }: UserProgressCourseCardProps) {
  const { t } = useTranslation('admin')
  const [expanded, setExpanded] = useState(false)
  const status = USER_PROGRESS_STATUS[course.enrollmentStatus] ?? USER_PROGRESS_STATUS.active
  const completedLessons = course.lessons.filter((lesson) => lesson.status === 'completed').length

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
      <button type="button" onClick={() => setExpanded((value) => !value)} className="w-full p-4 text-left">
        <div className="flex items-start gap-4">
          {course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" className="h-14 w-20 rounded-2xl object-cover" /> : <span className="flex h-14 w-20 items-center justify-center rounded-2xl bg-slate-200 text-slate-500 dark:bg-white/10"><BookOpen className="h-5 w-5" /></span>}
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2"><h4 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{course.courseTitle}</h4><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}>{t(status.labelKey)}</span><span className="text-xs text-slate-500 dark:text-slate-400">{t(USER_PROGRESS_LEVELS[course.courseLevel] ?? course.courseLevel)}</span></div>
            <div className="flex items-center gap-3"><div className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-white/10"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(course.overallProgress, 100)}%` }} className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500" /></div><span className="text-xs font-semibold text-slate-700 dark:text-white">{course.overallProgress}%</span></div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400"><span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{t('userStats.progressModal.courseMeta.enrolled', { date: formatProgressDate(course.enrolledAt, t) })}</span>{course.completedAt ? <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500" />{t('userStats.progressModal.courseMeta.completed', { date: formatProgressDate(course.completedAt, t) })}</span> : null}<span className="flex items-center gap-1"><Clock className="h-3 w-3" />{t('userStats.progressModal.courseMeta.hours', { value: formatStudyHours(course.totalStudyMinutes) })}</span><span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{t('userStats.progressModal.courseMeta.lessons', { completed: completedLessons, total: course.lessons.length })}</span>{course.hasCertificate ? <span className="flex items-center gap-1 text-amber-500"><Award className="h-3 w-3" />{t('userStats.progressModal.courseMeta.certificate', { date: formatProgressDate(course.certificateIssuedAt, t) })}</span> : null}</div>
          </div>
          {expanded ? <ChevronDown className="mt-1 h-5 w-5 text-slate-400" /> : <ChevronRight className="mt-1 h-5 w-5 text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-200 px-4 py-3 dark:border-white/10">{course.lessons.length ? course.lessons.map((lesson, index) => <UserProgressLessonRow key={lesson.lessonId} lesson={lesson} index={index + 1} />) : <p className="text-sm text-slate-500 dark:text-slate-400">{t('userStats.progressModal.emptyLessons')}</p>}</motion.div>}
      </AnimatePresence>
    </div>
  )
}
