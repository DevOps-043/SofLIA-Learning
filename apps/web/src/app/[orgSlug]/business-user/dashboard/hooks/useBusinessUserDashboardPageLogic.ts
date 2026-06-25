'use client'

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import { useAuth } from '../../../../../features/auth/hooks/useAuth'
import { useOrganizationStyles } from '../../../../../features/business-panel/hooks/useOrganizationStyles'
import { getBackgroundStyle, generateCSSVariables } from '../../../../../features/business-panel/utils/styles'
import { useThemeStore } from '../../../../../core/stores/themeStore'
import { useMobilePerformanceMode } from '../../../../../lib/utils/mobile-performance'
import {
  buildBusinessUserDashboardColors,
  buildBusinessUserDashboardStats,
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
  organization?: Organization | null
}

interface BusinessUserDashboardData {
  assignedCourses: AssignedCourse[]
  learningPaths: AssignedLearningPath[]
  organization: Organization | null
  orgRole: OrgRole
  stats: DashboardStats
}

class ApiJsonResponseError extends Error {
  constructor(message: string, readonly shouldRedirectToAuth = false) {
    super(message)
    this.name = 'ApiJsonResponseError'
  }
}

const EMPTY_DASHBOARD_STATS: DashboardStats = {
  total_assigned: 0,
  in_progress: 0,
  completed: 0,
  certificates: 0,
}

function resolveOrgSlugFromRoute(
  routeOrgSlug: string | string[] | undefined,
  pathname: string | null,
): string | undefined {
  if (typeof routeOrgSlug === 'string' && routeOrgSlug.trim().length > 0) {
    return routeOrgSlug
  }

  const firstSegment = pathname?.split('/').filter(Boolean)[0]

  return firstSegment && firstSegment !== 'business-user'
    ? firstSegment
    : undefined
}

function buildOrgCourseLearnPath(orgSlug: string | undefined, courseSlug: string) {
  return orgSlug
    ? `/${orgSlug}/courses/${courseSlug}/learn`
    : '/auth/select-organization'
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

async function fetchBusinessUserDashboardData(
  orgSlug: string,
): Promise<BusinessUserDashboardData> {
  const response = await fetch(`/api/${orgSlug}/business-user/dashboard`, {
    credentials: 'include',
  })

  const data = await readApiJson<DashboardResponse>(
    response,
    'Error al cargar datos del dashboard',
  )

  if (!response.ok) {
    throw new Error(
      data.error || `Error ${response.status}: Error al cargar datos del dashboard`,
    )
  }

  if (data.success || (data.stats && data.courses)) {
    const rawLearningPaths = data.learningPaths || []
    const organization = data.organization
      ? { ...data.organization, slug: orgSlug }
      : null
    return {
      assignedCourses: sortCoursesByLearningPathPosition(
        data.courses || [],
        rawLearningPaths,
      ),
      learningPaths: rawLearningPaths,
      organization,
      orgRole: null,
      stats: data.stats || EMPTY_DASHBOARD_STATS,
    }
  }

  throw new Error(data.error || 'Error al obtener datos')
}

export function useBusinessUserDashboardPageLogic() {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const orgSlug = resolveOrgSlugFromRoute(params?.orgSlug, pathname)
  const { user, logout } = useAuth()
  const { t, i18n } = useTranslation('business')
  const { effectiveStyles } = useOrganizationStyles()
  const { resolvedTheme } = useThemeStore()
  const { disableHeavyEffects, isMobileViewport } = useMobilePerformanceMode()

  const [isMounted, setIsMounted] = useState(false)
  const {
    data: dashboardData,
    error: dashboardError,
    isLoading: isDashboardLoading,
    mutate: mutateDashboardData,
  } = useSWR<BusinessUserDashboardData>(
    orgSlug ? `business-user-dashboard:${orgSlug}` : null,
    () => fetchBusinessUserDashboardData(orgSlug as string),
    {
      dedupingInterval: 60000,
      errorRetryCount: 1,
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  )

  const organization = dashboardData?.organization ?? null
  const orgRole = dashboardData?.orgRole ?? null
  const stats = dashboardData?.stats ?? EMPTY_DASHBOARD_STATS
  const assignedCourses = dashboardData?.assignedCourses ?? []
  const learningPaths = dashboardData?.learningPaths ?? []
  const loading = Boolean(orgSlug) && isDashboardLoading && !dashboardData
  const error = !orgSlug
    ? 'No se pudo determinar la organizacion'
    : dashboardError instanceof ApiJsonResponseError && dashboardError.shouldRedirectToAuth
      ? null
      : dashboardError instanceof Error
        ? dashboardError.message
        : null

  const userDashboardStyles = effectiveStyles?.userDashboard
  const backgroundStyle = getBackgroundStyle(userDashboardStyles ?? null)
  const cssVariables = generateCSSVariables(userDashboardStyles ?? null)
  const orgColors = useMemo(
    () => buildBusinessUserDashboardColors({ userDashboardStyles, resolvedTheme }),
    [resolvedTheme, userDashboardStyles]
  )
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
    await mutateDashboardData()
  }, [mutateDashboardData])

  useEffect(() => {
    if (dashboardError instanceof ApiJsonResponseError && dashboardError.shouldRedirectToAuth) {
      router.push('/auth?error=session_expired')
    }
  }, [dashboardError, router])

  useEffect(() => {
    if (orgSlug) {
      if (process.env.NODE_ENV === 'development' && typeof performance !== 'undefined') {
        performance.mark('business-user-dashboard:load-start')
      }
    }
  }, [orgSlug])

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

    techDebtLogger.debug('[business-user-dashboard] load complete', {
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
          const certApiUrl = orgSlug
            ? `/api/${orgSlug}/business-user/certificates`
            : '/api/certificates'
          const response = await fetch(certApiUrl, { credentials: 'include' })
          const data = (await response.json()) as CertificatesResponse
          router.push(getBusinessUserCertificateRoute(data.certificates, course.course_id))
        } catch {
          router.push(orgSlug ? `/${orgSlug}/certificates` : '/certificates')
        }
        return
      }

      if (!course.slug) {
        return
      }

      router.push(buildOrgCourseLearnPath(orgSlug, course.slug))
    },
    [orgSlug, router]
  )

  const handleLearningPathCourseClick = useCallback(
    (slug: string | null | undefined) => {
      if (!slug) return
      router.push(buildOrgCourseLearnPath(orgSlug, slug))
    },
    [orgSlug, router]
  )

  const handleLogout = useCallback(async () => {
    await logout()
    router.push('/auth')
  }, [logout, router])

  const handleProfileClick = useCallback(() => {
    router.push(orgSlug ? `/${orgSlug}/profile` : '/profile')
  }, [orgSlug, router])

  const handleCertificatesClick = useCallback(() => {
    router.push(orgSlug ? `/${orgSlug}/certificates` : '/certificates')
  }, [orgSlug, router])

  const handleAnalyticsClick = useCallback(() => {
    if (!orgSlug) return
    router.push(`/${orgSlug}/business-user/analytics`)
  }, [orgSlug, router])

  const handleNotebookClick = useCallback(() => {
    if (!orgSlug) return
    router.push(`/${orgSlug}/business-user/notebook`)
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
    handleNotebookClick,
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
