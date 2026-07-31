'use client'

import { AlertCircle, Network, RefreshCw } from 'lucide-react'
import type { NodeDashboardTranslations } from './node-dashboard.types'
import styles from '../HierarchyExperience.module.css'

export function NodeDashboardLoadingState({ t }: Pick<NodeDashboardTranslations, 't'>) {
  return (
    <div className={styles.page}>
      <div className={styles.state} aria-live="polite">
        <div className={styles.stateIcon}><Network aria-hidden="true" /></div>
        <h1 className={styles.stateTitle}>{t('hierarchy.dashboard.loading')}</h1>
        <div className={styles.skeletonStack}>
          {[0, 1, 2].map(item => <div key={item} className={styles.skeletonRow} />)}
        </div>
      </div>
    </div>
  )
}

export function NodeDashboardErrorState({ error, t, tc }: NodeDashboardTranslations & { error: string | null }) {
  return (
    <div className={styles.page}>
      <div className={styles.state} role="alert">
        <div className={styles.stateIcon}><AlertCircle aria-hidden="true" /></div>
        <h1 className={styles.stateTitle}>{t('hierarchy.dashboard.error.title')}</h1>
        <p className={styles.stateDescription}>{error || t('hierarchy.dashboard.error.notFound')}</p>
        <button type="button" onClick={() => window.location.reload()} className={styles.secondaryButton}>
          <RefreshCw aria-hidden="true" />
          {tc('actions.retry')}
        </button>
      </div>
    </div>
  )
}
