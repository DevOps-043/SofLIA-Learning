'use client'
import { ClockIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

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

  const getTypeColor = (activityType: string) => {
    switch (activityType) {
      case 'user': return 'var(--org-primary-button-color, #0A2540)'
      case 'course': return 'var(--org-secondary-button-color, #10B981)'
      case 'certificate': return 'var(--org-accent-color, #00D4B3)'
      case 'progress': return '#F59E0B'
      default: return 'var(--org-border-color, #6C757D)'
    }
  }

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl transition-all duration-200 hover:bg-[rgba(var(--org-card-background-rgb),0.8)] border-l-2 border-transparent hover:border-[var(--org-accent-color)]">
      <div className="w-2 h-2 mt-2 rounded-full" style={{ backgroundColor: getTypeColor(type) }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-4">
          <h4 className="font-medium text-sm truncate" style={{ color: 'var(--org-text-color, #FFFFFF)' }}>{title}</h4>
          <div className="flex items-center gap-1 text-xs whitespace-nowrap" style={{ color: 'var(--org-text-color, #FFFFFF)', opacity: 0.6 }}>
            <ClockIcon className="h-3.5 w-3.5" />
            {timestamp}
          </div>
        </div>
        <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--org-text-color, #FFFFFF)', opacity: 0.7 }}>{description}</p>
        <p className="text-xs mt-1 font-medium" style={{ color: 'var(--org-accent-color, #00D4B3)' }}>
          {t('dashboard.recentActivity.by')} {user}
        </p>
      </div>
    </div>
  )
}
