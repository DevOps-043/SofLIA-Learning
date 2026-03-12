'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../auth/hooks/useAuth'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'
import { useLiaPanel } from '../../../core/contexts/LiaPanelContext'
import { useOrganizationStylesContext } from '../../business-panel/contexts/OrganizationStylesContext'
import { useThemeStore } from '../../../core/stores/themeStore'
import { LiaSidePanel } from '../../../core/components/LiaSidePanel'
import { LiaFloatingButton } from '../../../core/components/LiaSidePanel/LiaFloatingButton'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [isRedirecting, setIsRedirecting] = useState(false)
  
  // Obtener tema del usuario (light/dark)
  const { resolvedTheme } = useThemeStore()
  const isLightTheme = resolvedTheme === 'light'
  
  // Obtener estilos de la organización
  const { styles: orgStyles } = useOrganizationStylesContext()
  const panelStyles = orgStyles?.panel
  
  // Colores del tema
  const themeColors = {
    background: isLightTheme ? '#F8FAFC' : '#0F1419',
    cardBackground: isLightTheme ? (panelStyles?.card_background || '#FFFFFF') : '#0F1419',
  }
  
  // Obtener estado del panel de LIA para desplazar contenido
  let isLiaPanelOpen = false;
  try {
    const liaPanel = useLiaPanel();
    isLiaPanelOpen = liaPanel.isOpen;
  } catch {
    // Si no está dentro del LiaPanelProvider, ignorar
  }
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-sidebar-collapsed') === 'true'
    }
    return false
  })
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    if (typeof window !== 'undefined') {
      const pinned = localStorage.getItem('admin-sidebar-pinned')
      return pinned === 'true'
    }
    return false
  })
  const [sidebarHovered, setSidebarHovered] = useState(false)

  // Asegurar que isLoading sea siempre un booleano, por defecto true si es undefined
  const isLoading = typeof authLoading === 'boolean' ? authLoading : true;

  useEffect(() => {
    // Evitar redirecciones múltiples o durante desmontaje
    if (isRedirecting) return
    
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return

    // Solo ejecutar lógica de redirección cuando loading sea explícitamente false
    if (isLoading === false) {
      if (!user) {
        setIsRedirecting(true)
        // Usar window.location como fallback si router falla
        try {
          router.replace('/auth')
        } catch (error) {
          // Fallback a window.location si router.replace falla
          window.location.href = '/auth'
        }
        return
      }
      
      const normalizedRole = user.cargo_rol?.toLowerCase().trim()
      if (normalizedRole !== 'administrador') {
        setIsRedirecting(true)
        // Usar window.location como fallback si router falla
        try {
          router.replace('/dashboard')
        } catch (error) {
          // Fallback a window.location si router.replace falla
          window.location.href = '/dashboard'
        }
        return
      }
    }

    // Cleanup: resetear estado de redirección si el componente se desmonta
    return () => {
      setIsRedirecting(false)
    }
  }, [user, isLoading, router, isRedirecting])

  // Guardar estado de colapso en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-sidebar-collapsed', sidebarCollapsed.toString())
    }
  }, [sidebarCollapsed])

  // Guardar estado pinned en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-sidebar-pinned', sidebarPinned.toString())
    }
  }, [sidebarPinned])

  // Mostrar loading spinner si isLoading es true
  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: themeColors.background }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-t-[#0A2540] dark:border-t-[#00D4B3] rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-sm text-[#6C757D] dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si loading es false, y el usuario es administrador, renderizar children
  const normalizedRole = user?.cargo_rol?.toLowerCase().trim()
  if (!user || normalizedRole !== 'administrador') {
    return null
  }

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: themeColors.background }}
    >
      {/* Sidebar Global */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isPinned={sidebarPinned}
        onTogglePin={() => setSidebarPinned(!sidebarPinned)}
        onHoverChange={setSidebarHovered}
      />

      {/* Main Content Area - Solo el sidebar izquierdo afecta el margin-left */}
      <div 
        className={`min-h-screen transition-all duration-300 ease-in-out ${
          (sidebarCollapsed && !sidebarPinned && !sidebarHovered) ? 'lg:ml-16' : 'lg:ml-64'
        }`}
        style={{ backgroundColor: themeColors.background }}
      >
        {/* Header Global */}
        <AdminHeader 
          onMenuClick={() => setSidebarOpen(true)}
          title="Panel de Administración"
          isCollapsed={sidebarCollapsed}
          isPinned={sidebarPinned}
          isHovered={sidebarHovered}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Page Content - pt-16 para compensar el header fijo, pr para panel de LIA */}
        <main 
          className="min-h-screen pt-16 transition-all duration-300 ease-in-out"
          style={{ 
            backgroundColor: themeColors.background,
            paddingRight: isLiaPanelOpen ? '420px' : '0px' 
          }}
        >
          {children}
        </main>
      </div>
      
      {/* Componentes de LIA */}
      <LiaSidePanel />
      <LiaFloatingButton />
    </div>
  )
}

