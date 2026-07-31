'use client'

import { UserPlus, Users } from 'lucide-react'
import { NodeMemberCard } from './NodeMemberCard'
import type { NodeDashboardCommonProps } from './node-dashboard.types'
import styles from '../HierarchyExperience.module.css'

export function NodeMembersTab(props: NodeDashboardCommonProps) {
  const { state, t } = props
  const openMemberModal = () => { state.setInitialRole('member'); state.setShowMemberModal(true) }
  return (
    <div className={styles.settingsStack}>
      <header className={styles.sectionToolbar}>
        <div className={styles.sectionToolbarCopy}>
          <h2>{t('hierarchy.dashboard.members.title')}</h2>
          <p>{t('hierarchy.dashboard.members.subtitle')}</p>
        </div>
        <button type="button" onClick={openMemberModal} className={styles.primaryButton}>
          <UserPlus aria-hidden="true" />
          {t('hierarchy.dashboard.members.assign')}
        </button>
      </header>
      {state.loadingMembers ? (
        <div className={styles.skeletonStack} aria-live="polite">
          {[0, 1, 2].map(item => <div key={item} className={styles.skeletonRow} />)}
        </div>
      ) : state.members.length === 0 ? (
        <div className={styles.emptySurface}>
          <Users aria-hidden="true" />
          <h3>{t('hierarchy.dashboard.members.title')}</h3>
          <p>{t('hierarchy.dashboard.members.empty')}</p>
          <button type="button" onClick={openMemberModal} className={styles.secondaryButton}>
            <UserPlus aria-hidden="true" />
            {t('hierarchy.dashboard.members.assign')}
          </button>
        </div>
      ) : (
        <div className={styles.memberGrid}>
          {state.members.map(member => <NodeMemberCard key={member.id} {...props} member={member} />)}
        </div>
      )}
    </div>
  )
}
