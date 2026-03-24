'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  ChevronDown,
  Edit3,
  LogOut,
  Building2,
  Menu,
  X,
  Sparkles,
  User,
  Users,
  Settings,
  LayoutDashboard,
  CalendarDays,
  CalendarPlus,
  Globe,
  Check,
  ChevronRight,
  Zap,
  Sun,
  Moon,
  Monitor
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { StyleConfig } from '@/features/business-panel/hooks/useOrganizationStyles'
import { hexToRgb } from '@/features/business-panel/utils/styles'
import { useLanguage } from '@/core/providers/I18nProvider'
import { useTranslation } from 'react-i18next'
import { useThemeStore, Theme } from '@/core/stores/themeStore'

interface ModernNavbarProps {
  organization: {
    id: string
    name: string
    slug: string
    logo_url?: string | null
    favicon_url?: string | null
    show_navbar_name?: boolean
  } | null
  user: {
    profile_picture_url?: string | null
    first_name?: string | null
    last_name?: string | null
    display_name?: string | null
    username?: string | null
    email?: string | null
    cargo_rol?: string | null
  } | null
  /** Rol del usuario dentro de la organización actual (owner/admin/member) */
  orgRole?: 'owner' | 'admin' | 'member' | 'superadmin' | null
  getDisplayName: () => string
  getInitials: () => string
  onProfileClick: () => void
  onLogout: () => void
  styles?: StyleConfig | null
  onRestartTour?: () => void
}

export function ModernNavbar({
  organization,
  user,
  orgRole,
  getDisplayName,
  getInitials,
  onProfileClick,
  onLogout,
  styles,
  onRestartTour
}: ModernNavbarProps) {
  // El usuario puede ver el panel de administración si es owner o admin de la organización
  const canAccessAdminPanel = orgRole === 'owner' || orgRole === 'admin' || orgRole === 'superadmin'
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const [hasStudyPlan, setHasStudyPlan] = useState<boolean | null>(null)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation('business')
  const { theme, setTheme, resolvedTheme, initializeTheme } = useThemeStore()

  // Detectar cuando el componente está montado (para portals)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Inicializar el tema
  useEffect(() => {
    initializeTheme()
  }, [initializeTheme])

  // Verificar si el usuario tiene un plan de estudio
  useEffect(() => {
    const checkStudyPlan = async () => {
      try {
        const response = await fetch('/api/study-planner/status', {
          cache: 'no-store',
          headers: {
            'Pragma': 'no-cache'
          }
        })
        if (response.ok) {
          const data = await response.json()
          setHasStudyPlan(!!data.hasPlan)
        } else {
          setHasStudyPlan(false)
        }
      } catch (error) {
        console.error('Error checking study plan:', error)
        setHasStudyPlan(false)
      }
    }

    // Cargar al abrir cualquier menú (desktop o móvil) o si aún es null
    if ((userDropdownOpen || mobileMenuOpen) && hasStudyPlan === null) {
      checkStudyPlan()
    }
  }, [userDropdownOpen, mobileMenuOpen, hasStudyPlan])


  // Colores SOFLIA por defecto con soporte para colores personalizados
  const colors = useMemo(() => {
    const isLight = resolvedTheme === 'light'

    const primaryColor = styles?.primary_button_color || '#0A2540'
    const accentColor = styles?.accent_color || '#00D4B3'

    // Adaptar colores según el tema
    const textColor = isLight ? '#0F172A' : (styles?.text_color || '#FFFFFF')
    const cardBg = isLight ? '#FFFFFF' : (styles?.card_background || '#1E2329')
    const sidebarBg = isLight ? '#FFFFFF' : (styles?.sidebar_background || '#0F1419')

    const sidebarOpacity = styles?.sidebar_opacity !== undefined ? styles.sidebar_opacity : 0.95

    let navBgColor: string
    if (sidebarBg.startsWith('#')) {
      const rgb = hexToRgb(sidebarBg)
      navBgColor = `rgba(${rgb}, ${sidebarOpacity})`
    } else {
      navBgColor = sidebarBg
    }

    return {
      primary: primaryColor,
      accent: accentColor,
      text: textColor,
      cardBg,
      navBg: navBgColor,
      border: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)',
      borderActive: `${accentColor}40`,
      gradientStart: primaryColor,
      gradientEnd: accentColor,
      isLightMode: isLight
    }
  }, [styles, resolvedTheme])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Contenido del Menú Móvil
  const mobileMenuContent = (
    <AnimatePresence>
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="md:hidden fixed inset-x-0 top-16 bottom-0 z-[100] overflow-y-auto"
          style={{
            backgroundColor: colors.cardBg,
            borderTop: `1px solid ${colors.border}`
          }}
        >
          <div className="px-4 py-4 space-y-2">
            {/* User Info Card */}
            <div
              className="flex items-center gap-3 p-3 rounded-xl mb-3"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}15, ${colors.accent}10)`,
                border: `1px solid ${colors.border}`
              }}
            >
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
                }}
              >
                {user?.profile_picture_url ? (
                  <Image
                    src={user.profile_picture_url}
                    alt={getDisplayName()}
                    width={48}
                    height={48}
                    className="h-full w-full rounded-xl object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-white">
                    {getInitials()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{getDisplayName()}</p>
                <p className="text-xs text-white/60 truncate">{user?.email || ''}</p>
              </div>
            </div>

            {/* Panel Administración - Solo visible para owners y admins de la organización */}
            {canAccessAdminPanel && (
              <motion.button
                onClick={() => {
                  router.push(`/${organization?.slug || ''}/business-panel/dashboard`)
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
                whileTap={{ scale: 0.98 }}
                style={{
                  backgroundColor: `${colors.primary}10`,
                  border: `1px solid ${colors.border}`
                }}
              >
                <div
                  className="p-2 rounded-xl text-white flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
                  }}
                >
                  <LayoutDashboard className="h-4 w-4" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <span className="text-white font-medium block text-sm">{t('header.adminPanel')}</span>
                  <span className="text-xs text-white/50">{t('header.manageOrganization')}</span>
                </div>
              </motion.button>
            )}

            {/* Study Planner */}
            {hasStudyPlan !== null && (
              <motion.button
                onClick={() => {
                  router.push(hasStudyPlan ? '/study-planner/dashboard' : '/study-planner/create')
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
                whileTap={{ scale: 0.98 }}
                style={{
                  backgroundColor: `${colors.accent}10`,
                  border: `1px solid ${colors.border}`
                }}
              >
                <div
                  className="p-2 rounded-xl text-white flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`
                  }}
                >
                  {hasStudyPlan ? (
                    <CalendarDays className="h-4 w-4" />
                  ) : (
                    <CalendarPlus className="h-4 w-4" />
                  )}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <span className="text-white font-medium block text-sm">
                    {hasStudyPlan ? t('header.myPlanner') : t('header.createStudyPlan')}
                  </span>
                  <span className="text-xs text-white/50">
                    {hasStudyPlan ? t('header.viewSchedule') : t('header.organizeLearning')}
                  </span>
                </div>
              </motion.button>
            )}



            {/* Mis Organizaciones */}
            <motion.button
              onClick={() => {
                router.push('/auth/select-organization')
                setMobileMenuOpen(false)
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
              whileTap={{ scale: 0.98 }}
              style={{
                backgroundColor: `${colors.primary}10`,
                border: `1px solid ${colors.border}`
              }}
            >
              <div
                className="p-2 rounded-xl text-white flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
                }}
              >
                <Building2 className="h-4 w-4" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <span className="text-white font-medium block text-sm">Mis organizaciones</span>
                <span className="text-xs text-white/50">Cambiar de organización</span>
              </div>
            </motion.button>

            {/* Editar Perfil */}
            <motion.button
              onClick={() => {
                onProfileClick()
                setMobileMenuOpen(false)
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
              whileTap={{ scale: 0.98 }}
              style={{
                backgroundColor: `${colors.primary}10`,
                border: `1px solid ${colors.border}`
              }}
            >
              <div
                className="p-2 rounded-xl flex-shrink-0"
                style={{ backgroundColor: `${colors.accent}20` }}
              >
                <User className="h-4 w-4" style={{ color: colors.accent }} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <span className="text-white font-medium block text-sm">{t('header.editProfile')}</span>
                <span className="text-xs text-white/50">{t('header.updateInfo')}</span>
              </div>
            </motion.button>

            {/* Restart Tour Mobile */}
            {onRestartTour && (
              <motion.button
                onClick={() => {
                  onRestartTour()
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
                whileTap={{ scale: 0.98 }}
                style={{
                  backgroundColor: `${colors.primary}10`,
                  border: `1px solid ${colors.border}`
                }}
              >
                <div
                  className="p-2 rounded-xl flex-shrink-0"
                  style={{ backgroundColor: `${colors.accent}20` }}
                >
                  <Zap className="h-4 w-4" style={{ color: colors.accent }} />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <span className="text-white font-medium block text-sm">Ver Tour</span>
                  <span className="text-xs text-white/50">Reiniciar el tour guiado</span>
                </div>
              </motion.button>
            )}


            {/* Language Selector */}
            <div className="px-3 py-2">
              <div className="flex items-center gap-2 mb-2 px-1">
                <Globe className="w-3.5 h-3.5 opacity-70" style={{ color: colors.text }} />
                <span className="text-xs font-medium opacity-70" style={{ color: colors.text }}>{t('header.language')}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['es', 'en', 'pt'] as const).map((lang) => (
                  <motion.button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className="relative overflow-hidden rounded-xl py-2 text-sm font-medium transition-colors border"
                    style={{
                      backgroundColor: language === lang ? `${colors.accent}15` : 'transparent',
                      borderColor: language === lang ? `${colors.accent}30` : colors.border,
                      color: language === lang ? colors.accent : `${colors.text}60`
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {lang.toUpperCase()}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Theme Selector */}
            <div className="px-3 py-2">
              <div className="flex items-center gap-2 mb-2 px-1">
                {resolvedTheme === 'dark' ? (
                  <Moon className="w-3.5 h-3.5 opacity-70" style={{ color: colors.text }} />
                ) : (
                  <Sun className="w-3.5 h-3.5 opacity-70" style={{ color: colors.text }} />
                )}
                <span className="text-xs font-medium opacity-70" style={{ color: colors.text }}>Tema</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'light' as Theme, label: 'Claro', icon: Sun },
                  { value: 'dark' as Theme, label: 'Oscuro', icon: Moon },
                  { value: 'system' as Theme, label: 'Auto', icon: Monitor },
                ]).map((option) => {
                  const ThemeIcon = option.icon
                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className="relative overflow-hidden rounded-xl py-2 text-sm font-medium transition-colors border flex items-center justify-center gap-1.5"
                      style={{
                        backgroundColor: theme === option.value ? `${colors.accent}15` : 'transparent',
                        borderColor: theme === option.value ? `${colors.accent}30` : colors.border,
                        color: theme === option.value ? colors.accent : `${colors.text}60`
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ThemeIcon className="w-3 h-3" />
                      {option.label}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Cerrar Sesión */}
            <motion.button
              onClick={() => {
                onLogout()
                setMobileMenuOpen(false)
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
              whileTap={{ scale: 0.98 }}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.15)'
              }}
            >
              <div className="p-2 rounded-xl flex-shrink-0" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                <LogOut className="h-4 w-4 text-red-400" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <span className="text-red-400 font-medium block text-sm">{t('header.logout')}</span>
                <span className="text-xs text-white/50">{t('header.exitAccount')}</span>
              </div>
            </motion.button>
          </div>

          {/* Footer decorativo */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <nav
        className="sticky top-0 z-[120] w-full backdrop-blur-xl"
        style={{
          backgroundColor: colors.navBg,
        }}
      >
        {/* Gradient border bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${colors.accent}30, ${colors.primary}30, transparent)`
          }}
        />

        <div className="w-full max-w-[1920px] mx-auto pl-2 pr-4 sm:pl-4 sm:pr-6 lg:pl-6 lg:pr-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Logo y Nombre */}
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex items-center gap-3"
              >
                {/* Logo con efecto premium */}
                <div className="relative">
                  {(organization?.favicon_url || organization?.logo_url) ? (
                    <motion.div
                      className="relative h-16 w-auto min-w-[36px] flex items-center justify-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <Image
                        src={organization.logo_url || organization.favicon_url || '/icono.png'}
                        alt={organization.name}
                        width={64}
                        height={64}
                        className="object-contain h-full w-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/icono.png';
                        }}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      className="h-11 w-11 rounded-xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                        boxShadow: `0 4px 20px ${colors.primary}30`
                      }}
                      whileHover={{ scale: 1.05, rotate: 2 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <Building2 className="h-6 w-6 text-white" />
                    </motion.div>
                  )}

                  {/* Indicador de activo */}
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                    style={{
                      backgroundColor: colors.accent,
                      borderColor: colors.isLightMode ? colors.cardBg : (colors.navBg.includes('rgba') ? colors.cardBg : colors.navBg)
                    }}
                  />
                </div>

                {/* Nombre y subtítulo */}
                {organization?.show_navbar_name !== false && (
                  <div className="hidden sm:block">
                    <h1
                      className="text-lg font-bold leading-tight tracking-tight"
                      style={{ color: colors.text }}
                    >
                      {organization?.name || t('header.myOrganization')}
                    </h1>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Sparkles
                        className="w-3 h-3"
                        style={{ color: colors.accent }}
                      />
                      <p
                        className="text-xs font-medium"
                        style={{ color: `${colors.accent}CC` }}
                      >
                        {t('header.learningPanel')}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right: User Menu */}
            <div className="flex items-center gap-3">
              {/* Desktop User Menu */}
              <div className="hidden md:block relative" ref={dropdownRef}>
                <motion.button
                  id="tour-user-dropdown-trigger"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center justify-center transition-all duration-300 p-1"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                      boxShadow: `0 4px 15px ${colors.primary}40`
                    }}
                  >
                    {user?.profile_picture_url ? (
                      <Image
                        src={user.profile_picture_url}
                        alt={getDisplayName()}
                        width={40}
                        height={40}
                        className="h-full w-full rounded-xl object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {getInitials()}
                      </span>
                    )}
                  </div>
                </motion.button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[998] bg-black/5 backdrop-blur-[1px]"
                        onClick={() => {
                          setUserDropdownOpen(false)
                          setActiveSubmenu(null)
                        }}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-64 rounded-xl border backdrop-blur-xl shadow-xl z-[999] overflow-hidden"
                        style={{
                          backgroundColor: colors.navBg,
                          borderColor: colors.border,
                        }}
                      >
                        {/* User Info Header */}
                        <div className="px-4 py-3 border-b" style={{ borderColor: colors.border }}>
                          <div className="flex items-center gap-3">
                            <div
                              className="h-10 w-10 rounded-full flex items-center justify-center ring-2"
                              style={{
                                background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
                              }}
                            >
                              {user?.profile_picture_url ? (
                                <Image
                                  src={user.profile_picture_url}
                                  alt={getDisplayName()}
                                  width={40}
                                  height={40}
                                  className="h-full w-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-bold text-white">
                                  {getInitials()}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-semibold truncate"
                                style={{ color: colors.text }}
                              >
                                {getDisplayName()}
                              </p>
                              <p
                                className="text-xs truncate"
                                style={{ color: colors.isLightMode ? '#64748B' : 'rgba(255, 255, 255, 0.7)' }}
                              >
                                {user?.email || ''}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1.5">
                          {/* Panel Administración - Solo visible para owners y admins de la organización */}
                          {canAccessAdminPanel && (
                            <motion.button
                              onClick={() => {
                                router.push(`/${organization?.slug || ''}/business-panel/dashboard`)
                                setUserDropdownOpen(false)
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                              style={{ color: colors.text }}
                              whileHover={{ x: 2, backgroundColor: colors.isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)' }}
                            >
                              <LayoutDashboard className="h-4 w-4 opacity-70" />
                              <div className="flex-1 text-left">
                                <span className="block">{t('header.adminPanel')}</span>
                              </div>
                            </motion.button>
                          )}

                          {hasStudyPlan !== null && (
                            <motion.button
                              onClick={() => {
                                router.push(hasStudyPlan ? '/study-planner/dashboard' : '/study-planner/create')
                                setUserDropdownOpen(false)
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                              style={{ color: colors.text }}
                              whileHover={{ x: 2, backgroundColor: colors.isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)' }}
                            >
                              {hasStudyPlan ? (
                                <CalendarDays className="h-4 w-4 opacity-70" />
                              ) : (
                                <CalendarPlus className="h-4 w-4 opacity-70" />
                              )}
                              <span className="block">{hasStudyPlan ? t('header.myPlanner') : t('header.createStudyPlan')}</span>
                            </motion.button>
                          )}



                          <motion.button
                            onClick={() => {
                              router.push('/auth/select-organization')
                              setUserDropdownOpen(false)
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                            style={{ color: colors.text }}
                            whileHover={{ x: 2, backgroundColor: colors.isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)' }}
                          >
                            <Building2 className="h-4 w-4 opacity-70" />
                            <span>Mis organizaciones</span>
                          </motion.button>

                          <motion.button
                            onClick={() => {
                              onProfileClick()
                              setUserDropdownOpen(false)
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                            style={{ color: colors.text }}
                            whileHover={{ x: 2, backgroundColor: colors.isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)' }}
                          >
                            <User className="h-4 w-4 opacity-70" />
                            <span>{t('header.editProfile')}</span>
                          </motion.button>

                          {/* Restart Tour Button */}
                          {onRestartTour && (
                            <motion.button
                              onClick={() => {
                                onRestartTour()
                                setUserDropdownOpen(false)
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                              style={{ color: colors.text }}
                              whileHover={{ x: 2, backgroundColor: colors.isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)' }}
                            >
                              <Zap className="h-4 w-4 opacity-70" />
                              <span>Ver Tour</span>
                            </motion.button>
                          )}


                          {/* Language Submenu */}
                          <div className="relative">
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveSubmenu(activeSubmenu === 'language' ? null : 'language')
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                              style={{ color: colors.text }}
                              whileHover={{ x: 2, backgroundColor: colors.isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)' }}
                            >
                              <Globe className="h-4 w-4 opacity-70" />
                              <span className="flex-1 text-left">{t('header.language')}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs opacity-70">
                                  {language.toUpperCase()}
                                </span>
                                <ChevronRight
                                  className={`h-3.5 w-3.5 opacity-70 transition-transform ${activeSubmenu === 'language' ? 'rotate-90' : ''}`}
                                />
                              </div>
                            </motion.button>

                            <AnimatePresence>
                              {activeSubmenu === 'language' && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                  style={{ backgroundColor: colors.isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.2)' }}
                                >
                                  {(['es', 'en', 'pt'] as const).map((lang) => (
                                    <button
                                      key={lang}
                                      onClick={() => {
                                        setLanguage(lang)
                                        setActiveSubmenu(null)
                                      }}
                                      className="w-full flex items-center gap-3 px-10 py-2 text-xs transition-colors"
                                      style={{
                                        color: language === lang ? colors.accent : colors.text,
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                      <span>{lang === 'es' ? '🇪🇸' : lang === 'en' ? '🇺🇸' : '🇧🇷'}</span>
                                      <span className="capitalize">{lang === 'es' ? 'Español' : lang === 'en' ? 'English' : 'Português'}</span>
                                      {language === lang && <Check className="h-3 w-3 ml-auto" />}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Theme Submenu */}
                          <div className="relative">
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveSubmenu(activeSubmenu === 'theme' ? null : 'theme')
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                              style={{ color: colors.text }}
                              whileHover={{ x: 2, backgroundColor: colors.isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)' }}
                            >
                              {resolvedTheme === 'dark' ? (
                                <Moon className="h-4 w-4 opacity-70" />
                              ) : (
                                <Sun className="h-4 w-4 opacity-70" />
                              )}
                              <span className="flex-1 text-left">Tema</span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs opacity-70">
                                  {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Auto'}
                                </span>
                                <ChevronRight
                                  className={`h-3.5 w-3.5 opacity-70 transition-transform ${activeSubmenu === 'theme' ? 'rotate-90' : ''}`}
                                />
                              </div>
                            </motion.button>

                            <AnimatePresence>
                              {activeSubmenu === 'theme' && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                  style={{ backgroundColor: colors.isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.2)' }}
                                >
                                  {([
                                    { value: 'light' as Theme, label: 'Claro', icon: Sun },
                                    { value: 'dark' as Theme, label: 'Oscuro', icon: Moon },
                                    { value: 'system' as Theme, label: 'Sistema', icon: Monitor },
                                  ]).map((option) => {
                                    const ThemeIcon = option.icon
                                    return (
                                      <button
                                        key={option.value}
                                        onClick={() => {
                                          setTheme(option.value)
                                          setActiveSubmenu(null)
                                        }}
                                        className="w-full flex items-center gap-3 px-10 py-2 text-xs transition-colors"
                                        style={{ color: theme === option.value ? colors.accent : colors.text }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                      >
                                        <ThemeIcon className="h-3.5 w-3.5" />
                                        <span>{option.label}</span>
                                        {theme === option.value && <Check className="h-3 w-3 ml-auto" />}
                                      </button>
                                    )
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div className="my-1 border-t" style={{ borderColor: colors.border }} />

                          <motion.button
                            onClick={() => {
                              onLogout()
                              setUserDropdownOpen(false)
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            whileHover={{ x: 2 }}
                          >
                            <LogOut className="h-4 w-4" />
                            <span>{t('header.logout')}</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Button */}
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl border-2 transition-all duration-300"
                style={{
                  backgroundColor: mobileMenuOpen ? `${colors.primary}15` : 'transparent',
                  borderColor: mobileMenuOpen ? colors.borderActive : colors.border
                }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {mobileMenuOpen ? (
                    <X className="h-5 w-5" style={{ color: colors.accent }} />
                  ) : (
                    <Menu className="h-5 w-5" style={{ color: `${colors.text}80` }} />
                  )}
                </motion.div>
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Renderizar menú móvil con Portal */}
      {mounted && createPortal(mobileMenuContent, document.body)}
    </>
  )
}
