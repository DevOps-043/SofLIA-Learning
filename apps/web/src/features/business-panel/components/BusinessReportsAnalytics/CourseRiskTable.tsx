import type { ReportsAnalyticsCourseRow } from '../../types/reports-analytics.types'
import type { ReportsAnalyticsT, ThemeTokens } from './types'

const courseRiskColumns = ['course', 'assigned', 'active', 'completed', 'progress', 'overdue', 'soflia']

export function CourseRiskTable({
  courses,
  theme,
  t,
}: {
  courses: ReportsAnalyticsCourseRow[]
  theme: ThemeTokens
  t: ReportsAnalyticsT
}) {
  return (
    <section className="rounded-lg border" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="border-b p-4" style={{ borderColor: theme.borderColor }}>
        <h2 className="text-lg font-semibold" style={{ color: theme.textColor }}>{t('reportsAnalytics.sections.courseRisk')}</h2>
        <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>{t('reportsAnalytics.sections.courseRiskSubtitle')}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead style={{ color: theme.mutedTextColor }}>
            <tr>
              {courseRiskColumns.map((key) => (
                <th key={key} className="px-4 py-3 font-semibold uppercase tracking-[0.1em]">{t(`reportsAnalytics.table.${key}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.slice(0, 12).map((course) => <CourseRiskRow key={course.courseId} course={course} theme={theme} />)}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function CourseRiskRow({ course, theme }: { course: ReportsAnalyticsCourseRow; theme: ThemeTokens }) {
  return (
    <tr className="border-t" style={{ borderColor: theme.borderColor }}>
      <td className="px-4 py-3 font-medium" style={{ color: theme.textColor }}>{course.courseTitle}</td>
      <td className="px-4 py-3" style={{ color: theme.subtextColor }}>{course.assignedUsers}</td>
      <td className="px-4 py-3" style={{ color: theme.subtextColor }}>{course.activeLearners}</td>
      <td className="px-4 py-3" style={{ color: theme.subtextColor }}>{course.completedUsers}</td>
      <td className="px-4 py-3" style={{ color: theme.subtextColor }}>{course.averageProgress}%</td>
      <td className="px-4 py-3" style={{ color: course.overdueAssignments > 0 ? theme.dangerColor : theme.subtextColor }}>{course.overdueAssignments}</td>
      <td className="px-4 py-3" style={{ color: theme.subtextColor }}>{course.sofliaConversations}</td>
    </tr>
  )
}
