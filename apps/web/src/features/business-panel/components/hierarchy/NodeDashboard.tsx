'use client'

import type { CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowLeft, Edit2, Layers3, Network, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import { useNodeDashboardState } from './node-dashboard/useNodeDashboardState'
import { NodeDashboardContent } from './node-dashboard/NodeDashboardContent'
import { NodeDashboardModals } from './node-dashboard/NodeDashboardModals'
import { NodeDashboardErrorState, NodeDashboardLoadingState } from './node-dashboard/NodeDashboardStates'
import { NodeDashboardTabs } from './node-dashboard/NodeDashboardTabs'
import { getHierarchyTypeLabel } from './hierarchy-labels'
import styles from './HierarchyExperience.module.css'

type HierarchyVariables = CSSProperties & Record<`--hierarchy-${string}`, string>

interface NodeDashboardProps {
  nodeId: string
}

export function NodeDashboard({ nodeId }: NodeDashboardProps) {
  const { t } = useTranslation('business')
  const { t: tc } = useTranslation('common')
  const theme = useBusinessPanelTheme()
  const state = useNodeDashboardState(nodeId)
  const commonProps = { nodeId, state, t, tc }

  if (state.loading) return <NodeDashboardLoadingState t={t} />
  if (state.error || !state.data) return <NodeDashboardErrorState error={state.error} t={t} tc={tc} />

  const node = state.data.node
  const hierarchyVariables: HierarchyVariables = {
    '--hierarchy-accent': theme.accentColor,
    '--hierarchy-action': theme.actionColor,
    '--hierarchy-border': theme.borderColor,
    '--hierarchy-danger': theme.dangerColor,
    '--hierarchy-divider': theme.dividerColor,
    '--hierarchy-input': theme.inputBg,
    '--hierarchy-muted': theme.mutedTextColor,
    '--hierarchy-on-action': theme.onActionColor,
    '--hierarchy-primary': theme.primaryColor,
    '--hierarchy-subtext': theme.subtextColor,
    '--hierarchy-success': theme.successColor,
    '--hierarchy-surface': theme.cardBg,
    '--hierarchy-text': theme.textColor,
    '--hierarchy-warning': theme.warningColor,
  }

  return (
    <main className={styles.page} style={hierarchyVariables}>
      <div className={styles.dashboard}>
        <section
          className={`${styles.hero} ${styles.nodeHero}`}
          style={{ background: theme.heroBackground, borderColor: theme.heroBorderColor }}
          aria-labelledby="node-dashboard-title"
        >
          <div className={styles.heroAtmosphere} aria-hidden="true" />
          <div className={styles.heroRingLarge} aria-hidden="true" />
          <div className={styles.heroRingSmall} aria-hidden="true" />
          <div className={styles.heroDot} aria-hidden="true" />
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{getHierarchyTypeLabel(node.type, t)}</p>
            <h1 id="node-dashboard-title" className={styles.heroTitle}>{node.name}</h1>
            <div className={styles.nodeHeroMeta}>
              <span><Network aria-hidden="true" />{t('hierarchy.dashboard.details.path')}</span>
              <span><Users aria-hidden="true" />{t('hierarchy.membersCount', { count: node.members_count || 0 })}</span>
              <span><Layers3 aria-hidden="true" />{state.data.children.length} {t('hierarchy.dashboard.substructures.title')}</span>
            </div>
          </div>
          <div className={styles.nodeHeroActions}>
            <Link href={`/${state.orgSlug}/business-panel/hierarchy`} className={styles.glassButton}>
              <ArrowLeft aria-hidden="true" />
              {t('hierarchy.pageTitle')}
            </Link>
            <button type="button" className={styles.glassButton} onClick={() => state.setShowEditModal(true)}>
              <Edit2 aria-hidden="true" />
              {tc('actions.edit')}
            </button>
          </div>
        </section>
        <NodeDashboardTabs {...commonProps} />
        <NodeDashboardContent {...commonProps} />
        <NodeDashboardModals {...commonProps} />
      </div>
    </main>
  )
}
