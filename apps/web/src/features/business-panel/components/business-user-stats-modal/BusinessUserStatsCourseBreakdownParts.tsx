'use client'

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { BusinessUserStatsCourseData } from '../../types/business-user-stats.types'
import type { BusinessUserStatsTheme, BusinessUserStatsTranslate } from './types'

export function MetricSection({
  icon: Icon,
  title,
  theme,
  children,
}: {
  icon: LucideIcon
  title: string
  theme: BusinessUserStatsTheme
  children: ReactNode
}) {
  return (
    <section>
      <h5
        className="mb-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em]"
        style={{ color: theme.mutedTextColor }}
      >
        <Icon className="h-4 w-4" style={{ color: theme.primaryColor }} />
        {title}
      </h5>
      <div>{children}</div>
    </section>
  )
}

export function BreakdownRow({
  icon: Icon,
  label,
  value,
  helper,
  color,
  theme,
  bordered = false,
}: {
  icon: LucideIcon
  label: string
  value: number | string
  helper?: string
  color: string
  theme: BusinessUserStatsTheme
  bordered?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-4 py-4 ${bordered ? 'border-t' : ''}`}
      style={bordered ? { borderTopColor: theme.modalBorder } : undefined}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 9.4%, transparent)` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="text-[10px] font-black uppercase tracking-widest"
          style={{ color: theme.mutedTextColor }}
        >
          {label}
        </div>
        {helper ? (
          <div
            className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-widest"
            style={{ color: `color-mix(in srgb, ${theme.textColor} 40%, transparent)` }}
          >
            {helper}
          </div>
        ) : null}
      </div>
      <div className="text-2xl font-black tracking-tight" style={{ color: theme.textColor }}>
        {value}
      </div>
    </div>
  )
}

export function StatusPill({
  icon: Icon,
  label,
  color,
}: {
  icon: LucideIcon
  label: string
  color: string
}) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 7.1%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} 14.9%, transparent)`,
        color,
      }}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

export function MetaItem({
  icon: Icon,
  label,
  value,
  theme,
}: {
  icon: LucideIcon
  label: string
  value: string
  theme: BusinessUserStatsTheme
}) {
  return (
    <span className="inline-flex items-center gap-2" style={{ color: theme.mutedTextColor }}>
      <Icon className="h-3.5 w-3.5" style={{ color: theme.primaryColor }} />
      <span>{label}</span>
      <span style={{ color: theme.textColor }}>{value}</span>
    </span>
  )
}

export function getProgressColor(
  course: Pick<BusinessUserStatsCourseData, 'status' | 'progress'>,
  theme: BusinessUserStatsTheme,
) {
  if (course.status === 'completed' || course.progress >= 100) return theme.successColor
  if (course.progress > 50) return theme.primaryColor
  if (course.progress > 0) return theme.warningColor
  return theme.mutedTextColor
}

export function getStatusLabel(
  course: Pick<BusinessUserStatsCourseData, 'status' | 'progress'>,
  t: BusinessUserStatsTranslate,
) {
  if (course.status === 'completed' || course.progress >= 100) {
    return t('users.modals.stats.coursesList.completed')
  }
  if (course.progress > 0) return t('users.modals.stats.coursesList.inProgress')
  return t('users.modals.stats.coursesList.notStarted')
}

export function clampProgress(progress: number) {
  return Math.min(Math.max(Number(progress) || 0, 0), 100)
}

export function formatPercent(progress: number) {
  return `${Math.round(progress * 10) / 10}%`
}

export function formatCourseTime(minutes: number, t: BusinessUserStatsTranslate) {
  if (minutes < 60) {
    return `${Math.round(minutes)}${t('users.modals.stats.coursesList.minutesShort')}`
  }

  return `${Math.round((minutes / 60) * 10) / 10}${t('users.modals.stats.coursesList.hoursShort')}`
}
