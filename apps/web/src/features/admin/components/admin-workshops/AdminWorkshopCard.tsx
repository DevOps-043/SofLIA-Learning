'use client'

import {
  ClockIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import type { AdminWorkshop } from '../../services/adminWorkshops.service'
import {
  formatWorkshopDuration,
  getWorkshopInstructorInitials,
  getWorkshopLevelLabel,
} from './admin-workshops-display.service'
import { WorkshopThumbnail } from './WorkshopThumbnail'
import { AdminButton, AdminStatusBadge, AdminSurface } from '../ui'
import { useAdminTheme } from '../../hooks/useAdminTheme'

interface AdminWorkshopCardProps {
  workshop: AdminWorkshop
  index: number
  onView: (workshop: AdminWorkshop) => void
  onEdit: (workshop: AdminWorkshop) => void
  onDelete: (workshop: AdminWorkshop) => void
}

function getLevelTone(level?: string | null) {
  const normalized = level?.toLowerCase()
  if (normalized?.includes('advanced') || normalized?.includes('avanzado')) return 'danger' as const
  if (normalized?.includes('inter')) return 'warning' as const
  return 'accent' as const
}

export function AdminWorkshopCard({
  workshop,
  onView,
  onEdit,
  onDelete,
}: AdminWorkshopCardProps) {
  const { t } = useTranslation('common')
  const { t: ta } = useTranslation('admin')
  const theme = useAdminTheme()
  const instructorInitials = getWorkshopInstructorInitials(workshop.instructor_name)

  return (
    <AdminSurface className="flex h-full cursor-pointer flex-col overflow-hidden" interactive>
      <div className="relative h-48 shrink-0 overflow-hidden" style={{ backgroundColor: theme.surfaceSubtle }}>
        <WorkshopThumbnail
          thumbnailUrl={workshop.thumbnail_url}
          title={workshop.title}
        />
        <div className="absolute inset-x-3 top-3 flex justify-end">
          <AdminStatusBadge tone={workshop.is_active ? 'success' : 'neutral'}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'currentColor' }} />
            {workshop.is_active ? ta('workshopCard.statusActive') : ta('workshopCard.statusInactive')}
          </AdminStatusBadge>
        </div>
        <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-2">
          <AdminStatusBadge tone="primary">{workshop.category}</AdminStatusBadge>
          <AdminStatusBadge tone={getLevelTone(workshop.level)}>
            {getWorkshopLevelLabel(workshop.level)}
          </AdminStatusBadge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 min-h-[3rem] text-lg font-bold" style={{ color: theme.text }}>
          {workshop.title}
        </h3>

        <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm leading-6" style={{ color: theme.textMuted }}>
          {workshop.description}
        </p>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {workshop.instructor_profile_picture_url ? (
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border" style={{ borderColor: theme.border }}>
                <img
                  src={workshop.instructor_profile_picture_url}
                  alt={workshop.instructor_name || ta('workshopCard.instructorLabel')}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold" style={{ backgroundColor: theme.actionSurface, color: theme.action }}>
                {instructorInitials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wide" style={{ color: theme.textMuted }}>
                {ta('workshopCard.instructorLabel')}
              </p>
              <p className="truncate text-sm font-semibold" style={{ color: theme.text }}>
                {workshop.instructor_name || ta('workshopCard.noInstructor')}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2" style={{ backgroundColor: theme.surfaceSubtle }}>
            <ClockIcon className="h-4 w-4" style={{ color: theme.textMuted }} />
            <span className="text-sm font-semibold" style={{ color: theme.text }}>
              {formatWorkshopDuration(workshop.duration_total_minutes)}
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t pt-4" style={{ borderColor: theme.divider }}>
          <AdminStatusBadge tone="accent">
            {workshop.student_count || 0} {ta('workshopCard.studentsLabel')}
          </AdminStatusBadge>
          <div className="flex items-center gap-2">
            <AdminButton
              onClick={(event) => {
                event.stopPropagation()
                onView(workshop)
              }}
              size="icon"
              variant="secondary"
              icon={EyeIcon}
              title={t('actions.viewDetails')}
            />
            <AdminButton
              onClick={(event) => {
                event.stopPropagation()
                onEdit(workshop)
              }}
              size="icon"
              variant="secondary"
              icon={PencilIcon}
              title={t('actions.edit')}
            />
            <AdminButton
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onDelete(workshop)
              }}
              size="icon"
              variant="danger"
              icon={TrashIcon}
              title={t('actions.delete')}
            />
          </div>
        </div>
      </div>
    </AdminSurface>
  )
}
