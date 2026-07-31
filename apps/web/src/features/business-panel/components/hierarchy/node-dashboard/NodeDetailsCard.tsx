'use client'

import Link from 'next/link'
import { Edit2, MapPin } from 'lucide-react'
import type { NodeDashboardCommonProps } from './node-dashboard.types'
import styles from '../HierarchyExperience.module.css'

export function NodeDetailsCard({ state, t }: NodeDashboardCommonProps) {
  const data = state.data
  if (!data) return null
  const node = data.node
  const isActive = node.is_active !== false
  const path = data.path ?? []
  const location = node.properties?.address || node.properties?.city || node.properties?.state || node.properties?.country || t('hierarchy.dashboard.details.notSpecified')
  return (
    <article className={styles.dashboardCard}>
      <div className={styles.dashboardCardBody}>
        <header className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>{t('hierarchy.dashboard.details.title')}</h2>
          <button type="button" onClick={() => state.setShowEditModal(true)} className={styles.iconButton} aria-label={t('hierarchy.dashboard.manager.change')}>
            <Edit2 aria-hidden="true" />
          </button>
        </header>
        <div className={styles.detailsList}>
          <Detail label={t('hierarchy.dashboard.details.name')} value={node.name} />
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>{t('hierarchy.dashboard.details.type')}</span>
            <span className={styles.detailValue}>
              {t(`hierarchy.types.${node.type}`)}{' '}
              <span className={`${styles.statusBadge} ${isActive ? styles.statusActive : ''}`}>
                {isActive ? t('hierarchy.dashboard.details.status.active') : t('hierarchy.dashboard.details.status.inactive')}
              </span>
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>{t('hierarchy.dashboard.details.location')}</span>
            <span className={styles.detailValue}><MapPin className="inline h-3.5 w-3.5" aria-hidden="true" /> {location}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>{t('hierarchy.dashboard.details.path')}</span>
            <div className={styles.pathList}>
              {path.map((item, index) => (
                <Link key={item.id} href={`/${state.orgSlug}/business-panel/hierarchy/node/${item.id}`} className={styles.pathLink}>
                  {index > 0 ? <span aria-hidden="true">/</span> : null}
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className={styles.detailItem}><span className={styles.detailLabel}>{label}</span><span className={styles.detailValue}>{value}</span></div>
}
