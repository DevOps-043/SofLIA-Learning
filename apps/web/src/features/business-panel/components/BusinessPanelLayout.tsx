'use client'

import { useState, useEffect, useMemo, useCallback, useRef, useContext } from 'react'
import { useRouter } from 'next/navigation'
import Joyride from 'react-joyride'
import { useAuth } from '../../auth/hooks/useAuth'
import { BusinessPanelSidebar } from './BusinessPanelSidebar'
import { BusinessPanelHeader } from './BusinessPanelHeader'
import { PremiumLoadingScreen } from './PremiumLoadingScreen'
import { OrganizationStylesProvider, useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { generateCSSVariables, getBackgroundStyle } from '../utils/styles'
import { LiaSidePanel } from '@/core/components/LiaSidePanel'
import { LiaFloatingButton } from '@/core/components/LiaSidePanel/LiaFloatingButton'
import { LiaPanelContext } from '@/core/contexts/LiaPanelContext'
import { useBusinessPanelJoyride } from '@/features/tours/hooks/useBusinessPanelJoyride'
import { BusinessPanelTourProvider } from '../contexts/BusinessPanelTourContext'
import { OnboardingVideoPlayer } from '@/features/tours/components/OnboardingVideoPlayer'


interface BusinessPanelLayoutProps {
  children: React.ReactNode
}

function BusinessPanelLayoutInner({ children }: BusinessPanelLayoutProps) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  // Usar effectiveStyles para soportar modo claro/oscuro
  const { styles, effectiveStyles, loading: stylesLoading } = useOrganizationStylesContext()
  // Use the new Joyride hook
  const normalizedUserRole = user?.cargo_rol?.toLowerCase().trim()
  const { joyrideProps, startTour, resetTour, run, showVideoIntro, handleVideoComplete } = useBusinessPanelJoyride({
    enabled: normalizedUserRole !== 'superadmin' && normalizedUserRole !== 'super admin'
  })
  // Track if component has mounted (for client-only rendering)
  const [isMounted, setIsMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('business-sidebar-collapsed') === 'true'
    }
    return false
  })
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    if (typeof window !== 'undefined') {
      const pinned = localStorage.getItem('business-sidebar-pinned')
      return pinned === 'true'
    }
    return false
  })

  // Asegurar que isLoading sea siempre un booleano
  const isLoading = typeof authLoading === 'boolean' ? authLoading : true;

  // Obtener estado del panel de LIA para desplazar contenido

  // Obtener estado del panel de LIA para desplazar contenido (solo el main, no el sidebar)
  // Reemplazamos el try/catch ilegal por useContext directo para evitar violar Rules of Hooks
  const liaPanel = useContext(LiaPanelContext) ?? null;
  const isLiaPanelOpen = liaPanel?.isOpen ?? false;

  // Refs para rastrear el estado previo y evitar loops
  const prevLiaPanelOpen = useRef(isLiaPanelOpen);
  const prevSidebarOpen = useRef(sidebarOpen);

  // Memorizar estilos personalizados ANTES de cualquier return (Regla de Hooks)
  // Usar estilos efectivos si existen (Light/Dark mode) o fallback a estilos base
  const panelStyles = useMemo(() => effectiveStyles?.panel || styles?.panel, [styles, effectiveStyles])
  const backgroundStyle = useMemo(() => getBackgroundStyle(panelStyles), [panelStyles])
  const cssVariables = useMemo(() => generateCSSVariables(panelStyles), [panelStyles])

  const introVideos = useMemo(() => [
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assets/TourB2B.mp4`,
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assets/TourB2C.mp4`
  ], []);

  // Debug: Log cuando los estilos se aplican
  useEffect(() => {
    if (panelStyles) {
      console.log('✅ [BusinessPanelLayout] Estilos aplicados correctamente al layout:', {
        theme: styles?.selectedTheme,
        mode: effectiveStyles ? 'effective' : 'base',
        backgroundValue: panelStyles.background_value?.substring(0, 50),
        primaryColor: panelStyles.primary_button_color
      });
    }
  }, [styles, effectiveStyles, panelStyles])

  // Set mounted state for client-only rendering of Joyride
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Efecto para redireccionar usuarios no autenticados o con rol incorrecto
  // SOLO después de que la carga inicial haya terminado completamente
  useEffect(() => {
    // Esperar a que termine de cargar Y a que se haya intentado obtener el usuario
    if (isLoading === false && user === null) {
      // Usuario no autenticado - obtener organization_slug de localStorage si existe
      let redirectPath = '/auth';

      if (typeof window !== 'undefined') {
        try {
          // Intentar obtener el slug de la organización del usuario desde localStorage
          const lastOrgSlug = localStorage.getItem('last_organization_slug');
          if (lastOrgSlug) {
            redirectPath = `/auth/${lastOrgSlug}`;
          }
        } catch (error) {
          // console.error('Error reading localStorage:', error);
        }
      }

      router.push(redirectPath);
      return;
    }

    // Usuario autenticado pero con rol incorrecto
    if (isLoading === false && user) {
      const normalizedRole = user.cargo_rol?.toLowerCase().trim();

      // Permitir 'business' o 'administrador'
      if (normalizedRole !== 'business' && normalizedRole !== 'administrador') {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, isLoading, router])

  // Guardar estado de colapso en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('business-sidebar-collapsed', sidebarCollapsed.toString())
    }
  }, [sidebarCollapsed])

  // Guardar estado pinned en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('business-sidebar-pinned', sidebarPinned.toString())
    }
  }, [sidebarPinned])

  // Cerrar sidebar cuando se abre LIA (solo cuando LIA cambia de cerrado a abierto)
  useEffect(() => {
    if (liaPanel && !prevLiaPanelOpen.current && isLiaPanelOpen && sidebarOpen) {
      setSidebarOpen(false)
    }
    prevLiaPanelOpen.current = isLiaPanelOpen
  }, [isLiaPanelOpen, sidebarOpen, liaPanel])

  // Cerrar LIA cuando se abre el sidebar (solo cuando el sidebar cambia de cerrado a abierto)
  useEffect(() => {
    if (liaPanel && !prevSidebarOpen.current && sidebarOpen && isLiaPanelOpen) {
      liaPanel.closePanel()
    }
    prevSidebarOpen.current = sidebarOpen
  }, [sidebarOpen, isLiaPanelOpen, liaPanel])

  // Estabilizar funciones de callbacks
  const handleMenuClick = useCallback(() => {
    setSidebarOpen(true)
  }, [])

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
  }, [])

  const handleTogglePin = useCallback(() => {
    setSidebarPinned(prev => !prev)
  }, [])

  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section)
  }, [])

  // Callback para cuando el sidebar se expande por hover
  const handleSidebarHoverExpand = useCallback(() => {
    if (liaPanel && isLiaPanelOpen) {
      liaPanel.closePanel()
    }
  }, [liaPanel, isLiaPanelOpen])

  // Mostrar loading spinner si isLoading es true
  if (isLoading) {
    return <PremiumLoadingScreen />
  }

  // Verificar rol (permitir business y administrador)
  const normalizedRole = user?.cargo_rol?.toLowerCase().trim()
  if (!user || (normalizedRole !== 'business' && normalizedRole !== 'administrador')) {
    return null
  }

  // Mostrar loading mientras se cargan los estilos
  if (stylesLoading) {
    return <PremiumLoadingScreen />
  }

  return (
    <BusinessPanelTourProvider startTour={startTour} resetTour={resetTour} isRunning={run}>
    <>
      {/* Intro Videos */}
      {showVideoIntro && (
        <OnboardingVideoPlayer
          videos={introVideos}
          onComplete={handleVideoComplete}
        />
      )}
      
      {/* Joyride Tour Component - Only render on client */}
      {isMounted && <Joyride {...joyrideProps} />}
      
      <div
        key={styles?.selectedTheme || 'default-theme'}
        className="fixed inset-0 z-0 h-screen flex flex-col overflow-hidden transition-all duration-300 business-panel-layout"
        style={{
          ...backgroundStyle,
          ...cssVariables
        } as React.CSSProperties}
      >
        {/* Header Global - Full Width */}
        <BusinessPanelHeader 
          onMenuClick={handleMenuClick}
          title="Panel de Gestión Business"
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />

        {/* Componentes de LIA */}
        <LiaSidePanel />
        <LiaFloatingButton />

        {/* Content Area with Sidebar + Main */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Global */}
          <BusinessPanelSidebar 
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

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <main 
              id="main-scroll-container"
              className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 xl:p-12 business-panel-content transition-all duration-300"
              style={{ marginRight: isLiaPanelOpen ? '420px' : '0px' }}
            >
              <div className="w-full max-w-[1920px] mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
    </BusinessPanelTourProvider>
  )
}

export function BusinessPanelLayout({ children }: BusinessPanelLayoutProps) {
  return (
    <OrganizationStylesProvider>
      <BusinessPanelLayoutInner>{children}</BusinessPanelLayoutInner>
    </OrganizationStylesProvider>
  )
}
