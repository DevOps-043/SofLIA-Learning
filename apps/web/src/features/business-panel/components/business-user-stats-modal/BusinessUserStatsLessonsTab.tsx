'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  MessageCircle,
  Layers,
  MinusCircle,
} from 'lucide-react'
import { BusinessUserStatsEmptyState } from './shared'
import type { BusinessUserStatsTabProps } from './types'
import type { CourseWithLessons, LessonDetail } from '../../types/business-user-stats.types'

// ─── Utility ────────────────────────────────────────────────────────────────

function fmtMinutes(minutes: number): string {
  if (minutes < 1) return '<1 min'
  if (minutes < 60) return `${Math.round(minutes)} min`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ─── Lesson Row ──────────────────────────────────────────────────────────────

interface LessonRowProps {
  lesson: LessonDetail
  index: number
  theme: BusinessUserStatsTabProps['theme']
}

function VideoBadge({ lesson, theme }: { lesson: LessonDetail; theme: BusinessUserStatsTabProps['theme'] }) {
  if (lesson.video_watched) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest"
        style={{ backgroundColor: `${theme.successColor}20`, color: theme.successColor }}
      >
        <Play className="w-2.5 h-2.5 fill-current" />
        Visto
      </span>
    )
  }
  if (lesson.video_progress_pct > 0) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest"
        style={{ backgroundColor: `${theme.warningColor}20`, color: theme.warningColor }}
      >
        <Play className="w-2.5 h-2.5" />
        {lesson.video_progress_pct}%
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest opacity-40"
      style={{ backgroundColor: `${theme.textColor}10`, color: theme.textColor }}
    >
      <Play className="w-2.5 h-2.5" />
      Sin ver
    </span>
  )
}

function ActivityBadge({ lesson, theme }: { lesson: LessonDetail; theme: BusinessUserStatsTabProps['theme'] }) {
  if (lesson.activities_total === 0) return null

  if (lesson.activity_done) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest"
        style={{ backgroundColor: `${theme.successColor}20`, color: theme.successColor }}
      >
        <CheckCircle2 className="w-2.5 h-2.5" />
        Act. {lesson.activities_completed}/{lesson.activities_total}
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest"
      style={{ backgroundColor: `${theme.warningColor}20`, color: theme.warningColor }}
    >
      <MinusCircle className="w-2.5 h-2.5" />
      Act. {lesson.activities_completed}/{lesson.activities_total}
    </span>
  )
}

function QuizBadge({ lesson, theme }: { lesson: LessonDetail; theme: BusinessUserStatsTabProps['theme'] }) {
  if (!lesson.quiz_completed) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest opacity-40"
        style={{ backgroundColor: `${theme.textColor}10`, color: theme.textColor }}
      >
        Quiz —
      </span>
    )
  }
  if (lesson.quiz_passed) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest"
        style={{ backgroundColor: `${theme.successColor}20`, color: theme.successColor }}
      >
        <CheckCircle2 className="w-2.5 h-2.5" />
        Quiz {lesson.quiz_score !== null ? `${lesson.quiz_score}%` : 'OK'}
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest"
      style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
    >
      <XCircle className="w-2.5 h-2.5" />
      Quiz {lesson.quiz_score !== null ? `${lesson.quiz_score}%` : 'Fail'}
    </span>
  )
}

function LiasBadge({ lesson, theme }: { lesson: LessonDetail; theme: BusinessUserStatsTabProps['theme'] }) {
  if (lesson.lia_conversations === 0) return null
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest"
      style={{ backgroundColor: `${theme.accentColor}20`, color: theme.accentColor }}
    >
      <MessageCircle className="w-2.5 h-2.5" />
      {lesson.lia_conversations} SofLIA
    </span>
  )
}

function LessonRow({ lesson, index, theme }: LessonRowProps) {
  const statusDot = {
    completed: theme.successColor,
    in_progress: theme.warningColor,
    not_started: `${theme.textColor}30`,
  }[lesson.status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-2xl border transition-colors"
      style={{
        backgroundColor:
          lesson.status === 'completed'
            ? `${theme.successColor}08`
            : `${theme.textColor}04`,
        borderColor: theme.modalBorder,
      }}
    >
      {/* Status dot + lesson title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: statusDot }}
        />
        <span
          className="text-xs font-semibold truncate"
          style={{ color: theme.textColor }}
        >
          {lesson.lesson_order !== null ? `${lesson.lesson_order}. ` : ''}
          {lesson.lesson_title ?? 'Lección sin título'}
        </span>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5 shrink-0 pl-5 sm:pl-0">
        <VideoBadge lesson={lesson} theme={theme} />
        <ActivityBadge lesson={lesson} theme={theme} />
        <QuizBadge lesson={lesson} theme={theme} />
        <LiasBadge lesson={lesson} theme={theme} />
        {lesson.time_spent_minutes > 0 ? (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest opacity-50"
            style={{ backgroundColor: `${theme.textColor}10`, color: theme.textColor }}
          >
            <Clock className="w-2.5 h-2.5" />
            {fmtMinutes(lesson.time_spent_minutes)}
          </span>
        ) : null}
      </div>
    </motion.div>
  )
}

// ─── Course Accordion ────────────────────────────────────────────────────────

interface CourseAccordionProps {
  courseData: CourseWithLessons
  courseIndex: number
  theme: BusinessUserStatsTabProps['theme']
  t: BusinessUserStatsTabProps['t']
  defaultOpen: boolean
}

function CourseAccordion({ courseData, courseIndex, theme, t, defaultOpen }: CourseAccordionProps) {
  const [open, setOpen] = useState(defaultOpen)

  const completedCount = courseData.lessons.filter((l) => l.status === 'completed').length
  const totalCount = courseData.lessons.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: courseIndex * 0.06 }}
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: theme.modalBorder }}
    >
      {/* Accordion header */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center gap-4 p-4 text-left transition-colors hover:opacity-90"
        style={{ backgroundColor: theme.cardBg }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${theme.primaryColor}15` }}
        >
          <Layers className="w-5 h-5" style={{ color: theme.primaryColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: theme.textColor }}>
            {courseData.course_title ?? 'Curso sin título'}
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.mutedTextColor }}>
            {completedCount}/{totalCount} {t('users.stats.timeline.lessons')}
          </p>
        </div>

        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform"
          style={{
            backgroundColor: `${theme.textColor}08`,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <ChevronDown className="w-4 h-4" style={{ color: theme.mutedTextColor }} />
        </div>
      </button>

      {/* Lesson rows */}
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="p-3 space-y-2 border-t"
              style={{
                backgroundColor: theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                borderColor: theme.modalBorder,
              }}
            >
              {courseData.lessons.length === 0 ? (
                <p
                  className="text-center py-4 text-[10px] font-black uppercase tracking-widest opacity-40"
                  style={{ color: theme.textColor }}
                >
                  Sin lecciones registradas
                </p>
              ) : (
                courseData.lessons.map((lesson, index) => (
                  <LessonRow
                    key={lesson.lesson_id}
                    lesson={lesson}
                    index={index}
                    theme={theme}
                  />
                ))
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Tab ────────────────────────────────────────────────────────────────────

export function BusinessUserStatsLessonsTab({
  stats,
  t,
  theme,
}: Pick<BusinessUserStatsTabProps, 'stats' | 't' | 'theme'>) {
  const courses = stats.courses_with_lessons ?? []

  if (courses.length === 0) {
    return (
      <BusinessUserStatsEmptyState
        icon={BookOpen}
        label={t('users.stats.lessons.empty')}
        theme={theme}
      />
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <h3
        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em]"
        style={{ color: theme.mutedTextColor }}
      >
        <BookOpen className="h-4 w-4" style={{ color: theme.primaryColor }} />
        {t('users.stats.lessons.title')}
      </h3>

      <div className="space-y-4">
        {courses.map((courseData, index) => (
          <CourseAccordion
            key={courseData.course_id}
            courseData={courseData}
            courseIndex={index}
            theme={theme}
            t={t}
            defaultOpen={index === 0}
          />
        ))}
      </div>
    </motion.div>
  )
}
