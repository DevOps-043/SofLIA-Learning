'use client'

import {
  AdminDashboardActivitySection,
  AdminDashboardHero,
  AdminDashboardSidebar,
  AdminDashboardStatsSection,
  useAdminDashboardLogic,
} from './admin-dashboard'
import { AdminPageShell } from './ui'

export function AdminDashboard() {
  const {
    activities,
    activitiesLoading,
    error,
    greeting,
    isLoading,
    quickActions,
    statsData,
    themeColors,
    todayLabel,
    userName,
  } = useAdminDashboardLogic()

  return (
    <AdminPageShell className="py-6 lg:py-8" maxWidth="wide">
      <AdminDashboardHero
        greeting={greeting}
        todayLabel={todayLabel}
        userName={userName}
      />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-4">
        <div className="space-y-8 xl:col-span-3">
          <AdminDashboardStatsSection
            error={error}
            isLoading={isLoading}
            statsData={statsData}
            themeColors={themeColors}
          />

          <AdminDashboardActivitySection
            activities={activities}
            isLoading={activitiesLoading}
            themeColors={themeColors}
          />
        </div>

        <div className="xl:col-span-1">
          <AdminDashboardSidebar
            quickActions={quickActions}
            themeColors={themeColors}
          />
        </div>
      </div>
    </AdminPageShell>
  )
}
