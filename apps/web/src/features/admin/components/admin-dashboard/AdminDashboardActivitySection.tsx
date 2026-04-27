'use client'

import { BellAlertIcon, ClockIcon, EyeIcon } from '@heroicons/react/24/outline'

import { AdminLinkButton, AdminSectionHeader, AdminStatusBadge, AdminSurface } from '../ui'
import { useAdminTheme } from '../../hooks/useAdminTheme'
import type {
  AdminDashboardActivityItem,
  AdminDashboardThemeColors,
} from './types'

function getActivityTone(type: AdminDashboardActivityItem['type']) {
  switch (type) {
    case 'user':
      return 'primary' as const
    case 'workshop':
      return 'success' as const
    case 'ai-app':
      return 'accent' as const
    case 'news':
      return 'warning' as const
    default:
      return 'neutral' as const
  }
}

function AdminDashboardActivityItemRow({
  activity,
}: {
  activity: AdminDashboardActivityItem
}) {
  const theme = useAdminTheme()

  return (
    <div className="flex items-start gap-4 px-4 py-3 transition-colors">
      <AdminStatusBadge tone={getActivityTone(activity.type)} className="mt-0.5 shrink-0">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'currentColor' }} />
      </AdminStatusBadge>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-4">
          <h4 className="truncate text-sm font-semibold" style={{ color: theme.text }}>
            {activity.title}
          </h4>
          <div className="flex items-center gap-1 whitespace-nowrap text-xs" style={{ color: theme.textMuted }}>
            <ClockIcon className="h-3.5 w-3.5" />
            {activity.timestamp}
          </div>
        </div>
        <p className="mt-1 line-clamp-1 text-xs" style={{ color: theme.textMuted }}>
          {activity.description}
        </p>
        <p className="mt-1 text-xs font-medium" style={{ color: theme.action }}>
          por {activity.user}
        </p>
      </div>
    </div>
  )
}

export function AdminDashboardActivitySection({
  activities,
  isLoading,
}: {
  activities: AdminDashboardActivityItem[]
  isLoading: boolean
  themeColors: AdminDashboardThemeColors
}) {
  const theme = useAdminTheme()

  return (
    <section>
      <AdminSectionHeader
        title="Actividad reciente"
        description="Ultimas acciones registradas en la plataforma."
        actions={
          <AdminLinkButton href="/admin/activity" variant="secondary" size="sm" icon={EyeIcon}>Ver todo</AdminLinkButton>
        }
      />

      <AdminSurface className="overflow-hidden">
        {isLoading ? (
          <div className="space-y-4 p-5">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex gap-4">
                <div className="mt-2 h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: theme.surfaceSubtle }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
                  <div className="h-3 w-1/2 animate-pulse rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center">
            <BellAlertIcon className="mx-auto mb-4 h-12 w-12" style={{ color: theme.textSubtle }} />
            <p style={{ color: theme.textMuted }}>No hay actividad reciente</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: theme.divider }}>
            {activities.map((activity) => (
              <AdminDashboardActivityItemRow key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </AdminSurface>
    </section>
  )
}
