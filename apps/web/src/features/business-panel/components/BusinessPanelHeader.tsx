'use client'

import { logger as techDebtLogger } from '@/lib/utils/logger'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Building2, Menu } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { NotificationBell } from '@/core/components/NotificationBell'
import { UserDropdown } from '@/core/components/UserDropdown'
import { TourTriggerButton, useTour } from '@/features/tours'
import { businessPanelDashboardTour } from '@/features/tours/config/business-panel-dashboard.tour'
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
    techDebtLogger.error('BusinessPanelHeader: onMenuClick debe ser una funcion')
    return null
  }

  const { styles, effectiveStyles } = useOrganizationStylesContext()
  const { data: businessData } = useBusinessSettings()
  const { t } = useTranslation('business')
  const { resolvedTheme } = useThemeStore()
  const pathname = usePathname()
  const { restartTour } = useTour(businessPanelDashboardTour)
  const panelTheme = useBusinessPanelTheme()
  const organization = businessData?.organization
  const canRestartDashboardTour = pathname?.includes('/business-panel/dashboard') ?? false

  const navbarStyle = useMemo(() => {
    const panelStyles = effectiveStyles?.panel || styles?.panel

    if (!panelStyles) {
      const isDark = resolvedTheme === 'dark'
      return {
        backgroundColor: isDark
          ? 'color-mix(in srgb, var(--color-bg-dark) 85%, transparent)'
          : 'color-mix(in srgb, var(--color-bg-light) 85%, transparent)',
        borderColor: isDark
          ? 'color-mix(in srgb, var(--color-muted) 30%, transparent)'
          : 'color-mix(in srgb, var(--color-gray-200) 80%, transparent)',
        color: isDark ? 'var(--color-gray-50)' : 'var(--color-contrast)',
        hoverBg: isDark
          ? 'color-mix(in srgb, var(--color-bg-light) 5%, transparent)'
          : 'color-mix(in srgb, var(--color-black) 4%, transparent)',
      }
    }

    const sidebarBg = panelStyles.sidebar_background || 'var(--color-bg-dark)'
    const sidebarOpacity =
      panelStyles.sidebar_opacity !== undefined ? panelStyles.sidebar_opacity : 0.85
    const borderColor =
      panelStyles.border_color || 'color-mix(in srgb, var(--color-muted) 30%, transparent)'
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
      backgroundColor =
        sidebarBg || 'color-mix(in srgb, var(--color-bg-dark) 85%, transparent)'
    }

    return {
      backgroundColor,
      borderColor,
      color: textColor,
      hoverBg: resolvedTheme === 'light'
        ? 'color-mix(in srgb, var(--color-black) 4%, transparent)'
        : 'color-mix(in srgb, var(--color-bg-light) 5%, transparent)',
    }
  }, [effectiveStyles, resolvedTheme, styles])

  return (
    <motion.header
      data-tour-id="business-panel-dashboard--top-nav"
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
                  (resolvedTheme === 'light'
                    ? 'var(--color-contrast)'
                    : 'color-mix(in srgb, var(--color-bg-light) 80%, transparent)'),
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
                      const image = event.target as HTMLImageElement
                      image.src = '/icono.png'
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
                      (resolvedTheme === 'light'
                        ? 'var(--color-contrast)'
                        : 'color-mix(in srgb, var(--color-bg-light) 95%, transparent)'),
                  }}
                >
                  {organization?.name || t('header.myOrganization')}
                </h1>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            {canRestartDashboardTour ? (
              <TourTriggerButton
                data-tour-id="business-panel-dashboard--tour-trigger"
                onStart={restartTour}
                showLabel
                className="h-9 shadow-sm dark:hover:bg-white/15"
                style={{
                  borderColor: `color-mix(in srgb, ${panelTheme.actionColor} 28%, transparent)`,
                  color: panelTheme.actionColor,
                }}
              />
            ) : null}
            <div data-tour-id="business-panel-dashboard--notifications">
              <NotificationBell />
            </div>
            <div data-tour-id="business-panel-dashboard--account-menu">
              <UserDropdown />
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
