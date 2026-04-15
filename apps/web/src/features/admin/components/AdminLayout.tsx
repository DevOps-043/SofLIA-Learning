'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'

import { LiaFloatingButton } from '../../../core/components/LiaSidePanel/LiaFloatingButton'
import { LiaSidePanel } from '../../../core/components/LiaSidePanel'
import { useResponsiveLiaLayout } from '@/core/hooks/useResponsiveLiaLayout'
import { useThemeStore } from '../../../core/stores/themeStore'
import { useAuth } from '../../auth/hooks/useAuth'
import { useOrganizationStylesContext } from '../../business-panel/contexts/OrganizationStylesContext'
import { AdminHeader } from './AdminHeader'
import { AdminSidebar } from './AdminSidebar'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { t } = useTranslation('admin')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [isRedirecting, setIsRedirecting] = useState(false)

  const { resolvedTheme } = useThemeStore()
  const isLightTheme = resolvedTheme === 'light'

  const { styles: orgStyles } = useOrganizationStylesContext()
  const panelStyles = orgStyles?.panel

  const themeColors = {
    background: isLightTheme ? '#F8FAFC' : '#0F1419',
    cardBackground: isLightTheme
      ? (panelStyles?.card_background || '#FFFFFF')
      : '#0F1419',
  }

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-sidebar-collapsed') === 'true'
    }
    return false
  })

  const { contentOffsetPx } = useResponsiveLiaLayout({
    reservedWidthPx: sidebarCollapsed ? 64 : 256,
  })

  const isLoading = typeof authLoading === 'boolean' ? authLoading : true

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

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: themeColors.background }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-[#E9ECEF] dark:border-[#6C757D]/30" />
            <div className="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-t-[#0A2540] dark:border-t-[#00D4B3]" />
          </div>
          <p className="text-sm text-[#6C757D] dark:text-gray-400">Cargando...</p>
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
      className="min-h-screen max-w-full overflow-x-clip transition-colors duration-300"
      style={{ backgroundColor: themeColors.background }}
    >
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div
        className={`min-h-screen max-w-full overflow-x-clip transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
        style={{ backgroundColor: themeColors.background }}
      >
        <AdminHeader
          onMenuClick={() => setSidebarOpen(true)}
          title={t('layout.panelTitle')}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main
          className="min-h-screen max-w-full overflow-x-clip pt-20 transition-all duration-300 ease-in-out"
          style={{
            backgroundColor: themeColors.background,
            paddingRight: contentOffsetPx > 0 ? `${contentOffsetPx}px` : undefined,
          }}
        >
          {children}
        </main>
      </div>

      <LiaSidePanel />
      <LiaFloatingButton />
    </div>
  )
}
