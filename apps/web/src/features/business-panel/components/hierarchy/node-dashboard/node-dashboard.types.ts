import type { TFunction } from 'i18next'
import type { useNodeDashboardState } from './useNodeDashboardState'

export type NodeDashboardState = ReturnType<typeof useNodeDashboardState>
export type NodeDashboardTab = NodeDashboardState['activeTab']
export type NodeDashboardTranslations = { t: TFunction; tc: TFunction }
export type NodeDashboardCommonProps = NodeDashboardTranslations & { state: NodeDashboardState; nodeId: string }
