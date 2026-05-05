'use client'
import { ClockIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

export interface ActivityItemProps {
  title: string
  description: string
  user: string
  timestamp: string
  type: string
  delay: number
}

export function ActivityItem({ title, description, user, timestamp, type }: ActivityItemProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  const getTypeColor = (activityType: string) => {
    switch (activityType) {
      case 'user': return theme.brandColor
      case 'course': return theme.successColor
      case 'certificate': return theme.accentColor
      case 'progress': return theme.warningColor
      default: return theme.mutedTextColor
    }
  }

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl transition-all duration-200" style={{ borderLeft: `2px solid transparent` }}>
      <div className="w-2 h-2 mt-2 rounded-full" style={{ backgroundColor: getTypeColor(type) }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-4">
          <h4 className="font-medium text-sm truncate" style={{ color: theme.textColor }}>{title}</h4>
          <div className="flex items-center gap-1 text-xs whitespace-nowrap" style={{ color: theme.subtextColor }}>
            <ClockIcon className="h-3.5 w-3.5" />
            {timestamp}
          </div>
        </div>
        <p className="text-xs mt-1 line-clamp-1" style={{ color: theme.subtextColor }}>{description}</p>
        <p className="text-xs mt-1 font-medium" style={{ color: theme.accentColor }}>
          {t('dashboard.recentActivity.by')} {user}
        </p>
      </div>
    </div>
  )
}
