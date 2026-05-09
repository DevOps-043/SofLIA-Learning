'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Building2, Menu } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { NotificationBell } from '@/core/components/NotificationBell'
import { UserDropdown } from '@/core/components/UserDropdown'
import { useThemeStore } from '../../../core/stores/themeStore'
import { useBusinessSettings } from '../hooks/useBusinessSettings'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { hexToRgb } from '../utils/styles'

interface BusinessPanelHeaderProps {
  onMenuClick: () => void
  title: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function BusinessPanelHeader({ onMenuClick }: BusinessPanelHeaderProps) {
  if (!onMenuClick || typeof onMenuClick !== 'function') {
    console.error('BusinessPanelHeader: onMenuClick debe ser una funcion')
    return null
  }

  const { styles, effectiveStyles } = useOrganizationStylesContext()
  const { data: businessData } = useBusinessSettings()
  const { t } = useTranslation('business')
  const { resolvedTheme } = useThemeStore()
  const panelTheme = useBusinessPanelTheme()
  const organization = businessData?.organization

  const navbarStyle = useMemo(() => {
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

    const sidebarBg = panelStyles.sidebar_background || '#0f172a'
    const sidebarOpacity =
      panelStyles.sidebar_opacity !== undefined ? panelStyles.sidebar_opacity : 0.85
    const borderColor = panelStyles.border_color || 'rgba(71, 85, 105, 0.3)'
    const textColor = panelStyles.text_color

    let backgroundColor: string
    if (sidebarBg && typeof sidebarBg === 'string' && sidebarBg.startsWith('#')) {
      const rgb = hexToRgb(sidebarBg)
      backgroundColor = `rgba(${rgb}, ${sidebarOpacity})`
    } else if (sidebarBg && typeof sidebarBg === 'string' && sidebarBg.startsWith('rgba')) {
      const rgbaMatch = sidebarBg.match(/rgba?\(([^)]+)\)/)
      if (rgbaMatch) {
        const parts = rgbaMatch[1].split(',')
        backgroundColor =
          parts.length >= 3
            ? `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${sidebarOpacity})`
            : sidebarBg
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
      hoverBg: resolvedTheme === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
    }
  }, [effectiveStyles, resolvedTheme, styles])

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
      <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-12">
        <div className="flex h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onMenuClick}
              className="rounded-lg p-2 transition-colors hover:opacity-80 lg:hidden"
              style={{
                color:
                  navbarStyle.color ||
                  (resolvedTheme === 'light' ? '#1E293B' : 'rgba(255, 255, 255, 0.8)'),
              }}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex min-w-0 items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                {organization?.brand_logo_url ||
                organization?.logo_url ||
                organization?.brand_favicon_url ||
                organization?.favicon_url ? (
                  <Image
                    src={
                      organization?.brand_logo_url ||
                      organization?.logo_url ||
                      organization?.brand_favicon_url ||
                      organization?.favicon_url ||
                      '/icono.png'
                    }
                    alt={organization?.name || 'Organizacion'}
                    width={180}
                    height={48}
                    className="h-10 w-auto max-w-[140px] rounded-lg object-contain sm:h-12 sm:max-w-[180px]"
                    style={{ width: 'auto' }}
                    onError={(event) => {
                      ;(event.target as HTMLImageElement).src = '/icono.png'
                    }}
                  />
                ) : (
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg sm:h-12 sm:w-12"
                    style={{
                      background: `linear-gradient(135deg, ${panelTheme.actionColor}, ${panelTheme.secondaryColor})`,
                    }}
                  >
                    <Building2 className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                  </div>
                )}
              </div>

              {organization?.show_navbar_name !== false && (
                <h1
                  className="hidden min-w-0 truncate text-sm font-semibold sm:block sm:max-w-[300px] sm:text-base lg:max-w-[360px]"
                  style={{
                    color:
                      navbarStyle.color ||
                      (resolvedTheme === 'light' ? '#1E293B' : 'rgba(255, 255, 255, 0.95)'),
                  }}
                >
                  {organization?.name || t('header.myOrganization')}
                </h1>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <NotificationBell />
            <UserDropdown />
          </div>
        </div>
      </div>
    </motion.header>
  )
}
