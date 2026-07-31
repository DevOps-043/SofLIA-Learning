'use client'

import { Edit2, User } from 'lucide-react'
import type { NodeDashboardCommonProps } from './node-dashboard.types'
import { getHierarchyTypeLabel } from '../hierarchy-labels'
import styles from '../HierarchyExperience.module.css'

export function NodeManagerCard({ state, t }: NodeDashboardCommonProps) {
  const node = state.data?.node
  if (!node) return null
  const assignManager = () => { state.setInitialRole('leader'); state.setShowMemberModal(true) }
  return (
    <article className={styles.dashboardCard}>
      <div className={styles.dashboardCardBody}>
        <header className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>{t('hierarchy.dashboard.manager.title')}</h2>
            <p className={styles.cardDescription}>{t('hierarchy.dashboard.manager.subtitle')}</p>
          </div>
          <button type="button" onClick={assignManager} className={styles.iconButton} aria-label={t('hierarchy.dashboard.manager.change')}>
            <Edit2 aria-hidden="true" />
          </button>
        </header>
        {node.manager ? (
          <div className={styles.managerBody}>
            <div className={styles.avatar}>
              {node.manager.profile_picture_url ? (
                <img src={node.manager.profile_picture_url} alt={`${node.manager.first_name} ${node.manager.last_name}`} />
              ) : (
                node.manager.first_name?.[0]
              )}
            </div>
            <h3 className={styles.managerName}>{node.manager.first_name} {node.manager.last_name}</h3>
            <p className={styles.managerEmail}>{node.manager.email}</p>
            <span className={styles.managerRole}>
              <User aria-hidden="true" />
              {t('hierarchy.dashboard.manager.roleLabel', { type: getHierarchyTypeLabel(node.type, t) })}
            </span>
          </div>
        ) : (
          <div className={styles.compactEmpty}>
            <div className={styles.stateIcon}><User aria-hidden="true" /></div>
            <h3 className={styles.stateTitle}>{t('hierarchy.dashboard.manager.notAssigned')}</h3>
            <button type="button" onClick={assignManager} className={styles.primaryButton}>
              {t('hierarchy.dashboard.manager.assign')}
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
