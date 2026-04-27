'use client'

import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useSWR from 'swr'
import {
  Award,
  BookOpen,
  Building,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  FileQuestion,
  GraduationCap,
  Lock,
  PlayCircle,
  UserCheck,
  Video,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../../hooks/useAdminTheme'
import { AdminButton, AdminModalShell, AdminStatusBadge, AdminSurface } from '../ui'
import type { UserCourseProgress, UserDetail, UserLessonDetail, UserProgressResponse } from './types'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

interface UserProgressModalProps {
  user: UserDetail
  isOpen: boolean
  onClose: () => void
}

const LESSON_STATUS_ICON: Record<UserLessonDetail['status'], LucideIcon> = {
  completed: CheckCircle,
  in_progress: PlayCircle,
  locked: Lock,
  not_started: Circle,
}

export function UserProgressModal({ user, isOpen, onClose }: UserProgressModalProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const { data, isLoading } = useSWR<UserProgressResponse>(
    isOpen ? `/api/admin/user-stats/users/${user.id}/progress` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 },
  )

  const formatDate = (date: string | null) => {
    if (!date) {
      return t('userStatsPage.progressModal.dateUnavailable')
    }

    return new Date(date).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const coursesCount = data?.courses?.length ?? 0

  return (
    <AdminModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={t('userStatsPage.progressModal.title')}
      description={t('userStatsPage.progressModal.courseCount', { count: coursesCount })}
      icon={GraduationCap}
      className="max-w-6xl"
      footer={
        <div className="flex justify-end">
          <AdminButton variant="secondary" onClick={onClose}>
            {t('userStatsPage.progressModal.close')}
          </AdminButton>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <AdminSurface className="p-5" style={{ backgroundColor: theme.surfaceSubtle, boxShadow: 'none' }}>
          <div className="mb-6 flex flex-col items-center text-center">
            {user.profilePictureUrl ? (
              <img
                src={user.profilePictureUrl}
                alt=""
                className="mb-3 h-20 w-20 rounded-full object-cover"
                style={{ boxShadow: `0 0 0 2px ${theme.actionSurface}` }}
              />
            ) : (
              <div
                className="mb-3 flex h-20 w-20 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.actionSurface, color: theme.action }}
              >
                <UserCheck className="h-8 w-8" />
              </div>
            )}
            <h3 className="text-lg font-bold" style={{ color: theme.text }}>
              {user.displayName || user.username}
            </h3>
            <p className="text-sm" style={{ color: theme.textMuted }}>
              {user.email}
            </p>
          </div>

          {user.organization ? (
            <AdminSurface className="mb-4 p-3" style={{ boxShadow: 'none' }}>
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4" style={{ color: theme.textMuted }} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: theme.text }}>
                    {user.organization}
                  </p>
                  {user.orgRole ? (
                    <p className="text-xs" style={{ color: theme.textMuted }}>
                      {user.orgRole}
                    </p>
                  ) : null}
                </div>
              </div>
            </AdminSurface>
          ) : null}

          <div className="space-y-3">
            <SidebarStat icon={BookOpen} label={t('userStatsPage.progressModal.stats.coursesEnrolled')} value={String(user.coursesEnrolled)} />
            <SidebarStat icon={GraduationCap} label={t('userStatsPage.progressModal.stats.avgProgress')} value={`${user.avgProgress}%`} />
            <SidebarStat icon={Clock} label={t('userStatsPage.progressModal.stats.studyHours')} value={`${user.studyHours}h`} />
            <SidebarStat icon={Award} label={t('userStatsPage.progressModal.stats.certificates')} value={String(user.certificates)} />
            <SidebarStat icon={Calendar} label={t('userStatsPage.progressModal.stats.lastLogin')} value={formatDate(user.lastLogin)} />
          </div>
        </AdminSurface>

        <div className="min-w-0 space-y-4">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: theme.action, borderTopColor: 'transparent' }}
              />
            </div>
          ) : data?.courses && data.courses.length > 0 ? (
            data.courses.map((course) => (
              <CourseCard key={course.enrollmentId} course={course} formatDate={formatDate} />
            ))
          ) : (
            <AdminSurface className="flex h-48 flex-col items-center justify-center p-6 text-center" style={{ boxShadow: 'none' }}>
              <BookOpen className="mb-3 h-10 w-10" style={{ color: theme.textMuted }} />
              <p className="text-sm" style={{ color: theme.textMuted }}>
                {t('userStatsPage.progressModal.emptyCourses')}
              </p>
            </AdminSurface>
          )}
        </div>
      </div>
    </AdminModalShell>
  )
}

function SidebarStat({ icon: Icon, label, value }: { icon: LucideIcon; label: ReactNode; value: string }) {
  const theme = useAdminTheme()

  return (
    <AdminSurface className="p-3" style={{ boxShadow: 'none' }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0" style={{ color: theme.textMuted }} />
          <span className="truncate text-sm" style={{ color: theme.textMuted }}>
            {label}
          </span>
        </div>
        <span className="text-sm font-bold" style={{ color: theme.text }}>
          {value}
        </span>
      </div>
    </AdminSurface>
  )
}

function getEnrollmentTone(status: string) {
  if (status === 'completed') return 'success' as const
  if (status === 'paused') return 'warning' as const
  if (status === 'cancelled') return 'danger' as const
  return 'info' as const
}

function CourseCard({
  course,
  formatDate,
}: {
  course: UserCourseProgress
  formatDate: (date: string | null) => string
}) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const [expanded, setExpanded] = useState(false)
  const studyHours = Math.round((course.totalStudyMinutes / 60) * 10) / 10
  const completedLessons = course.lessons.filter((lesson) => lesson.status === 'completed').length
  const statusLabel = t(`userStatsPage.progressModal.status.${course.enrollmentStatus}`, {
    defaultValue: t('userStatsPage.progressModal.status.active'),
  })
  const levelLabel = t(`userStatsPage.progressModal.level.${course.courseLevel}`, {
    defaultValue: course.courseLevel,
  })

  return (
    <AdminSurface className="overflow-hidden" style={{ boxShadow: 'none' }}>
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="w-full p-4 text-left transition hover:opacity-90"
      >
        <div className="flex items-start gap-4">
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt="" className="h-12 w-16 shrink-0 rounded-xl object-cover" />
          ) : (
            <div
              className="flex h-12 w-16 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: theme.surfaceSubtle, color: theme.textMuted }}
            >
              <BookOpen className="h-5 w-5" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h4 className="truncate text-sm font-bold" style={{ color: theme.text }}>
                {course.courseTitle}
              </h4>
              <AdminStatusBadge tone={getEnrollmentTone(course.enrollmentStatus)}>
                {statusLabel}
              </AdminStatusBadge>
              <span className="text-xs" style={{ color: theme.textMuted }}>
                {levelLabel}
              </span>
            </div>

            <div className="mb-2 flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: theme.surfaceSubtle }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(course.overallProgress, 100)}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-2 rounded-full"
                  style={{ backgroundColor: theme.action }}
                />
              </div>
              <span className="w-10 text-right text-xs font-bold" style={{ color: theme.text }}>
                {course.overallProgress}%
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: theme.textMuted }}>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {t('userStatsPage.progressModal.course.enrolled', { date: formatDate(course.enrolledAt) })}
              </span>
              {course.completedAt ? (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" style={{ color: theme.success }} />
                  {t('userStatsPage.progressModal.course.completed', { date: formatDate(course.completedAt) })}
                </span>
              ) : null}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t('userStatsPage.progressModal.course.studyHours', { hours: studyHours })}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {t('userStatsPage.progressModal.course.lessons', {
                  completed: completedLessons,
                  total: course.lessons.length,
                })}
              </span>
              {course.hasCertificate ? (
                <span className="flex items-center gap-1" style={{ color: theme.warning }}>
                  <Award className="h-3 w-3" />
                  {t('userStatsPage.progressModal.course.certificate', {
                    date: formatDate(course.certificateIssuedAt),
                  })}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-1 shrink-0" style={{ color: theme.textMuted }}>
            {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && course.lessons.length > 0 ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 border-t px-4 py-3" style={{ borderColor: theme.divider }}>
              {course.lessons.map((lesson, index) => (
                <LessonRow key={lesson.lessonId} lesson={lesson} index={index + 1} />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {expanded && course.lessons.length === 0 ? (
        <div className="border-t px-4 py-4 text-center text-sm" style={{ borderColor: theme.divider, color: theme.textMuted }}>
          {t('userStatsPage.progressModal.course.emptyLessons')}
        </div>
      ) : null}
    </AdminSurface>
  )
}

function getLessonColor(theme: ReturnType<typeof useAdminTheme>, status: UserLessonDetail['status']) {
  if (status === 'completed') return theme.success
  if (status === 'in_progress') return theme.action
  if (status === 'locked') return theme.textSubtle
  return theme.textMuted
}

function LessonRow({ lesson, index }: { lesson: UserLessonDetail; index: number }) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const StatusIcon = LESSON_STATUS_ICON[lesson.status] || Circle

  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:opacity-85">
      <StatusIcon className="h-4 w-4 shrink-0" style={{ color: getLessonColor(theme, lesson.status) }} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm" style={{ color: theme.text }}>
          <span className="mr-1" style={{ color: theme.textMuted }}>
            {index}.
          </span>
          {lesson.lessonTitle}
        </p>
      </div>

      <div className="flex w-20 items-center gap-1 text-xs" style={{ color: theme.textMuted }}>
        <Video className="h-3 w-3" />
        <span>{lesson.videoProgress}%</span>
      </div>

      <div className="flex w-20 items-center gap-1 text-xs">
        <FileQuestion className="h-3 w-3" style={{ color: lesson.quizCompleted ? theme.action : theme.textMuted }} />
        {lesson.quizCompleted ? (
          <span style={{ color: lesson.quizPassed ? theme.success : theme.danger }}>
            {lesson.quizPassed ? t('userStatsPage.progressModal.lesson.quizPassed') : t('userStatsPage.progressModal.lesson.quizFailed')}
          </span>
        ) : (
          <span style={{ color: theme.textMuted }}>{t('userStatsPage.progressModal.lesson.quizPending')}</span>
        )}
      </div>

      <div className="w-14 text-right text-xs" style={{ color: theme.textMuted }}>
        {lesson.timeSpentMinutes > 0
          ? t('userStatsPage.progressModal.lesson.minutes', { minutes: lesson.timeSpentMinutes })
          : t('userStatsPage.progressModal.dateUnavailable')}
      </div>
    </div>
  )
}
