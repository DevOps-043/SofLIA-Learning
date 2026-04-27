'use client'

import { useEffect, useState } from 'react'

import { useAdminStats } from '@/features/admin/hooks/useAdminStats'
import { useAdminTheme } from '@/features/admin/hooks/useAdminTheme'
import { useProfile } from '@/features/profile/hooks/useProfile'

import {
  buildAdminDashboardStatsData,
  getAdminDashboardGreeting,
  getAdminDashboardQuickActions,
  getAdminDashboardUserName,
  mapAdminDashboardActivities,
} from './service'
import type { AdminDashboardActivityRecord } from './types'

export function useAdminDashboardLogic() {
  const { stats, isLoading, error } = useAdminStats()
  const { profile } = useProfile()
  const adminTheme = useAdminTheme()

  const [activityRecords, setActivityRecords] = useState<AdminDashboardActivityRecord[]>(
    []
  )
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  const themeColors = {
    background: adminTheme.background,
    borderColor: adminTheme.border,
    cardBackground: adminTheme.surface,
    inputBg: adminTheme.surfaceSubtle,
    textPrimary: adminTheme.text,
    textSecondary: adminTheme.textMuted,
  }

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadActivities = async () => {
      try {
        const response = await fetch('/api/admin/activity/recent?limit=8')
        const data = (await response.json()) as {
          activities?: AdminDashboardActivityRecord[]
          success?: boolean
        }

        if (!cancelled && data.success && data.activities) {
          setActivityRecords(data.activities)
        }
      } catch (fetchError) {
        if (!cancelled) {
          console.error('Error fetching activities:', fetchError)
        }
      } finally {
        if (!cancelled) {
          setActivitiesLoading(false)
        }
      }
    }

    loadActivities()
    const interval = window.setInterval(loadActivities, 30000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  return {
    activities: mapAdminDashboardActivities(activityRecords),
    activitiesLoading,
    error,
    greeting: getAdminDashboardGreeting(currentTime),
    isLoading,
    quickActions: getAdminDashboardQuickActions(),
    statsData: buildAdminDashboardStatsData(stats),
    themeColors,
    todayLabel: currentTime.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
      year: 'numeric',
    }),
    userName: getAdminDashboardUserName(profile),
  }
}
