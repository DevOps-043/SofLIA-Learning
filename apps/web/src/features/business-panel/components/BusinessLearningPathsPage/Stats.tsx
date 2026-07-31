import { motion } from 'framer-motion'
import type { CSSProperties } from 'react'
import { BookOpen, CheckCircle2, Route, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { BusinessLearningPathsLogic } from './types'
import styles from '@/app/[orgSlug]/business-panel/courses/ContentPanel.module.css'

type MetricStyle = CSSProperties & { '--metric-accent': string }

export function BusinessLearningPathStats({ logic }: { logic: BusinessLearningPathsLogic }) {
  const { t } = useTranslation('business')
  const { primaryColor, accentColor, successColor } = logic.theme
  const stats = [
    { icon: Route, label: t('learningPathsPage.stats.paths'), value: logic.learningPaths.length, color: primaryColor },
    { icon: BookOpen, label: t('learningPathsPage.stats.workshops'), value: logic.totalWorkshops, color: accentColor },
    { icon: Users, label: t('learningPathsPage.stats.assignedUsers'), value: logic.totalAssignedUsers, color: primaryColor },
    { icon: CheckCircle2, label: t('learningPathsPage.stats.activeAssignments'), value: logic.assignments.length, color: successColor },
  ]

  return (
    <div id="tour-paths-stats" className={styles.statsSurface}>
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className={styles.statItem}
            style={{ '--metric-accent': stat.color } as MetricStyle}
          >
            <span className={styles.statIcon} aria-hidden="true">
              <Icon />
            </span>
            <div className={styles.statCopy}>
              <p className={styles.statLabel}>{stat.label}</p>
              <strong className={styles.statValue}>{stat.value}</strong>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
