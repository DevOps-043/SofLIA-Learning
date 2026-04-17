'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../../../features/auth/hooks/useAuth'
import { useOrganizationStyles } from '../../../../../features/business-panel/hooks/useOrganizationStyles'
import { getBackgroundStyle, generateCSSVariables } from '../../../../../features/business-panel/utils/styles'
import { useThemeStore } from '../../../../../core/stores/themeStore'
import { useBusinessUserJoyride } from '../../../../../features/tours/hooks/useBusinessUserJoyride'
import {
  buildBusinessUserDashboardColors,
  buildBusinessUserDashboardStats,
  buildBusinessUserIntroVideos,
  getBusinessUserCertificateRoute,
  getBusinessUserDashboardGreeting,
  getBusinessUserDisplayName,
  getBusinessUserInitials,
} from '../services/business-user-dashboard.service'
import type {
  AssignedCourse,
  AssignedLearningPath,
  DashboardStats,
  Organization,
  OrgRole,
} from '../types'

interface OrganizationResponse {
  success?: boolean
  organization?: Organization
  userRole?: OrgRole
}

interface CertificatesResponse {
  success?: boolean
  certificates?: Array<{ course_id: string; certificate_id: string }>
}

interface DashboardResponse {
  success?: boolean
  error?: string
  stats?: DashboardStats
  courses?: AssignedCourse[]
  learningPaths?: AssignedLearningPath[]
}

/**
 * Sort courses in a fixed order.
 * Temporary hardcoded sort while RLS issues are resolved.
 */
function sortCoursesByLearningPathPosition(
  courses: AssignedCourse[],
  _learningPaths: AssignedLearningPath[],
): AssignedCourse[] {
  if (courses.length === 0) return courses

  const ORDER: string[] = [
    'trampa',        // 1. La Trampa de la Insolvencia 2026
    'esencial',      // 2. IA Esencial
    'líderes',       // 3. IA para Líderes
    'lideres',       // 3. fallback sin acento
    'challenger',    // 4. Método Challenger
  ]

  function getOrder(title: string): number {
    const lower = title.toLowerCase()
    for (let i = 0; i < ORDER.length; i++) {
      if (lower.includes(ORDER[i])) return i
    }
    return ORDER.length
  }

  return [...courses].sort((a, b) => getOrder(a.title) - getOrder(b.title))
}

export function useBusinessUserDashboardPageLogic() {
  const router = useRouter()
  const params = useParams()
  const orgSlug = params?.orgSlug as string | undefined
  const { user, logout } = useAuth()
  const { t, i18n } = useTranslation('business')
  const { effectiveStyles } = useOrganizationStyles()
  const { resolvedTheme } = useThemeStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [orgRole, setOrgRole] = useState<OrgRole>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [stats, setStats] = useState<DashboardStats>({
    total_assigned: 0,
    in_progress: 0,
    completed: 0,
    certificates: 0,
  })
  const [assignedCourses, setAssignedCourses] = useState<AssignedCourse[]>([])
  const [learningPaths, setLearningPaths] = useState<AssignedLearningPath[]>([])
  const [isMounted, setIsMounted] = useState(false)

  const userDashboardStyles = effectiveStyles?.userDashboard
  const backgroundStyle = getBackgroundStyle(userDashboardStyles ?? null)
  const cssVariables = generateCSSVariables(userDashboardStyles ?? null)
  const orgColors = useMemo(
    () => buildBusinessUserDashboardColors({ userDashboardStyles, resolvedTheme }),
    [resolvedTheme, userDashboardStyles]
  )
  const introVideos = useMemo(
    () => buildBusinessUserIntroVideos(process.env.NEXT_PUBLIC_SUPABASE_URL),
    []
  )

  const { joyrideProps, shouldShowTour, startTour: restartTour, showVideoIntro, handleVideoComplete } =
    useBusinessUserJoyride({
      enabled: orgRole !== null && orgRole !== 'superadmin',
    })

  const translate = useCallback(
    (key: string, defaultValue?: string) => t(key, defaultValue || key),
    [t]
  )

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const myStats = useMemo(() => buildBusinessUserDashboardStats(stats, translate), [stats, translate])
  const greeting = useMemo(
    () => getBusinessUserDashboardGreeting(currentTime, translate),
    [currentTime, translate]
  )
  const displayName = useMemo(() => getBusinessUserDisplayName(user), [user])
  const initials = useMemo(() => getBusinessUserInitials(user), [user])

  const loadDashboardData = useCallback(async () => {
    if (!orgSlug) {
      setError('No se pudo determinar la organizacion')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [organizationResponse, dashboardResponse] = await Promise.all([
        fetch(`/api/${orgSlug}/organization`, {
          credentials: 'include',
        }),
        fetch(`/api/${orgSlug}/business-user/dashboard`, {
          credentials: 'include',
        }),
      ])

      if (organizationResponse.ok) {
        const organizationData = (await organizationResponse.json()) as OrganizationResponse
        if (organizationData.success && organizationData.organization) {
          setOrganization({
            ...organizationData.organization,
            slug: orgSlug,
          })
          if (organizationData.userRole) {
            setOrgRole(organizationData.userRole)
          }
        }
      }

      const dashboardData = (await dashboardResponse.json()) as DashboardResponse

      if (!dashboardResponse.ok) {
        throw new Error(
          dashboardData.error || `Error ${dashboardResponse.status}: Error al cargar datos del dashboard`
        )
      }

      if (dashboardData.success) {
        setStats(
          dashboardData.stats || {
            total_assigned: 0,
            in_progress: 0,
            completed: 0,
            certificates: 0,
          }
        )

        // Sort courses by learning path position (LP courses first, then the rest)
        const rawCourses = dashboardData.courses || []
        const rawLearningPaths = dashboardData.learningPaths || []
        setAssignedCourses(sortCoursesByLearningPathPosition(rawCourses, rawLearningPaths))
        setLearningPaths(rawLearningPaths)
        return
      }

      if (dashboardData.stats && dashboardData.courses) {
        setStats(dashboardData.stats)
        const fallbackLPs = dashboardData.learningPaths || []
        setAssignedCourses(sortCoursesByLearningPathPosition(dashboardData.courses, fallbackLPs))
        setLearningPaths(fallbackLPs)
        return
      }

      throw new Error(dashboardData.error || 'Error al obtener datos')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error desconocido')
      setStats({
        total_assigned: 0,
        in_progress: 0,
        completed: 0,
        certificates: 0,
      })
      setAssignedCourses([])
      setLearningPaths([])
    } finally {
      setLoading(false)
    }
  }, [orgSlug])

  useEffect(() => {
    if (orgSlug) {
      void loadDashboardData()
    }
  }, [loadDashboardData, orgSlug])

  const handleCourseClick = useCallback(
    async (course: AssignedCourse, action?: 'start' | 'continue' | 'certificate') => {
      if (action === 'certificate' && course.has_certificate) {
        try {
          const response = await fetch('/api/certificates', { credentials: 'include' })
          const data = (await response.json()) as CertificatesResponse
          router.push(getBusinessUserCertificateRoute(data.certificates, course.course_id))
        } catch {
          router.push('/certificates')
        }
        return
      }

      if (!course.slug) {
        return
      }

      router.push(`/courses/${course.slug}/learn`)
    },
    [router]
  )

  const handleLearningPathCourseClick = useCallback(
    (slug: string | null | undefined) => {
      if (!slug) return
      router.push(`/courses/${slug}/learn`)
    },
    [router]
  )

  const handleLogout = useCallback(async () => {
    await logout()
    router.push('/auth')
  }, [logout, router])

  const handleProfileClick = useCallback(() => {
    router.push('/profile')
  }, [router])

  const handleCertificatesClick = useCallback(() => {
    router.push('/certificates')
  }, [router])

  return {
    orgSlug,
    user,
    t,
    translate,
    i18n,
    loading,
    error,
    organization,
    orgRole,
    currentTime,
    stats,
    assignedCourses,
    learningPaths,
    isMounted,
    userDashboardStyles,
    backgroundStyle,
    cssVariables,
    orgColors,
    joyrideProps,
    shouldShowTour,
    restartTour,
    showVideoIntro,
    handleVideoComplete,
    introVideos,
    myStats,
    greeting,
    displayName,
    initials,
    loadDashboardData,
    handleCourseClick,
    handleLearningPathCourseClick,
    handleLogout,
    handleProfileClick,
    handleCertificatesClick,
  }
}
