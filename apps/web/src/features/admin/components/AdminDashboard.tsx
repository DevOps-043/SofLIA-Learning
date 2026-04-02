'use client'

import {
  AdminDashboardActivitySection,
  AdminDashboardHero,
  AdminDashboardSidebar,
  AdminDashboardStatsSection,
  useAdminDashboardLogic,
} from './admin-dashboard'

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
    <div
      className="min-h-screen p-6 transition-colors duration-300 lg:p-8"
      style={{ backgroundColor: themeColors.background }}
    >
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
    </div>
  )
}
