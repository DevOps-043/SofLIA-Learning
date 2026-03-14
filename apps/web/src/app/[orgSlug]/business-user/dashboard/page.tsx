'use client'

import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import {
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  GraduationCap,
  TrendingUp,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useOrganizationStyles } from '@/features/business-panel/hooks/useOrganizationStyles'
import { getBackgroundStyle, generateCSSVariables } from '@/features/business-panel/utils/styles'
import { useThemeStore } from '@/core/stores/themeStore'

// Removed old tour hook
import { useBusinessUserJoyride } from '@/features/tours/hooks/useBusinessUserJoyride'
import Joyride from 'react-joyride'

import { useTranslation } from 'react-i18next'
import { TeamRequiredBanner } from '@/features/business-panel/components/hierarchy/TeamRequiredBanner'

// Lazy load components - Removed heavy 3D/Particles backgrounds for performance
const ModernNavbar = lazy(() =>
  import('./components/ModernNavbar').then(m => ({ default: m.ModernNavbar }))
)
const ModernStatsCard = lazy(() =>
  import('./components/ModernStatsCard').then(m => ({ default: m.ModernStatsCard }))
)
const CourseCard3D = lazy(() =>
  import('./components/CourseCard3D').then(m => ({ default: m.CourseCard3D }))
)


interface DashboardStats {
  total_assigned: number
  in_progress: number
  completed: number
  certificates: number
}

interface AssignedCourse {
  id: string
  course_id: string
  title: string
  instructor: string
  progress: number
  status: 'Asignado' | 'En progreso' | 'Completado'
  thumbnail: string
  slug: string
  assigned_at: string
  due_date?: string
  completed_at?: string
  has_certificate?: boolean
}

interface Organization {
  id: string
  name: string
  slug: string
  logo_url?: string | null
  favicon_url?: string | null
  show_navbar_name?: boolean
}

type OrgRole = 'owner' | 'admin' | 'member' | null

export default function BusinessUserDashboardPage() {
  const router = useRouter()
  const params = useParams()
  const orgSlug = params?.orgSlug as string | undefined
  const { user, logout } = useAuth()
  const { t, i18n } = useTranslation('business')
  const { effectiveStyles } = useOrganizationStyles()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [orgRole, setOrgRole] = useState<OrgRole>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Aplicar estilos personalizados (usando effectiveStyles que respeta modo claro/oscuro)
  const userDashboardStyles = effectiveStyles?.userDashboard
  const backgroundStyle = getBackgroundStyle(userDashboardStyles)
  const cssVariables = generateCSSVariables(userDashboardStyles)

  // Tour inicializado
  const { joyrideProps, startTour: restartTour } = useBusinessUserJoyride()
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])

  // Colores personalizados de la organización con detección de modo
  const { resolvedTheme } = useThemeStore()
  const isSystemLightMode = resolvedTheme === 'light'

  const orgColors = useMemo(() => {
    // Definir defaults basados en el tema resuelto (resolvedTheme)
    // El resolvedTheme ya contiene la preferencia del usuario (Light o Dark)
    const isLightMode = resolvedTheme === 'light'
    
    // Si NO hay estilos de DB explícitos, usamos los defaults según el isLightMode
    const defaultCardBg = isLightMode ? '#FFFFFF' : '#1E2329'
    const defaultSidebarBg = isLightMode ? '#F8FAFC' : '#0F1419'
    const defaultText = isLightMode ? '#0F172A' : '#FFFFFF'
    const defaultBorder = isLightMode ? '#E2E8F0' : '#334155'
    
    // Obtener los colores directos si existen en DB
    // Nota: El useOrganizationStyles() idealmente ya retorna los colores en su versión 
    // "Light" si isLightMode es true (a través de effectiveStyles)
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
      // Colores secundarios que se adaptan al modo
      textSecondary: isLightMode ? '#64748B' : '#9CA3AF',
      textMuted: isLightMode ? '#94A3B8' : '#6B7280',
      // Color de iconos: aqua en modo oscuro para visibilidad (SOFLIA Design System)
      iconColor: isLightMode
        ? (dbPrimary || '#0A2540')
        : (dbAccent || '#00D4B3'),
      heroBg: isLightMode
        ? 'linear-gradient(135deg, #0A2540 0%, #173B63 50%, #0A2540 100%)' // Ensure contrast
        : 'linear-gradient(135deg, #0a1628 0%, #0f1e30 50%, #0d1a2a 100%)',
      heroOverlay: isLightMode
        ? 'linear-gradient(to right, rgba(10, 37, 64, 0.95) 0%, rgba(10, 37, 64, 0.7) 50%, transparent 100%)'
        : 'linear-gradient(to right, rgba(10, 22, 40, 0.9) 0%, rgba(10, 22, 40, 0.5) 50%, transparent 100%)',
      gridPattern: isLightMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
    }
  }, [userDashboardStyles, resolvedTheme])

  const [stats, setStats] = useState<DashboardStats>({
    total_assigned: 0,
    in_progress: 0,
    completed: 0,
    certificates: 0
  })
  const [assignedCourses, setAssignedCourses] = useState<AssignedCourse[]>([])

  // Time update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Obtener saludo basado en hora
  const getGreeting = useCallback(() => {
    const hour = currentTime.getHours()
    if (hour < 12) return t('dashboard.greetings.morning')
    if (hour < 18) return t('dashboard.greetings.afternoon')
    return t('dashboard.greetings.evening')
  }, [currentTime, t])

  // Obtener información de la organización y rol del usuario usando el orgSlug de la URL
  useEffect(() => {
    const fetchOrganization = async () => {
      if (!orgSlug) return

      try {
        // Use the org-scoped API to get organization info and user role
        const response = await fetch(`/api/${orgSlug}/organization`, { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.organization) {
            setOrganization({
              ...data.organization,
              slug: orgSlug // Asegurar que el slug esté presente
            })
            // El rol del usuario en esta organización viene de la API
            if (data.userRole) {
              setOrgRole(data.userRole as OrgRole)
            }
          }
        }
      } catch (error) {
        // Silent fail
      }
    }
    fetchOrganization()
  }, [orgSlug])

  const myStats = useMemo(() => [
    { label: t('dashboard.stats.assignedCourses', 'Cursos Asignados'), value: stats.total_assigned, icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
    { label: t('dashboard.stats.inProgress', 'En Progreso'), value: stats.in_progress, icon: Clock, color: 'from-purple-500 to-pink-500' },
    { label: t('dashboard.stats.completed', 'Completados'), value: stats.completed, icon: CheckCircle2, color: 'from-green-500 to-emerald-500' },
    { label: t('dashboard.stats.certificates', 'Certificados'), value: stats.certificates, icon: Award, color: 'from-orange-500 to-red-500' },
  ], [stats, t])

  const fetchDashboardData = useCallback(async () => {
    if (!orgSlug) {
      setError('No se pudo determinar la organización')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // CRITICAL: Use the org-scoped API to ensure proper data isolation
      const response = await fetch(`/api/${orgSlug}/business-user/dashboard`, { credentials: 'include' })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}: Error al cargar datos del dashboard`)
      }

      if (data.success) {
        setStats(data.stats)
        setAssignedCourses(data.courses || [])
      } else {
        if (data.stats && data.courses) {
          setStats(data.stats)
          setAssignedCourses(data.courses)
        } else {
          throw new Error(data.error || 'Error al obtener datos')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setStats({ total_assigned: 0, in_progress: 0, completed: 0, certificates: 0 })
      setAssignedCourses([])
    } finally {
      setLoading(false)
    }
  }, [orgSlug])

  // Fetch dashboard data when orgSlug is available
  useEffect(() => {
    if (orgSlug) {
      fetchDashboardData()
    }
  }, [orgSlug, fetchDashboardData])

  const handleCourseClick = useCallback((course: AssignedCourse, action?: 'start' | 'continue' | 'certificate') => {
    if (action === 'certificate' && course.has_certificate) {
      fetch('/api/certificates', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.certificates) {
            const certificate = data.certificates.find((cert: any) => cert.course_id === course.course_id)
            if (certificate) {
              router.push(`/certificates/${certificate.certificate_id}`)
            } else {
              router.push('/certificates')
            }
          } else {
            router.push('/certificates')
          }
        })
        .catch(() => router.push('/certificates'))
    } else if (!course.slug) {
      return
    } else {
      router.push(`/courses/${course.slug}/learn`)
    }
  }, [router])

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

  const getDisplayName = useCallback(() => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user?.display_name || user?.username || 'Usuario'
  }, [user])

  const getInitials = useCallback(() => {
    const firstName = user?.first_name || ''
    const lastName = user?.last_name || ''
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }
    return (user?.username || 'U').charAt(0).toUpperCase()
  }, [user])

  // Loading state - simplified without infinite animations
  if (loading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{
          background: orgColors.sidebarBg
        }}
      >
        <div className="flex flex-col items-center gap-8">
          {/* Simple loading indicator */}
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${orgColors.primary}15, ${orgColors.accent}15)`,
                border: `2px solid ${orgColors.accent}50`
              }}
            />
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="w-8 h-8" style={{ color: orgColors.accent }} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold" style={{ color: orgColors.text }}>{t('common.loading', 'Cargando...')}</p>
            <p className="text-sm mt-2" style={{ color: orgColors.textSecondary }}>{t('common.preparingExperience', 'Preparando tu experiencia...')}</p>
          </div>
        </div>
      </main>
    )
  }

  // Error state
  if (error) {
    return (
      <main
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: orgColors.sidebarBg }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 max-w-md text-center p-8 rounded-2xl border border-red-500/20 backdrop-blur-xl"
          style={{ backgroundColor: orgColors.cardBg }}
        >
          <div className="p-4 rounded-full bg-red-500/10">
            <AlertCircle className="w-12 h-12 text-red-400" />
          </div>
          <div>
            <p className="text-red-400 text-xl font-semibold">Error al cargar datos</p>
            <p className="text-sm mt-2" style={{ color: orgColors.textSecondary }}>{error}</p>
          </div>
          <motion.button
            onClick={fetchDashboardData}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium"
            style={{
              background: `linear-gradient(135deg, ${orgColors.primary}, ${orgColors.accent})`,
              boxShadow: `0 4px 20px ${orgColors.primary}50`,
              color: '#FFFFFF'
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </motion.button>
        </motion.div>
      </main>
    )
  }

  // Calcular el margen derecho basado en el estado del panel LIA
  // const contentMarginRight = isPanelOpen && !isCollapsed ? `${panelWidth}px` : '0' // Removed LIA logic

  return (
    <div
      className="min-h-screen"
      style={{
        ...cssVariables,
        // Usar solo 'background' para evitar conflicto con 'backgroundColor'
        background: backgroundStyle?.background || backgroundStyle?.backgroundColor || orgColors.sidebarBg
      } as React.CSSProperties}
    >
      {/* Modern Navbar - Siempre ocupa el ancho completo, NO se desplaza */}
      <Suspense fallback={
        <nav
          className="sticky top-0 z-50 w-full backdrop-blur-xl h-16"
          style={{
            backgroundColor: orgColors.sidebarBg,
            borderBottom: `1px solid ${orgColors.border}`
          }}
        />
      }>
        <ModernNavbar
          organization={organization}
          user={user}
          orgRole={orgRole}
          getDisplayName={getDisplayName}
          getInitials={getInitials}
          onProfileClick={handleProfileClick}
          onLogout={handleLogout}
          styles={userDashboardStyles}
          onRestartTour={restartTour}
        />
      </Suspense>

      {/* Main Content */}
      <main
        className="relative overflow-hidden min-h-[calc(100vh-4rem)]"
      >
        {/* Background gradient - static, no heavy effects */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${orgColors.primary}08 0%, transparent 50%)`,
          }}
        />

        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20 py-8">

          {/* Banner de equipo requerido */}
          <TeamRequiredBanner orgSlug={orgSlug} />

          {/* ============================================ */}
          {/* HERO SECTION - Premium Design */}
          {/* ============================================ */}
          <div id="tour-hero-section" className="scroll-mt-28 mb-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-3xl p-8 group"
            >
              {/* Background with layered gradients - no image dependency */}
              <div className="absolute inset-0 z-0 overflow-hidden"
                style={{
                  backgroundColor: orgColors.primary !== '#FFFFFF' ? orgColors.primary : '#0A2540'
                }}
              >
                {/* Background Image */}
                <Image
                  src="/images/teams-header.png"
                  alt="Learning Panel Background"
                  fill
                  className="object-cover opacity-50"
                  priority
                />

                {/* Gradient Overlay for Depth & Text Contrast */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/20 to-transparent pointer-events-none z-0"
                />

                {/* Subtle grid pattern */}
                <div
                  className="absolute inset-0 opacity-[0.1]"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px'
                  }}
                />

                {/* Accent glow on right side */}
                <div
                  className="absolute -right-20 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px]"
                  style={{ backgroundColor: `${orgColors.accent}20` }}
                />

                {/* Secondary glow */}
                <div
                  className="absolute right-1/4 bottom-0 w-64 h-64 rounded-full blur-[100px]"
                  style={{ backgroundColor: `${orgColors.primary}15` }}
                />
              </div>

              {/* Decorative elements */}
              <div
                className="absolute top-6 right-12 w-2 h-2 rounded-full z-10"
                style={{ backgroundColor: orgColors.accent }}
              />
              <div
                className="absolute bottom-8 right-24 w-1.5 h-1.5 rounded-full z-10 opacity-60"
                style={{ backgroundColor: orgColors.primary }}
              />
              <div
                className="absolute top-1/2 right-16 w-1 h-1 rounded-full z-10 opacity-40"
                style={{ backgroundColor: orgColors.primary }}
              />
              <div
                className="absolute bottom-12 right-32 w-3 h-3 rounded-full"
                style={{ backgroundColor: `${orgColors.primary}40` }}
              />

              {/* Content */}
              <div className="relative z-10">


                {/* Greeting */}
                <motion.h1
                  className="text-3xl lg:text-4xl xl:text-5xl font-bold mb-3"
                  style={{ color: '#FFFFFF' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {getGreeting()},{' '}
                  <span
                    className="text-white"
                  >
                    {user?.first_name || 'Usuario'}
                  </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  className="text-lg max-w-xl mb-6"
                  style={{ color: 'rgba(255,255,255,0.8)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {t('dashboard.subtitle')}
                </motion.p>

                {/* Date and Status */}
                <motion.div
                  className="flex flex-wrap items-center gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div
                    className="flex items-center gap-2 text-sm"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    <Clock className="w-4 h-4" />
                    {currentTime.toLocaleDateString(i18n.language === 'en' ? 'en-US' : (i18n.language === 'pt' ? 'pt-BR' : 'es-MX'), {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: orgColors.accent }}
                    />
                    <span className="text-sm font-medium" style={{ color: orgColors.accent }}>{t('dashboard.systemActive')}</span>
                  </div>
                </motion.div>
              </div>

              {/* Decorative border gradient */}
              <div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, ${orgColors.primary}50, transparent, ${orgColors.primary}30)`,
                  padding: '1px',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                  WebkitMaskComposite: 'xor'
                }}
              />
            </motion.div>
          </div>

          {/* ============================================ */}
          {/* STATS SECTION - Premium Cards */}
          {/* ============================================ */}
          {/* Envoltura dedicada para el tour para asegurar posicionamiento correcto */}
          <div id="tour-stats-section" className="scroll-mt-32 relative">
            <section className="mb-10">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-between mb-6"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-xl border"
                    style={{
                      background: `linear-gradient(135deg, ${orgColors.iconColor}25, ${orgColors.iconColor}08)`,
                      borderColor: `${orgColors.iconColor}30`
                    }}
                  >
                    <TrendingUp className="w-5 h-5" style={{ color: orgColors.iconColor }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: orgColors.text }}>{t('dashboard.generalStats', 'Tu Progreso')}</h2>
                    <p className="text-sm" style={{ color: orgColors.textSecondary }}>{t('dashboard.keyMetrics', 'Métricas de tu aprendizaje')}</p>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <Suspense fallback={
                  <>
                    {myStats.map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-2xl p-5 animate-pulse h-32"
                        style={{
                          backgroundColor: orgColors.cardBg,
                          border: `1px solid ${orgColors.border}`
                        }}
                      />
                    ))}
                  </>
                }>
                  {myStats.map((stat, index) => {
                    const isCertificates = stat.label === 'Certificados'
                    return (
                      <ModernStatsCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        icon={stat.icon}
                        color={stat.color}
                        index={index}
                        onClick={isCertificates && stats.certificates > 0 ? handleCertificatesClick : undefined}
                        isClickable={isCertificates && stats.certificates > 0}
                        styles={userDashboardStyles}
                        id={index === 0 ? 'tour-stat-courses' : index === 3 ? 'tour-stat-certificates' : undefined}
                      />
                    )
                  })}
                </Suspense>
              </div>
            </section>
          </div>

          {/* ============================================ */}
          {/* COURSES SECTION - Premium Grid */}
          {/* ============================================ */}
          <section>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between mb-6"
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-xl border"
                  style={{
                    background: `linear-gradient(135deg, ${orgColors.iconColor}25, ${orgColors.iconColor}08)`,
                    borderColor: `${orgColors.iconColor}30`
                  }}
                >
                  <GraduationCap className="w-5 h-5" style={{ color: orgColors.iconColor }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: orgColors.text }}>{t('sidebar.courses')}</h2>
                  <p className="text-sm" style={{ color: orgColors.textSecondary }}>{t('dashboard.quickActions.assignCourses.desc', 'Continúa donde lo dejaste')}</p>
                </div>
              </div>
            </motion.div>

            {assignedCourses.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-2xl backdrop-blur-xl p-12 text-center"
                style={{
                  backgroundColor: orgColors.cardBg,
                  border: `1px solid ${orgColors.border}`
                }}
              >
                {/* Decorative gradient */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${orgColors.primary}15, transparent 60%)`
                  }}
                />

                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="relative z-10"
                >
                  <div
                    className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border"
                    style={{
                      backgroundColor: `${orgColors.iconColor}15`,
                      borderColor: `${orgColors.iconColor}30`
                    }}
                  >
                    <BookOpen className="w-10 h-10" style={{ color: orgColors.iconColor }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: orgColors.text }}>{t('dashboard.emptyCourses.title', 'No tienes cursos asignados aún')}</h3>
                  <p className="max-w-md mx-auto" style={{ color: orgColors.textSecondary }}>
                    {t('dashboard.emptyCourses.description', 'Tu organización te asignará cursos próximamente. Mientras tanto, explora lo que tenemos preparado para ti.')}
                  </p>

                  {/* Decorative elements - static */}
                  <div className="absolute top-6 right-6">
                    <Sparkles className="w-5 h-5" style={{ color: `${orgColors.iconColor}50` }} />
                  </div>
                  <div className="absolute bottom-8 left-8">
                    <GraduationCap className="w-6 h-6" style={{ color: `${orgColors.iconColor}50` }} />
                  </div>
                </motion.div>

                {/* Border gradient */}
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, ${orgColors.primary}30, transparent, ${orgColors.accent}15)`,
                    padding: '1px',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    WebkitMaskComposite: 'xor'
                  }}
                />
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                <Suspense fallback={
                  <>
                    {assignedCourses.map((_, index) => (
                      <div
                        key={index}
                        className="rounded-2xl animate-pulse h-80"
                        style={{
                          backgroundColor: orgColors.cardBg,
                          border: `1px solid ${orgColors.border}`
                        }}
                      />
                    ))}
                  </>
                }>
                  {assignedCourses.map((course, index) => (
                    <CourseCard3D
                      key={course.id}
                      course={course}
                      index={index}
                      onClick={() => handleCourseClick(course)}
                      onCertificateClick={
                        course.progress === 100 && course.has_certificate
                          ? () => handleCourseClick(course, 'certificate')
                          : undefined
                      }
                      styles={userDashboardStyles}
                    />
                  ))}
                </Suspense>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Tour de bienvenida Joyride */}
      {isMounted && <Joyride {...joyrideProps} />}
    </div>
  )
}
