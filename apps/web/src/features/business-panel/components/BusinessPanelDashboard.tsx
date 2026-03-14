'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  UsersIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  ClockIcon,
  PlusIcon,
  Cog6ToothIcon,
  RocketLaunchIcon,
  AcademicCapIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useAuth } from '../../auth/hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '../../../core/stores/themeStore'

// ============================================
// COMPONENTE: StatCard Premium
// ============================================
// ============================================
// COMPONENTE: StatCard Premium con Efectos Avanzados
// ============================================
interface StatCardProps {
  title: string
  value: string | number
  change: number
  backgroundImage?: string
  gradient: string
  gradientStyle?: React.CSSProperties
  delay: number
  href?: string
  id?: string
  theme?: any
}

function StatCard({ title, value, change, backgroundImage, gradient, gradientStyle, delay, href, id, theme }: StatCardProps) {
  const isPositive = change >= 0

  const CardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: delay * 0.08,
        duration: 0.4,
        ease: 'easeOut'
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative group overflow-hidden rounded-3xl cursor-pointer h-40 shadow-sm hover:shadow-md transition-shadow duration-300"
      id={id}
      style={{
        backgroundColor: 'var(--org-card-background, #1E2329)',
        border: `1.5px solid ${theme?.borderColor || '#6C757D'}80`,
        willChange: 'transform',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden'
      }}
    >

      {/* Background Image with Overlay */}
      {backgroundImage && (
        <div
          className="absolute inset-0 z-0"
          style={{
            willChange: 'transform',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          <Image
            src={backgroundImage}
            alt={title}
            fill
            className="object-cover opacity-70 group-hover:opacity-80 transition-opacity duration-300"
            style={{
              willChange: 'opacity',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
            unoptimized={false}
            priority={false}
          />
          <div
            className="absolute inset-0 bg-gradient-to-br from-[var(--org-card-background,#1E2329)]/70 via-[var(--org-card-background,#1E2329)]/40 to-transparent"
            style={{
              willChange: 'auto',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[var(--org-card-background,#1E2329)]/80 via-transparent to-transparent"
            style={{
              willChange: 'auto',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
          />
        </div>
      )}

      {/* Content Container */}
      <div
        className="relative z-10 p-5 h-full flex flex-col justify-between"
        style={{
          willChange: 'auto',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
      >
        {/* Top Row: Indicator + Badge */}
        <div className="flex items-start justify-between">
          {/* Visual Indicator */}
          <div
            className="p-2.5 rounded-xl"
            style={{
              backgroundColor: `${theme?.text || '#FFFFFF'}0D`,
              border: `1px solid ${theme?.borderColor || '#FFFFFF'}1A`,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              willChange: 'auto',
              transform: 'translateZ(0)'
            }}
          >
            <div
              className="w-8 h-1.5 rounded-full"
              style={gradientStyle}
            />
          </div>

          {/* Change Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${isPositive
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              }`}
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              willChange: 'auto',
              transform: 'translateZ(0)'
            }}
          >
            {isPositive ? (
              <ArrowTrendingUpIcon className="h-4 w-4" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4" />
            )}
            <span>{isPositive ? '+' : ''}{change}%</span>
          </div>
        </div>

        {/* Bottom Row: Value + Title */}
        <div className="space-y-1">
          <h3
            className="text-4xl font-black tracking-tight"
            style={{
              color: 'var(--org-text-color, #FFFFFF)'
            }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>

          <p
            className="text-sm font-semibold tracking-wide uppercase"
            style={{
              color: 'var(--org-text-color, #FFFFFF)',
              opacity: 0.7,
              letterSpacing: '0.05em'
            }}
          >
            {title}
          </p>
        </div>

        {/* Progress Bar at Bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden"
          style={{ backgroundColor: `${theme?.text || '#FFFFFF'}0D` }}
        >
          <div
            className="h-full rounded-r-full w-[60%]"
            style={{
              background: `linear-gradient(90deg, ${gradientStyle?.background || 'var(--org-accent-color, #00D4B3)'}, transparent)`
            }}
          />
        </div>
      </div>
    </motion.div>
  )

  if (href) {
    return <Link href={href}>{CardContent}</Link>
  }

  return CardContent
}


// ============================================
// HELPER: Calcular luminosidad de un color
// ============================================
function getLuminance(color: string): number {
  try {
    // Convertir hex a RGB
    const hex = color.replace('#', '').trim()
    if (hex.length !== 6) {
      // Si no es un hex válido, asumir que es oscuro
      return 0.3
    }
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    // Calcular luminosidad relativa usando la fórmula estándar
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance
  } catch {
    // En caso de error, asumir que es oscuro
    return 0.3
  }
}

// ============================================
// COMPONENTE: Quick Action Button
// ============================================
interface QuickActionProps {
  title: string
  description: string
  icon: React.ComponentType<any>
  href: string
  color: string
  delay: number
}

function QuickAction({ title, description, icon: Icon, href, color, delay }: QuickActionProps) {
  const { resolvedTheme } = useThemeStore()
  const isLightMode = resolvedTheme === 'light'

  // Calcular luminosidad del color de fondo
  const luminance = getLuminance(color)
  const isLightColor = luminance > 0.5

  // El icono siempre será blanco (según lo solicitado por el usuario)
  const iconColor = '#FFFFFF'

  // Ajustar el color de fondo en modo claro para asegurar contraste con el icono blanco
  // Si el color es claro en modo claro, oscurecerlo para que el icono blanco se vea bien
  let backgroundColor = color
  if (isLightMode && isLightColor) {
    // Oscurecer el color significativamente para mejor contraste con icono blanco
    const hex = color.replace('#', '')
    const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - 60)
    const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - 60)
    const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - 60)
    backgroundColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay * 0.05 + 0.3, duration: 0.3 }}
    >
      <Link href={href}>
        <div
          className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:scale-[1.01] hover:brightness-110 group cursor-pointer"
          style={{
            backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 35, 41), 0.5)'
          }}
        >
          <div
            className="p-3 rounded-lg transition-colors"
            style={{ backgroundColor: backgroundColor }}
          >
            <Icon className="h-5 w-5" style={{ color: iconColor }} />
          </div>
          <div className="flex-1">
            <h4
              className="font-semibold text-sm transition-colors"
              style={{ color: 'var(--org-text-color, #FFFFFF)' }}
            >
              {title}
            </h4>
            <p
              className="text-xs mt-0.5"
              style={{ color: 'var(--org-text-color, #FFFFFF)', opacity: 0.7 }}
            >
              {description}
            </p>
          </div>
          <div
            className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-[-5px] group-hover:translate-x-0"
            style={{ color: 'var(--org-accent-color, #00D4B3)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ============================================
// COMPONENTE: Activity Item
// ============================================
interface ActivityItemProps {
  title: string
  description: string
  user: string
  timestamp: string
  type: string
  delay: number
}

function ActivityItem({ title, description, user, timestamp, type, delay }: ActivityItemProps) {
  const { t } = useTranslation('business')
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user': return 'var(--org-primary-button-color, #0A2540)'
      case 'course': return 'var(--org-secondary-button-color, #10B981)'
      case 'certificate': return 'var(--org-accent-color, #00D4B3)'
      case 'progress': return '#F59E0B'
      default: return 'var(--org-border-color, #6C757D)'
    }
  }

  return (
    <div
      className="flex items-start gap-4 p-4 rounded-xl transition-all duration-200 hover:bg-[rgba(var(--org-card-background-rgb),0.8)] border-l-2 border-transparent hover:border-[var(--org-accent-color)]"
    >
      <div
        className="w-2 h-2 mt-2 rounded-full"
        style={{ backgroundColor: getTypeColor(type) }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-4">
          <h4
            className="font-medium text-sm truncate"
            style={{ color: 'var(--org-text-color, #FFFFFF)' }}
          >
            {title}
          </h4>
          <div
            className="flex items-center gap-1 text-xs whitespace-nowrap"
            style={{ color: 'var(--org-text-color, #FFFFFF)', opacity: 0.6 }}
          >
            <ClockIcon className="h-3.5 w-3.5" />
            {timestamp}
          </div>
        </div>
        <p
          className="text-xs mt-1 line-clamp-1"
          style={{ color: 'var(--org-text-color, #FFFFFF)', opacity: 0.7 }}
        >
          {description}
        </p>
        <p
          className="text-xs mt-1 font-medium"
          style={{ color: 'var(--org-accent-color, #00D4B3)' }}
        >
          {t('dashboard.recentActivity.by')} {user}
        </p>
      </div>
    </div>
  )
}

// ============================================
// COMPONENTE PRINCIPAL: BusinessPanelDashboard
// ============================================
export function BusinessPanelDashboard() {
  const { user } = useAuth()
  const params = useParams()
  const orgSlug = params?.orgSlug as string || 'org' // Fallback for safety
  const [stats, setStats] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { t } = useTranslation('business')
  const { effectiveStyles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  // Obtener estilos del panel con fallbacks
  const panelStyles = effectiveStyles?.panel

  // Definir themeColors basado en los estilos del panel
  const themeColors = useMemo(() => {
    return {
      primary: panelStyles?.primary_button_color || (isDark ? '#8B5CF6' : '#6366F1'),
      secondary: panelStyles?.secondary_button_color || '#3B82F6',
      accent: panelStyles?.accent_color || '#00D4B3',
      text: isDark ? (panelStyles?.text_color || '#FFFFFF') : '#0F172A',
      cardBg: isDark ? (panelStyles?.card_background || '#1E2329') : '#FFFFFF',
      borderColor: isDark ? (panelStyles?.border_color || 'rgba(255,255,255,0.1)') : 'rgba(0,0,0,0.1)',
      background: panelStyles?.background_value || (isDark ? '#0F172A' : '#F8FAFC'),
      backgroundType: panelStyles?.background_type || 'color'
    }
  }, [panelStyles, isDark])

  // Funciones auxiliares
  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return t('dashboard.greetings.morning')
    if (hour < 18) return t('dashboard.greetings.afternoon')
    return t('dashboard.greetings.evening')
  }

  const getUserName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    if (user?.display_name) {
      return user.display_name
    }
    if (user?.first_name) {
      return user.first_name
    }
    if (user?.username) {
      return user.username
    }
    return t('dashboard.recentActivity.defaultUser', { defaultValue: 'Usuario' })
  }

  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return t('dashboard.recentActivity.time.justNow')
    if (diffMins < 60) return t('dashboard.recentActivity.time.minsAgo', { time: diffMins })
    if (diffHours < 24) return t('dashboard.recentActivity.time.hoursAgo', { time: diffHours })
    if (diffDays === 1) return t('dashboard.recentActivity.time.daysAgo', { time: 1 })
    if (diffDays < 7) return t('dashboard.recentActivity.time.daysAgo', { time: diffDays })

    return date.toLocaleDateString(t('dashboard.recentActivity.time.locale', { defaultValue: 'es-ES' }), { day: 'numeric', month: 'short' })
  }

  // Cargar estadísticas del dashboard
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/${orgSlug}/business/dashboard/stats`, {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Error al cargar estadísticas')
        }

        const data = await response.json()
        if (data.success && data.stats) {
          setStats(data.stats)
        }
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Cargar actividades recientes
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setActivitiesLoading(true)
        const response = await fetch(`/api/${orgSlug}/business/dashboard/activity`, {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Error al cargar actividades')
        }

        const data = await response.json()
        if (data.success && data.activities) {
          // Mapear el formato de la API al formato esperado por el componente
          const mappedActivities = data.activities.map((activity: any) => ({
            title: activity.action || t('dashboard.recentActivity.defaultTitle', { defaultValue: 'Actividad' }),
            description: activity.action || t('dashboard.recentActivity.defaultDesc', { defaultValue: 'Sin descripción' }),
            user: activity.user || t('dashboard.recentActivity.defaultUser', { defaultValue: 'Usuario' }),
            timestamp: activity.time || t('dashboard.recentActivity.defaultTime', { defaultValue: 'Hace un momento' }), // La API ya devuelve el tiempo formateado
            type: activity.icon === 'CheckCircle' ? 'certificate' :
              activity.icon === 'Users' ? 'user' :
                activity.icon === 'BookOpen' ? 'course' : 'progress'
          }))
          setActivities(mappedActivities)
        }
      } catch (error) {
        console.error('Error loading activities:', error)
      } finally {
        setActivitiesLoading(false)
      }
    }

    fetchActivities()
  }, [])

  // Actualizar hora actual cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Función auxiliar para parsear el cambio (puede venir como string con + o - y %)
  const parseChange = (change: any): number => {
    if (typeof change === 'number') return change
    if (typeof change === 'string') {
      // Remover +, - y % del string
      const cleaned = change.replace(/[+\-%]/g, '')
      const parsed = parseFloat(cleaned)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }

  const statsData = useMemo(() => stats ? [
    {
      title: t('dashboard.stats.activeUsers'),
      value: typeof stats.activeUsers === 'object' ? stats.activeUsers.value : (stats.activeUsers || 0),
      change: typeof stats.activeUsers === 'object' ? parseChange(stats.activeUsers.change) : 0,
      backgroundImage: '/images/dashboard-cards/users-card-bg.png',
      gradient: `bg-gradient-to-br from-[${themeColors.primary}] to-[${themeColors.primary}]/80`,
      gradientStyle: { background: `linear-gradient(to bottom right, ${themeColors.primary}, ${themeColors.primary}cc)` },
      href: `/${orgSlug}/business-panel/users`
    },
    {
      title: t('dashboard.stats.assignedCourses'),
      value: typeof stats.assignedCourses === 'object' ? stats.assignedCourses.value : (stats.assignedCourses || 0),
      change: typeof stats.assignedCourses === 'object' ? parseChange(stats.assignedCourses.change) : 0,
      backgroundImage: '/images/dashboard-cards/courses-card-bg.png',
      gradient: `bg-gradient-to-br from-[${themeColors.secondary}] to-[${themeColors.secondary}]/80`,
      gradientStyle: { background: `linear-gradient(to bottom right, ${themeColors.secondary}, ${themeColors.secondary}cc)` },
      href: `/${orgSlug}/business-panel/courses`,
      id: 'tour-stat-courses'
    },
    {
      title: t('dashboard.stats.completed'),
      value: typeof stats.completed === 'object' ? stats.completed.value : (stats.completed || stats.completedCourses || 0),
      change: typeof stats.completed === 'object' ? parseChange(stats.completed.change) : 0,
      backgroundImage: '/images/dashboard-cards/completed-card-bg.png',
      gradient: `bg-gradient-to-br from-[${themeColors.accent}] to-[${themeColors.accent}]/80`,
      gradientStyle: { background: `linear-gradient(to bottom right, ${themeColors.accent}, ${themeColors.accent}cc)` },
    },
    {
      title: t('dashboard.stats.avgProgress'),
      value: typeof stats.inProgress === 'object' ? stats.inProgress.value : `${stats.averageProgress || 0}%`,
      change: typeof stats.inProgress === 'object' ? parseChange(stats.inProgress.change) : 0,
      backgroundImage: '/images/dashboard-cards/progress-card-bg.png',
      gradient: 'bg-gradient-to-br from-[#F59E0B] to-[#F59E0B]/80',
      gradientStyle: { background: `linear-gradient(to bottom right, #F59E0B, #F59E0Bcc)` },
    },
    {
      title: t('dashboard.stats.certificates'),
      value: stats.certificates || 0,
      change: parseChange(stats.certificateGrowth),
      backgroundImage: '/images/dashboard-cards/certificates-card-bg.png',
      gradient: 'bg-gradient-to-br from-[#8B5CF6] to-[#8B5CF6]/80',
      gradientStyle: { background: `linear-gradient(to bottom right, #8B5CF6, #8B5CF6cc)` },
      id: 'tour-stat-certificates'
    },
    {
      title: t('dashboard.stats.engagement'),
      value: `${stats.engagementRate || 0}%`,
      change: parseChange(stats.engagementGrowth),
      backgroundImage: '/images/dashboard-cards/engagement-card-bg.png',
      gradient: 'bg-gradient-to-br from-[#EC4899] to-[#EC4899]/80',
      gradientStyle: { background: `linear-gradient(to bottom right, #EC4899, #EC4899cc)` },
    },
  ] : [], [stats, themeColors, t, orgSlug])

  const quickActions = useMemo(() => [
    {
      title: t('dashboard.quickActions.manageUsers.title'),
      description: t('dashboard.quickActions.manageUsers.desc'),
      icon: UsersIcon,
      href: `/${orgSlug}/business-panel/users`,
      color: themeColors.primary
    },
    {
      title: t('dashboard.quickActions.assignCourses.title'),
      description: t('dashboard.quickActions.assignCourses.desc'),
      icon: PlusIcon,
      href: `/${orgSlug}/business-panel/courses`,
      color: themeColors.secondary
    },
    {
      title: t('dashboard.quickActions.viewReports.title'),
      description: t('dashboard.quickActions.viewReports.desc'),
      icon: ChartBarIcon,
      href: `/${orgSlug}/business-panel/reports`,
      color: themeColors.accent
    },
    {
      title: t('dashboard.quickActions.settings.title'),
      description: t('dashboard.quickActions.settings.desc'),
      icon: Cog6ToothIcon,
      href: `/${orgSlug}/business-panel/settings`,
      color: '#8B5CF6'
    },
  ], [themeColors, t, orgSlug])

  // Calcular estilo de fondo dinámico
  const getBackgroundStyles = () => {
    if (themeColors.backgroundType === 'gradient' && themeColors.background) {
      return { background: themeColors.background }
    } else if (themeColors.backgroundType === 'image' && themeColors.background) {
      return {
        backgroundImage: `url(${themeColors.background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    }
    return { backgroundColor: themeColors.background }
  }

  return (
    <div
      className="p-6 lg:p-8 min-h-screen"
      style={getBackgroundStyles()}
    >
      {/* Hero Section */}
      <motion.div
        id="tour-hero-section"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl p-8 mb-8 group"
      >
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 mix-blend-multiply opacity-80 z-10"
            style={{ backgroundColor: themeColors.primary }}
          />
          <div
            className="absolute inset-0 z-10"
            style={{
              background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.primary}99, transparent)`
            }}
          />
          <Image
            src="/images/dashboard-header.png"
            alt="Business Dashboard Background"
            fill
            priority
            unoptimized
            className="object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, 100vw"
          />
        </div>

        {/* Animated Particles */}


        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="transition-transform duration-[10s] ease-linear hover:rotate-180"
            >
              <SparklesIcon className="h-6 w-6" style={{ color: themeColors.accent }} />
            </div>
            <span
              className="text-sm font-medium tracking-wide uppercase"
              style={{ color: '#FFFFFF' }}
            >
              {t('dashboard.title')}
            </span>
          </div>

          <motion.h1
            className="text-3xl lg:text-4xl font-bold mb-2"
            style={{ color: '#FFFFFF' }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {getGreeting()}, {getUserName()}
          </motion.h1>

          <motion.p
            className="text-lg max-w-xl"
            style={{ color: '#FFFFFF', opacity: 0.7 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {t('dashboard.subtitle')}
          </motion.p>

          {/* Date & Status */}
          <motion.div
            className="flex items-center gap-6 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <ClockIcon className="h-4 w-4" />
              <span style={{ color: '#FFFFFF' }} className="opacity-90">
                {currentTime.toLocaleDateString('es-MX', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#00D4B3' }} />
              <span className="text-sm font-medium" style={{ color: '#00D4B3' }}>{t('dashboard.systemActive')}</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-8">
          {/* Stats Grid */}
          <section id="tour-stats-section">
            <motion.div
              className="flex items-center justify-between mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div>
                <h2 className="text-xl font-bold" style={{ color: themeColors.text }}>{t('dashboard.generalStats')}</h2>
                <p className="text-sm mt-1" style={{ color: themeColors.text, opacity: 0.7 }}>{t('dashboard.keyMetrics')}</p>
              </div>
            </motion.div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ backgroundColor: themeColors.cardBg }} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statsData.map((stat, index) => (
                  <StatCard
                    key={stat.title}
                    title={stat.title}
                    value={stat.value}
                    change={stat.change}
                    backgroundImage={stat.backgroundImage}
                    gradient={stat.gradient}
                    gradientStyle={stat.gradientStyle}
                    delay={index}
                    href={stat.href}
                    theme={themeColors}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Activity Section */}
          <section id="tour-activity-section">
            <motion.div
              className="flex items-center justify-between mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div>
                <h2 id="tour-activity-title" className="text-xl font-bold" style={{ color: themeColors.text }}>{t('dashboard.recentActivity.title')}</h2>
                <p className="text-sm mt-1" style={{ color: themeColors.text, opacity: 0.7 }}>{t('dashboard.recentActivity.subtitle')}</p>
              </div>
            </motion.div>

            <motion.div
              id="tour-activity-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="rounded-2xl border overflow-hidden"
              style={{
                backgroundColor: themeColors.cardBg,
                borderColor: `${themeColors.borderColor}33`
              }}
            >
              {activitiesLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="w-2 h-2 mt-2 rounded-full" style={{ backgroundColor: `${themeColors.borderColor}4D` }} />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 rounded w-3/4" style={{ backgroundColor: `${themeColors.borderColor}33` }} />
                        <div className="h-3 rounded w-1/2" style={{ backgroundColor: `${themeColors.borderColor}33` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="p-12 text-center">
                  <ClockIcon className="h-12 w-12 mx-auto mb-4" style={{ color: themeColors.text, opacity: 0.3 }} />
                  <p style={{ color: themeColors.text, opacity: 0.6 }}>{t('dashboard.recentActivity.empty')}</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {activities.map((activity, index) => (
                    <div key={index} style={{ borderBottom: index < activities.length - 1 ? `1px solid ${themeColors.borderColor}1A` : 'none' }}>
                      <ActivityItem
                        title={activity.title || t('dashboard.recentActivity.defaultTitle', { defaultValue: 'Actividad' })}
                        description={activity.description || t('dashboard.recentActivity.defaultDesc', { defaultValue: 'Sin descripción' })}
                        user={activity.user || t('dashboard.recentActivity.defaultUser', { defaultValue: 'Usuario' })}
                        timestamp={activity.timestamp || t('dashboard.recentActivity.defaultTime', { defaultValue: 'Hace un momento' })}
                        type={activity.type || 'system'}
                        delay={index}
                      />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </section>
        </div>

        {/* Sidebar - Quick Actions */}
        <div id="tour-quick-actions" className="xl:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="sticky top-24"
          >
            <div id="tour-quick-actions-list">
              <div className="mb-6">
                <h2 className="text-lg font-bold" style={{ color: themeColors.text }}>{t('dashboard.quickActions.title')}</h2>
                <p className="text-sm mt-1" style={{ color: themeColors.text, opacity: 0.7 }}>{t('dashboard.quickActions.subtitle')}</p>
              </div>

              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <QuickAction
                    key={action.title}
                    title={action.title}
                    description={action.description}
                    icon={action.icon}
                    href={action.href}
                    color={action.color}
                    delay={index}
                  />
                ))}
              </div>
            </div>

            {/* System Health Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-6 p-6 rounded-2xl"
              style={{
                backgroundColor: 'var(--org-card-background, #1E2329)'
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: '#00D4B3' }}
                >
                  <RocketLaunchIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--org-text-color, #FFFFFF)' }}>{t('dashboard.systemHealth.activeAccount')}</h3>
                  <p className="text-xs" style={{ color: '#00D4B3' }}>{t('dashboard.systemHealth.servicesOperational')}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--org-text-color, #FFFFFF)', opacity: 0.8 }}>{t('dashboard.systemHealth.users')}</span>
                  <span className="font-medium" style={{ color: '#00D4B3' }}>
                    {typeof stats?.activeUsers === 'object' ? stats.activeUsers.value : (stats?.activeUsers || 0)} {t('dashboard.systemHealth.active')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--org-text-color, #FFFFFF)', opacity: 0.8 }}>{t('dashboard.systemHealth.courses')}</span>
                  <span className="font-medium" style={{ color: '#00D4B3' }}>
                    {typeof stats?.assignedCourses === 'object' ? stats.assignedCourses.value : (stats?.assignedCourses || 0)} {t('dashboard.systemHealth.coursesAssigned', { defaultValue: 'asignados' })}
                  </span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span style={{ color: 'var(--org-text-color, #FFFFFF)', opacity: 0.8 }}>{t('dashboard.systemHealth.systemLabel', { defaultValue: 'Sistema' })}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#00D4B3' }} />
                    <span className="font-medium" style={{ color: '#00D4B3' }}>{t('dashboard.systemHealth.operationalLabel', { defaultValue: 'Operativo' })}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}