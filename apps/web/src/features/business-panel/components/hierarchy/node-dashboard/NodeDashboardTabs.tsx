'use client'

import type { NodeDashboardCommonProps, NodeDashboardTab } from './node-dashboard.types'

const tabs: NodeDashboardTab[] = ['overview', 'members', 'structure', 'learning', 'chat']

export function NodeDashboardTabs({ state, t }: NodeDashboardCommonProps) {
  return (
    <div className="border-b border-white/10"><nav className="flex space-x-8">
      {tabs.map((tab) => <button key={tab} onClick={() => state.setActiveTab(tab)} className={`border-b-2 px-2 py-4 text-sm font-medium transition-colors ${state.activeTab === tab ? 'border-blue-500 text-blue-400' : 'border-transparent text-white/40 hover:border-white/20 hover:text-white'}`}>{t(`hierarchy.dashboard.tabs.${tab}`)}</button>)}
    </nav></div>
  )
}
