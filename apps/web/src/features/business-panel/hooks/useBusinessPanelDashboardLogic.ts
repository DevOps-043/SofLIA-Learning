'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
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
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<DashboardActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const { t, i18n } = useTranslation('business')
  const { effectiveStyles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  const panelStyles = effectiveStyles?.panel

  const themeColors = useMemo(() => ({
    primary: panelStyles?.primary_button_color || 'var(--color-primary)',
    secondary: panelStyles?.secondary_button_color || 'var(--color-info)',
    accent: panelStyles?.accent_color || 'var(--color-accent)',
    text: isDark ? (panelStyles?.text_color || 'var(--color-bg-light)') : 'var(--color-gray-900)',
    cardBg: isDark ? (panelStyles?.card_background || 'var(--color-gray-800)') : 'var(--color-bg-light)',
    borderColor: isDark ? (panelStyles?.border_color || 'rgb(255 255 255 / 10%)') : 'rgb(0 0 0 / 10%)',
    background: panelStyles?.background_value || (isDark ? 'var(--color-gray-900)' : 'var(--color-gray-50)'),
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/${orgSlug}/business/dashboard/stats`, { credentials: 'include' })
        if (!response.ok) throw new Error('Error al cargar estadisticas')
        const data = await response.json() as DashboardStatsResponse
        if (data.success && data.stats) setStats(data.stats)
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setActivitiesLoading(true)
        const response = await fetch(`/api/${orgSlug}/business/dashboard/activity`, { credentials: 'include' })
        if (!response.ok) throw new Error('Error al cargar actividades')
        const data = await response.json() as DashboardActivitiesResponse
        if (data.success && data.activities) {
          setActivities(data.activities.map((activity) => ({
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
          })))
        }
      } catch (error) {
        console.error('Error loading activities:', error)
      } finally {
        setActivitiesLoading(false)
      }
    }
    fetchActivities()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const statsData = useMemo(() => stats ? [
    {
      title: t('dashboard.stats.activeUsers'),
      value: getStatValue(stats.activeUsers),
      change: getStatChange(stats.activeUsers, stats.usersChange),
      backgroundImage: '/images/dashboard-cards/users-card-bg.webp',
      gradient: `bg-gradient-to-br from-[${themeColors.primary}] to-[${themeColors.primary}]/80`,
      gradientStyle: { background: `linear-gradient(to bottom right, ${themeColors.primary}, ${themeColors.primary}cc)` },
      href: `/${orgSlug}/business-panel/users`,
      icon: UsersIcon,
    },
    {
      title: t('dashboard.stats.assignedCourses'),
      value: getStatValue(stats.assignedCourses),
      change: getStatChange(stats.assignedCourses, stats.assignmentsChange),
      backgroundImage: '/images/dashboard-cards/courses-card-bg.webp',
      gradient: `bg-gradient-to-br from-[${themeColors.secondary}] to-[${themeColors.secondary}]/80`,
      gradientStyle: { background: `linear-gradient(to bottom right, ${themeColors.secondary}, ${themeColors.secondary}cc)` },
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
      gradientStyle: { background: `linear-gradient(to bottom right, ${themeColors.accent}, ${themeColors.accent}cc)` },
      icon: CheckCircleIcon,
    },
    {
      title: t('dashboard.stats.avgProgress'),
      value: getStatValue(stats.inProgress, `${stats.averageProgress || 0}%`),
      change: getStatChange(stats.inProgress, stats.progressChange),
      backgroundImage: '/images/dashboard-cards/progress-card-bg.webp',
      gradient: 'bg-gradient-to-br from-[#F59E0B] to-[#F59E0B]/80',
      gradientStyle: { background: 'linear-gradient(to bottom right, #F59E0B, #F59E0Bcc)' },
      icon: ClockIcon,
    },
    {
      title: t('dashboard.stats.certificates'),
      value: getStatValue(stats.certificates, 0),
      change: getStatChange(stats.certificates, stats.certificateGrowth),
      backgroundImage: '/images/dashboard-cards/certificates-card-bg.webp',
      gradient: 'bg-gradient-to-br from-[#8B5CF6] to-[#8B5CF6]/80',
      gradientStyle: { background: 'linear-gradient(to bottom right, #8B5CF6, #8B5CF6cc)' },
      id: 'tour-stat-certificates',
      icon: AcademicCapIcon,
    },
    {
      title: t('dashboard.stats.engagement'),
      value: getStatValue(stats.engagement, `${stats.engagementRate || 0}%`),
      change: getStatChange(stats.engagement, stats.engagementGrowth),
      backgroundImage: '/images/dashboard-cards/engagement-card-bg.webp',
      gradient: 'bg-gradient-to-br from-[#EC4899] to-[#EC4899]/80',
      gradientStyle: { background: 'linear-gradient(to bottom right, #EC4899, #EC4899cc)' },
      icon: ChartBarIcon,
    },
    {
      title: t('dashboard.stats.invitedUsers', 'Usuarios Invitados'),
      value: getStatValue(stats.invitedUsers),
      change: getStatChange(stats.invitedUsers),
      backgroundImage: '/images/dashboard-cards/users-card-bg.webp',
      gradient: 'bg-gradient-to-br from-[#6366F1] to-[#6366F1]/80',
      gradientStyle: { background: 'linear-gradient(to bottom right, #6366F1, #6366F1cc)' },
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
      gradient: 'bg-gradient-to-br from-[#10B981] to-[#10B981]/80',
      gradientStyle: { background: 'linear-gradient(to bottom right, #10B981, #10B981cc)' },
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
    isLoading,
    activitiesLoading,
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
