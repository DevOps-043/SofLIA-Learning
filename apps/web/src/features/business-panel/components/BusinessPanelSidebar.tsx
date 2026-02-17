'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useBusinessSettings } from '../hooks/useBusinessSettings'
import { useAuth } from '../../auth/hooks/useAuth'
import { useThemeStore } from '@/core/stores/themeStore'
import Image from 'next/image'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart3,
  FileText,
  Settings,
  X,
  Building2,
  UsersRound,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MapPin,
  Network,
  ClipboardCheck,
  UserPlus
} from 'lucide-react'

interface BusinessPanelSidebarProps {
  isOpen: boolean
  onClose: () => void
  activeSection: string
  onSectionChange: (section: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  isPinned: boolean
  onTogglePin: () => void
  onHoverExpand?: () => void
}

import { useTranslation } from 'react-i18next'

/* Removed external navigation constant to use translations inside component */

export function BusinessPanelSidebar({
  isOpen,
  onClose,
  activeSection,
  onSectionChange,
  isCollapsed,
  onToggleCollapse,
  isPinned,
  onTogglePin,
  onHoverExpand
}: BusinessPanelSidebarProps) {
  const pathname = usePathname()
  const { styles, effectiveStyles } = useOrganizationStylesContext()
  const { data: businessData } = useBusinessSettings()
  const { logout } = useAuth()
  const [imageError, setImageError] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)

  const { t } = useTranslation('business')

  /* New import for dynamic routing */
  const params = useParams()
  const orgSlug = params?.orgSlug as string

  const navigation = useMemo(() => [
    { name: t('sidebar.dashboard'), href: `/${orgSlug}/business-panel/dashboard`, icon: LayoutDashboard },
    { name: t('sidebar.users'), href: `/${orgSlug}/business-panel/users`, icon: Users },
    { name: t('sidebar.courses'), href: `/${orgSlug}/business-panel/courses`, icon: BookOpen },
    { name: t('sidebar.hierarchy', 'Estructura'), href: `/${orgSlug}/business-panel/hierarchy`, icon: Network },
    { name: t('sidebar.reports'), href: `/${orgSlug}/business-panel/reports`, icon: FileText },
    { name: t('sidebar.analytics'), href: `/${orgSlug}/business-panel/analytics`, icon: BarChart3 },
    { name: t('sidebar.reviews', 'Revisiones'), href: `/${orgSlug}/business-panel/reviews`, icon: ClipboardCheck },
    { name: t('sidebar.joinRequests', 'Solicitudes'), href: `/${orgSlug}/business-panel/join-requests`, icon: UserPlus },
    { name: t('sidebar.settings'), href: `/${orgSlug}/business-panel/settings`, icon: Settings },
  ], [t, orgSlug])

  // State for hover/pin interaction
  const [isHovered, setIsHovered] = useState(false)
  const [showPinFeedback, setShowPinFeedback] = useState(false)
  const [isClicking, setIsClicking] = useState(false)

  const organization = businessData?.organization
  // Usar estilos efectivos (light/dark) o fallback a estilos base
  const panelStyles = effectiveStyles?.panel || styles?.panel
  const sidebarBackground = panelStyles?.sidebar_background || '#0a0a0a'

  /* State for mobile detection */
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Collapse hover logic
  const shouldExpand = isPinned || (isCollapsed && isHovered)

  // Handle click outside to close hover or mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        if (isMobile && isOpen) {
          // onClose() // Let the overlay handle closing on mobile to avoid conflicts
        } else if (!isMobile && isCollapsed && isHovered && !isPinned) {
          setIsHovered(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isCollapsed, isHovered, isPinned, isMobile, isOpen])

  // Clear hover when uncollapsed manually
  useEffect(() => {
    if (!isCollapsed) {
      setIsHovered(false)
    }
  }, [isCollapsed])

  // Notificar cuando el sidebar se expande por hover y cerrar LIA si está abierto
  useEffect(() => {
    if (isHovered && isCollapsed && !isPinned && !isMobile && onHoverExpand) {
      onHoverExpand()
    }
  }, [isHovered, isCollapsed, isPinned, isMobile, onHoverExpand])

  // Calcular estilos dinámicos para el fondo
  const sidebarStyle: React.CSSProperties = useMemo(() => {
    const opacity = panelStyles?.sidebar_opacity || 0.95
    if (!sidebarBackground) return { backgroundColor: `rgba(10, 10, 10, ${opacity})` }
    if (sidebarBackground.includes('linear-gradient') || sidebarBackground.includes('radial-gradient')) {
      return { background: sidebarBackground, backgroundColor: 'transparent' }
    }
    if (sidebarBackground.startsWith('#')) {
      const hex = sidebarBackground.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return { backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})` }
    }
    return { backgroundColor: sidebarBackground, opacity: opacity }
  }, [sidebarBackground, panelStyles])

  const handleLogout = async () => {
    if (logout && typeof logout === 'function') {
      await logout()
    }
    if (isMobile) onClose()
  }

  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'
  const accentColor = panelStyles?.accent_color || '#10b981'
  const textColor = panelStyles?.text_color || (resolvedTheme === 'light' ? '#1E293B' : '#FFFFFF')
  const borderColor = panelStyles?.border_color || (resolvedTheme === 'light' ? '#E2E8F0' : 'rgba(255,255,255,0.1)')
  const hoverBg = resolvedTheme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)'

  // Determine X position: 
  // - Desktop (not mobile): Always 0 (visible)
  // - Mobile: 0 if Open, -100% if Closed
  const xPosition = isMobile ? (isOpen ? 0 : '-100%') : 0

  // Calculate width
  const sidebarWidth = (isCollapsed && !shouldExpand && !isMobile) ? 80 : 280

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.div
        ref={sidebarRef}
        initial={false}
        animate={{
          width: sidebarWidth,
          x: xPosition
        }}
        transition={{
          width: { duration: 0.3, ease: 'easeInOut' },
          x: { duration: 0.3, ease: [0.32, 0.72, 0, 1] }
        }}
        className={`
          fixed inset-y-0 left-0 z-[110] h-full flex flex-col
          shadow-2xl overflow-hidden
          lg:translate-x-0 lg:relative lg:z-0 lg:shadow-none
        `}
        style={{
          ...sidebarStyle,
          backdropFilter: 'blur(20px)',
          borderRight: `1px solid ${borderColor}`
        }}
        onHoverStart={() => {
          if (!isMobile && isCollapsed && !isPinned) setIsHovered(true)
        }}
        onHoverEnd={() => {
          if (!isMobile && isCollapsed && !isPinned) setIsHovered(false)
        }}
        onDoubleClick={(event) => {
          if (isMobile) return;
          const target = event.target as HTMLElement
          // Avoid triggering pin when clicking specific interactive elements
          if (target.tagName !== 'A' && target.tagName !== 'BUTTON' && !target.closest('a') && !target.closest('button')) {
            onTogglePin()
            setShowPinFeedback(true)
            setTimeout(() => setShowPinFeedback(false), 2000)
          }
        }}
      >
        {/* Decoracion de fondo sutil */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: `radial-gradient(circle at 100% 0%, ${primaryColor}40 0%, transparent 20%), 
                         radial-gradient(circle at 0% 100%, ${accentColor}40 0%, transparent 20%)`
          }}
        />

        {/* Mobile Close Button Container - Minimal */}
        <div className="relative flex-shrink-0 flex items-center justify-end px-4 pt-4 pb-2 lg:hidden">
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: textColor, opacity: 0.5 }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = hoverBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Messages (Pin/Unpin) */}
        <AnimatePresence>
          {showPinFeedback && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-1 border-b overflow-hidden"
              style={{ backgroundColor: resolvedTheme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', borderColor }}
            >
              <p className="text-[10px] text-accent font-medium flex items-center gap-1.5 justify-center py-1" style={{ color: accentColor }}>
                <MapPin className="w-3 h-3" />
                {isPinned ? t('sidebar.pinned') : t('sidebar.unpinned')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Section */}
        <nav id="tour-sidebar-nav" className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 custom-scrollbar relative">
          <ul className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon
              /* Check if active: exact match or starts with (for sub-routes) */
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      if (isMobile) onClose();
                      /* Extract section name for analytics/state tracking, removing the orgSlug prefix */
                      const sectionName = item.href.split('/').pop() || '';
                      onSectionChange(sectionName);
                      if (!isMobile && isCollapsed && !isPinned && isHovered) {
                        setIsHovered(false)
                      }
                    }}
                    className={`
                      group relative flex items-center px-3 py-3 rounded-xl
                      transition-all duration-300 ease-out
                      ${isActive
                        ? 'shadow-lg'
                        : 'hover:bg-white/5'
                      }
                      ${(isCollapsed && !shouldExpand && !isMobile) ? 'justify-center' : 'justify-start gap-3'}
                    `}
                    style={{
                      backgroundColor: isActive ? primaryColor : undefined,
                      color: isActive ? '#FFFFFF' : textColor,
                      opacity: isActive ? 1 : 0.7,
                      boxShadow: isActive ? `0 4px 20px -5px ${primaryColor}60` : undefined
                    }}
                    onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = hoverBg; e.currentTarget.style.opacity = '1'; } }}
                    onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.opacity = '0.7'; } }}
                    title={(isCollapsed && !shouldExpand && !isMobile) ? item.name : undefined}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />

                    {(!isCollapsed || shouldExpand || isMobile) && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
                      >
                        {item.name}
                      </motion.span>
                    )}

                    {/* Active Indicator Glow for Collapsed */}
                    {isCollapsed && !shouldExpand && !isMobile && isActive && (
                      <div
                        className="absolute inset-0 rounded-xl blur-md -z-10 opacity-60"
                        style={{ background: primaryColor }}
                      />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer Section */}
        <div className="mt-auto px-4 pb-4 pt-2">
          {/* Collapse Toggle Button - Desktop Only */}
          {!isMobile && (
            <div className={`flex ${(!isCollapsed || shouldExpand) ? 'justify-end' : 'justify-center'} mb-4`}>
              <button
                onClick={onToggleCollapse}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{
                  color: textColor,
                  opacity: 0.7,
                  border: `1px solid ${borderColor}`,
                  backgroundColor: resolvedTheme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hoverBg; e.currentTarget.style.borderColor = resolvedTheme === 'light' ? '#CBD5E1' : 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = resolvedTheme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = borderColor; }}
                title={isCollapsed ? t('sidebar.pinMenu') : t('sidebar.collapseMenu')}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          )}


        </div>

      </motion.div>
    </>
  )
}
