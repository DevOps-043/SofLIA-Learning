'use client'

import { useState, useEffect } from 'react'
import type { ActiveTab, CourseChartData, CourseUserStats, EnrolledUser } from '../types'

export function useCourseStats(
  courseId: string,
  isNewCourse: boolean,
  activeTab: ActiveTab
) {
  const [userStats, setUserStats] = useState<CourseUserStats | null>(null)
  const [enrolledUsers, setEnrolledUsers] = useState<EnrolledUser[]>([])
  const [statsLoading, setStatsLoading] = useState<boolean>(false)
  const [chartData, setChartData] = useState<CourseChartData | null>(null)

  useEffect(() => {
    if (activeTab !== 'stats') return
    ;(async () => {
      try {
        setStatsLoading(true)
        if (isNewCourse) return
        const res = await fetch(`/api/instructor/workshops/${courseId}/stats`)
        const data = await res.json()
        if (res.ok && data?.stats) {
          setUserStats(data.stats)
          setEnrolledUsers(data.enrolled_users || [])
          setChartData(data.charts || null)
        }
      } catch {
        // silent
      } finally {
        setStatsLoading(false)
      }
    })()
  }, [activeTab, courseId, isNewCourse])

  return { userStats, enrolledUsers, statsLoading, chartData }
}
