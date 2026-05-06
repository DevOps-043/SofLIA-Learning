'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun, Moon, Monitor, Check, Globe, ChevronRight,
  LogOut, Shield, User, Building2, LayoutDashboard,
  LucideIcon
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/hooks/useAuth'
import { useThemeStore, Theme } from '@/core/stores/themeStore'
import { useOrganization } from '@/core/hooks/useOrganization'
import { useLanguage } from '@/core/providers/I18nProvider'
import { getOrganizationUserDashboardPath } from '@/core/utils/organizationNavigation'

interface AdminUserDropdownProps {
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
    profile_picture_url?: string
    cargo_rol: string
    organization?: {
      name: string
      slug: string
    }
  }
}

const LANGUAGE_OPTIONS = [
  { value: 'es' as const, label: 'Español', flag: '🇲🇽' },
  { value: 'en' as const, label: 'English', flag: '🇺🇸' },
  { value: 'pt' as const, label: 'Português', flag: '🇧🇷' },
]

const THEME_OPTIONS: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

export function AdminUserDropdown({ user }: AdminUserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState(false)
  const handleAvatarError = useCallback(() => setAvatarError(true), [])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { logout } = useAuth()
  const { t } = useTranslation(['common', 'business'])
  const { theme, setTheme, resolvedTheme, initializeTheme } = useThemeStore()
  const { canSwitch, currentOrganization } = useOrganization()
  const { language, setLanguage } = useLanguage()

  useEffect(() => {
    initializeTheme()
  }, [initializeTheme])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setActiveSubmenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await logout()
      router.push('/auth')
    } catch (error) {
      // silenced
    }
  }, [logout, router])

  const handleNavigation = useCallback((path: string) => {
    router.push(path)
    setIsOpen(false)
    setActiveSubmenu(null)
  }, [router])

  const handleUserPanelNavigation = useCallback(() => {
    if (currentOrganization?.slug) {
      handleNavigation(getOrganizationUserDashboardPath(currentOrganization.slug))
      return
    }

    handleNavigation('/auth/select-organization?redirect=/business-user/dashboard')
  }, [currentOrganization?.slug, handleNavigation])

  const getInitials = () => {
    const firstName = user.first_name || ''
    const lastName = user.last_name || ''
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getDisplayName = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user.email
  }

  const getCurrentThemeIcon = () => {
    if (theme === 'system') return Monitor
    return resolvedTheme === 'dark' ? Moon : Sun
  }

  const hoverBackground = resolvedTheme === 'light' ? 'rgba(10,37,64,0.05)' : 'rgba(0,212,179,0.08)'

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <motion.button
        id="tour-user-dropdown-trigger"
        onClick={() => { setIsOpen(!isOpen); setActiveSubmenu(null) }}
        className="flex items-center justify-center p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative">
          <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#00D4B3]/30 hover:ring-[#00D4B3]/60 transition-all duration-300">
            {user.profile_picture_url && !avatarError ? (
              <img
                src={user.profile_picture_url}
                alt={getDisplayName()}
                className="w-full h-full object-cover"
                onError={handleAvatarError}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center">
                <span className="text-white text-xs font-semibold">{getInitials()}</span>
              </div>
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10B981] rounded-full border-2 border-white dark:border-[#0F1419]" />
        </div>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => { setIsOpen(false); setActiveSubmenu(null) }}
            />

            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              className="absolute right-0 top-full mt-2 w-[260px] rounded-2xl border backdrop-blur-xl shadow-xl z-50 overflow-hidden bg-white dark:bg-[#1E2329] border-gray-200 dark:border-[#334155]"
            >
              {/* Header - User Info */}
              <div className="p-4 border-b border-gray-200 dark:border-[#334155] bg-gray-50/70 dark:bg-[#0A0D12]/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#00D4B3]/40 flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, #0A2540, #00D4B3)` }}
                  >
                    {user.profile_picture_url && !avatarError ? (
                      <img src={user.profile_picture_url} alt={getDisplayName()} className="w-full h-full rounded-full object-cover" onError={handleAvatarError} />
                    ) : (
                      <span className="text-white font-semibold text-sm">{getInitials()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{getDisplayName()}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1.5 space-y-0.5">
                {/* Panel de Administración */}
                {user.cargo_rol?.toLowerCase() === 'administrador' && (
                  <DropdownMenuItem
                    icon={Shield}
                    label={t('common:menu.adminPanel')}
                    onClick={() => handleNavigation('/admin/dashboard')}
                    hoverBackground={hoverBackground}
                  />
                )}

                {/* Panel Usuario */}
                <DropdownMenuItem
                  icon={LayoutDashboard}
                  label={t('business:header.userPanel', { defaultValue: 'Panel Usuario' })}
                  onClick={handleUserPanelNavigation}
                  hoverBackground={hoverBackground}
                />

                {/* Mis organizaciones */}
                {canSwitch && (
                  <DropdownMenuItem
                    icon={Building2}
                    label={t('common:profileDropdown.organizations')}
                    onClick={() => handleNavigation('/auth/select-organization')}
                    hoverBackground={hoverBackground}
                  />
                )}

                {/* Editar perfil */}
                <DropdownMenuItem
                  icon={User}
                  label={t('common:menu.profile')}
                  onClick={() => handleNavigation('/profile')}
                  hoverBackground={hoverBackground}
                />

                {/* Tema - con submenu como el panel de usuario */}
                <div className="relative">
                  <DropdownMenuItem
                    icon={getCurrentThemeIcon()}
                    label={t('common:profileDropdown.theme')}
                    rightElement={
                      <div className="flex items-center gap-1">
                        <span className="text-xs opacity-70">{t(`common:menu.theme.${theme}`)}</span>
                        <ChevronRight className={`h-3.5 w-3.5 opacity-70 transition-transform ${activeSubmenu === 'theme' ? 'rotate-90' : ''}`} />
                      </div>
                    }
                    onClick={() => setActiveSubmenu(activeSubmenu === 'theme' ? null : 'theme')}
                    hoverBackground={hoverBackground}
                  />
                  <AnimatePresence>
                    {activeSubmenu === 'theme' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                        style={{ backgroundColor: resolvedTheme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.2)' }}
                      >
                        {THEME_OPTIONS.map((option) => {
                          const ThemeIcon = option.icon
                          const isActive = theme === option.value
                          return (
                            <button
                              key={option.value}
                              onClick={() => { setTheme(option.value) }}
                              className="w-full flex items-center gap-3 px-10 py-2 text-xs transition-colors"
                              style={{ color: isActive ? '#00D4B3' : (resolvedTheme === 'light' ? '#334155' : 'rgba(255,255,255,0.8)') }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hoverBackground }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                            >
                              <ThemeIcon className="h-3.5 w-3.5" />
                              <span>{t(`common:menu.theme.${option.value}`)}</span>
                              {isActive && <Check className="h-3 w-3 ml-auto" />}
                            </button>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Idioma - con submenu como el panel de usuario */}
                <div className="relative">
                  <DropdownMenuItem
                    icon={Globe}
                    label={t('common:language')}
                    rightElement={
                      <div className="flex items-center gap-1">
                        <span className="text-xs opacity-70">{language.toUpperCase()}</span>
                        <ChevronRight className={`h-3.5 w-3.5 opacity-70 transition-transform ${activeSubmenu === 'language' ? 'rotate-90' : ''}`} />
                      </div>
                    }
                    onClick={() => setActiveSubmenu(activeSubmenu === 'language' ? null : 'language')}
                    hoverBackground={hoverBackground}
                  />
                  <AnimatePresence>
                    {activeSubmenu === 'language' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                        style={{ backgroundColor: resolvedTheme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.2)' }}
                      >
                        {LANGUAGE_OPTIONS.map((opt) => {
                          const isActive = language === opt.value
                          return (
                            <button
                              key={opt.value}
                              onClick={() => { setLanguage(opt.value) }}
                              className="w-full flex items-center gap-3 px-10 py-2 text-xs transition-colors"
                              style={{ color: isActive ? '#00D4B3' : (resolvedTheme === 'light' ? '#334155' : 'rgba(255,255,255,0.8)') }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hoverBackground }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
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

                <div className="-mx-2 my-1 border-t border-gray-200 dark:border-[#334155]" />

                {/* Cerrar sesión */}
                <motion.button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 dark:text-red-400 transition-colors hover:bg-red-500/10"
                  whileHover={{ x: 2 }}
                >
                  <LogOut className="h-5 w-5" />
                  <span>{t('common:menu.logout')}</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Reusable MenuItem component matching user panel design
interface DropdownMenuItemProps {
  icon: LucideIcon
  label: string
  onClick: () => void
  rightElement?: React.ReactNode
  hoverBackground: string
}

function DropdownMenuItem({ icon: Icon, label, onClick, rightElement, hoverBackground }: DropdownMenuItemProps) {
  return (
    <motion.button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-gray-900 dark:text-white"
      whileHover={{ x: 2, backgroundColor: hoverBackground }}
    >
      <Icon className="h-5 w-5 opacity-70" />
      <span className="flex-1 text-left">{label}</span>
      {rightElement}
    </motion.button>
  )
}
