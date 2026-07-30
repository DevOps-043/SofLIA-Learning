import { Award, BarChart3, BookOpen, CheckCircle2, Clock } from 'lucide-react'
import { chooseReadableTextColor } from '@/core/theme/color-engine'
import type {
  BusinessUserCertificateSummary,
  BusinessUserDashboardColors,
  BusinessUserDashboardIdentity,
  BusinessUserDashboardStatItem,
  BusinessUserDashboardStylesProps,
  DashboardStats,
} from '../types'

type DashboardTranslator = (key: string, defaultValue?: string) => string

export function buildBusinessUserDashboardColors({
  userDashboardStyles,
  resolvedTheme,
}: BusinessUserDashboardStylesProps): BusinessUserDashboardColors {
  const isLightMode = resolvedTheme === 'light'
  const defaultCardBg = isLightMode ? 'var(--color-bg-light)' : 'var(--color-gray-800)'
  const defaultSidebarBg = isLightMode ? 'var(--color-gray-50)' : 'var(--color-bg-dark)'
  const defaultText = isLightMode ? 'var(--color-legacy-0f172a)' : 'var(--color-bg-light)'
  const defaultBorder = isLightMode ? 'var(--color-gray-200)' : 'var(--color-legacy-334155)'

  const dbCardBg = userDashboardStyles?.card_background
  const dbSidebarBg = userDashboardStyles?.sidebar_background
  const dbText = userDashboardStyles?.text_color
  const dbBorder = userDashboardStyles?.border_color
  const dbPrimary = userDashboardStyles?.primary_button_color
  const dbAccent = userDashboardStyles?.accent_color
  const primary = dbPrimary || 'var(--color-primary)'
  const accent = dbAccent || primary

  return {
    primary,
    accent,
    onPrimary: chooseReadableTextColor(primary),
    onAccent: chooseReadableTextColor(accent),
    text: dbText || defaultText,
    cardBg: dbCardBg || defaultCardBg,
    sidebarBg: dbSidebarBg || defaultSidebarBg,
    border: dbBorder || defaultBorder,
    isLightMode,
    textSecondary: isLightMode ? 'var(--color-gray-500)' : 'var(--color-legacy-9ca3af)',
    textMuted: isLightMode ? 'var(--color-gray-400)' : 'var(--color-legacy-6b7280)',
    iconColor: isLightMode ? primary : accent,
    heroBg: isLightMode
      ? `linear-gradient(135deg, ${primary} 0%, color-mix(in srgb, ${primary} 82%, ${accent}) 52%, ${accent} 100%)`
      : `linear-gradient(135deg, color-mix(in srgb, ${primary} 62%, var(--color-black)) 0%, color-mix(in srgb, ${primary} 42%, var(--color-black)) 52%, color-mix(in srgb, ${accent} 30%, var(--color-black)) 100%)`,
    heroOverlay: isLightMode
      ? `linear-gradient(to right, color-mix(in srgb, ${primary} 92%, var(--color-black)) 0%, color-mix(in srgb, ${primary} 68%, transparent) 50%, transparent 100%)`
      : `linear-gradient(to right, color-mix(in srgb, ${primary} 70%, var(--color-black)) 0%, color-mix(in srgb, ${primary} 46%, transparent) 50%, transparent 100%)`,
    gridPattern: isLightMode
      ? 'color-mix(in srgb, var(--color-bg-light) 5%, transparent)'
      : 'color-mix(in srgb, var(--color-bg-light) 10%, transparent)',
  }
}

export function getBusinessUserDisplayName(user: BusinessUserDashboardIdentity | null | undefined): string {
  if (user?.first_name && user?.last_name) {
    return `${user.first_name} ${user.last_name}`
  }

  return user?.display_name || user?.username || 'Usuario'
}

export function getBusinessUserInitials(user: BusinessUserDashboardIdentity | null | undefined): string {
  const firstName = user?.first_name || ''
  const lastName = user?.last_name || ''

  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (user?.username || 'U').charAt(0).toUpperCase()
}

export function getBusinessUserDashboardGreeting(
  currentTime: Date,
  t: DashboardTranslator
): string {
  const hour = currentTime.getHours()

  if (hour < 12) {
    return t('dashboard.greetings.morning')
  }

  if (hour < 18) {
    return t('dashboard.greetings.afternoon')
  }

  return t('dashboard.greetings.evening')
}

export function getBusinessUserDashboardLocale(language: string): string {
  if (language === 'en') {
    return 'en-US'
  }

  if (language === 'pt') {
    return 'pt-BR'
  }

  return 'es-MX'
}

export function formatBusinessUserDashboardDate(date: Date, language: string): string {
  return date.toLocaleDateString(getBusinessUserDashboardLocale(language), {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function buildBusinessUserDashboardStats(
  stats: DashboardStats,
  t: DashboardTranslator
): BusinessUserDashboardStatItem[] {
  return [
    {
      label: t('dashboard.stats.assignedCourses', 'Cursos Asignados'),
      value: stats.total_assigned,
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500',
      kind: 'courses',
    },
    {
      label: t('dashboard.stats.inProgress', 'En Progreso'),
      value: stats.in_progress,
      icon: Clock,
      color: 'from-purple-500 to-pink-500',
      kind: 'inProgress',
    },
    {
      label: t('dashboard.stats.completed', 'Completados'),
      value: stats.completed,
      icon: CheckCircle2,
      color: 'from-green-500 to-emerald-500',
      kind: 'completed',
    },
    {
      label: t('dashboard.stats.certificates', 'Certificados'),
      value: stats.certificates,
      icon: Award,
      color: 'from-orange-500 to-red-500',
      kind: 'certificates',
    },
    {
      label: t('dashboard.stats.myAnalytics', 'Mis estadisticas'),
      value: t('dashboard.stats.viewAnalytics', 'Ver'),
      icon: BarChart3,
      color: 'from-cyan-500 to-teal-500',
      kind: 'analytics',
    },
  ]
}

export function getBusinessUserCertificateRoute(
  certificates: BusinessUserCertificateSummary[] | null | undefined,
  courseId: string
): string {
  const certificate = certificates?.find((entry) => entry.course_id === courseId)
  return certificate ? `/certificates/${certificate.certificate_id}` : '/certificates'
}
