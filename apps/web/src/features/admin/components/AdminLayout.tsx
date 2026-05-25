'use client'

import type { CSSProperties } from 'react'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'

import { LiaFloatingButton } from '../../../core/components/LiaSidePanel/LiaFloatingButton'
import { LiaSidePanel } from '../../../core/components/LiaSidePanel'
import { LiaPanelContext } from '@/core/contexts/LiaPanelContext'
import { useResponsiveLiaLayout } from '@/core/hooks/useResponsiveLiaLayout'
import { useAuth } from '../../auth/hooks/useAuth'
import { useOrganizationStylesContext } from '../../business-panel/contexts/OrganizationStylesContext'
import { generateCSSVariables, getBackgroundStyle } from '../../business-panel/utils/styles'
import { AdminHeader } from './AdminHeader'
import { AdminSidebar } from './AdminSidebar'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { t } = useTranslation('admin')
  const { styles, effectiveStyles, loading: stylesLoading } = useOrganizationStylesContext()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-sidebar-collapsed') === 'true'
    }
    return false
  })
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-sidebar-pinned') === 'true'
    }
    return false
  })

  const panelStyles = useMemo(
    () => effectiveStyles?.panel || styles?.panel,
    [effectiveStyles, styles],
  )
  const backgroundStyle = useMemo(() => getBackgroundStyle(panelStyles), [panelStyles])
  const cssVariables = useMemo(() => generateCSSVariables(panelStyles), [panelStyles])
  const fallbackBackground = 'var(--color-bg-dark)'
  const isLoading = typeof authLoading === 'boolean' ? authLoading : true

  const liaPanel = useContext(LiaPanelContext) ?? null
  const isLiaPanelOpen = liaPanel?.isOpen ?? false
  const { contentOffsetPx } = useResponsiveLiaLayout({
    reservedWidthPx: sidebarCollapsed ? 64 : 256,
  })

  const prevLiaPanelOpen = useRef(isLiaPanelOpen)
  const prevSidebarOpen = useRef(sidebarOpen)

  useEffect(() => {
    if (isRedirecting || typeof window === 'undefined') return

    if (isLoading === false) {
      if (!user) {
        setIsRedirecting(true)

        try {
          router.replace('/auth')
        } catch {
          window.location.href = '/auth'
        }
        return
      }

      const normalizedRole = user.cargo_rol?.toLowerCase().trim()

      if (normalizedRole !== 'administrador') {
        setIsRedirecting(true)

        try {
          router.replace('/dashboard')
        } catch {
          window.location.href = '/dashboard'
        }
        return
      }
    }

    return () => {
      setIsRedirecting(false)
    }
  }, [isRedirecting, isLoading, router, user])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-sidebar-collapsed', sidebarCollapsed.toString())
    }
  }, [sidebarCollapsed])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-sidebar-pinned', sidebarPinned.toString())
    }
  }, [sidebarPinned])

  useEffect(() => {
    if (liaPanel && !prevLiaPanelOpen.current && isLiaPanelOpen && sidebarOpen) {
      setSidebarOpen(false)
    }

    prevLiaPanelOpen.current = isLiaPanelOpen
  }, [isLiaPanelOpen, liaPanel, sidebarOpen])

  useEffect(() => {
    if (liaPanel && !prevSidebarOpen.current && sidebarOpen && isLiaPanelOpen) {
      liaPanel.closePanel()
    }

    prevSidebarOpen.current = sidebarOpen
  }, [isLiaPanelOpen, liaPanel, sidebarOpen])

  const handleMenuClick = useCallback(() => {
    setSidebarOpen(true)
  }, [])

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed((previous) => !previous)
  }, [])

  const handleTogglePin = useCallback(() => {
    setSidebarPinned((previous) => !previous)
  }, [])

  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section)
  }, [])

  const handleSidebarHoverExpand = useCallback(() => {
    if (liaPanel && isLiaPanelOpen) {
      liaPanel.closePanel()
    }
  }, [isLiaPanelOpen, liaPanel])

  if (isLoading || stylesLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: fallbackBackground }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-gray-200 dark:border-white/10" />
            <div className="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-[var(--color-accent)]" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('layout.loading')}
          </p>
        </div>
      </div>
    )
  }

  const normalizedRole = user?.cargo_rol?.toLowerCase().trim()

  if (!user || normalizedRole !== 'administrador') {
    return null
  }

  return (
    <div
      key={styles?.selectedTheme || 'admin-default-theme'}
      className="admin-panel-layout fixed inset-0 z-0 flex h-screen max-w-full flex-col overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: fallbackBackground,
        ...backgroundStyle,
        ...cssVariables,
      } as CSSProperties}
    >
      <AdminHeader
        onMenuClick={handleMenuClick}
        title={t('layout.panelTitle')}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      <LiaSidePanel />
      <LiaFloatingButton />

      <div className="flex min-w-0 flex-1 overflow-hidden">
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
          isPinned={sidebarPinned}
          onTogglePin={handleTogglePin}
          onHoverExpand={handleSidebarHoverExpand}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <main
            id="main-scroll-container"
            className="admin-panel-content flex-1 overflow-x-clip overflow-y-auto p-4 transition-all duration-300 sm:p-6 lg:p-8 xl:p-12"
            style={{
              paddingRight: contentOffsetPx > 0 ? `${contentOffsetPx}px` : undefined,
            }}
          >
            <div className="mx-auto w-full min-w-0 max-w-[1920px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
