'use client'

import { motion } from 'framer-motion'
import { NodeChatTab } from './NodeChatTab'
import { NodeLearningTab } from './NodeLearningTab'
import { NodeMembersTab } from './NodeMembersTab'
import { NodeOverviewTab } from './NodeOverviewTab'
import { NodeStructureTab } from './NodeStructureTab'
import type { NodeDashboardCommonProps } from './node-dashboard.types'

export function NodeDashboardContent(props: NodeDashboardCommonProps) {
  const { activeTab } = props.state
  return (
    <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      {activeTab === 'overview' ? <NodeOverviewTab {...props} /> : null}
      {activeTab === 'members' ? <NodeMembersTab {...props} /> : null}
      {activeTab === 'structure' ? <NodeStructureTab {...props} /> : null}
      {activeTab === 'learning' ? <NodeLearningTab {...props} /> : null}
      {activeTab === 'chat' ? <NodeChatTab {...props} /> : null}
    </motion.div>
  )
}
