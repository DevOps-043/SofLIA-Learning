'use client'

import { Trash2 } from 'lucide-react'
import type { NodeMember } from '../../../types/hierarchy.types'
import type { NodeDashboardCommonProps } from './node-dashboard.types'
import styles from '../HierarchyExperience.module.css'

export function NodeMemberCard({ member, state, t, tc }: NodeDashboardCommonProps & { member: NodeMember }) {
  const nameInitial = (member.users.first_name?.[0] || member.users.username?.[0] || '?').toUpperCase()
  return (
    <article className={styles.memberCard}>
      <div className={styles.memberAvatar}>
        {member.users.profile_picture_url ? (
          <img
            src={member.users.profile_picture_url}
            alt={`${member.users.first_name || ''} ${member.users.last_name || ''}`.trim()}
          />
        ) : nameInitial}
      </div>
      <div>
        <h3 className={styles.memberName}>{member.users.first_name} {member.users.last_name}</h3>
        <p className={styles.memberEmail}>{member.users.email}</p>
        <span className={styles.memberRoleBadge}>
          {member.role === 'leader' ? t('hierarchy.dashboard.members.role.leader') : t('hierarchy.dashboard.members.role.member')}
        </span>
      </div>
      {state.pendingRemoveMemberId === member.user_id ? (
        <div className={styles.alertActions}>
          <button type="button" onClick={() => state.setPendingRemoveMemberId(null)} className={styles.compactButton}>
            {tc('actions.cancel')}
          </button>
          <button type="button" onClick={state.handleConfirmRemoveMember} className={styles.compactDangerButton}>
            {tc('actions.confirm')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => state.handleRemoveMember(member.user_id)}
          className={styles.dangerIconButton}
          aria-label={`${t('hierarchy.confirmRemoveMember')}: ${member.users.first_name || member.users.email}`}
        >
          <Trash2 aria-hidden="true" />
        </button>
      )}
    </article>
  )
}
