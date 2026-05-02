'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../../../features/auth/hooks/useAuth'
import { useOrganizationStyles } from '../../../../../features/business-panel/hooks/useOrganizationStyles'
import { getBackgroundStyle, generateCSSVariables } from '../../../../../features/business-panel/utils/styles'
import { useThemeStore } from '../../../../../core/stores/themeStore'
import { useBusinessUserJoyride } from '../../../../../features/tours/hooks/useBusinessUserJoyride'
import { useMobilePerformanceMode } from '../../../../../lib/utils/mobile-performance'
import {
  buildBusinessUserDashboardColors,
  buildBusinessUserDashboardStats,
  buildBusinessUserIntroVideos,
  getBusinessUserCertificateRoute,
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

class ApiJsonResponseError extends Error {
  constructor(message: string, readonly shouldRedirectToAuth = false) {
    super(message)
    this.name = 'ApiJsonResponseError'
  }
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
  const { disableHeavyEffects, isMobileViewport } = useMobilePerformanceMode()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [orgRole, setOrgRole] = useState<OrgRole>(null)
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
      mobilePerformanceMode: disableHeavyEffects,
    })

  const translate = useCallback(
    (key: string, defaultValue?: string) => t(key, defaultValue || key),
    [t]
  )

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const myStats = useMemo(() => buildBusinessUserDashboardStats(stats, translate), [stats, translate])
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
        const organizationData = await readApiJson<OrganizationResponse>(
          organizationResponse,
          'Error al cargar datos de la organizacion',
        )
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

      const dashboardData = await readApiJson<DashboardResponse>(
        dashboardResponse,
        'Error al cargar datos del dashboard',
      )

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
      if (loadError instanceof ApiJsonResponseError && loadError.shouldRedirectToAuth) {
        router.push('/auth?error=session_expired')
        return
      }

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
  }, [orgSlug, router])

  useEffect(() => {
    if (orgSlug) {
      if (process.env.NODE_ENV === 'development' && typeof performance !== 'undefined') {
        performance.mark('business-user-dashboard:load-start')
      }
      void loadDashboardData()
    }
  }, [loadDashboardData, orgSlug])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || loading || typeof performance === 'undefined') {
      return
    }

    performance.mark('business-user-dashboard:load-end')
    performance.measure(
      'business-user-dashboard:load-duration',
      'business-user-dashboard:load-start',
      'business-user-dashboard:load-end'
    )

    const measures = performance.getEntriesByName('business-user-dashboard:load-duration')
    const lastMeasure = measures[measures.length - 1]

    console.debug('[business-user-dashboard] load complete', {
      assignedCourses: assignedCourses.length,
      disableHeavyEffects,
      isMobileViewport,
      learningPaths: learningPaths.length,
      loadDurationMs: Math.round(lastMeasure?.duration || 0),
    })
  }, [assignedCourses.length, disableHeavyEffects, isMobileViewport, learningPaths.length, loading])

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

  const handleAnalyticsClick = useCallback(() => {
    if (!orgSlug) return
    router.push(`/${orgSlug}/business-user/analytics`)
  }, [orgSlug, router])

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
    stats,
    assignedCourses,
    learningPaths,
    isMounted,
    userDashboardStyles,
    backgroundStyle,
    cssVariables,
    orgColors,
    disableHeavyEffects,
    isMobileViewport,
    joyrideProps,
    shouldShowTour,
    restartTour,
    showVideoIntro,
    handleVideoComplete,
    introVideos,
    myStats,
    displayName,
    initials,
    loadDashboardData,
    handleCourseClick,
    handleLearningPathCourseClick,
    handleLogout,
    handleProfileClick,
    handleCertificatesClick,
    handleAnalyticsClick,
  }
}

async function readApiJson<T>(response: Response, fallbackMessage: string): Promise<T> {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>
  }

  if (response.redirected || response.url.includes('/auth')) {
    throw new ApiJsonResponseError('Sesion expirada. Inicia sesion nuevamente.', true)
  }

  throw new ApiJsonResponseError(`${fallbackMessage}. Respuesta inesperada del servidor (${response.status}).`)
}
