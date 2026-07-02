'use client'

import {
  AdminDashboardActivitySection,
  AdminDashboardHero,
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
    statsData,
    themeColors,
    todayLabel,
    userName,
  } = useAdminDashboardLogic()

  return (
    <div
      className="min-h-screen p-3 transition-colors duration-300 md:p-6 lg:p-8"
      style={{ backgroundColor: themeColors.background }}
    >
      <AdminDashboardHero
        greeting={greeting}
        themeColors={themeColors}
        todayLabel={todayLabel}
        userName={userName}
      />

      <div className="space-y-8">
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
    </div>
  )
}
