'use client'

import { Award, Flag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  COURSE_MANAGEMENT_CHART_COLORS,
  COURSE_MANAGEMENT_MUTED_TEXT_CLASS,
  COURSE_MANAGEMENT_PANEL_SURFACE_CLASS,
  COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS,
  COURSE_MANAGEMENT_ACCENT_ICON_CLASS,
} from '../courseManagementTheme'

function formatDate(value: string | null | undefined, locale: string) {
  return value ? new Date(value).toLocaleDateString(locale) : '--'
}

interface StudentActivitySectionProps {
  selectedStudent: Record<string, unknown>
}

interface StudentActivityData {
  enrollment_status?: string
  enrolled_at?: string | null
  last_accessed_at?: string | null
}

export function StudentActivitySection({ selectedStudent }: StudentActivitySectionProps) {
  const { i18n, t } = useTranslation('admin')
  const ss = selectedStudent as StudentActivityData
  const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'pt' ? 'pt-BR' : 'es-ES'

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className={`p-4 ${COURSE_MANAGEMENT_PANEL_SURFACE_CLASS}`}>
        <div className="mb-3 flex items-center gap-2">
          <Flag className={`h-4 w-4 ${COURSE_MANAGEMENT_ACCENT_ICON_CLASS}`} />
          <h4 className={`text-sm font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>
            {t('workshops.editor.stats.studentDetails.activity.enrollmentStatusTitle')}
          </h4>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className={COURSE_MANAGEMENT_MUTED_TEXT_CLASS}>
              {t('workshops.editor.stats.studentDetails.activity.status')}
            </span>
            <span className={`font-semibold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>
              {t(`workshops.editor.stats.studentDetails.statuses.${ss.enrollment_status ?? 'unknown'}`)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={COURSE_MANAGEMENT_MUTED_TEXT_CLASS}>
              {t('workshops.editor.stats.studentDetails.activity.enrolledAt')}
            </span>
            <span className={`font-semibold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>
              {formatDate(ss.enrolled_at, locale)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={COURSE_MANAGEMENT_MUTED_TEXT_CLASS}>
              {t('workshops.editor.stats.studentDetails.activity.lastActivity')}
            </span>
            <span className={`font-semibold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>
              {ss.last_accessed_at
                ? new Date(ss.last_accessed_at).toLocaleDateString(locale)
                : t('workshops.editor.stats.studentDetails.activity.never')}
            </span>
          </div>
        </div>
      </div>

      <div className={`p-4 ${COURSE_MANAGEMENT_PANEL_SURFACE_CLASS}`}>
        <div className="mb-3 flex items-center gap-2">
          <Award className="h-4 w-4" style={{ color: COURSE_MANAGEMENT_CHART_COLORS.warning }} />
          <h4 className={`text-sm font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>
            {t('workshops.editor.stats.studentDetails.activity.achievementsTitle')}
          </h4>
        </div>
        <p className={`text-sm ${COURSE_MANAGEMENT_MUTED_TEXT_CLASS}`}>
          {t('workshops.editor.stats.studentDetails.activity.noAchievements')}
        </p>
      </div>
    </div>
  )
}
