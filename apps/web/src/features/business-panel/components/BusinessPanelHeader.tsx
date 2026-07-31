'use client'

import { logger as techDebtLogger } from '@/lib/utils/logger'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Building2, Menu } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { NotificationBell } from '@/core/components/NotificationBell'
import { UserDropdown } from '@/core/components/UserDropdown'
import { TourTriggerButton, useTour } from '@/features/tours'
import { businessPanelDashboardTour } from '@/features/tours/config/business-panel-dashboard.tour'
import { businessPanelHierarchyTour } from '@/features/tours/config/business-panel-hierarchy.tour'
import { businessPanelCoursesTour, businessPanelCourseDetailTour } from '@/features/tours/config/business-panel-courses.tour'
import { businessPanelLearningPathsTour } from '@/features/tours/config/business-panel-learning-paths.tour'
import { businessPanelUsersTour } from '@/features/tours/config/business-panel-users.tour'
import { businessPanelReportsTour } from '@/features/tours/config/business-panel-reports.tour'
import { businessPanelReviewsTour } from '@/features/tours/config/business-panel-reviews.tour'
import { businessPanelSettingsTour } from '@/features/tours/config/business-panel-settings.tour'
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
  const searchParams = useSearchParams()
  const { restartTour } = useTour(businessPanelDashboardTour)
  const { restartTour: restartHierarchyTour } = useTour(businessPanelHierarchyTour)
  const { restartTour: restartCoursesTour } = useTour(businessPanelCoursesTour)
  const { restartTour: restartCourseDetailTour } = useTour(businessPanelCourseDetailTour)
  const { restartTour: restartLearningPathsTour } = useTour(businessPanelLearningPathsTour)
  const { restartTour: restartUsersTour } = useTour(businessPanelUsersTour)
  const { restartTour: restartReportsTour } = useTour(businessPanelReportsTour)
  const { restartTour: restartReviewsTour } = useTour(businessPanelReviewsTour)
  const { restartTour: restartSettingsTour } = useTour(businessPanelSettingsTour)
  const panelTheme = useBusinessPanelTheme()
  const organization = businessData?.organization
  const isOnContentPage = /\/business-panel\/courses$/.test(pathname ?? '')
  const contentTab = isOnContentPage ? (searchParams?.get('tab') ?? 'courses') : null

  const canRestartDashboardTour = pathname?.includes('/business-panel/dashboard') ?? false
  const canRestartHierarchyTour = (pathname?.includes('/business-panel/hierarchy') && !pathname?.includes('/node/')) ?? false
  // Courses and LP now share the unified /courses page — distinguish by ?tab param
  const canRestartCoursesListTour = isOnContentPage && contentTab !== 'paths'
  const canRestartCourseDetailTour = /\/business-panel\/courses\/[^/]+$/.test(pathname ?? '')
  const canRestartLearningPathsTour = isOnContentPage && contentTab === 'paths'
  const canRestartUsersTour = /\/business-panel\/users$/.test(pathname ?? '')
  const canRestartReportsTour = pathname?.includes('/business-panel/reports') ?? false
  const canRestartReviewsTour = pathname?.includes('/business-panel/reviews') ?? false
  const canRestartSettingsTour = pathname?.includes('/business-panel/settings') ?? false

  const activeTourRestart =
    canRestartDashboardTour ? restartTour :
    canRestartUsersTour ? restartUsersTour :
    canRestartHierarchyTour ? restartHierarchyTour :
    canRestartCoursesListTour ? restartCoursesTour :
    canRestartCourseDetailTour ? restartCourseDetailTour :
    canRestartLearningPathsTour ? restartLearningPathsTour :
    canRestartReportsTour ? restartReportsTour :
    canRestartReviewsTour ? restartReviewsTour :
    canRestartSettingsTour ? restartSettingsTour :
    null

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
      className="pointer-events-none absolute inset-x-0 top-0 z-[999] w-full bg-transparent px-3 pt-3 sm:px-4 lg:px-6"
    >
      <div
        className="pointer-events-auto mx-auto flex h-16 w-full max-w-[1480px] items-center justify-between gap-3 rounded-[1.25rem] border px-3 shadow-[0_18px_48px_-32px_rgba(2,12,23,0.38)] backdrop-blur-2xl sm:px-4 lg:px-5"
        style={{
          backgroundColor: `color-mix(in srgb, ${navbarStyle.backgroundColor} 58%, transparent)`,
          borderColor: navbarStyle.borderColor,
          boxShadow: `0 18px 48px -32px color-mix(in srgb, ${panelTheme.actionColor} 30%, transparent), inset 0 1px 0 color-mix(in srgb, var(--color-bg-light) 9%, transparent)`,
        }}
      >
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onMenuClick}
              className="grid h-10 w-10 place-items-center rounded-xl border p-0 transition-all hover:-translate-y-px lg:hidden"
              style={{
                backgroundColor: panelTheme.inputBg,
                borderColor: panelTheme.borderColor,
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
                    className="h-9 w-auto max-w-[128px] rounded-xl object-contain sm:h-10 sm:max-w-[168px]"
                    style={{ width: 'auto' }}
                    onError={(event) => {
                      const image = event.target as HTMLImageElement
                      image.src = '/icono.png'
                    }}
                  />
                ) : (
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl border sm:h-10 sm:w-10"
                    style={{
                      background: `linear-gradient(135deg, ${panelTheme.actionColor}, ${panelTheme.secondaryColor})`,
                      borderColor: `color-mix(in srgb, ${panelTheme.accentColor} 28%, transparent)`,
                    }}
                  >
                    <Building2 className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                  </div>
                )}
              </div>

              {organization?.show_navbar_name !== false && (
                <h1
                  className="hidden min-w-0 truncate text-sm font-semibold tracking-[-0.01em] sm:block sm:max-w-[300px] lg:max-w-[360px]"
                  style={{
                    fontFamily: 'var(--font-system-ui)',
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
            {activeTourRestart !== null ? (
              <TourTriggerButton
                data-tour-id="business-panel-dashboard--tour-trigger"
                onStart={activeTourRestart}
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
    </motion.header>
  )
}
