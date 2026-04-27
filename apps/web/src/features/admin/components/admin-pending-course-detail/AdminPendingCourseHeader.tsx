'use client'

import { ClockIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { AdminStatusBadge, AdminSurface } from '../ui'
import { useAdminTheme } from '../../hooks/useAdminTheme'
import { formatCourseDurationHours } from './utils'
import type { PendingCourseDetail } from './types'

interface AdminPendingCourseHeaderProps {
  course: PendingCourseDetail
}

export function AdminPendingCourseHeader({ course }: AdminPendingCourseHeaderProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()

  return (
    <AdminSurface className="mb-6 p-6">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl md:w-1/3" style={{ backgroundColor: theme.surfaceSubtle }}>
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover" />
          ) : null}
          <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
            <AdminStatusBadge tone={course.approval_status === 'rejected' ? 'danger' : 'warning'} className="uppercase tracking-widest">
              {course.approval_status === 'rejected' ? t('pendingCourses.statusRejected') : t('pendingCourses.statusPending')}
            </AdminStatusBadge>
            <AdminStatusBadge tone={course.is_update ? 'primary' : 'info'} className="uppercase tracking-widest">
              {course.is_update ? t('pendingCourses.statusUpdate') : t('pendingCourses.statusNew')}
            </AdminStatusBadge>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="mb-2 text-2xl font-bold" style={{ color: theme.text }}>{course.title}</h1>
          <p className="mb-4 text-sm leading-6" style={{ color: theme.textMuted }}>{course.description}</p>

          <div className="flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-1 rounded-full px-3 py-1" style={{ backgroundColor: theme.surfaceSubtle, color: theme.textMuted }}>
              <ClockIcon className="h-4 w-4" />
              {t('pendingCourseDetail.durationHours', { hours: formatCourseDurationHours(course.duration_total_minutes) })}
            </span>
            <span className="rounded-full px-3 py-1 capitalize" style={{ backgroundColor: theme.surfaceSubtle, color: theme.textMuted }}>
              {t('pendingCourseDetail.levelLabel', { level: course.level })}
            </span>
            <span className="rounded-full px-3 py-1 capitalize" style={{ backgroundColor: theme.surfaceSubtle, color: theme.textMuted }}>
              {t('pendingCourseDetail.categoryLabel', { category: course.category })}
            </span>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t pt-4" style={{ borderColor: theme.divider }}>
            {course.instructor?.profile_picture_url ? (
              <img src={course.instructor.profile_picture_url} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold" style={{ backgroundColor: theme.action, color: theme.onAction }}>
                I
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" style={{ color: theme.text }}>
                {course.instructor?.display_name || t('pendingCourseDetail.instructorFallback')}
              </p>
              <p className="truncate text-xs" style={{ color: theme.textMuted }}>
                {course.instructor?.first_name} {course.instructor?.last_name}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminSurface>
  )
}
