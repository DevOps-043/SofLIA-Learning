'use client'

import { Award, Flag } from 'lucide-react'
import {
  COURSE_MANAGEMENT_CHART_COLORS,
  COURSE_MANAGEMENT_MUTED_TEXT_CLASS,
  COURSE_MANAGEMENT_PANEL_SURFACE_CLASS,
  COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS,
  COURSE_MANAGEMENT_ACCENT_ICON_CLASS,
} from '../courseManagementTheme'
import { getCourseManagementEnrollmentStatusLabel } from '../CourseManagementStudentDetails.service'

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('es-ES') : '--'
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
  const ss = selectedStudent as StudentActivityData

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className={`p-4 ${COURSE_MANAGEMENT_PANEL_SURFACE_CLASS}`}>
        <div className="mb-3 flex items-center gap-2">
          <Flag className={`h-4 w-4 ${COURSE_MANAGEMENT_ACCENT_ICON_CLASS}`} />
          <h4 className={`text-sm font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>Estado de Inscripcion</h4>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className={COURSE_MANAGEMENT_MUTED_TEXT_CLASS}>Estado:</span>
            <span className={`font-semibold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>
              {getCourseManagementEnrollmentStatusLabel(ss.enrollment_status)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={COURSE_MANAGEMENT_MUTED_TEXT_CLASS}>Inscrito:</span>
            <span className={`font-semibold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>
              {formatDate(ss.enrolled_at)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={COURSE_MANAGEMENT_MUTED_TEXT_CLASS}>Ultima Actividad:</span>
            <span className={`font-semibold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>
              {ss.last_accessed_at ? new Date(ss.last_accessed_at).toLocaleDateString('es-ES') : 'Nunca'}
            </span>
          </div>
        </div>
      </div>

      <div className={`p-4 ${COURSE_MANAGEMENT_PANEL_SURFACE_CLASS}`}>
        <div className="mb-3 flex items-center gap-2">
          <Award className="h-4 w-4" style={{ color: COURSE_MANAGEMENT_CHART_COLORS.warning }} />
          <h4 className={`text-sm font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>Logros y Certificados</h4>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className={COURSE_MANAGEMENT_MUTED_TEXT_CLASS}>Certificados:</span>
            <span className={`font-semibold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>0</span>
          </div>
          <div className="flex justify-between">
            <span className={COURSE_MANAGEMENT_MUTED_TEXT_CLASS}>Badges Obtenidos:</span>
            <span className={`font-semibold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>3</span>
          </div>
          <div className="flex justify-between">
            <span className={COURSE_MANAGEMENT_MUTED_TEXT_CLASS}>Ranking:</span>
            <span className={`font-semibold ${COURSE_MANAGEMENT_ACCENT_ICON_CLASS}`}>Top 15%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
