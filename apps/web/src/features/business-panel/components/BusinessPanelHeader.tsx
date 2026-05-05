'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown, LogOut, Building2, User, LayoutDashboard, Globe, ChevronRight, Check, Sun, Moon, Monitor, Compass, ShieldCheck } from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '../../auth/hooks/useAuth'
import { useUserProfile } from '../../auth/hooks/useUserProfile'
import { useBusinessSettings } from '../hooks/useBusinessSettings'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { hexToRgb } from '../utils/styles'
import { useLanguage } from '../../../core/providers/I18nProvider'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '../../../core/stores/themeStore'
import { useOrganization } from '../../../core/hooks/useOrganization'
import { useBusinessPanelTourOptional } from '../contexts/BusinessPanelTourContext'

interface BusinessPanelHeaderProps {
  onMenuClick: () => void
  title: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function BusinessPanelHeader({ onMenuClick }: BusinessPanelHeaderProps) {
  if (!onMenuClick || typeof onMenuClick !== 'function') {
    console.error('BusinessPanelHeader: onMenuClick debe ser una función')
    return null
  }

  const { styles, effectiveStyles } = useOrganizationStylesContext()
  const { data: businessData } = useBusinessSettings()
  const { user, logout } = useAuth()
  const { userProfile } = useUserProfile()
  const router = useRouter()
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation(['business', 'common'])
  const { theme, resolvedTheme, setTheme } = useThemeStore()
  const { canSwitch } = useOrganization()
  const panelTheme = useBusinessPanelTheme()
  const tourContext = useBusinessPanelTourOptional()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const languageOptions = [
    { value: 'es' as const, label: 'Español', flag: '🇲🇽' },
    { value: 'en' as const, label: 'English', flag: '🇺🇸' },
    { value: 'pt' as const, label: 'Português', flag: '🇧🇷' },
  ]

  const languageOptionsDisplay = [
    { value: 'es' as const, label: 'Español', flag: '🇲🇽' },
    { value: 'en' as const, label: 'English', flag: '🇺🇸' },
    { value: 'pt' as const, label: 'Português', flag: '🇧🇷' },
  ]
  const organization = businessData?.organization

  // Calcular estilos del navbar
  const navbarStyle = useMemo(() => {
    // Usar estilos efectivos (light/dark) o fallback a estilos base
    const panelStyles = effectiveStyles?.panel || styles?.panel

    if (!panelStyles) {
      const isDark = resolvedTheme === 'dark'
      return {
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        borderColor: isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(226, 232, 240, 0.8)',
        color: isDark ? '#f8fafc' : '#1E293B',
        hoverBg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      }
    }

    const sidebarBg = panelStyles?.sidebar_background || '#0f172a'
    const sidebarOpacity = panelStyles?.sidebar_opacity !== undefined ? panelStyles.sidebar_opacity : 0.85
    const borderColor = panelStyles?.border_color || 'rgba(71, 85, 105, 0.3)'
    const textColor = panelStyles?.text_color

    let backgroundColor: string
    if (sidebarBg && typeof sidebarBg === 'string' && sidebarBg.startsWith('#')) {
      const rgb = hexToRgb(sidebarBg)
      backgroundColor = `rgba(${rgb}, ${sidebarOpacity})`
    } else if (sidebarBg && typeof sidebarBg === 'string' && sidebarBg.startsWith('rgba')) {
      const rgbaMatch = sidebarBg.match(/rgba?\(([^)]+)\)/)
      if (rgbaMatch) {
        const parts = rgbaMatch[1].split(',')
        if (parts.length >= 3) {
          backgroundColor = `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${sidebarOpacity})`
        } else {
          backgroundColor = sidebarBg
        }
      } else {
        backgroundColor = sidebarBg
      }
    } else {
      backgroundColor = sidebarBg || 'rgba(15, 23, 42, 0.85)'
    }

    return {
      backgroundColor,
      borderColor,
      color: textColor,
      hoverBg: resolvedTheme === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)'
    }
  }, [styles, effectiveStyles, resolvedTheme])

  const getDisplayName = () => {
    return userProfile?.display_name ||
      userProfile?.first_name ||
      user?.display_name ||
      user?.username ||
      'Usuario'
  }

  const getInitials = () => {
    const name = getDisplayName()
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const handleLogout = async () => {
    if (logout && typeof logout === 'function') {
      await logout()
    }
    setUserDropdownOpen(false)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-[999] w-full border-b backdrop-blur-xl"
      style={{
        backgroundColor: navbarStyle.backgroundColor,
        borderColor: navbarStyle.borderColor,
      }}
    >
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Left: Logo y Nombre */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg transition-colors hover:opacity-80"
              style={{ color: navbarStyle.color || (resolvedTheme === 'light' ? '#1E293B' : 'rgba(255, 255, 255, 0.8)') }}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex min-w-0 items-center gap-2.5">
              {/* Logo */}
              <div className="relative flex items-center justify-center">
                {(organization?.brand_logo_url || organization?.logo_url || organization?.brand_favicon_url || organization?.favicon_url) ? (
                  <Image
                    src={organization?.brand_logo_url || organization?.logo_url || organization?.brand_favicon_url || organization?.favicon_url || '/icono.png'}
                    alt={organization?.name || 'Organización'}
                    width={180}
                    height={48}
                  className="h-10 w-auto max-w-[140px] rounded-lg object-contain sm:h-12 sm:max-w-[180px]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icono.png';
                    }}
                  />
                ) : (
                  <div
                    className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${panelTheme.actionColor}, ${panelTheme.secondaryColor})`
                    }}
                  >
                    <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                )}
              </div>

              {/* Nombre de la Organización */}
              {organization?.show_navbar_name !== false && (
                <h1
                  className="hidden min-w-0 truncate text-sm font-semibold sm:block sm:max-w-[300px] sm:text-base lg:max-w-[360px]"
                  style={{
                    color: navbarStyle.color || (resolvedTheme === 'light' ? '#1E293B' : 'rgba(255, 255, 255, 0.95)')
                  }}
                >
                  {organization?.name || t('business:header.myOrganization')}
                </h1>
              )}
            </div>
          </div>

          {/* Right: User Menu */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <motion.button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center justify-center p-1 rounded-full transition-all duration-200"
              style={{
                backgroundColor: userDropdownOpen ? navbarStyle.hoverBg : 'transparent'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center transition-all shadow-sm ring-2 ring-[#00D4B3]/30 hover:ring-[#00D4B3]/60"
                style={{
                  background: `linear-gradient(135deg, #0A2540, #00D4B3)`
                }}
              >
                {userProfile?.profile_picture_url || user?.profile_picture_url ? (
                  <Image
                    src={userProfile?.profile_picture_url || user?.profile_picture_url || ''}
                    alt={getDisplayName()}
                    width={36}
                    height={36}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-white">
                    {getInitials()}
                  </span>
                )}
              </div>
            </motion.button>

            {/* Dropdown */}
            <AnimatePresence>
              {userDropdownOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[998] bg-black/20 backdrop-blur-sm"
                    style={{ top: '64px' }}
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
                    className="absolute right-0 mt-2 w-56 rounded-xl border backdrop-blur-xl shadow-xl z-[1000] overflow-hidden"
                    style={{
                      backgroundColor: navbarStyle.backgroundColor,
                      borderColor: navbarStyle.borderColor,
                    }}
                  >
                    {/* User Info */}
                    <div
                      className="px-4 py-3 border-b"
                      style={{ borderColor: navbarStyle.borderColor }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center ring-2 ring-[#00D4B3]/40"
                          style={{
                            background: `linear-gradient(135deg, #0A2540, #00D4B3)`
                          }}
                        >
                          {userProfile?.profile_picture_url || user?.profile_picture_url ? (
                            <Image
                              src={userProfile?.profile_picture_url || user?.profile_picture_url || ''}
                              alt={getDisplayName()}
                              width={40}
                              height={40}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-white">
                              {getInitials()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-semibold truncate"
                            style={{ color: navbarStyle.color || undefined }}
                          >
                            {getDisplayName()}
                          </p>
                          <p
                            className="text-xs truncate opacity-70"
                            style={{ color: navbarStyle.color || undefined }}
                          >
                            {user?.cargo_rol?.toLowerCase() === 'administrador' 
                              ? t('business:header.superadminRole', { defaultValue: 'Superadmin' })
                              : t('business:header.administratorRole', { defaultValue: 'Administrador' })
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1.5 space-y-0.5">
                      {user?.cargo_rol?.toLowerCase() === 'administrador' && (
                        <motion.button
                          onClick={() => {
                            router.push('/admin/dashboard')
                            setUserDropdownOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                          style={{ color: navbarStyle.color || (resolvedTheme === 'light' ? '#1E293B' : 'rgba(255, 255, 255, 0.9)') }}
                          whileHover={{ x: 2, backgroundColor: navbarStyle.hoverBg }}
                        >
                          <ShieldCheck className="h-5 w-5 opacity-70" />
                          <span>{t('common:menu.adminPanel')}</span>
                        </motion.button>
                      )}

                      <motion.button
                        onClick={() => {
                          router.push(`/${orgSlug}/business-user/dashboard`)
                          setUserDropdownOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                        style={{ color: navbarStyle.color || (resolvedTheme === 'light' ? '#1E293B' : 'rgba(255, 255, 255, 0.9)') }}
                        whileHover={{ x: 2, backgroundColor: navbarStyle.hoverBg }}
                      >
                        <LayoutDashboard className="h-5 w-5 opacity-70" />
                        <span>{t('business:header.userPanel')}</span>
                      </motion.button>

                      {canSwitch && (
                        <motion.button
                          onClick={() => {
                            router.push('/auth/select-organization')
                            setUserDropdownOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                          style={{ color: navbarStyle.color || (resolvedTheme === 'light' ? '#1E293B' : 'rgba(255, 255, 255, 0.9)') }}
                          whileHover={{ x: 2, backgroundColor: navbarStyle.hoverBg }}
                        >
                          <Building2 className="h-5 w-5 opacity-70" />
                          <span>{t('common:profileDropdown.organizations')}</span>
                        </motion.button>
                      )}

                      <motion.button
                        onClick={() => {
                          router.push('/profile')
                          setUserDropdownOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                        style={{ color: navbarStyle.color || (resolvedTheme === 'light' ? '#1E293B' : 'rgba(255, 255, 255, 0.9)') }}
                        whileHover={{ x: 2, backgroundColor: navbarStyle.hoverBg }}
                      >
                        <User className="h-5 w-5 opacity-70" />
                        <span>{t('business:header.editProfile')}</span>
                      </motion.button>

                      {/* Tema - submenu expandible */}
                      <div className="relative">
                        <motion.button
                          onClick={() => setActiveSubmenu(activeSubmenu === 'theme' ? null : 'theme')}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                          style={{ color: navbarStyle.color || (resolvedTheme === 'light' ? '#1E293B' : 'rgba(255, 255, 255, 0.9)') }}
                          whileHover={{ x: 2, backgroundColor: navbarStyle.hoverBg }}
                        >
                          {resolvedTheme === 'dark' ? <Moon className="h-5 w-5 opacity-70" /> : <Sun className="h-5 w-5 opacity-70" />}
                          <span className="flex-1 text-left">{t('common:profileDropdown.theme')}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs opacity-70">{t(`common:menu.theme.${theme}`)}</span>
                            <ChevronRight className={`h-3.5 w-3.5 opacity-70 transition-transform ${activeSubmenu === 'theme' ? 'rotate-90' : ''}`} />
                          </div>
                        </motion.button>
                        <AnimatePresence>
                          {activeSubmenu === 'theme' && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                              style={{ backgroundColor: navbarStyle.hoverBg }}
                            >
                              {[
                                { value: 'light' as const, label: t('common:menu.theme.light'), icon: Sun },
                                { value: 'dark' as const, label: t('common:menu.theme.dark'), icon: Moon },
                                { value: 'system' as const, label: t('common:menu.theme.system'), icon: Monitor },
                              ].map((option) => {
                                const ThemeIcon = option.icon
                                const isActive = theme === option.value
                                return (
                                  <button
                                    key={option.value}
                                    onClick={() => { setTheme(option.value) }}
                                    className="w-full flex items-center gap-3 px-10 py-2 text-xs transition-colors"
                                    style={{
                                      color: isActive ? panelTheme.actionColor : (navbarStyle.color || (resolvedTheme === 'light' ? '#475569' : 'rgba(255, 255, 255, 0.7)'))
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = navbarStyle.hoverBg}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    <ThemeIcon className="h-3.5 w-3.5" />
                                    <span>{option.label}</span>
                                    {isActive && <Check className="h-3 w-3 ml-auto" />}
                                  </button>
                                )
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>



                      <div className="relative">
                        <motion.button
                          onClick={() => setActiveSubmenu(activeSubmenu === 'language' ? null : 'language')}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                          style={{ color: navbarStyle.color || (resolvedTheme === 'light' ? '#1E293B' : 'rgba(255, 255, 255, 0.9)') }}
                          whileHover={{ x: 2, backgroundColor: navbarStyle.hoverBg }}
                        >
                          <Globe className="h-5 w-5 opacity-70" />
                          <span className="flex-1 text-left">{t('common:language')}</span>
                          <div className="flex items-center gap-1">
                          <span className="text-xs">{languageOptions.find(l => l.value === language)?.flag}</span>
                            <ChevronRight
                              className={`h-3.5 w-3.5 transition-transform ${activeSubmenu === 'language' ? 'rotate-90' : ''}`}
                              style={{ opacity: 0.7 }}
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
                              style={{ backgroundColor: navbarStyle.hoverBg }}
                            >
                              {languageOptions.map((opt) => {
                                const isActive = language === opt.value
                                return (
                                  <button
                                    key={opt.value}
                                    onClick={() => {
                                      setLanguage(opt.value)
                                      setActiveSubmenu(null)
                                    }}
                                    className="w-full flex items-center gap-3 px-10 py-2 text-xs transition-colors"
                                    style={{
                                      color: isActive ? panelTheme.actionColor : (navbarStyle.color || (resolvedTheme === 'light' ? '#475569' : 'rgba(255, 255, 255, 0.7)'))
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = navbarStyle.hoverBg}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    <span>{opt.flag}</span>
                                    <span>{opt.label}</span>
                                    {isActive && <Check className="h-3 w-3 ml-auto" />}
                                  </button>
                                )
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="my-1 border-t" style={{ borderColor: navbarStyle.borderColor }} />
                      <motion.button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 dark:text-red-400 transition-colors hover:bg-red-500/10"
                        whileHover={{ x: 2 }}
                      >
                        <LogOut className="h-5 w-5" />
                        <span>{t('business:header.logout')}</span>
                      </motion.button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
