'use client'

import type { ComponentType, CSSProperties } from 'react'
import { ArrowUpRight, ChartNoAxesCombined } from 'lucide-react'

import { PrefetchLink } from '@/core/components/PrefetchLink'
import { useMotionSafe } from '@/lib/utils/motion'

import styles from '../BusinessPanelDashboard.module.css'

interface StatCardTheme {
  actionColor?: string
  borderColor?: string
  cardBg?: string
  mutedText?: string
  text?: string
}

export interface StatCardProps {
  title: string
  value: string | number
  delay: number
  href?: string
  id?: string
  theme?: StatCardTheme
  icon?: ComponentType<{ className?: string; style?: CSSProperties }>
}

export function StatCard({
  title,
  value,
  delay,
  href,
  id,
  theme,
  icon: Icon = ChartNoAxesCombined,
}: StatCardProps) {
  const { disableHeavy, interfaceStaggerSeconds } = useMotionSafe()
  const entranceDelayMs = disableHeavy
    ? 0
    : Math.min(delay * interfaceStaggerSeconds, 0.08) * 1000

  const content = (
    <article
      id={id}
      className={`${styles.statCard} ${href ? styles.statCardInteractive : ''}`}
      style={{
        '--stat-accent': theme?.actionColor || 'var(--dashboard-action)',
        animationDelay: entranceDelayMs > 0 ? `${entranceDelayMs}ms` : undefined,
      } as CSSProperties}
    >
      <div className={styles.statIcon}>
        <Icon aria-hidden="true" />
      </div>
      <div className={styles.statCopy}>
        <p>{title}</p>
        <strong>{typeof value === 'number' ? value.toLocaleString() : value}</strong>
      </div>
      {href ? (
        <span className={styles.statArrow} aria-hidden="true">
          <ArrowUpRight />
        </span>
      ) : null}
      <span className={styles.statAccentLine} aria-hidden="true" />
    </article>
  )

  return href ? (
    <PrefetchLink href={href} className={styles.statLink} aria-label={`${title}: ${value}`}>
      {content}
    </PrefetchLink>
  ) : content
}
