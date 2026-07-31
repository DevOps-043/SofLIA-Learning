'use client'

import { AlertCircle, Layers3, Network, RefreshCw } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { NodeDashboardTranslations } from './node-dashboard.types'
import styles from '../HierarchyExperience.module.css'

export function NodeDashboardLoadingState({ t }: Pick<NodeDashboardTranslations, 't'>) {
  return (
    <main className={styles.page} aria-busy="true" data-testid="node-dashboard-loading">
      <div className={`${styles.dashboard} ${styles.nodeLoadingDashboard}`}>
        <section className={styles.nodeLoadingHero} aria-live="polite">
          <div className={styles.nodeLoadingCopy}>
            <div className={styles.nodeLoadingIcon} aria-hidden="true">
              <Network />
              <span />
            </div>
            <div>
              <p className={styles.nodeLoadingKicker}>{t('hierarchy.pageTitle')}</p>
              <h1 className={styles.nodeLoadingTitle}>{t('hierarchy.dashboard.loading')}</h1>
              <p className={styles.nodeLoadingDescription}>{t('hierarchy.dashboard.loadingDescription')}</p>
            </div>
          </div>
          <div className={styles.nodeLoadingStatus}>
            <span className={styles.nodeLoadingPulse} aria-hidden="true" />
            {t('hierarchy.dashboard.loadingStatus')}
          </div>
        </section>

        <div className={styles.nodeLoadingTabs} aria-hidden="true">
          {[42, 34, 46, 40, 32].map((width, index) => (
            <span key={index} style={{ '--loading-tab-width': `${width / 4}rem` } as CSSProperties} />
          ))}
        </div>

        <div className={styles.nodeLoadingGrid} aria-hidden="true">
          <section className={styles.nodeLoadingCard}>
            <div className={styles.nodeLoadingCardHeader}>
              <span className={styles.nodeLoadingBadge}><Layers3 /></span>
              <span className={styles.nodeLoadingLine} data-size="medium" />
            </div>
            <div className={styles.nodeLoadingDetailRows}>
              {[0, 1, 2, 3].map(item => (
                <div key={item}>
                  <span className={styles.nodeLoadingLine} data-size="small" />
                  <span className={styles.nodeLoadingLine} data-size={item === 3 ? 'medium' : 'large'} />
                </div>
              ))}
            </div>
          </section>

          <section className={styles.nodeLoadingCard}>
            <div className={styles.nodeLoadingCardHeader}>
              <span className={styles.nodeLoadingLine} data-size="medium" />
              <span className={styles.nodeLoadingBadge} />
            </div>
            <div className={styles.nodeLoadingMetrics}>
              {[0, 1, 2].map(item => <span key={item} />)}
            </div>
            <div className={styles.nodeLoadingChart} />
          </section>
        </div>
      </div>
    </main>
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
