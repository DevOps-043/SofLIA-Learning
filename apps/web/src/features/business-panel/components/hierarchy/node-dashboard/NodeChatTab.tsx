'use client'

import { HierarchyChat } from '../HierarchyChat'
import type { NodeDashboardCommonProps } from './node-dashboard.types'

export function NodeChatTab({ nodeId, state, t }: NodeDashboardCommonProps) {
  return <div className="mx-auto max-w-4xl"><HierarchyChat entityType="node" entityId={nodeId} chatType="vertical" title={t('hierarchy.dashboard.chatTitle', { name: state.data?.node.name || t('hierarchy.dashboard.members.role.member') })} className="border border-white/5 bg-[#1E2329]" /></div>
}
