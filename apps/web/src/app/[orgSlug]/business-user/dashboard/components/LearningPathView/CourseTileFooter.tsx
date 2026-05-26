import { Award } from 'lucide-react'
import type { AssignedCourse, BusinessUserDashboardColors } from '../../types'
import type { LearningPathTranslator } from './types'

interface CourseTileFooterProps {
  course: AssignedCourse
  isCompleted: boolean
  isLocked: boolean
  onCertificateClick?: () => void
  orgColors: BusinessUserDashboardColors
  statusLabel: string
  t: LearningPathTranslator
}

export function CourseTileFooter({
  course,
  isCompleted,
  isLocked,
  onCertificateClick,
  orgColors,
  statusLabel,
  t,
}: CourseTileFooterProps) {
  return (
    <div className="mt-2 flex min-h-6 items-center justify-between gap-2">
      <p
        className="truncate text-xs font-medium"
        style={{ color: isLocked ? orgColors.textMuted : orgColors.textSecondary }}
      >
        {statusLabel}
      </p>
      {course.has_certificate && isCompleted && onCertificateClick ? (
        <button
          data-tour-id="business-user-dashboard--certificate-action"
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onCertificateClick()
          }}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition hover:scale-105"
          style={{
            backgroundColor: `color-mix(in srgb, ${orgColors.iconColor} 9.4%, transparent)`,
            color: orgColors.iconColor,
          }}
          aria-label={t('dashboard.learningPaths.viewCertificate', 'Ver certificado')}
        >
          <Award className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  )
}
