'use client'

import { HierarchyChat } from '../HierarchyChat'
import type { NodeDashboardCommonProps } from './node-dashboard.types'
import styles from '../HierarchyExperience.module.css'

export function NodeChatTab({ nodeId, state, t }: NodeDashboardCommonProps) {
  return (
    <HierarchyChat
      entityType="node"
      entityId={nodeId}
      chatType="vertical"
      title={t('hierarchy.dashboard.chatTitle', { name: state.data?.node.name || t('hierarchy.dashboard.members.role.member') })}
      className={styles.chatShell}
    />
  )
}
