'use client'

import { motion } from 'framer-motion'
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  HelpCircle,
  Layers,
  MessageSquare,
  Target,
  Zap,
} from 'lucide-react'
import type { BusinessUserStatsCourseData } from '../../types/business-user-stats.types'
import type { BusinessUserStatsTheme, BusinessUserStatsTranslate } from './types'
import {
  BreakdownRow,
  MetaItem,
  MetricSection,
  StatusPill,
  clampProgress,
  formatCourseTime,
  formatPercent,
  getProgressColor,
  getStatusLabel,
} from './BusinessUserStatsCourseBreakdownParts'

interface BusinessUserStatsCourseBreakdownCardProps {
  course: BusinessUserStatsCourseData
  delay: number
  formatDate: (dateString: string | null | undefined) => string
  t: BusinessUserStatsTranslate
  theme: BusinessUserStatsTheme
}

export function BusinessUserStatsCourseBreakdownCard({
  course,
  delay,
  formatDate,
  t,
  theme,
}: BusinessUserStatsCourseBreakdownCardProps) {
  const progressColor = getProgressColor(course, theme)
  const progress = clampProgress(course.progress)
  const assignedOrEnrolledAt = course.assigned_at || course.enrolled_at
  const statusLabel = getStatusLabel(course, t)
  const notesCount = course.notes_count || 0
  const activitiesCompleted = course.activities_completed || course.lia_activities_completed || 0
  const activitiesTotal = course.activities_total || 0
  const quizTotal = course.quiz_total || 0
  const quizPassed = course.quiz_passed || 0
  const liaConversations = course.lia_conversations_count || 0
  const liaMessages = course.lia_messages_count || 0

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative overflow-hidden rounded-[2.25rem] border p-5 shadow-2xl sm:p-7"
      style={{ backgroundColor: theme.cardBg, borderColor: theme.modalBorder }}
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${progressColor}, ${theme.accentColor})`,
        }}
      />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusPill icon={CheckCircle} label={statusLabel} color={progressColor} />
            {course.has_certificate ? (
              <StatusPill
                icon={Award}
                label={t('users.modals.stats.coursesList.certificate')}
                color={theme.warningColor}
              />
            ) : null}
          </div>

          <h4
            className="text-xl font-black tracking-tight sm:text-2xl"
            style={{ color: theme.textColor }}
          >
            {course.course_title}
          </h4>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest">
            {assignedOrEnrolledAt ? (
              <MetaItem
                icon={Calendar}
                label={
                  course.assigned_at
                    ? t('users.modals.stats.coursesList.assignedAt')
                    : t('users.modals.stats.coursesList.enrolled')
                }
                value={formatDate(assignedOrEnrolledAt)}
                theme={theme}
              />
            ) : null}
            {course.due_date ? (
              <MetaItem
                icon={Target}
                label={t('users.modals.stats.coursesList.due')}
                value={formatDate(course.due_date)}
                theme={theme}
              />
            ) : null}
          </div>
        </div>

        <div
          className="shrink-0 rounded-[1.8rem] border px-5 py-4 text-right"
          style={{ borderColor: theme.modalBorder }}
        >
          <div
            className="text-[9px] font-black uppercase tracking-[0.25em]"
            style={{ color: theme.mutedTextColor }}
          >
            {t('users.modals.stats.coursesList.progress')}
          </div>
          <div className="text-4xl font-black tracking-tighter" style={{ color: progressColor }}>
            {formatPercent(progress)}
          </div>
        </div>
      </div>

      <div className="mt-7">
        <div
          className="relative h-4 overflow-hidden rounded-full"
          style={{ backgroundColor: `color-mix(in srgb, ${theme.textColor} 7.8%, transparent)` }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: delay + 0.1 }}
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${progressColor}, ${theme.accentColor})`,
              boxShadow: `0 0 24px color-mix(in srgb, ${progressColor} 40%, transparent)`,
            }}
          />
        </div>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-7 xl:grid-cols-2">
        <MetricSection
          icon={Layers}
          title={t('users.modals.stats.coursesList.learningProgress')}
          theme={theme}
        >
          <BreakdownRow
            icon={BookOpen}
            label={t('users.modals.stats.coursesList.lessons')}
            value={`${course.lessons_completed || 0}/${course.lessons_total || 0}`}
            helper={t('users.modals.stats.coursesList.completedOfTotal', {
              completed: course.lessons_completed || 0,
              total: course.lessons_total || 0,
            })}
            color={theme.primaryColor}
            theme={theme}
          />
          <BreakdownRow
            bordered
            icon={Layers}
            label={t('users.modals.stats.coursesList.modules')}
            value={`${course.modules_completed || 0}/${course.modules_total || 0}`}
            helper={t('users.modals.stats.coursesList.completedOfTotal', {
              completed: course.modules_completed || 0,
              total: course.modules_total || 0,
            })}
            color={theme.accentColor}
            theme={theme}
          />
          <BreakdownRow
            bordered
            icon={Clock}
            label={t('users.modals.stats.coursesList.studyTime')}
            value={formatCourseTime(course.time_spent_minutes || 0, t)}
            color={theme.secondaryColor || theme.primaryColor}
            theme={theme}
          />
        </MetricSection>

        <MetricSection
          icon={MessageSquare}
          title={t('users.modals.stats.coursesList.engagementBreakdown')}
          theme={theme}
        >
          <BreakdownRow
            icon={FileText}
            label={t('users.modals.stats.coursesList.notes')}
            value={notesCount}
            helper={t('users.modals.stats.coursesList.notesCreated')}
            color={theme.chartColors[0] || theme.accentColor}
            theme={theme}
          />
          <BreakdownRow
            bordered
            icon={Zap}
            label={t('users.modals.stats.coursesList.activities')}
            value={`${activitiesCompleted}/${activitiesTotal}`}
            helper={t('users.modals.stats.coursesList.completedOfTotal', {
              completed: activitiesCompleted,
              total: activitiesTotal,
            })}
            color={theme.chartColors[1] || theme.warningColor}
            theme={theme}
          />
          <BreakdownRow
            bordered
            icon={HelpCircle}
            label={t('users.modals.stats.coursesList.quizzes')}
            value={`${quizPassed}/${quizTotal}`}
            helper={
              quizTotal > 0
                ? t('users.modals.stats.coursesList.avgScore', {
                    score: course.quiz_average_score || 0,
                  })
                : undefined
            }
            color={theme.chartColors[2] || theme.primaryColor}
            theme={theme}
          />
          <BreakdownRow
            bordered
            icon={MessageSquare}
            label={t('users.modals.stats.coursesList.sofliaInteractions')}
            value={liaConversations}
            helper={t('users.modals.stats.coursesList.messagesCount', {
              count: liaMessages,
            })}
            color={theme.chartColors[3] || theme.accentColor}
            theme={theme}
          />
        </MetricSection>
      </div>
    </motion.article>
  )
}
