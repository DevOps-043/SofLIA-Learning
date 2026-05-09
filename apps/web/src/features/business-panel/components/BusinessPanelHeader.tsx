'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Menu, LogOut, Building2, User, LayoutDashboard, Globe, ChevronRight, Check, Sun, Moon, Monitor, ShieldCheck } from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
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
import { NotificationBell } from '@/core/components/NotificationBell'
import { UserDropdown } from '@/core/components/UserDropdown'

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
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation(['business', 'common'])
  const { theme, resolvedTheme, setTheme } = useThemeStore()
  const { canSwitch } = useOrganization()
  const panelTheme = useBusinessPanelTheme()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const languageOptions = [
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

  // Dropdown logic removed in favor of global UserDropdown component

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

          {/* Right: User Menu & Notifications */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <NotificationBell />

            <UserDropdown />
          </div>
        </div>
      </div>
    </motion.header>
  )
}
