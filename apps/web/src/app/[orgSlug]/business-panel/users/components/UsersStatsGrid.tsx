'use client'

import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { BadgeCheck, Mail, ShieldCheck, UserRoundPlus, UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { BusinessUsersPageLogic, BusinessUsersTheme } from './users-page.types'
import styles from './UsersPanel.module.css'

interface UsersStatsGridProps {
  logic: BusinessUsersPageLogic
  theme: BusinessUsersTheme
}

export function UsersStatsGrid({ logic, theme }: UsersStatsGridProps) {
  const { t } = useTranslation('business')
  const metrics: Array<{
    color: string
    icon: ReactNode
    label: string
    onClick?: () => void
    value: number
  }> = [
    {
      label: t('users.stats.total'),
      value: logic.stats.total,
      icon: <UsersRound aria-hidden="true" />,
      color: theme.brandColor,
    },
    {
      label: t('users.stats.active'),
      value: logic.stats.active,
      icon: <BadgeCheck aria-hidden="true" />,
      color: theme.successColor,
    },
    {
      label: t('users.stats.invited'),
      value: logic.stats.invited,
      icon: <Mail aria-hidden="true" />,
      color: theme.warningColor,
      onClick: () => logic.setActiveTab('invitations'),
    },
    {
      label: t('users.stats.admins'),
      value: logic.stats.admins,
      icon: <ShieldCheck aria-hidden="true" />,
      color: theme.secondaryColor,
    },
    {
      label: t('sidebar.joinRequests', 'Solicitudes'),
      value: logic.joinRequestsCount,
      icon: <UserRoundPlus aria-hidden="true" />,
      color: theme.actionColor,
      onClick: () => logic.setActiveTab('requests'),
    },
  ]

  return (
    <section id="tour-users-stats" className={styles.statsSurface} aria-label={t('users.stats.title', 'Resumen de usuarios')}>
      {metrics.map((metric, index) => {
        const metricStyle = { '--metric-accent': metric.color } as CSSProperties
        const content = (
          <>
            <span className={styles.statIcon}>{metric.icon}</span>
            <span className={styles.statCopy}>
              <span className={styles.statLabel}>{metric.label}</span>
              <strong className={styles.statValue}>{metric.value}</strong>
            </span>
          </>
        )

        if (metric.onClick) {
          return (
            <motion.button
              key={metric.label}
              type="button"
              className={styles.statItem}
              style={metricStyle}
              onClick={metric.onClick}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.035, duration: 0.24 }}
            >
              {content}
            </motion.button>
          )
        }

        return (
          <motion.article
            key={metric.label}
            className={styles.statItem}
            style={metricStyle}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.035, duration: 0.24 }}
          >
            {content}
          </motion.article>
        )
      })}
    </section>
  )
}
