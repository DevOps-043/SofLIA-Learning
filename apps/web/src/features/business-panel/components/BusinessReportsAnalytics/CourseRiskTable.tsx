import { AlertTriangle } from 'lucide-react'
import type { ReportsAnalyticsCourseRow } from '../../types/reports-analytics.types'
import { deriveCourseRiskList, type CourseRiskLevel, type CourseWithRisk } from './derive-course-risk'
import type { ReportsAnalyticsT, ThemeTokens } from './types'

const RISK_BADGE: Record<CourseRiskLevel, { bg: string; text: string }> = {
  high: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  medium: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  low: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
}

function RiskBadge({ level, t }: { level: CourseRiskLevel; t: ReportsAnalyticsT }) {
  const s = RISK_BADGE[level]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
      {level === 'high' && <AlertTriangle className="h-3 w-3" />}
      {t('reportsAnalytics.risk.' + level)}
    </span>
  )
}

function ProgressCell({ value, theme }: { value: number; theme: ThemeTokens }) {
  const color = value === 0 ? '#ef4444' : value < 25 ? '#f59e0b' : value < 70 ? theme.accentColor : theme.successColor
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full" style={{ backgroundColor: theme.hoverBg }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-medium tabular-nums" style={{ color: theme.subtextColor }}>{value}%</span>
    </div>
  )
}

function CourseRow({ course, theme, t }: { course: CourseWithRisk; theme: ThemeTokens; t: ReportsAnalyticsT }) {
  return (
    <tr style={{ borderTop: `1px solid ${theme.dividerColor}` }}>
      <td className="max-w-[200px] truncate px-4 py-3 font-medium" style={{ color: theme.textColor }} title={course.courseTitle}>
        {course.courseTitle}
      </td>
      <td className="px-4 py-3 text-center text-sm tabular-nums" style={{ color: theme.subtextColor }}>
        {course.assignedUsers}
      </td>
      <td className="px-4 py-3 text-center text-sm tabular-nums" style={{ color: theme.subtextColor }}>
        {course.activeLearners}
      </td>
      <td className="px-4 py-3">
        <ProgressCell value={Math.round(course.averageProgress)} theme={theme} />
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-sm tabular-nums font-medium" style={{ color: course.completionRate >= 70 ? theme.successColor : theme.subtextColor }}>
          {course.completionRate}%
        </span>
      </td>
      <td className="px-4 py-3 text-center text-sm tabular-nums font-semibold" style={{ color: course.overdueAssignments > 0 ? '#ef4444' : theme.subtextColor }}>
        {course.overdueAssignments}
      </td>
      <td className="px-4 py-3">
        <RiskBadge level={course.riskLevel} t={t} />
      </td>
    </tr>
  )
}

export function CourseRiskTable({
  courses,
  theme,
  t,
}: {
  courses: ReportsAnalyticsCourseRow[]
  theme: ThemeTokens
  t: ReportsAnalyticsT
}) {
  const rankedCourses = deriveCourseRiskList(courses)
  const col = 'text-xs font-medium uppercase tracking-wide px-4 py-3'

  return (
    <section className="overflow-hidden rounded-lg border" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="border-b p-4" style={{ borderColor: theme.borderColor }}>
        <h2 className="text-base font-semibold sm:text-lg" style={{ color: theme.textColor }}>
          {t('reportsAnalytics.sections.courseRisk')}
        </h2>
        <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>
          {t('reportsAnalytics.sections.courseRiskSubtitle')}
        </p>
      </div>

      {rankedCourses.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm" style={{ color: theme.mutedTextColor }}>
            {t('reportsAnalytics.emptyStates.noAtRiskCourses')}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead style={{ backgroundColor: theme.hoverBg }}>
              <tr>
                <th className={`${col} text-left`} style={{ color: theme.mutedTextColor }}>{t('reportsAnalytics.table.course')}</th>
                <th className={`${col} text-center`} style={{ color: theme.mutedTextColor }}>{t('reportsAnalytics.table.assigned')}</th>
                <th className={`${col} text-center`} style={{ color: theme.mutedTextColor }}>{t('reportsAnalytics.table.active')}</th>
                <th className={`${col} text-left`} style={{ color: theme.mutedTextColor }}>{t('reportsAnalytics.overview.averageProgress')}</th>
                <th className={`${col} text-center`} style={{ color: theme.mutedTextColor }}>{t('reportsAnalytics.table.completion')}</th>
                <th className={`${col} text-center`} style={{ color: theme.mutedTextColor }}>{t('reportsAnalytics.table.overdue') || t('reportsAnalytics.overview.overdueAssignments')}</th>
                <th className={`${col} text-left`} style={{ color: theme.mutedTextColor }}>{t('reportsAnalytics.table.risk')}</th>
              </tr>
            </thead>
            <tbody>
              {rankedCourses.slice(0, 12).map((course) => (
                <CourseRow key={course.courseId} course={course} theme={theme} t={t} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
