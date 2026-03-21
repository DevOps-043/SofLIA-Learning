'use client'

import { useState } from 'react'
import { BarChart3, BookOpen, Activity, Users } from 'lucide-react'
import type { UserStatsTab } from './types'
import { OverviewTab } from './OverviewTab'
import { LearningTab } from './LearningTab'
import { EngagementTab } from './EngagementTab'
import { UserDetailTab } from './UserDetailTab'

const TABS: { id: UserStatsTab; label: string; icon: typeof BarChart3 }[] = [
  { id: 'overview', label: 'Resumen', icon: BarChart3 },
  { id: 'learning', label: 'Aprendizaje', icon: BookOpen },
  { id: 'engagement', label: 'Engagement', icon: Activity },
  { id: 'users', label: 'Detalle Usuarios', icon: Users },
]

export function UserStatsB2BPage() {
  const [activeTab, setActiveTab] = useState<UserStatsTab>('overview')

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estadísticas de Usuarios</h1>
        <p className="text-gray-500 dark:text-gray-400">Métricas de aprendizaje, engagement y detalle de usuarios</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
              activeTab === id
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'learning' && <LearningTab />}
      {activeTab === 'engagement' && <EngagementTab />}
      {activeTab === 'users' && <UserDetailTab />}
    </div>
  )
}
