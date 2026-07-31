'use client'

import { motion } from 'framer-motion'
import type { CSSProperties } from 'react'
import type { LucideIcon } from 'lucide-react'
import { useMotionSafe } from '@/lib/utils/motion'
import styles from './ContentPanel.module.css'

export interface CourseStatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: string
  delay: number
}

type MetricStyle = CSSProperties & { '--metric-accent': string }

export function CourseStatCard({ title, value, icon: Icon, color, delay }: CourseStatCardProps) {
  const { disableHeavy, interfaceStaggerSeconds, interfaceTransition } = useMotionSafe()
  const entranceDelay = disableHeavy ? 0 : Math.min(delay * interfaceStaggerSeconds, 0.08)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...interfaceTransition, delay: entranceDelay }}
      className={styles.statItem}
      style={{ '--metric-accent': color } as MetricStyle}
    >
      <span className={styles.statIcon} aria-hidden="true">
        <Icon />
      </span>
      <div className={styles.statCopy}>
        <p className={styles.statLabel}>{title}</p>
        <strong className={styles.statValue}>{value}</strong>
      </div>
    </motion.div>
  )
}
