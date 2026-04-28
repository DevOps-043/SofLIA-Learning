import { Award, BookOpen, CheckCircle2, Clock } from 'lucide-react'
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
  const defaultCardBg = isLightMode ? '#FFFFFF' : '#1E2329'
  const defaultSidebarBg = isLightMode ? '#F8FAFC' : '#0F1419'
  const defaultText = isLightMode ? '#0F172A' : '#FFFFFF'
  const defaultBorder = isLightMode ? '#E2E8F0' : '#334155'

  const dbCardBg = userDashboardStyles?.card_background
  const dbSidebarBg = userDashboardStyles?.sidebar_background
  const dbText = userDashboardStyles?.text_color
  const dbBorder = userDashboardStyles?.border_color
  const dbPrimary = userDashboardStyles?.primary_button_color
  const dbAccent = userDashboardStyles?.accent_color

  return {
    primary: dbPrimary || '#0A2540',
    accent: dbAccent || '#00D4B3',
    text: dbText || defaultText,
    cardBg: dbCardBg || defaultCardBg,
    sidebarBg: dbSidebarBg || defaultSidebarBg,
    border: dbBorder || defaultBorder,
    isLightMode,
    textSecondary: isLightMode ? '#64748B' : '#9CA3AF',
    textMuted: isLightMode ? '#94A3B8' : '#6B7280',
    iconColor: isLightMode ? (dbPrimary || '#0A2540') : (dbAccent || '#00D4B3'),
    heroBg: isLightMode
      ? 'linear-gradient(135deg, #0A2540 0%, #173B63 50%, #0A2540 100%)'
      : 'linear-gradient(135deg, #0a1628 0%, #0f1e30 50%, #0d1a2a 100%)',
    heroOverlay: isLightMode
      ? 'linear-gradient(to right, rgba(10, 37, 64, 0.95) 0%, rgba(10, 37, 64, 0.7) 50%, transparent 100%)'
      : 'linear-gradient(to right, rgba(10, 22, 40, 0.9) 0%, rgba(10, 22, 40, 0.5) 50%, transparent 100%)',
    gridPattern: isLightMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
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
    },
    {
      label: t('dashboard.stats.inProgress', 'En Progreso'),
      value: stats.in_progress,
      icon: Clock,
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: t('dashboard.stats.completed', 'Completados'),
      value: stats.completed,
      icon: CheckCircle2,
      color: 'from-green-500 to-emerald-500',
    },
    {
      label: t('dashboard.stats.certificates', 'Certificados'),
      value: stats.certificates,
      icon: Award,
      color: 'from-orange-500 to-red-500',
    },
  ]
}

export function buildBusinessUserIntroVideos(supabaseUrl: string | undefined): string[] {
  if (!supabaseUrl) {
    return []
  }

  return [
    `${supabaseUrl}/storage/v1/object/public/assets/Teaser%20-%20SofLIA%20Nexus.mp4`,
  ]
}

export function getBusinessUserCertificateRoute(
  certificates: BusinessUserCertificateSummary[] | null | undefined,
  courseId: string
): string {
  const certificate = certificates?.find((entry) => entry.course_id === courseId)
  return certificate ? `/certificates/${certificate.certificate_id}` : '/certificates'
}
