'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useAuth } from '../../auth/hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '../../../core/stores/themeStore'
import {
  UsersIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ChartBarIcon,
  PlusIcon,
  Cog6ToothIcon,
  ClockIcon,
  AcademicCapIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'
import { formatDate, formatTimeAgo } from '@/utils/date-formatter'

type DashboardChange = number | string | null | undefined

interface DashboardMetricValue {
  value: string | number
  change?: DashboardChange
  linksCount?: number
}

type DashboardMetric = DashboardMetricValue | string | number | null | undefined

interface DashboardStats {
  activeUsers?: DashboardMetric
  assignedCourses?: DashboardMetric
  completedCourses?: DashboardMetric
  completed?: DashboardMetric
  inProgress?: DashboardMetric
  certificates?: DashboardMetric
  engagement?: DashboardMetric
  invitedUsers?: DashboardMetric
  usersChange?: DashboardChange
  assignmentsChange?: DashboardChange
  completedChange?: DashboardChange
  progressChange?: DashboardChange
  certificateGrowth?: DashboardChange
  engagementGrowth?: DashboardChange
  averageProgress?: number
  engagementRate?: number
}

interface DashboardActivityApiRow {
  action?: string | null
  user?: string | null
  time?: string | null
  icon?: string | null
}

interface DashboardActivity {
  title: string
  description: string
  user: string
  timestamp: string
  type: 'certificate' | 'user' | 'course' | 'progress'
}

interface DashboardStatsResponse {
  success?: boolean
  stats?: DashboardStats
}

interface DashboardActivitiesResponse {
  success?: boolean
  activities?: DashboardActivityApiRow[]
}

async function fetchDashboardStats(url: string): Promise<DashboardStats | null> {
  const response = await fetch(url, { credentials: 'include' })
  const data = (await response.json().catch(() => null)) as DashboardStatsResponse | null

  if (!response.ok || !data?.success) {
    throw new Error('Error al cargar estadisticas')
  }

  return data.stats ?? null
}

async function fetchDashboardActivities(url: string): Promise<DashboardActivityApiRow[]> {
  const response = await fetch(url, { credentials: 'include' })
  const data = (await response.json().catch(() => null)) as DashboardActivitiesResponse | null

  if (!response.ok || !data?.success) {
    throw new Error('Error al cargar actividades')
  }

  return data.activities ?? []
}

function parseChange(change: DashboardChange): number {
  if (typeof change === 'number') return change
  if (typeof change === 'string') {
    const parsed = parseFloat(change.replace(/[+\-%]/g, ''))
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

function getStatValue(stat: DashboardMetric, fallback: string | number = 0): string | number {
  if (stat && typeof stat === 'object' && 'value' in stat) return stat.value
  return stat || fallback
}

function getStatChange(stat: DashboardMetric, fallbackChange: DashboardChange = 0): number {
  if (stat && typeof stat === 'object' && 'change' in stat) return parseChange(stat.change)
  return parseChange(fallbackChange)
}

export function useBusinessPanelDashboardLogic() {
  const { user } = useAuth()
  const params = useParams()
  const orgSlug = params?.orgSlug as string || 'org'
  const { t, i18n } = useTranslation('business')
  const { effectiveStyles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const statsUrl = orgSlug ? `/api/${orgSlug}/business/dashboard/stats` : null
  const activitiesUrl = orgSlug ? `/api/${orgSlug}/business/dashboard/activity` : null

  const {
    data: stats = null,
    error: statsError,
    isLoading: statsLoading,
  } = useSWR<DashboardStats | null>(statsUrl, fetchDashboardStats, {
    dedupingInterval: 60000,
    errorRetryCount: 1,
    keepPreviousData: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  })

  const {
    data: activityRows = [],
    isLoading: activityRowsLoading,
  } = useSWR<DashboardActivityApiRow[]>(activitiesUrl, fetchDashboardActivities, {
    dedupingInterval: 30000,
    errorRetryCount: 1,
    keepPreviousData: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  })

  const panelStyles = effectiveStyles?.panel

  const themeColors = useMemo(() => ({
    primary: panelStyles?.primary_button_color || 'var(--color-primary)',
    secondary: panelStyles?.secondary_button_color || 'var(--color-info)',
    accent: panelStyles?.accent_color || 'var(--color-accent)',
    text: panelStyles?.text_color || 'var(--color-contrast)',
    cardBg: panelStyles?.card_background || (isDark ? 'var(--color-gray-800)' : 'var(--color-bg-light)'),
    borderColor: isDark
      ? (panelStyles?.border_color || 'color-mix(in srgb, var(--color-bg-light) 10%, transparent)')
      : (panelStyles?.border_color || 'color-mix(in srgb, var(--color-black) 10%, transparent)'),
    background: panelStyles?.background_value || 'var(--color-bg-dark)',
    backgroundType: panelStyles?.background_type || 'color',
  }), [panelStyles, isDark])

  const getGreeting = (date: Date = new Date()) => {
    const hour = date.getHours()
    if (hour < 12) return t('dashboard.greetings.morning')
    if (hour < 18) return t('dashboard.greetings.afternoon')
    return t('dashboard.greetings.evening')
  }

  const getUserName = () => {
    if (user?.first_name && user?.last_name) return `${user.first_name} ${user.last_name}`
    if (user?.display_name) return user.display_name
    if (user?.first_name) return user.first_name
    if (user?.username) return user.username
    return t('dashboard.recentActivity.defaultUser', { defaultValue: 'Usuario' })
  }

  const formatTimestamp = (dateString: string): string => {
    return formatTimeAgo(dateString, i18n.language, t)
  }

  const activities = useMemo<DashboardActivity[]>(() => (
    activityRows.map((activity) => ({
      title: activity.action || t('dashboard.recentActivity.defaultTitle', { defaultValue: 'Actividad' }),
      description: activity.action || t('dashboard.recentActivity.defaultDesc', { defaultValue: 'Sin descripcion' }),
      user: activity.user || t('dashboard.recentActivity.defaultUser', { defaultValue: 'Usuario' }),
      timestamp: activity.time || t('dashboard.recentActivity.defaultTime', { defaultValue: 'Hace un momento' }),
      type: activity.icon === 'CheckCircle'
        ? 'certificate'
        : activity.icon === 'Users'
          ? 'user'
          : activity.icon === 'BookOpen'
            ? 'course'
            : 'progress',
    }))
  ), [activityRows, t])

  const statsData = useMemo(() => stats ? [
    {
      title: t('dashboard.stats.activeUsers'),
      value: getStatValue(stats.activeUsers),
      change: getStatChange(stats.activeUsers, stats.usersChange),
      backgroundImage: '/images/dashboard-cards/users-card-bg.webp',
      gradient: `bg-gradient-to-br from-[${themeColors.primary}] to-[${themeColors.primary}]/80`,
      gradientStyle: { background: `linear-gradient(to bottom right, ${themeColors.primary}, color-mix(in srgb, ${themeColors.primary} 80%, transparent))` },
      href: `/${orgSlug}/business-panel/users`,
      icon: UsersIcon,
    },
    {
      title: t('dashboard.stats.assignedCourses'),
      value: getStatValue(stats.assignedCourses),
      change: getStatChange(stats.assignedCourses, stats.assignmentsChange),
      backgroundImage: '/images/dashboard-cards/courses-card-bg.webp',
      gradient: `bg-gradient-to-br from-[${themeColors.secondary}] to-[${themeColors.secondary}]/80`,
      gradientStyle: { background: `linear-gradient(to bottom right, ${themeColors.secondary}, color-mix(in srgb, ${themeColors.secondary} 80%, transparent))` },
      href: `/${orgSlug}/business-panel/courses`,
      id: 'tour-stat-courses',
      icon: BookOpenIcon,
    },
    {
      title: t('dashboard.stats.completed'),
      value: getStatValue(stats.completedCourses || stats.completed),
      change: getStatChange(stats.completedCourses || stats.completed, stats.completedChange),
      backgroundImage: '/images/dashboard-cards/completed-card-bg.webp',
      gradient: `bg-gradient-to-br from-[${themeColors.accent}] to-[${themeColors.accent}]/80`,
      gradientStyle: { background: `linear-gradient(to bottom right, ${themeColors.accent}, color-mix(in srgb, ${themeColors.accent} 80%, transparent))` },
      icon: CheckCircleIcon,
    },
    {
      title: t('dashboard.stats.avgProgress'),
      value: getStatValue(stats.inProgress, `${stats.averageProgress || 0}%`),
      change: getStatChange(stats.inProgress, stats.progressChange),
      backgroundImage: '/images/dashboard-cards/progress-card-bg.webp',
      gradient: 'bg-gradient-to-br from-warning to-warning/80',
      gradientStyle: { background: 'linear-gradient(to bottom right, var(--color-warning), var(--color-legacy-f59e0bcc))' },
      icon: ClockIcon,
    },
    {
      title: t('dashboard.stats.certificates'),
      value: getStatValue(stats.certificates, 0),
      change: getStatChange(stats.certificates, stats.certificateGrowth),
      backgroundImage: '/images/dashboard-cards/certificates-card-bg.webp',
      gradient: 'bg-gradient-to-br from-secondary to-secondary/80',
      gradientStyle: { background: 'linear-gradient(to bottom right, var(--color-secondary), var(--color-legacy-8b5cf6cc))' },
      id: 'tour-stat-certificates',
      icon: AcademicCapIcon,
    },
    {
      title: t('dashboard.stats.engagement'),
      value: getStatValue(stats.engagement, `${stats.engagementRate || 0}%`),
      change: getStatChange(stats.engagement, stats.engagementGrowth),
      backgroundImage: '/images/dashboard-cards/engagement-card-bg.webp',
      gradient: 'bg-gradient-to-br from-pink-500 to-pink-500/80',
      gradientStyle: { background: 'linear-gradient(to bottom right, var(--color-legacy-ec4899), var(--color-legacy-ec4899cc))' },
      icon: ChartBarIcon,
    },
    {
      title: t('dashboard.stats.invitedUsers', 'Usuarios Invitados'),
      value: getStatValue(stats.invitedUsers),
      change: getStatChange(stats.invitedUsers),
      backgroundImage: '/images/dashboard-cards/users-card-bg.webp',
      gradient: 'bg-gradient-to-br from-[var(--color-legacy-6366f1)] to-[color-mix(in_srgb,var(--color-legacy-6366f1)_80%,transparent)]',
      gradientStyle: { background: 'linear-gradient(to bottom right, var(--color-legacy-6366f1), var(--color-legacy-6366f1cc))' },
      href: `/${orgSlug}/business-panel/users?tab=invitations`,
      icon: UsersIcon,
    },
    {
      title: t('dashboard.stats.inviteLinks', 'Enlaces de Invitacion'),
      value:
        stats.invitedUsers && typeof stats.invitedUsers === 'object'
          ? stats.invitedUsers.linksCount || 0
          : 0,
      change: 0,
      backgroundImage: '/images/dashboard-cards/courses-card-bg.webp',
      gradient: 'bg-gradient-to-br from-success to-success/80',
      gradientStyle: { background: 'linear-gradient(to bottom right, var(--color-success), var(--color-legacy-10b981cc))' },
      href: `/${orgSlug}/business-panel/users?tab=links`,
      icon: LinkIcon,
    },
  ] : [], [stats, themeColors, t, orgSlug]) // eslint-disable-line react-hooks/exhaustive-deps

  const quickActions = useMemo(() => [
    {
      title: t('dashboard.quickActions.manageUsers.title'),
      description: t('dashboard.quickActions.manageUsers.desc'),
      icon: UsersIcon,
      href: `/${orgSlug}/business-panel/users`,
      color: themeColors.primary,
    },
    {
      title: t('dashboard.quickActions.assignCourses.title'),
      description: t('dashboard.quickActions.assignCourses.desc'),
      icon: PlusIcon,
      href: `/${orgSlug}/business-panel/courses`,
      color: themeColors.secondary,
    },
    {
      title: t('dashboard.quickActions.viewReports.title'),
      description: t('dashboard.quickActions.viewReports.desc'),
      icon: ChartBarIcon,
      href: `/${orgSlug}/business-panel/reports`,
      color: themeColors.accent,
    },
    {
      title: t('dashboard.quickActions.settings.title'),
      description: t('dashboard.quickActions.settings.desc'),
      icon: Cog6ToothIcon,
      href: `/${orgSlug}/business-panel/settings`,
      color: themeColors.primary,
    },
  ], [themeColors, t, orgSlug])

  const getBackgroundStyles = () => {
    if (themeColors.backgroundType === 'gradient' && themeColors.background) {
      return { background: themeColors.background }
    }
    if (themeColors.backgroundType === 'image' && themeColors.background) {
      return {
        backgroundImage: `url(${themeColors.background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    }
    return { backgroundColor: themeColors.background }
  }

  return {
    user,
    orgSlug,
    stats,
    activities,
    isLoading: statsLoading && !stats,
    activitiesLoading: activityRowsLoading && activityRows.length === 0,
    error: statsError instanceof Error ? statsError.message : null,
    themeColors,
    statsData,
    quickActions,
    getGreeting,
    getUserName,
    formatTimestamp,
    formatDate: (date: Date) => formatDate(date, i18n.language),
    getBackgroundStyles,
    language: i18n.language,
  }
}
