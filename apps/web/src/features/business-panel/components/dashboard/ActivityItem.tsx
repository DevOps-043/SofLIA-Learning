'use client'

import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import styles from '../BusinessPanelDashboard.module.css'

export interface ActivityItemProps {
  title: string
  description: string
  user: string
  timestamp: string
  type: string
  delay: number
}

const activityIcons = {
  certificate: Award,
  course: BookOpen,
  progress: CheckCircle2,
  system: Sparkles,
  user: UserRound,
}

export function ActivityItem({
  title,
  description,
  user,
  timestamp,
  type,
}: ActivityItemProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const Icon = activityIcons[type as keyof typeof activityIcons] || Sparkles

  return (
    <article className={styles.activityItem}>
      <div
        className={styles.activityIcon}
        style={{ color: theme.actionColor }}
      >
        <Icon aria-hidden="true" />
      </div>
      <div className={styles.activityCopy}>
        <div className={styles.activityTitleRow}>
          <h3>{title}</h3>
          <span className={styles.activityTime}>
            <Clock3 aria-hidden="true" />
            {timestamp}
          </span>
        </div>
        <p>{description}</p>
        <span className={styles.activityUser}>
          {t('dashboard.recentActivity.by')} {user}
        </span>
      </div>
    </article>
  )
}
