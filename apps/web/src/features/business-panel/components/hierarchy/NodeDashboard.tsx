'use client'

import { useTranslation } from 'react-i18next'
import { useNodeDashboardState } from './node-dashboard/useNodeDashboardState'
import { NodeDashboardContent } from './node-dashboard/NodeDashboardContent'
import { NodeDashboardModals } from './node-dashboard/NodeDashboardModals'
import { NodeDashboardErrorState, NodeDashboardLoadingState } from './node-dashboard/NodeDashboardStates'
import { NodeDashboardTabs } from './node-dashboard/NodeDashboardTabs'

interface NodeDashboardProps {
  nodeId: string
}

export function NodeDashboard({ nodeId }: NodeDashboardProps) {
  const { t } = useTranslation('business')
  const { t: tc } = useTranslation('common')
  const state = useNodeDashboardState(nodeId)
  const commonProps = { nodeId, state, t, tc }

  if (state.loading) return <NodeDashboardLoadingState t={t} />
  if (state.error || !state.data) return <NodeDashboardErrorState error={state.error} t={t} tc={tc} />

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-20">
      <NodeDashboardTabs {...commonProps} />
      <NodeDashboardContent {...commonProps} />
      <NodeDashboardModals {...commonProps} />
    </div>
  )
}
