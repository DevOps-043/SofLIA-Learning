'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { NodeDashboardCommonProps } from './node-dashboard.types'
import { getHierarchyTypeLabel } from '../hierarchy-labels'
import styles from '../HierarchyExperience.module.css'

export function NodeChildrenCard({ state, t }: NodeDashboardCommonProps) {
  const children = state.data?.children || []
  return (
    <article className={styles.dashboardCard}>
      <div className={styles.dashboardCardBody}>
        <header className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>{t('hierarchy.dashboard.substructures.title')}</h2>
          <span className={styles.statusBadge}>{children.length}</span>
        </header>
        {children.length === 0 ? (
          <p className={styles.stateDescription}>{t('hierarchy.dashboard.substructures.empty')}</p>
        ) : (
          <div className={styles.childrenList}>
            {children.map(child => (
              <Link key={child.id} href={`/${state.orgSlug}/business-panel/hierarchy/node/${child.id}`} className={styles.childLink}>
                <span>
                  <strong>{child.name}</strong>
                  <small>{getHierarchyTypeLabel(child.type, t)}</small>
                </span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
