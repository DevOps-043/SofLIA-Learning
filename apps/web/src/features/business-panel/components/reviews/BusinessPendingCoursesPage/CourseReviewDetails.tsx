import { AlertTriangle, CheckCircle2, Eye, Trash2, UserCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/utils/date-formatter'
import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'
import { ActionButton } from './ActionButton'
import { InfoPill } from './InfoPill'
import type { ReviewCourseCardProps } from './types'

export function CourseReviewDetails({
  activeTab,
  basePath,
  course,
  labels,
  language,
  onApprove,
  onDelete,
  onReject,
}: Omit<ReviewCourseCardProps, 'index'>) {
  const router = useRouter()
  const panelTheme = useBusinessPanelTheme()
  const formattedDate = formatDate(course.created_at, language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="p-5 space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold leading-tight line-clamp-2" style={{ color: panelTheme.textColor }}>
          {course.title}
        </h2>
        <div className="flex items-center gap-2 text-sm" style={{ color: panelTheme.subtextColor }}>
          <UserCircle2 className="w-4 h-4" />
          <span className="line-clamp-1">{course.instructor_name || labels.instructorFallback}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InfoPill label={labels.dateLabel} value={formattedDate} />
        <InfoPill label={labels.levelLabel} value={course.level || labels.notAvailable} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ActionButton
          label={labels.approveAction}
          icon={<CheckCircle2 className="w-4 h-4" />}
          onClick={() => onApprove(course.id)}
          backgroundColor={panelTheme.actionColor}
          color={panelTheme.onActionColor}
          borderColor={`${panelTheme.actionColor}22`}
        />
        <ActionButton
          label={labels.viewAction}
          icon={<Eye className="w-4 h-4" />}
          onClick={() => router.push(`${basePath}/${course.id}`)}
          backgroundColor={panelTheme.inputBg}
          color={panelTheme.textColor}
          borderColor={panelTheme.borderColor}
        />
      </div>

      <ActionButton
        label={labels.dangerAction}
        icon={activeTab === 'pending' ? <AlertTriangle className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
        onClick={() => (activeTab === 'pending' ? onReject(course.id) : onDelete(course.id))}
        backgroundColor={`${panelTheme.dangerColor}12`}
        color={panelTheme.dangerColor}
        borderColor={`${panelTheme.dangerColor}24`}
      />
    </div>
  )
}
