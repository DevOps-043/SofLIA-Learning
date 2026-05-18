'use client'

import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  BarChart3,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Film,
  LayoutDashboard,
  MapPin,
  Route,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'

import { useOrganizationStylesContext } from '../../business-panel/contexts/OrganizationStylesContext'
import { useBusinessPanelTheme } from '../../business-panel/hooks/useBusinessPanelTheme'

interface AdminSidebarProps {
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

const navigation = [
  { section: 'dashboard', labelKey: 'navigation.dashboard', fallbackLabel: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { section: 'users', labelKey: 'navigation.users', fallbackLabel: 'Usuarios', href: '/admin/users', icon: Users },
  { section: 'workshops', labelKey: 'navigation.workshops', fallbackLabel: 'Talleres', href: '/admin/workshops', icon: BookOpen },
  { section: 'learning-paths', labelKey: 'navigation.learningPaths', fallbackLabel: 'Rutas de aprendizaje', href: '/admin/learning-paths', icon: Route },
  { section: 'lia-analytics', labelKey: 'navigation.liaAnalytics', fallbackLabel: 'SofLIA Analytics', href: '/admin/lia-analytics', icon: BarChart3 },
  { section: 'user-stats', labelKey: 'navigation.userStats', fallbackLabel: 'Estadisticas de Usuarios', href: '/admin/user-stats', icon: MapPin },
  { section: 'companies', labelKey: 'navigation.companies', fallbackLabel: 'Empresas', href: '/admin/companies', icon: Building2 },
  { section: 'reports', labelKey: 'navigation.reports', fallbackLabel: 'Reportes', href: '/admin/reportes', icon: FileText },
  { section: 'security', labelKey: 'navigation.security', fallbackLabel: 'Seguridad', href: '/admin/security', icon: ShieldCheck },
  { section: 'transcoding', labelKey: 'navigation.transcoding', fallbackLabel: 'Transcoding de video', href: '/admin/transcoding', icon: Film },
  { section: 'reviews', labelKey: 'navigation.reviews', fallbackLabel: 'Revisiones', href: '/admin/courses/pending', icon: ClipboardCheck },
]

export function AdminSidebar({
  activeSection: _activeSection,
  isCollapsed,
  isOpen,
  isPinned,
  onClose,
  onHoverExpand,
  onSectionChange,
  onToggleCollapse,
  onTogglePin,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const { t } = useTranslation('admin')
  const theme = useBusinessPanelTheme()
  const { styles, effectiveStyles } = useOrganizationStylesContext()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [showPinFeedback, setShowPinFeedback] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const panelStyles = effectiveStyles?.panel || styles?.panel
  const sidebarBackground = panelStyles?.sidebar_background || theme.panelBg
  const sidebarOpacity = panelStyles?.sidebar_opacity || 0.95
  const shouldExpand = isPinned || (isCollapsed && isHovered)
  const sidebarWidth = isCollapsed && !shouldExpand && !isMobile ? 80 : 280
  const xPosition = isMobile ? (isOpen ? 0 : '-100%') : 0

  const sidebarStyle = useMemo<CSSProperties>(() => {
    if (!sidebarBackground) {
      return { backgroundColor: theme.panelBg }
    }

    if (
      sidebarBackground.includes('linear-gradient') ||
      sidebarBackground.includes('radial-gradient')
    ) {
      return { background: sidebarBackground, backgroundColor: 'transparent' }
    }

    if (sidebarBackground.startsWith('#') && sidebarBackground.length >= 7) {
      const hex = sidebarBackground.replace('#', '')
      const red = parseInt(hex.substring(0, 2), 16)
      const green = parseInt(hex.substring(2, 4), 16)
      const blue = parseInt(hex.substring(4, 6), 16)
      return { backgroundColor: `rgba(${red}, ${green}, ${blue}, ${sidebarOpacity})` }
    }

    return { backgroundColor: sidebarBackground, opacity: sidebarOpacity }
  }, [sidebarBackground, sidebarOpacity, theme.panelBg])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        !isMobile &&
        isCollapsed &&
        isHovered &&
        !isPinned
      ) {
        setIsHovered(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isCollapsed, isHovered, isMobile, isPinned])

  useEffect(() => {
    if (!isCollapsed) {
      setIsHovered(false)
    }
  }, [isCollapsed])

  useEffect(() => {
    if (isHovered && isCollapsed && !isPinned && !isMobile && onHoverExpand) {
      onHoverExpand()
    }
  }, [isCollapsed, isHovered, isMobile, isPinned, onHoverExpand])

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] backdrop-blur-sm lg:hidden"
            style={{ backgroundColor: theme.overlayBg }}
            onClick={onClose}
            aria-hidden="true"
          />
        ) : null}
      </AnimatePresence>

      <motion.div
        ref={sidebarRef}
        initial={false}
        animate={{ width: sidebarWidth, x: xPosition }}
        transition={{
          width: { duration: 0.3, ease: 'easeInOut' },
          x: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
        }}
        className="fixed inset-y-0 left-0 z-[110] flex h-full flex-col overflow-hidden shadow-2xl lg:relative lg:z-0 lg:translate-x-0 lg:shadow-none"
        style={{
          ...sidebarStyle,
          backdropFilter: 'blur(20px)',
          borderRight: `1px solid ${theme.borderColor}`,
        }}
        onHoverStart={() => {
          if (!isMobile && isCollapsed && !isPinned) setIsHovered(true)
        }}
        onHoverEnd={() => {
          if (!isMobile && isCollapsed && !isPinned) setIsHovered(false)
        }}
        onDoubleClick={(event) => {
          if (isMobile) return

          const target = event.target as HTMLElement
          if (
            target.tagName !== 'A' &&
            target.tagName !== 'BUTTON' &&
            !target.closest('a') &&
            !target.closest('button')
          ) {
            onTogglePin()
            setShowPinFeedback(true)
            setTimeout(() => setShowPinFeedback(false), 2000)
          }
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at 100% 0%, ${theme.primaryColor}40 0%, transparent 20%), radial-gradient(circle at 0% 100%, ${theme.accentColor}40 0%, transparent 20%)`,
          }}
        />

        <div className="relative flex flex-shrink-0 items-center justify-end px-4 pb-2 pt-4 lg:hidden">
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors"
            style={{ color: theme.textColor, opacity: 0.6 }}
            onMouseEnter={(event) => {
              event.currentTarget.style.opacity = '1'
              event.currentTarget.style.backgroundColor = theme.hoverBg
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.opacity = '0.6'
              event.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <AnimatePresence>
          {showPinFeedback ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b px-4 py-1"
              style={{ backgroundColor: theme.hoverBg, borderColor: theme.borderColor }}
            >
              <p
                className="flex items-center justify-center gap-1.5 py-1 text-[10px] font-medium"
                style={{ color: theme.accentColor }}
              >
                <MapPin className="h-3 w-3" />
                {isPinned
                  ? t('sidebar.pinned', { defaultValue: 'Menu fijo' })
                  : t('sidebar.unpinned', { defaultValue: 'Menu flotante' })}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <nav className="custom-scrollbar relative flex-1 overflow-y-auto overflow-x-hidden px-3 py-6">
          <ul className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
              const label = t(item.labelKey, { defaultValue: item.fallbackLabel })

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      if (isMobile) onClose()
                      onSectionChange(item.section)
                      if (!isMobile && isCollapsed && !isPinned && isHovered) {
                        setIsHovered(false)
                      }
                    }}
                    className={`group relative flex items-center rounded-xl px-3 py-3 transition-all duration-300 ease-out ${
                      isCollapsed && !shouldExpand && !isMobile
                        ? 'justify-center'
                        : 'justify-start gap-3'
                    }`}
                    style={{
                      backgroundColor: isActive ? theme.primaryColor : 'transparent',
                      boxShadow: isActive ? `0 4px 20px -5px ${theme.primaryColor}60` : 'none',
                      color: isActive ? theme.onPrimaryColor : theme.textColor,
                      opacity: isActive ? 1 : 0.78,
                    }}
                    onMouseEnter={(event) => {
                      if (!isActive) {
                        event.currentTarget.style.backgroundColor = theme.hoverBg
                        event.currentTarget.style.opacity = '1'
                      }
                    }}
                    onMouseLeave={(event) => {
                      if (!isActive) {
                        event.currentTarget.style.backgroundColor = 'transparent'
                        event.currentTarget.style.opacity = '0.78'
                      }
                    }}
                    title={isCollapsed && !shouldExpand && !isMobile ? label : undefined}
                  >
                    <Icon
                      className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${
                        isActive ? 'scale-110' : 'group-hover:scale-110'
                      }`}
                    />

                    {!isCollapsed || shouldExpand || isMobile ? (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden whitespace-nowrap text-sm font-medium"
                      >
                        {label}
                      </motion.span>
                    ) : null}

                    {isCollapsed && !shouldExpand && !isMobile && isActive ? (
                      <div
                        className="absolute inset-0 -z-10 rounded-xl opacity-60 blur-md"
                        style={{ background: theme.primaryColor }}
                      />
                    ) : null}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="mt-auto px-4 pb-4 pt-2">
          {!isMobile ? (
            <div className={`mb-4 flex ${!isCollapsed || shouldExpand ? 'justify-end' : 'justify-center'}`}>
              <button
                onClick={onToggleCollapse}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: theme.inputBg,
                  border: `1px solid ${theme.borderColor}`,
                  color: theme.textColor,
                  opacity: 0.7,
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.backgroundColor = theme.hoverBg
                  event.currentTarget.style.borderColor = theme.dividerColor
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.backgroundColor = theme.inputBg
                  event.currentTarget.style.borderColor = theme.borderColor
                }}
                title={
                  isCollapsed
                    ? t('sidebar.expandMenu', { defaultValue: 'Expandir menu' })
                    : t('sidebar.collapseMenu', { defaultValue: 'Contraer menu' })
                }
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>
          ) : null}
        </div>
      </motion.div>
    </>
  )
}
