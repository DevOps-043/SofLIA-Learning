'use client'

import { motion } from 'framer-motion'
import {
  UsersIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  ClockIcon,
  EyeIcon,
  PlusIcon,
  BellAlertIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { useAdminStats } from '../hooks/useAdminStats'
import { useState, useEffect } from 'react'
import { formatRelativeTime } from '@/core/utils/date-utils'
import Link from 'next/link'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'

// ============================================
// COMPONENTE: StatCard Premium
// ============================================
interface StatCardProps {
  title: string
  value: string | number
  change: number
  icon: React.ComponentType<any>
  gradient: string
  delay: number
  href?: string
  themeColors?: any
}

function StatCard({ title, value, change, icon: Icon, gradient, delay, href, themeColors }: StatCardProps) {
  const isPositive = change >= 0
  const bgColor = themeColors?.cardBackground || '#1E2329'
  const textColor = themeColors?.textPrimary || 'white'
  const subTextColor = themeColors?.textSecondary || '#6C757D'
  const borderColor = themeColors?.borderColor || '#6C757D'

  const CardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: delay * 0.1,
        duration: 0.5,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{
        y: -5,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className="relative group overflow-hidden rounded-2xl border p-6 cursor-pointer"
      style={{ 
        backgroundColor: bgColor,
        borderColor: `${borderColor}20` // 20 hex opacity
      }}
    >
      {/* Gradient Background Effect */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`} />

      {/* Glow Effect */}
      <motion.div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[#00D4B3]/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <motion.div
            className={`p-3 rounded-xl ${gradient} shadow-lg`}
            whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
          >
            <Icon className="h-6 w-6 text-white" />
          </motion.div>

          {/* Change Badge */}
          <motion.div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isPositive
                ? 'bg-[#10B981]/20 text-[#10B981]'
                : 'bg-red-500/20 text-red-400'
              }`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay * 0.1 + 0.3, type: "spring" }}
          >
            {isPositive ? (
              <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
            ) : (
              <ArrowTrendingDownIcon className="h-3.5 w-3.5" />
            )}
            {isPositive ? '+' : ''}{change}%
          </motion.div>
        </div>

        <motion.h3
          className="text-3xl font-bold mb-1 tracking-tight"
          style={{ color: textColor }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay * 0.1 + 0.2 }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </motion.h3>

        <p className="text-sm font-medium" style={{ color: subTextColor }}>{title}</p>

        {/* Animated line */}
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#00D4B3] to-[#0A2540]"
          initial={{ width: 0 }}
          animate={{ width: '30%' }}
          transition={{ delay: delay * 0.1 + 0.4, duration: 0.8 }}
        />
      </div>
    </motion.div>
  )

  if (href) {
    return <Link href={href}>{CardContent}</Link>
  }

  return CardContent
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
  themeColors?: any
}

function QuickAction({ title, description, icon: Icon, href, color, delay, themeColors }: QuickActionProps) {
  const bgColor = themeColors?.inputBg || '#1E2329'
  const textColor = themeColors?.textPrimary || 'white'
  const subTextColor = themeColors?.textSecondary || '#6C757D'
  const borderColor = themeColors?.borderColor || '#6C757D'
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay * 0.1 + 0.5, duration: 0.4 }}
    >
      <Link href={href}>
        <motion.div
          whileHover={{ x: 5, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-4 p-4 rounded-xl border hover:border-[#00D4B3]/50 transition-all duration-300 group"
          style={{ 
            backgroundColor: bgColor,
            borderColor: `${borderColor}20`,
            color: textColor 
          }}
        >
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm group-hover:text-[#00D4B3] transition-colors" style={{ color: textColor }}>
              {title}
            </h4>
            <p className="text-xs mt-0.5" style={{ color: subTextColor }}>{description}</p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="text-[#00D4B3]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.div>
        </motion.div>
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
  themeColors?: any
}

function ActivityItem({ title, description, user, timestamp, type, delay, themeColors }: ActivityItemProps) {
  const textColor = themeColors?.textPrimary || 'white'
  const subTextColor = themeColors?.textSecondary || '#6C757D'
  const hoverBg = themeColors?.cardBackground === '#FFFFFF' ? '#F1F5F9' : '#1E2329'
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user': return 'bg-[#0A2540] border-[#0A2540]/50'
      case 'workshop': return 'bg-[#10B981] border-[#10B981]/50'
      case 'ai-app': return 'bg-[#00D4B3] border-[#00D4B3]/50'
      case 'news': return 'bg-[#F59E0B] border-[#F59E0B]/50'
      default: return 'bg-[#6C757D] border-[#6C757D]/50'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay * 0.08, duration: 0.4 }}
      whileHover={{ y: -2, backgroundColor: hoverBg }}
      className="flex items-start gap-4 p-4 rounded-xl transition-all duration-300 border-l-2 border-transparent hover:border-[#00D4B3]"
    >
      <div className={`w-2 h-2 mt-2 rounded-full ${getTypeColor(type)}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-4">
          <h4 className="font-medium text-sm truncate" style={{ color: textColor }}>{title}</h4>
          <div className="flex items-center gap-1 text-xs whitespace-nowrap" style={{ color: subTextColor }}>
            <ClockIcon className="h-3.5 w-3.5" />
            {timestamp}
          </div>
        </div>
        <p className="text-xs mt-1 line-clamp-1" style={{ color: subTextColor }}>{description}</p>
        <p className="text-[#00D4B3] text-xs mt-1 font-medium">por {user}</p>
      </div>
    </motion.div>
  )
}

// ============================================
// COMPONENTE PRINCIPAL: AdminDashboard
// ============================================
export function AdminDashboard() {
  const { stats: dbStats, isLoading, error } = useAdminStats()
  const { profile } = useProfile()
  const [activities, setActivities] = useState<any[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Obtener tema del usuario (light/dark)
  const { resolvedTheme } = useThemeStore()
  const isLightTheme = resolvedTheme === 'light'
  
  // Obtener estilos de la organización para el tema
  const { styles: orgStyles } = useOrganizationStylesContext()
  const panelStyles = orgStyles?.panel
  
  // Colores del tema - Priorizar preferencia del usuario sobre estilo de organización si hay conflicto
  const themeColors = {
    background: isLightTheme ? (panelStyles?.background_value && panelStyles.background_value !== '#0F1419' ? panelStyles.background_value : '#F8FAFC') : '#0F1419',
    cardBackground: isLightTheme ? (panelStyles?.card_background && panelStyles.card_background !== '#1E2329' ? panelStyles.card_background : '#FFFFFF') : '#1E2329',
    textPrimary: isLightTheme ? '#1E293B' : '#FFFFFF',
    textSecondary: isLightTheme ? '#64748B' : '#6C757D',
    borderColor: isLightTheme ? '#E2E8F0' : '#6C757D',
    inputBg: isLightTheme ? '#F1F5F9' : '#1E2329',
  }

  // Actualizar la hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Cargar actividad reciente
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch('/api/admin/activity/recent?limit=8')
        const data = await res.json()
        if (data.success && data.activities) {
          setActivities(data.activities)
        }
      } catch (err) {
        console.error('Error fetching activities:', err)
      } finally {
        setActivitiesLoading(false)
      }
    }
    fetchActivities()
    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, [])

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const getUserName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`
    }
    if (profile?.display_name) {
      return profile.display_name
    }
    if (profile?.first_name) {
      return profile.first_name
    }
    if (profile?.username) {
      return profile.username
    }
    return 'Administrador'
  }

  const statsData = dbStats ? [
    {
      title: 'Usuarios Totales',
      value: dbStats.totalUsers,
      change: dbStats.userGrowth,
      icon: UsersIcon,
      gradient: 'bg-gradient-to-br from-[#0A2540] to-[#0A2540]/80',
      href: '/admin/users'
    },
    {
      title: 'Cursos Activos',
      value: dbStats.activeCourses,
      change: dbStats.courseGrowth,
      icon: BookOpenIcon,
      gradient: 'bg-gradient-to-br from-[#10B981] to-[#10B981]/80',
      href: '/admin/workshops'
    },
    {
      title: 'Empresas Activas',
      value: dbStats.totalOrganizations || 0,
      change: dbStats.organizationGrowth || 0,
      icon: BuildingOffice2Icon,
      gradient: 'bg-gradient-to-br from-[#00D4B3] to-[#00D4B3]/80',
      href: '/admin/companies'
    },
    {
      title: 'Engagement',
      value: `${dbStats.engagementRate}%`,
      change: dbStats.engagementGrowth,
      icon: ChartBarIcon,
      gradient: 'bg-gradient-to-br from-[#8B5CF6] to-[#8B5CF6]/80',
      href: '/admin/lia-analytics'
    },
  ] : []

  const quickActions = [
    {
      title: 'Crear Nuevo Curso',
      description: 'Añade un nuevo taller a la plataforma',
      icon: PlusIcon,
      href: '/admin/workshops/new',
      color: 'bg-[#10B981]'
    },
    {
      title: 'Gestionar Usuarios',
      description: 'Administra permisos y roles',
      icon: UsersIcon,
      href: '/admin/users',
      color: 'bg-[#0A2540]'
    },
    {
      title: 'Gestionar Empresas',
      description: 'Administra organizaciones B2B',
      icon: BuildingOffice2Icon,
      href: '/admin/companies',
      color: 'bg-[#00D4B3]'
    },
    {
      title: 'Ver Analytics',
      description: 'Métricas avanzadas de la IA',
      icon: ChartBarIcon,
      href: '/admin/lia-analytics',
      color: 'bg-[#8B5CF6]'
    },
    {
      title: 'Ver Reportes',
      description: 'Reportes y métricas del sistema',
      icon: DocumentTextIcon,
      href: '/admin/reportes',
      color: 'bg-[#F59E0B]'
    },
  ]

  return (
    <div className="p-6 lg:p-8 min-h-screen transition-colors duration-300" style={{ backgroundColor: themeColors.background }}>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A2540] via-[#0A2540] to-[#0A2540]/90 p-8 mb-8"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D4B3] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00D4B3] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Animated Particles */}
        <motion.div
          animate={{
            y: [0, -10, 0],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-10 right-20 w-2 h-2 bg-[#00D4B3] rounded-full"
        />
        <motion.div
          animate={{
            y: [0, 10, 0],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          className="absolute bottom-10 right-40 w-3 h-3 bg-[#00D4B3] rounded-full"
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <SparklesIcon className="h-6 w-6 text-[#00D4B3]" />
            </motion.div>
            <span className="text-[#00D4B3] text-sm font-medium tracking-wide uppercase">
              Panel de Control
            </span>
          </div>

          <motion.h1
            className="text-3xl lg:text-4xl font-bold text-white mb-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {getGreeting()}, {getUserName()}
          </motion.h1>

          <motion.p
            className="text-white/70 text-lg max-w-xl"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            Gestiona tu plataforma de aprendizaje con IA. Tienes el control total.
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
              {currentTime.toLocaleDateString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
              <span className="text-[#10B981] text-sm font-medium">Sistema Operativo</span>
            </div>
          </motion.div>
        </div>

        {/* Decorative Shield */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block"
        >
          <ShieldCheckIcon className="h-48 w-48 text-white" />
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-8">
          {/* Stats Grid */}
          <section>
            <motion.div
              className="flex items-center justify-between mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div>
                <h2 className="text-xl font-bold" style={{ color: themeColors.textPrimary }}>Estadísticas Generales</h2>
                <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>Métricas clave de la plataforma</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 text-[#00D4B3] text-sm font-medium rounded-lg border border-[#00D4B3]/30 hover:bg-[#00D4B3]/10 transition-colors"
                style={{ backgroundColor: themeColors.cardBackground }}
              >
                Ver Reportes
              </motion.button>
            </motion.div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ backgroundColor: themeColors.cardBackground }} />
                ))}
              </div>
            ) : error ? (
              <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl">
                <p className="text-red-400">Error al cargar estadísticas: {error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statsData.map((stat, index) => (
                  <StatCard
                    key={stat.title}
                    title={stat.title}
                    value={stat.value}
                    change={stat.change}
                    icon={stat.icon}
                    gradient={stat.gradient}
                    delay={index}
                    href={stat.href}
                    themeColors={themeColors}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Activity Section */}
          <section>
            <motion.div
              className="flex items-center justify-between mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div>
                <h2 className="text-xl font-bold" style={{ color: themeColors.textPrimary }}>Actividad Reciente</h2>
                <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>Últimas acciones en la plataforma</p>
              </div>
              <Link href="/admin/activity">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 text-[#00D4B3] text-sm font-medium hover:underline"
                >
                  <EyeIcon className="h-4 w-4" />
                  Ver todo
                </motion.button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="rounded-2xl border overflow-hidden"
              style={{ 
                backgroundColor: themeColors.cardBackground,
                borderColor: `${themeColors.borderColor}20`
              }}
            >
              {activitiesLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="w-2 h-2 mt-2 rounded-full" style={{ backgroundColor: `${themeColors.textSecondary}30` }} />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 rounded w-3/4" style={{ backgroundColor: `${themeColors.textSecondary}20` }} />
                        <div className="h-3 rounded w-1/2" style={{ backgroundColor: `${themeColors.textSecondary}20` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="p-12 text-center">
                  <BellAlertIcon className="h-12 w-12 mx-auto mb-4" style={{ color: `${themeColors.textSecondary}50` }} />
                  <p style={{ color: themeColors.textSecondary }}>No hay actividad reciente</p>
                </div>
              ) : (
                <div className="divide-y">
                  {activities.map((activity, index) => {
                    const user = activity.users || {}
                    const userName = user.display_name ||
                      `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
                      user.username || 'Usuario'

                    return (
                      <ActivityItem
                        key={activity.notification_id}
                        title={activity.title || 'Actividad'}
                        description={activity.message || 'Sin descripción'}
                        user={userName}
                        timestamp={formatRelativeTime(activity.created_at)}
                        type={activity.notification_type?.includes('user') ? 'user' :
                          activity.notification_type?.includes('course') ? 'workshop' :
                            activity.notification_type?.includes('ai') ? 'ai-app' :
                              activity.notification_type?.includes('news') ? 'news' : 'system'}
                        delay={index}
                        themeColors={themeColors}
                      />
                    )
                  })}
                </div>
              )}
            </motion.div>
          </section>
        </div>

        {/* Sidebar - Quick Actions */}
        <div className="xl:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="sticky top-24"
          >
            <div className="mb-6">
              <h2 className="text-lg font-bold" style={{ color: themeColors.textPrimary }}>Acciones Rápidas</h2>
              <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>Accesos directos</p>
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
                  themeColors={themeColors}
                />
              ))}
            </div>

            {/* System Health Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-[#10B981]/20 to-[#10B981]/5 border border-[#10B981]/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-2 bg-[#10B981] rounded-lg"
                >
                  <RocketLaunchIcon className="h-5 w-5 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-white font-semibold">Sistema Saludable</h3>
                  <p className="text-[#10B981] text-xs">Todos los servicios activos</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6C757D]">API</span>
                  <span className="text-[#10B981] font-medium">Operativo</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6C757D]">Base de Datos</span>
                  <span className="text-[#10B981] font-medium">Operativo</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6C757D]">SofLIA (IA)</span>
                  <span className="text-[#10B981] font-medium">Activo</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
